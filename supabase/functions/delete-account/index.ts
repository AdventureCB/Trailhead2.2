// Trailhead — Edge Function: delete-account
//
// In-app account deletion. Required by Apple App Store guideline 5.1.1(v) for
// any app that supports account creation, and good hygiene on web too.
//
// Deployed WITH JWT verification (the default) so Supabase's gateway validates
// the caller's access token before we run. We then extract the caller's uid
// from that same token and delete ONLY that user — a caller can never delete
// anyone else. Deleting the auth.users row cascades to public.profiles (FK id
// → auth.users ON DELETE CASCADE) and onward through every user_id FK
// (posts, builds, comments, likes, dm_*, follows, etc.), while SET NULL FKs
// (notifications.actor_id, camping_spots.user_id, *.created_by) intentionally
// preserve others' records with the author blanked.
//
// DEPLOY: supabase functions deploy delete-account
// Secrets used (already set): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

function extractUserId(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload && typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ ok: false, error: "server not configured" }, 500);

  const uid = extractUserId(req.headers.get("authorization"));
  if (!uid) return json({ ok: false, error: "unauthorized" }, 401);

  // Delete the caller's auth user via the Auth admin REST endpoint. Cascades
  // handle all owned rows; SET NULL FKs preserve others' content anonymized.
  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, {
    method: "DELETE",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!r.ok && r.status !== 404) {
    let detail: unknown = null;
    try { detail = await r.json(); } catch {}
    console.error("[delete-account] auth admin delete failed", r.status, detail);
    return json({ ok: false, error: "could not delete account", detail }, 502);
  }

  // 404 = already gone; treat as success (idempotent).
  return json({ ok: true });
});
