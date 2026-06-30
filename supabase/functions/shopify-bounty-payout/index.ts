// Trailhead — Edge Function: shopify-bounty-payout
//
// Admin-only. Issues a gift card payout to a user via Shopify's Gift
// Card API. Two flavors based on whether the user already has a card:
//   • NEW card (profile.lpo_gift_card_id IS NULL) →
//       POST /admin/api/{ver}/gift_cards.json with initial_value
//   • TOP-UP (profile already has a card) →
//       POST /admin/api/{ver}/gift_card_adjustments.json with positive amount
//
// On success:
//   1. Inserts a bounty_payouts row recording method + amount + the
//      submission ids cleared by this payout.
//   2. Updates profile cache: lpo_gift_card_id / last4 / balance_cents /
//      synced_at. Code itself NEVER stored — only last 4 digits.
//   3. Flips linked bounty_submissions.payout_status='paid' so the
//      recompute_bounty_earnings trigger re-derives the user's denorm.
//   4. Inserts a bounty_payout_received notification. Body must NEVER
//      include the gift card code — phone lock-screen safety.
//
// Manual payout mode (cash / check / other): skips Shopify entirely.
// Records a bounty_payouts row with method='manual' + reference. Used
// for one-off disbursements outside the gift-card flow.
//
// Request (POST, JWT, admin-only):
//   {
//     user_id: uuid,
//     amount_cents: number,           // > 0
//     submission_ids: uuid[],         // approved + payout_status='pending'; sum >= amount
//     method?: 'gift_card' | 'manual',// default 'gift_card'
//     reference?: string,             // manual: check #, Venmo handle, etc.
//     notes?: string,
//   }
//
// Response 200: {
//   ok: true,
//   payout_id: uuid,
//   method: 'shopify_gift_card_new' | 'shopify_gift_card_topup' | 'manual',
//   gift_card?: { last4, balance_cents },
// }
// Response 4xx/5xx: { ok: false, error: string, detail?: any }
//
// DEPLOY:
//   supabase functions deploy shopify-bounty-payout
//
// Required secrets:
//   SHOPIFY_ADMIN_TOKEN          — same as ambassador integration
//   SHOPIFY_SHOP_DOMAIN          — lone-peak-overland.myshopify.com
//   SUPABASE_URL                 — auto
//   SUPABASE_SERVICE_ROLE_KEY    — auto

import { createClient } from "npm:@supabase/supabase-js@2";

