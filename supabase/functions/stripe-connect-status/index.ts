// Trailhead — Edge Function: stripe-connect-status
//
// Refreshes a Stripe Connect account's status from the Stripe API and
// syncs the resulting `onboarded` flag back into ambassadors.stripe_onboarded.
// Called when the user returns from Stripe-hosted onboarding (`?stripe_return=1`)
// or via manual REFRESH STATUS button.
//
// Auth: JWT required. Caller must be admin OR the ambassador themselves.
//
// DEPLOY: `supabase functions deploy stripe-connect-status`

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY       = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function ok(body: unknown, status = 200): Response {
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
    return (payload && typeof payload.sub === "string") ? payload.sub : null;
  } catch { return null; }
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

async function stripeFetch(path: string) {
  const r = await fetch(`https://api.stripe.com${path}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${STRIPE_SECRET_KEY!}`,
      "Stripe-Version": "2024-09-30.acacia",
    },
  });
  let data: any = null;
  try { data = await r.json(); } catch {}
  return { ok: r.ok, status: r.status, data };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return ok({ ok: false, error: "method not allowed" }, 405);
  if (!STRIPE_SECRET_KEY) return ok({ ok: false, error: "STRIPE_SECRET_KEY missing" }, 500);
  if (!SUPABASE_URL || !SERVICE_KEY) return ok({ ok: false, error: "Supabase env missing" }, 500);

  const userId = extractUserId(req.headers.get("authorization"));
  if (!userId) return ok({ ok: false, error: "unauthenticated" }, 401);

  let body: any = {};
  try { body = await req.json(); } catch {}
  const targetAmbassadorId: string | undefined = body.ambassador_id;

  // Resolve + authorize (same pattern as onboard).
  let ambassadorRow: any = null;
  if (targetAmbassadorId) {
    const ambResp = await supabaseFetch(`/rest/v1/ambassadors?id=eq.${targetAmbassadorId}&select=id,profile_id,stripe_account_id,stripe_onboarded`);
    if (!Array.isArray(ambResp.data) || !ambResp.data[0]) return ok({ ok: false, error: "ambassador not found" }, 404);
    ambassadorRow = ambResp.data[0];
    if (ambassadorRow.profile_id !== userId) {
      const profResp = await supabaseFetch(`/rest/v1/profiles?id=eq.${userId}&select=role`);
      const isAdmin = Array.isArray(profResp.data) && profResp.data[0]?.role === "admin";
      if (!isAdmin) return ok({ ok: false, error: "not authorized" }, 403);
    }
  } else {
    const ambResp = await supabaseFetch(`/rest/v1/ambassadors?profile_id=eq.${userId}&select=id,profile_id,stripe_account_id,stripe_onboarded&limit=1`);
    if (!Array.isArray(ambResp.data) || !ambResp.data[0]) return ok({ ok: false, error: "you are not an ambassador" }, 403);
    ambassadorRow = ambResp.data[0];
  }

  if (!ambassadorRow.stripe_account_id) {
    return ok({ ok: true, onboarded: false, account_id: null });
  }

  const acctResp = await stripeFetch(`/v1/accounts/${ambassadorRow.stripe_account_id}`);
  if (!acctResp.ok) {
    console.error("[stripe-connect-status] account fetch failed", acctResp.status, acctResp.data);
    return ok({ ok: false, error: "stripe fetch failed", detail: acctResp.data }, 502);
  }

  const acct = acctResp.data;
  const onboarded = !!(acct.details_submitted && acct.charges_enabled && acct.payouts_enabled);

  // Sync to DB if changed (also serves as a fallback when the webhook
  // misses an account.updated event).
  if (onboarded !== ambassadorRow.stripe_onboarded) {
    await supabaseFetch(`/rest/v1/ambassadors?id=eq.${ambassadorRow.id}`, {
      method: "PATCH",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({
        stripe_onboarded: onboarded,
        updated_at: new Date().toISOString(),
      }),
    });
  }

  return ok({
    ok: true,
    onboarded,
    account_id: acct.id,
    details_submitted: !!acct.details_submitted,
    charges_enabled: !!acct.charges_enabled,
    payouts_enabled: !!acct.payouts_enabled,
    requirements: acct.requirements || null,
  });
});
