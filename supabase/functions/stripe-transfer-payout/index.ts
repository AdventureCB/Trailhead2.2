// Trailhead — Edge Function: stripe-transfer-payout
//
// Replaces the manual MARK PAID flow with a real Stripe transfer.
// Admin-only. For an approved ambassador_payouts row:
//   1. Validate the row is 'approved' (not already paid/cancelled/failed)
//   2. Verify the ambassador has a fully-onboarded Connect account
//   3. POST /v1/transfers (idempotent via payout id) — moves funds from
//      LPO's platform balance to the ambassador's connected account.
//      Stripe auto-handles the bank deposit on Express's default schedule.
//   4. Persist stripe_transfer_id + flip status='paid' + set paid_at/by
//   5. Flip all linked journeys to state='paid'
//
// Failure modes:
//   - !stripe_account_id / !stripe_onboarded → 400 with helpful message
//   - Insufficient platform balance → 502 with Stripe error
//   - Stripe API error → status stays 'approved', error returned to client
//   - DB update fails after transfer succeeded → critical state, logged
//
// Idempotency: uses `trailhead_payout_${payout_id}` as Idempotency-Key.
// Re-clicking MARK PAID on the same row returns the same Stripe transfer
// without creating a duplicate.
//
// DEPLOY: `supabase functions deploy stripe-transfer-payout`
//   (WITH JWT — admin gated server-side via service-role profile lookup.)

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