const SHOPIFY_TOKEN = Deno.env.get("SHOPIFY_ADMIN_TOKEN");
const SHOPIFY_DOMAIN = Deno.env.get("SHOPIFY_SHOP_DOMAIN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const API_VERSION = "2026-04";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
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

async function isAdmin(sb: ReturnType<typeof createClient>, userId: string): Promise<boolean> {
  const { data } = await sb.from("profiles").select("role").eq("id", userId).maybeSingle();
  return !!(data && (data as any).role === "admin");
}

// GraphQL Admin API helper. Used for gift card topup adjustments —
// Shopify deprecated the REST /gift_cards/{id}/adjustments.json
// endpoint (returns 404 in 2026-04) and routes via GraphQL's
// giftCardCredit mutation, which requires write_gift_card_transactions
// scope (separate from write_gift_cards). All other gift card ops still
// use REST since the create + customer flows work fine there.
async function shopifyGraphqlFetch(query: string, variables: Record<string, unknown>): Promise<{ status: number; body: any }> {
  const url = `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_TOKEN!,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  let body: any = null;
  const text = await res.text();
  try { body = text ? JSON.parse(text) : null; } catch { body = { _raw: text }; }
  return { status: res.status, body };
}

async function shopifyFetch(path: string, init: RequestInit = {}): Promise<{ status: number; body: any }> {
  const url = `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_TOKEN!,
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(init.headers || {}),
    },
  });
  let body: any = null;
  const text = await res.text();
  try { body = text ? JSON.parse(text) : null; } catch { body = { _raw: text }; }
  return { status: res.status, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);

  if (!SHOPIFY_TOKEN || !SHOPIFY_DOMAIN || !SUPABASE_URL || !SERVICE_KEY) {
    return json({ ok: false, error: "server not configured" }, 500);
  }

  // ── 1) Auth: caller must be a signed-in admin ──
  const callerUid = extractUserId(req.headers.get("authorization"));
  if (!callerUid) return json({ ok: false, error: "unauthorized" }, 401);
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  if (!(await isAdmin(sb, callerUid))) return json({ ok: false, error: "forbidden" }, 403);

  // ── 2) Parse + validate payload ──
  let payload: {
    user_id?: string;
    amount_cents?: number;
    submission_ids?: string[];
    method?: "gift_card" | "manual";
    reference?: string;
    notes?: string;
  };
  try { payload = await req.json(); } catch { return json({ ok: false, error: "bad json" }, 400); }

  const userId = String(payload?.user_id || "").trim();
  const amountCents = Math.floor(Number(payload?.amount_cents || 0));
  const submissionIds = Array.isArray(payload?.submission_ids) ? payload!.submission_ids!.filter(x => typeof x === "string") : [];
  const method = payload?.method === "manual" ? "manual" : "gift_card";
  const reference = (payload?.reference || "").trim() || null;
  const notes = (payload?.notes || "").trim() || null;

  if (!userId) return json({ ok: false, error: "user_id required" }, 400);
  if (!Number.isFinite(amountCents) || amountCents <= 0) return json({ ok: false, error: "amount_cents must be > 0" }, 400);
  if (amountCents > 10_000_00) return json({ ok: false, error: "amount_cents over 10000 cap — split it" }, 400);

  // ── 3) Load target profile (need email + name for gift card metadata + cache cols) ──
  const { data: profile, error: profErr } = await sb
    .from("profiles")
    .select("id, handle, full_name, lpo_gift_card_id, lpo_gift_card_last4, lpo_gift_card_balance_cents, shopify_customer_id")
    .eq("id", userId)
    .maybeSingle();
  if (profErr) return json({ ok: false, error: "profile lookup failed", detail: profErr.message }, 500);
  if (!profile) return json({ ok: false, error: "target user not found" }, 404);
  const targetProfile = profile as any;

  // Email lives on auth.users, not profiles. Pull via admin API.
  const { data: authRow } = await sb.auth.admin.getUserById(userId);
  const targetEmail = authRow?.user?.email || null;

  // ── 3b) Resolve or create the Shopify customer ──
  // Gift cards MUST be attached to a customer record to (a) show a name
  // in the Shopify admin and (b) auto-apply at checkout for the signed-
  // in shopper. We cache the resolved customer_id on profiles so we
  // only do the search/create dance once per user.
  if (method !== "manual" && !targetProfile.shopify_customer_id) {
    if (!targetEmail) {
      return json({ ok: false, error: "Target user has no email — Shopify customer lookup requires one. Add an email to the auth user before issuing a gift card." }, 400);
    }
    // Split full_name into first/last for the Shopify customer record.
    // Shopify is lenient — if we can't split, send full_name as first
    // and leave last blank.
    const fullName = (targetProfile.full_name || targetProfile.handle || "Trailhead User").trim();
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0] || "Trailhead";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Search by exact email first — avoids duplicate customer records
    // when the user already shops at lonepeakoverland.com.
    const searchUrl = `/customers/search.json?query=${encodeURIComponent(`email:${targetEmail}`)}`;
    const { status: searchStatus, body: searchBody } = await shopifyFetch(searchUrl);
    let resolvedCustomerId: string | null = null;
    if (searchStatus >= 200 && searchStatus < 300 && Array.isArray(searchBody?.customers) && searchBody.customers.length > 0) {
      // Pick the first match. Shopify returns exact-email matches first.
      resolvedCustomerId = String(searchBody.customers[0].id);
    } else {
      // No existing customer — create one. tax_exempt:false, send_email_invite:false
      // so they aren't surprised by an unrelated email. They'll be linked
      // automatically when they next sign in / checkout.
      const createBody = {
        customer: {
          email: targetEmail,
          first_name: firstName,
          last_name: lastName,
          verified_email: true,                          // we own the auth flow, the email is verified
          accepts_marketing: false,                       // don't opt into LPO marketing without consent
          note: `Auto-created by Trailhead bounty payout · profile ${userId.slice(0, 8)}`,
          tags: "trailhead-bounty-recipient",
        },
      };
      const { status: createStatus, body: createBodyResp } = await shopifyFetch("/customers.json", {
        method: "POST",
        body: JSON.stringify(createBody),
      });
      if (createStatus < 200 || createStatus >= 300 || !createBodyResp?.customer?.id) {
        return json({ ok: false, error: "Shopify customer create failed", detail: createBodyResp }, 502);
      }
      resolvedCustomerId = String(createBodyResp.customer.id);
    }
    // Cache on the profile so subsequent gift card top-ups skip this step.
    targetProfile.shopify_customer_id = resolvedCustomerId;
    const { error: cacheErr } = await sb
      .from("profiles")
      .update({ shopify_customer_id: resolvedCustomerId })
      .eq("id", userId);
    if (cacheErr) console.warn("[shopify-bounty-payout] shopify_customer_id cache failed", cacheErr);
  }

  // ── 3c) Belt-and-suspenders: if the user already has a gift card but it
  // was created BEFORE we shipped customer-linking (or somehow lost the
  // link), patch it now. Idempotent — Shopify accepts the same customer_id
  // again without complaining. Non-fatal on failure since the card still
  // works for top-ups regardless. ──
  if (method !== "manual" && targetProfile.lpo_gift_card_id && targetProfile.shopify_customer_id) {
    try {
      const { status: updStatus, body: updBody } = await shopifyFetch(
        `/gift_cards/${targetProfile.lpo_gift_card_id}.json`,
        {
          method: "PUT",
          body: JSON.stringify({
            gift_card: {
              id: Number(targetProfile.lpo_gift_card_id),
              customer_id: Number(targetProfile.shopify_customer_id),
            },
          }),
        },
      );
      if (updStatus < 200 || updStatus >= 300) {
        console.warn("[shopify-bounty-payout] existing gift card customer attach failed (non-fatal)", updStatus, updBody);
      }
    } catch (e) {
      console.warn("[shopify-bounty-payout] existing gift card customer attach threw (non-fatal)", e);
    }
  }

  // ── 4) Validate submissions (if any provided) ──
  // submission_ids is OPTIONAL — admin can record a payout that isn't
  // tied to specific submissions (e.g. one-off bonus). When provided,
  // every id must be an approved + pending submission owned by this
  // user, and their sum must be >= amount.
  if (submissionIds.length > 0) {
    const { data: subs, error: subErr } = await sb
      .from("bounty_submissions")
      .select("id, user_id, status, payout_status, reward_cents")
      .in("id", submissionIds);
    if (subErr) return json({ ok: false, error: "submission lookup failed", detail: subErr.message }, 500);
    if (!subs || subs.length !== submissionIds.length) {
      return json({ ok: false, error: "one or more submissions not found" }, 400);
    }
    for (const s of subs as any[]) {
      if (s.user_id !== userId) return json({ ok: false, error: `submission ${s.id} doesn't belong to target user` }, 400);
      if (s.status !== "approved") return json({ ok: false, error: `submission ${s.id} not approved (status=${s.status})` }, 400);
      if (s.payout_status !== "pending") return json({ ok: false, error: `submission ${s.id} already ${s.payout_status}` }, 400);
    }
    const sumCents = (subs as any[]).reduce((acc, s) => acc + (Number(s.reward_cents) || 0), 0);
    if (sumCents < amountCents) {
      return json({ ok: false, error: `submission rewards sum to ${sumCents}¢ but payout is ${amountCents}¢` }, 400);
    }
  }

  // ── 5) Branch: manual vs gift card ──
  let payoutMethod: "shopify_gift_card_new" | "shopify_gift_card_topup" | "manual";
  let shopifyGiftCardId: string | null = targetProfile.lpo_gift_card_id || null;
  let shopifyAdjustmentId: string | null = null;
  let updatedBalanceCents: number = Number(targetProfile.lpo_gift_card_balance_cents || 0);
  let updatedLast4: string | null = targetProfile.lpo_gift_card_last4 || null;

  if (method === "manual") {
    payoutMethod = "manual";
    if (!reference) return json({ ok: false, error: "reference required for manual payouts" }, 400);
  } else {
    // Shopify gift card path.
    if (!targetProfile.lpo_gift_card_id) {
      // Create a new gift card with initial_value = amountCents/100.
      // value is in store currency (USD for LPO). note tags admin trace.
      const createBody = {
        gift_card: {
          initial_value: (amountCents / 100).toFixed(2),
          note: `Trailhead bounty payout · ${userId.slice(0, 8)}`,
          customer_id: targetProfile.shopify_customer_id || undefined,
          template_suffix: undefined, // use store default
        },
      };
      const { status, body } = await shopifyFetch("/gift_cards.json", {
        method: "POST",
        body: JSON.stringify(createBody),
      });
      if (status < 200 || status >= 300 || !body?.gift_card?.id) {
        return json({ ok: false, error: "Shopify gift_cards create failed", detail: body }, 502);
      }
      const gc = body.gift_card;
      payoutMethod = "shopify_gift_card_new";
      shopifyGiftCardId = String(gc.id);
      updatedBalanceCents = Math.round(Number(gc.balance || amountCents / 100) * 100);
      updatedLast4 = String(gc.last_characters || gc.code?.slice(-4) || "").slice(-4) || null;
    } else {
      // Top-up via GraphQL giftCardCredit mutation. The REST adjustments
      // endpoint (/gift_cards/{id}/adjustments.json) returns 404 in
      // 2026-04 — Shopify moved adjustments to GraphQL only. Requires
      // the `write_gift_card_transactions` scope (separate from
      // `write_gift_cards`) and the gift card ID in GID format.
      const giftCardGid = `gid://shopify/GiftCard/${targetProfile.lpo_gift_card_id}`;
      const creditMutation = `mutation giftCardCredit($id: ID!, $creditInput: GiftCardCreditInput!) {
        giftCardCredit(id: $id, creditInput: $creditInput) {
          giftCardCreditTransaction {
            id
            giftCard { id balance { amount currencyCode } maskedCode }
          }
          userErrors { field message code }
        }
      }`;
      const creditVars = {
        id: giftCardGid,
        creditInput: {
          creditAmount: {
            amount: (amountCents / 100).toFixed(2),
            currencyCode: "USD",
          },
          note: `Trailhead bounty payout · ${userId.slice(0, 8)}`,
        },
      };
      const { status: gqlStatus, body: gqlBody } = await shopifyGraphqlFetch(creditMutation, creditVars);
      if (gqlStatus < 200 || gqlStatus >= 300) {
        return json({ ok: false, error: "Shopify GraphQL adjustment failed (HTTP error)", detail: gqlBody, status: gqlStatus }, 502);
      }
      const credit = gqlBody?.data?.giftCardCredit;
      if (!credit) {
        return json({ ok: false, error: "GraphQL response missing giftCardCredit payload", detail: gqlBody }, 502);
      }
      if (Array.isArray(credit.userErrors) && credit.userErrors.length > 0) {
        return json({ ok: false, error: "Gift card credit rejected", detail: credit.userErrors }, 502);
      }
      const txn = credit.giftCardCreditTransaction;
      if (!txn || !txn.id) {
        return json({ ok: false, error: "GraphQL response missing transaction id", detail: gqlBody }, 502);
      }
      payoutMethod = "shopify_gift_card_topup";
      // Store the numeric portion of the GID — easier to filter on + UI consistency.
      shopifyAdjustmentId = String(txn.id).replace(/^gid:\/\/shopify\/[^/]+\//, "");
      const balanceAmount = txn?.giftCard?.balance?.amount;
      if (balanceAmount != null) {
        updatedBalanceCents = Math.round(Number(balanceAmount) * 100);
      } else {
        // Fallback: optimistic local add.
        updatedBalanceCents = updatedBalanceCents + amountCents;
      }
      // Pull updated last4 from masked code if available — usually
      // unchanged from create but defensive in case Shopify rotates it.
      const masked = txn?.giftCard?.maskedCode || "";
      if (masked) {
        const tail = masked.replace(/[^A-Za-z0-9]/g, "").slice(-4);
        if (tail) updatedLast4 = tail;
      }
    }
  }

  // ── 6) Record the payout row ──
  const { data: payoutRow, error: payoutErr } = await sb
    .from("bounty_payouts")
    .insert({
      user_id: userId,
      amount_cents: amountCents,
      method: payoutMethod,
      shopify_gift_card_id: shopifyGiftCardId,
      shopify_adjustment_id: shopifyAdjustmentId,
      reference,
      submission_ids: submissionIds,
      paid_by: callerUid,
      notes,
    })
    .select("id")
    .single();
  if (payoutErr) {
    // Gift card already created in Shopify — flag for manual reconciliation.
    return json({ ok: false, error: "bounty_payouts insert failed", detail: payoutErr.message, gift_card_id: shopifyGiftCardId }, 500);
  }
  const payoutId = (payoutRow as any).id;

  // ── 7) Update profile gift card cache (only for Shopify branches) ──
  if (payoutMethod !== "manual") {
    const { error: upErr } = await sb
      .from("profiles")
      .update({
        lpo_gift_card_id: shopifyGiftCardId,
        lpo_gift_card_last4: updatedLast4,
        lpo_gift_card_balance_cents: updatedBalanceCents,
        lpo_gift_card_synced_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (upErr) console.warn("[shopify-bounty-payout] profile cache update failed", upErr);
  }

  // ── 8) Flip submissions to paid (trigger recomputes bounty_earnings) ──
  if (submissionIds.length > 0) {
    const { error: flipErr } = await sb
      .from("bounty_submissions")
      .update({ payout_status: "paid", payout_id: payoutId })
      .in("id", submissionIds);
    if (flipErr) console.warn("[shopify-bounty-payout] submission flip failed", flipErr);
  } else {
    // No submissions linked → recompute manually so the user's
    // bounty_earnings reflects the payout count.
    try { await sb.rpc("recompute_bounty_earnings", { p_user_id: userId }); } catch (e) {
      console.warn("[shopify-bounty-payout] recompute failed", e);
    }
  }

  // ── 9) Notify the user. Body MUST NOT contain the gift card code. ──
  try {
    const dollars = (amountCents / 100).toFixed(2);
    const body = payoutMethod === "manual"
      ? `$${dollars} payout recorded · ${reference}`
      : `$${dollars} added to your gift card · tap to view balance`;
    await sb.from("notifications").insert({
      user_id: userId,
      type: "bounty_payout_received",
      actor_name: "Trailhead",
      text: body,
      target: "Earnings",
    });
  } catch (e) {
    console.warn("[shopify-bounty-payout] notif insert failed", e);
  }

  return json({
    ok: true,
    payout_id: payoutId,
    method: payoutMethod,
    gift_card: payoutMethod === "manual" ? null : { last4: updatedLast4, balance_cents: updatedBalanceCents },
  });
});
