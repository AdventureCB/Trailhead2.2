// Trailhead — Edge Function: stripe-connect-onboard
//
// Generates a Stripe Connect Express onboarding URL for an ambassador.
// Creates the Stripe account on first call (saves to ambassadors.stripe_account_id),
// then returns a one-time AccountLink the user opens to complete W-9, banking
// info, and ID verification on Stripe-hosted pages.
//
// Auth: JWT required (Supabase gateway verifies).
// Authorization: caller must be admin OR onboarding their own ambassador profile.
//
// Required secrets:
//   STRIPE_SECRET_KEY  (sk_test_… or sk_live_…)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-populated)
//
// DEPLOY: `supabase functions deploy stripe-connect-onboard`

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY       = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const APP_BASE_URL      = Deno.env.get("APP_BASE_URL") || "https://trailhead.lonepeakoverland.com";

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

// Stripe API helper. POST → form-encoded body, GET → no body.
async function stripeFetch(path: string, formBody?: Record<string, string>) {
  const init: RequestInit = {
    method: formBody ? "POST" : "GET",
    headers: {
      "Authorization": `Bearer ${STRIPE_SECRET_KEY!}`,
      "Stripe-Version": "2024-09-30.acacia",
      ...(formBody ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
  };
  if (formBody) init.body = new URLSearchParams(formBody).toString();
  const r = await fetch(`https://api.stripe.com${path}`, init);
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

  // Resolve the ambassador row + authorize.
  let ambassadorRow: any = null;
  if (targetAmbassadorId) {
    const ambResp = await supabaseFetch(`/rest/v1/ambassadors?id=eq.${targetAmbassadorId}&select=id,profile_id,stripe_account_id,stripe_onboarded`);
    if (!Array.isArray(ambResp.data) || !ambResp.data[0]) return ok({ ok: false, error: "ambassador not found" }, 404);
    ambassadorRow = ambResp.data[0];
    // Admin or self
    if (ambassadorRow.profile_id !== userId) {
      const profResp = await supabaseFetch(`/rest/v1/profiles?id=eq.${userId}&select=role`);
      const isAdmin = Array.isArray(profResp.data) && profResp.data[0]?.role === "admin";
      if (!isAdmin) return ok({ ok: false, error: "not authorized" }, 403);
    }
  } else {
    // Default: caller's own ambassador profile.
    const ambResp = await supabaseFetch(`/rest/v1/ambassadors?profile_id=eq.${userId}&select=id,profile_id,stripe_account_id,stripe_onboarded&limit=1`);
    if (!Array.isArray(ambResp.data) || !ambResp.data[0]) return ok({ ok: false, error: "you are not an ambassador" }, 403);
    ambassadorRow = ambResp.data[0];
  }

  // Best-effort: fetch the user's auth email to prefill the Stripe account.
  let email: string | null = null;
  try {
    const userResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${ambassadorRow.profile_id}`, {
      headers: { "apikey": SERVICE_KEY!, "Authorization": `Bearer ${SERVICE_KEY}` },
    });
    if (userResp.ok) {
      const userData: any = await userResp.json();
      email = userData?.email || null;
    }
  } catch (_) { /* email is optional; Stripe will prompt for it */ }

  // 1. Create the Stripe Express account on first call. Subsequent calls
  //    reuse the saved account id and just regenerate the AccountLink.
  let accountId = ambassadorRow.stripe_account_id;
  if (!accountId) {
    const acctResp = await stripeFetch("/v1/accounts", {
      type: "express",
      country: "US",
      ...(email ? { email } : {}),
      // Live mode requires platforms to request `card_payments` alongside
      // `transfers` — transfers-only needs explicit Stripe approval which
      // takes 1-3 weeks. Easier to just request both. Ambassadors never
      // actually accept card payments because we don't trigger any payment
      // flows on their accounts; the capability is permission-only, not
      // usage. Test mode auto-allowed transfers-only so this is a live-
      // mode-only divergence (discovered 2026-05-29 during live switch).
      "capabilities[transfers][requested]": "true",
      "capabilities[card_payments][requested]": "true",
      "business_profile[product_description]": "Overland gear sales commission via Lone Peak Overland ambassador program",
      "business_profile[url]": APP_BASE_URL,
      "metadata[ambassador_id]": ambassadorRow.id,
      "metadata[trailhead_user_id]": ambassadorRow.profile_id,
    });
    if (!acctResp.ok || !acctResp.data?.id) {
      console.error("[stripe-connect-onboard] create account failed", acctResp.status, acctResp.data);
      return ok({ ok: false, error: "stripe create account failed", detail: acctResp.data }, 502);
    }
    accountId = acctResp.data.id;
    await supabaseFetch(`/rest/v1/ambassadors?id=eq.${ambassadorRow.id}`, {
      method: "PATCH",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({
        stripe_account_id: accountId,
        updated_at: new Date().toISOString(),
      }),
    });
  }

  // 2. Generate a one-time onboarding link. refresh_url is hit if the link
  //    expires mid-onboarding; return_url is the success destination.
  const linkResp = await stripeFetch("/v1/account_links", {
    account: accountId!,
    refresh_url: `${APP_BASE_URL}/?stripe_refresh=1`,
    return_url: `${APP_BASE_URL}/?stripe_return=1`,
    type: "account_onboarding",
  });
  if (!linkResp.ok || !linkResp.data?.url) {
    console.error("[stripe-connect-onboard] create link failed", linkResp.status, linkResp.data);
    return ok({ ok: false, error: "stripe create link failed", detail: linkResp.data }, 502);
  }

  return ok({
    ok: true,
    url: linkResp.data.url,
    account_id: accountId,
    expires_at: linkResp.data.expires_at,
  });
});