async function isAdmin(userId: string): Promise<boolean> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=role`, {
      headers: { "apikey": SERVICE_KEY!, "Authorization": `Bearer ${SERVICE_KEY}` },
    });
    if (!r.ok) return false;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0]?.role === "admin";
  } catch { return false; }
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

async function stripeFetch(path: string, formBody?: Record<string, string>, idempotencyKey?: string) {
  const init: RequestInit = {
    method: formBody ? "POST" : "GET",
    headers: {
      "Authorization": `Bearer ${STRIPE_SECRET_KEY!}`,
      "Stripe-Version": "2024-09-30.acacia",
      ...(formBody ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
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
  if (!(await isAdmin(userId))) return ok({ ok: false, error: "not authorized" }, 403);

  let body: any = {};
  try { body = await req.json(); } catch {}
  const payoutId: string | undefined = body.payout_id;
  if (!payoutId) return ok({ ok: false, error: "payout_id required" }, 400);

  // Fetch payout + ambassador in parallel.
  const payoutResp = await supabaseFetch(`/rest/v1/ambassador_payouts?id=eq.${payoutId}&select=*`);
  if (!payoutResp.ok || !Array.isArray(payoutResp.data) || !payoutResp.data[0]) {
    return ok({ ok: false, error: "payout not found" }, 404);
  }
  const payout = payoutResp.data[0];
  if (payout.status === "paid") return ok({ ok: false, error: "payout already paid" }, 400);
  if (payout.status !== "approved") return ok({ ok: false, error: `payout status is '${payout.status}' — must be 'approved'` }, 400);

  const ambResp = await supabaseFetch(`/rest/v1/ambassadors?id=eq.${payout.ambassador_id}&select=id,profile_id,stripe_account_id,stripe_onboarded`);
  if (!ambResp.ok || !Array.isArray(ambResp.data) || !ambResp.data[0]) {
    return ok({ ok: false, error: "ambassador not found" }, 404);
  }
  const amb = ambResp.data[0];
  if (!amb.stripe_account_id) {
    return ok({ ok: false, error: "ambassador hasn't started Stripe onboarding" }, 400);
  }
  if (!amb.stripe_onboarded) {
    return ok({ ok: false, error: "ambassador hasn't completed Stripe onboarding (banking info / W-9 missing)" }, 400);
  }

  // Fetch the ambassador's display name for the Stripe transfer
  // description (visible on their Stripe dashboard + bank statement
  // memo line) + a human-readable month label for the earning period.
  const profResp = await supabaseFetch(`/rest/v1/profiles?id=eq.${amb.profile_id}&select=full_name,handle`);
  const prof = (Array.isArray(profResp.data) && profResp.data[0]) || {};
  const displayName = prof.full_name || prof.handle || "Ambassador";
  // period_start is yyyy-mm-dd. Build "April 2026" without timezone drift.
  const periodMonthLabel = (() => {
    try {
      const d = new Date(`${payout.period_start}T00:00:00Z`);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    } catch { return String(payout.period_start || ""); }
  })();

  // Compute amount in cents (Stripe takes integer minor units).
  const netDollars = parseFloat(String(payout.net_amount || "0")) || 0;
  if (netDollars <= 0) return ok({ ok: false, error: "payout net_amount must be > 0" }, 400);
  const amountCents = Math.round(netDollars * 100);

  // Create the transfer. Idempotency key includes payout id (so a
  // double-click within the same attempt doesn't double-fund) PLUS the
  // prior failure timestamp (so admin can retry after a sync failure
  // without hitting Stripe's 24h cached-response replay). On a fresh
  // payout, transfer_failed_at is null → key is just the id.
  const idemKey = payout.transfer_failed_at
    ? `trailhead_payout_${payoutId}_retry_${new Date(payout.transfer_failed_at).getTime()}`
    : `trailhead_payout_${payoutId}`;
  const transferResp = await stripeFetch("/v1/transfers", {
    amount: String(amountCents),
    currency: "usd",
    destination: amb.stripe_account_id,
    description: `LPO ambassador commission · ${displayName} · ${periodMonthLabel}`,
    "metadata[trailhead_payout_id]": payoutId,
    "metadata[trailhead_ambassador_id]": amb.id,
    "metadata[trailhead_ambassador_name]": displayName,
    "metadata[trailhead_earning_month]": periodMonthLabel,
    "metadata[trailhead_period_start]": String(payout.period_start),
    "metadata[trailhead_period_end]": String(payout.period_end),
  }, idemKey);

  if (!transferResp.ok || !transferResp.data?.id) {
    // Persist failure detail so admin can debug. Status stays 'approved'.
    const errMsg = transferResp.data?.error?.message || `stripe error (${transferResp.status})`;
    await supabaseFetch(`/rest/v1/ambassador_payouts?id=eq.${payoutId}`, {
      method: "PATCH",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({
        transfer_failed_at: new Date().toISOString(),
        transfer_failure_message: errMsg,
      }),
    });
    console.error("[stripe-transfer-payout] transfer failed", transferResp.status, transferResp.data);
    return ok({ ok: false, error: "stripe transfer failed", detail: transferResp.data?.error || errMsg }, 502);
  }

  const transferId = transferResp.data.id;

  // Mark payout paid + clear any prior failure detail.
  const updResp = await supabaseFetch(`/rest/v1/ambassador_payouts?id=eq.${payoutId}`, {
    method: "PATCH",
    headers: { "Prefer": "return=minimal" },
    body: JSON.stringify({
      status: "paid",
      paid_at: new Date().toISOString(),
      paid_by: userId,
      stripe_transfer_id: transferId,
      transfer_failed_at: null,
      transfer_failure_message: null,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!updResp.ok) {
    // Transfer succeeded but DB update failed. Don't try to reverse —
    // log + return success with a warning so admin investigates.
    console.error("[stripe-transfer-payout] CRITICAL: transfer ok but payout DB update failed", updResp.status, updResp.data);
    return ok({
      ok: true,
      transfer_id: transferId,
      warning: "transfer succeeded but DB update failed — manual verify needed",
      detail: updResp.data,
    });
  }

  // Flip linked journeys to 'paid'.
  await supabaseFetch(`/rest/v1/ambassador_journeys?payout_id=eq.${payoutId}&state=in.(confirmed,walk_in)`, {
    method: "PATCH",
    headers: { "Prefer": "return=minimal" },
    body: JSON.stringify({
      state: "paid",
      updated_at: new Date().toISOString(),
    }),
  });

  // Notify the ambassador their payout was paid. The DB trigger on
  // notifications.INSERT fans out to web push via send-push.
  const amountStr = `$${(amountCents / 100).toFixed(2)}`;
  await supabaseFetch(`/rest/v1/notifications`, {
    method: "POST",
    headers: { "Prefer": "return=minimal" },
    body: JSON.stringify({
      user_id: amb.profile_id,
      actor_id: userId,
      type: "payout_paid",
      text: `paid your ${amountStr} commission for ${periodMonthLabel}`,
    }),
  });

  return ok({
    ok: true,
    transfer_id: transferId,
    amount_cents: amountCents,
    destination: amb.stripe_account_id,
  });
});
