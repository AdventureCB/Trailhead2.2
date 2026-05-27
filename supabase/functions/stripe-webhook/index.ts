// Trailhead — Edge Function: stripe-webhook
//
// Receives Stripe events. Phase 2A handles `account.updated` (Connect
// onboarding state changes). Phase 2B will add transfer.failed /
// transfer.reversed handlers for payout reconciliation.
//
// Auth via Stripe's signed-webhook HMAC (STRIPE_WEBHOOK_SECRET). Stripe
// doesn't send a Supabase JWT — deploy with `--no-verify-jwt`.
//
// DEPLOY: `supabase functions deploy stripe-webhook --no-verify-jwt`
//
// Required secrets:
//   STRIPE_WEBHOOK_SECRET (whsec_…)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-populated)

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL          = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY           = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

function ok(body: unknown = { ok: true }, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function supabaseFetch(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      "apikey": SERVICE_KEY!,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  let data: any = null;
  try { data = await r.json(); } catch {}
  return { ok: r.ok, status: r.status, data };
}

// Verify a Stripe signature header. Format: `t=<unix>,v1=<hexsig>,v0=<...>`.
// Computes HMAC-SHA256 of `${timestamp}.${rawBody}` with the webhook
// secret and constant-time compares against v1.
async function verifyStripeSignature(rawBody: string, sigHeader: string | null, secret: string): Promise<boolean> {
  if (!sigHeader) return false;
  const parts: Record<string, string> = {};
  for (const segment of sigHeader.split(",")) {
    const [k, v] = segment.split("=");
    if (k && v) parts[k] = v;
  }
  const timestamp = parts.t;
  const v1sig = parts.v1;
  if (!timestamp || !v1sig) return false;

  // Replay protection — reject signatures older than 5 minutes.
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false;

  const payload = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  if (computed.length !== v1sig.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ v1sig.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return ok({ ok: false, error: "method not allowed" }, 405);
  if (!STRIPE_WEBHOOK_SECRET) return ok({ ok: false, error: "STRIPE_WEBHOOK_SECRET missing" }, 500);
  if (!SUPABASE_URL || !SERVICE_KEY) return ok({ ok: false, error: "Supabase env missing" }, 500);

  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!(await verifyStripeSignature(rawBody, sig, STRIPE_WEBHOOK_SECRET))) {
    console.warn("[stripe-webhook] signature verification failed");
    return ok({ ok: false, error: "invalid signature" }, 401);
  }

  let event: any;
  try { event = JSON.parse(rawBody); } catch { return ok({ ok: false, error: "bad json" }, 400); }

  // ─── account.updated ───────────────────────────────────────────────
  // Fires when a connected account's state changes (onboarding fields
  // submitted, charges/payouts enabled, etc). Recompute `onboarded` and
  // sync to ambassadors.stripe_onboarded.
  if (event.type === "account.updated") {
    const acct = event.data?.object;
    if (!acct?.id) return ok({ ok: false, error: "missing account id" }, 400);

    const onboarded = !!(acct.details_submitted && acct.charges_enabled && acct.payouts_enabled);

    const ambResp = await supabaseFetch(`/rest/v1/ambassadors?stripe_account_id=eq.${acct.id}&select=id,stripe_onboarded`);
    if (Array.isArray(ambResp.data) && ambResp.data[0]) {
      const amb = ambResp.data[0];
      if (onboarded !== amb.stripe_onboarded) {
        await supabaseFetch(`/rest/v1/ambassadors?id=eq.${amb.id}`, {
          method: "PATCH",
          headers: { "Prefer": "return=minimal" },
          body: JSON.stringify({
            stripe_onboarded: onboarded,
            updated_at: new Date().toISOString(),
          }),
        });
        console.log(`[stripe-webhook] ambassador ${amb.id} stripe_onboarded → ${onboarded}`);
      }
    } else {
      // Account not linked to any ambassador (could be unrelated; safe ignore).
      console.log("[stripe-webhook] account.updated for unknown account", acct.id);
    }
    return ok({ ok: true, event: event.type, onboarded });
  }

  // Other events: ack + log. Phase 2B will add transfer.* handlers.
  console.log("[stripe-webhook] unhandled event", event.type);
  return ok({ ok: true, ignored: event.type });
});
