// Trailhead — Edge Function: generate-alt-text
//
// Called by the client after `uploadPostPhotoList` resolves a public
// storage URL. Sends the URL to Anthropic's Claude Haiku 4.5 vision API
// and returns:
//   - alt        : short, SEO-friendly alt-text description
//   - moderation : { adult: boolean, reason?: string } — used by the
//                  client to block + delete adult uploads before they
//                  hit the DB. Single round-trip per image keeps cost
//                  identical to the prior alt-only flow.
//
// Request:  POST { "url": "https://…/post-photos/…jpg" }
//   Required header: Authorization: Bearer <supabase JWT>
//                    (supabase.functions.invoke() sends this automatically)
// Response: 200  { "alt": "…", "moderation": { "adult": false } }
//           4xx/5xx { "error": "…" }  — caller treats as "no alt" and proceeds
//
// DEPLOY: `supabase functions deploy generate-alt-text`  (do NOT pass --no-verify-jwt)
//
// Environment (set via `supabase secrets set ANTHROPIC_API_KEY=…`):
//   ANTHROPIC_API_KEY  — required
//   MODEL_OVERRIDE     — optional, defaults to claude-haiku-4-5-20251001

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = Deno.env.get("MODEL_OVERRIDE") || "claude-haiku-4-5-20251001";

// Only accept URLs from Trailhead's public storage buckets. Blocks SSRF —
// even an authed user can't make Anthropic fetch arbitrary URLs (e.g.
// cloud metadata endpoints, internal services). Update if new buckets are
// added that legitimately need alt-text generation.
const ALLOWED_URL_PREFIXES = [
  "https://babbgaziiyjfaqjsaxgd.supabase.co/storage/v1/object/public/post-photos/",
  "https://babbgaziiyjfaqjsaxgd.supabase.co/storage/v1/object/public/avatars/",
  "https://babbgaziiyjfaqjsaxgd.supabase.co/storage/v1/object/public/dm-attachments/",
];

// Per-user rate limit. In-memory per edge-instance — worst case attacker
// bouncing across N instances gets N × LIMIT calls/window, still a
// >1000× cap vs unlimited. For stronger limiting wire a Postgres counter
// table if needed.
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const userCalls = new Map<string, number[]>();
function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (userCalls.get(userId) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) { userCalls.set(userId, recent); return true; }
  recent.push(now);
  userCalls.set(userId, recent);
  return false;
}

// Decode the Supabase JWT payload to extract user id. Supabase has already
// VERIFIED the signature before this function runs (since we deploy with
// JWT verification on); we just need to read the `sub` claim.
function extractUserId(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return (payload && typeof payload.sub === "string") ? payload.sub : null;
  } catch { return null; }
}

// Single-shot prompt: returns JSON with alt + moderation flag. We ask
// Claude to be conservative on `adult` — explicit nudity or sexual acts
// only, NOT suggestive/swimwear/shirtless. False positives on overlanding
// + camping content (people in swimsuits at a lake, etc.) would be worse
// than missing edge cases.
const PROMPT =
  "You are reviewing an uploaded image for a public outdoors/overlanding community app. " +
  "Reply with ONLY a JSON object on a single line — no preamble, no code fence, no quotes around the JSON. " +
  "Schema: { \"alt\": string, \"moderation\": { \"adult\": boolean, \"reason\": string } }\n\n" +
  "RULES:\n" +
  "- alt: one specific sentence (max 180 chars) describing the image for accessibility and SEO. " +
  "Name vehicles (make/model if visible), terrain, weather, notable gear, location features. " +
  "Avoid phrases like \"image of\" or \"photo of\".\n" +
  "- moderation.adult: true ONLY if the image contains explicit nudity, sexual acts, or pornographic content. " +
  "Do NOT flag swimwear, shirtless people, breastfeeding, or non-sexual partial nudity. " +
  "Be conservative — this is an outdoors community where people swim and camp.\n" +
  "- moderation.reason: short string explaining why if adult=true, otherwise empty string.\n\n" +
  "Example output: {\"alt\":\"Red Toyota 4Runner parked at a dusty desert trailhead at sunset\",\"moderation\":{\"adult\":false,\"reason\":\"\"}}";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// Pull the first JSON-object substring out of Claude's text response.
// Defensive: Claude usually obeys our "JSON only" instruction but we've
// seen occasional leading/trailing whitespace or stray markdown fences.
function extractJsonObject(text: string): { alt?: string; moderation?: { adult?: boolean; reason?: string } } | null {
  if (typeof text !== "string") return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch { return null; }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  if (!ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY missing" }, 500);

  // JWT signature was verified by the Supabase auth gateway (function
  // deployed without --no-verify-jwt). Decode payload to get user id for
  // rate limiting. If somehow we got past the gateway without a valid
  // JWT (e.g. local testing), bail.
  const userId = extractUserId(req.headers.get("authorization"));
  if (!userId) return json({ error: "unauthenticated" }, 401);

  if (isRateLimited(userId)) {
    return json({ error: "rate limited — too many alt-text requests, slow down" }, 429);
  }

  let body: { url?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }

  const url = body && body.url;
  if (!url || typeof url !== "string") {
    return json({ error: "missing url" }, 400);
  }
  if (!ALLOWED_URL_PREFIXES.some(p => url.startsWith(p))) {
    return json({ error: "url not allowed — must be a Trailhead storage URL" }, 400);
  }

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "url", url } },
            { type: "text", text: PROMPT },
          ],
        }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[generate-alt-text] anthropic error", resp.status, errText);
      return json({ error: "vision api failed", status: resp.status, detail: errText.slice(0, 500) }, 502);
    }

    const data = await resp.json();
    let raw = "";
    if (Array.isArray(data?.content)) {
      for (const block of data.content) {
        if (block?.type === "text" && typeof block.text === "string") {
          raw = block.text;
          break;
        }
      }
    }
    const parsed = extractJsonObject(raw.trim());
    let alt = "";
    let moderation = { adult: false, reason: "" };
    if (parsed) {
      if (typeof parsed.alt === "string") alt = parsed.alt.trim();
      if (parsed.moderation && typeof parsed.moderation === "object") {
        moderation = {
          adult: parsed.moderation.adult === true,
          reason: typeof parsed.moderation.reason === "string" ? parsed.moderation.reason.trim() : "",
        };
      }
    } else {
      // Couldn't parse JSON — fall back to treating the raw text as alt.
      // Moderation defaults to {adult:false} so we don't false-positive
      // block uploads when the model misbehaves on formatting.
      alt = raw.trim();
    }
    // Strip stray surrounding quotes Claude sometimes adds.
    if ((alt.startsWith('"') && alt.endsWith('"')) || (alt.startsWith("'") && alt.endsWith("'"))) {
      alt = alt.slice(1, -1).trim();
    }
    // Hard cap to keep the persisted string small in jsonb.
    if (alt.length > 200) alt = alt.slice(0, 197) + "…";
    return json({ alt, moderation });
  } catch (e) {
    console.error("[generate-alt-text] failed", e);
    return json({ error: "internal" }, 500);
  }
});
