// Trailhead — Edge Function: shopify-webhook
//
// Receives Shopify webhook deliveries:
//   - orders/paid      → commission ingestion + journey state machine
//   - orders/refunded  → refund clawback (Phase 1B.6, May 2026)
//
// For each paid order:
//
//   1. Verify HMAC-SHA256 signature using SHOPIFY_CLIENT_SECRET (Shopify
//      signs all webhooks for OAuth apps with the app's client secret).
//   2. Parse the order. Look up discount_codes[] against
//      ambassador_discount_codes (code OR internal_code, status != 'deleted').
//      If no match → 200 OK, ignore.
//   3. Insert one ambassador_orders row keyed by shopify_order_id
//      (UNIQUE constraint dedupes retries — Shopify retries on transient
//      delivery failures).
//   4. Match the customer to an open journey on the same ambassador
//      (email OR shopify_customer_id OR normalized name, within 180 days).
//   5. Run the classification + journey state machine:
//      - Order subtotal == $500 + no journey → new journey, state='deposit_only'
//      - Cumulative confirmation_subtotal > $4999 on an existing
//        deposit_only journey → flip state='confirmed', compute commission
//      - Subtotal >= $5000 + no journey → new journey, state='walk_in',
//        commission computed immediately
//      - Anything else → row stays classification='unclassified' with no
//        journey link (treated as ineligible/general order)
//   6. commission_eligible_subtotal = subtotal MINUS line items where
//      product_type IN commission_config.excluded_product_types
//
// Multi-ambassador conflict detection (when customer touches multiple
// ambassadors' codes) is flagged via is_conflict=true but admin queue UI
// is Phase 1B.5.
//
// DEPLOY: `supabase functions deploy shopify-webhook --no-verify-jwt`
//   (Shopify doesn't send a Supabase JWT — we authenticate via HMAC.)
//
// Required secrets:
//   SHOPIFY_CLIENT_SECRET  — for HMAC verification (same as OAuth flow)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  — auto-populated

const SHOPIFY_CLIENT_SECRET = Deno.env.get("SHOPIFY_CLIENT_SECRET");
const SUPABASE_URL          = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY           = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const DEPOSIT_AMOUNT        = 500;
const CONFIRMATION_MIN      = 5000;     // strictly greater than 4999
const PAIRING_WINDOW_DAYS   = 180;

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

// HMAC-SHA256 verification of the raw request body. Shopify base64-encodes
// the digest and sends it via X-Shopify-Hmac-Sha256.
async function verifyShopifyHmac(rawBody: string, hmacHeader: string | null, secret: string): Promise<boolean> {
  if (!hmacHeader) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  // Constant-time compare
  if (computed.length !== hmacHeader.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ hmacHeader.charCodeAt(i);
  return diff === 0;
}

async function supabaseFetch(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; data: any }> {
  const resp = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      "apikey": SERVICE_KEY!,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(init.headers || {}),
    },
  });
  let data: any = null;
  try { data = await resp.json(); } catch { /* may be empty */ }
  return { ok: resp.ok, status: resp.status, data };
}

// Normalize a customer name for matching. Lowercase + collapse whitespace.
function normalizeName(first?: string | null, last?: string | null): string | null {
  const parts = [first, last].filter(Boolean).map(s => String(s).trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(" ").toLowerCase().replace(/\s+/g, " ");
}

// Commission-eligible subtotal = order.subtotal_price (already AFTER ALL
// discounts including order-level discount codes) MINUS the post-discount
// value of any merch line items.
//
// Bug history: previously computed `linePrice * qty - total_discount` which
// uses the ORIGINAL line totals — it missed order-level discount allocations
// (e.g. the staff-applied $500 off code), over-counting by the full
// order-level discount amount.
function computeEligibleSubtotal(order: any, excludedTypes: string[]): number {
  const subtotal = parseFloat(String(order.subtotal_price || "0"));
  if (!Array.isArray(order.line_items) || excludedTypes.length === 0) return Math.max(0, subtotal);
  // Subtract merch lines' true post-discount value: (price*qty - line_discount)
  // MINUS each line's order-level discount allocations.
  let merchPostDiscount = 0;
  for (const li of order.line_items) {
    const pt = li?.product_type || "";
    if (!excludedTypes.includes(pt)) continue;
    const linePrice = parseFloat(String(li.price || "0"));
    const qty = parseInt(String(li.quantity || "0"), 10) || 0;
    const lineTotal = linePrice * qty;
    const lineDiscount = parseFloat(String(li.total_discount || "0"));
    const allocs = li?.discount_allocations || [];
    const allocSum = allocs.reduce((acc: number, a: any) => acc + (parseFloat(String(a?.amount || "0")) || 0), 0);
    merchPostDiscount += Math.max(0, lineTotal - lineDiscount - allocSum);
  }
  return Math.max(0, subtotal - merchPostDiscount);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return ok({ ok: false, error: "method not allowed" }, 405);
  if (!SHOPIFY_CLIENT_SECRET) {
    console.error("[shopify-webhook] SHOPIFY_CLIENT_SECRET secret missing");
    return ok({ ok: false, error: "server misconfigured" }, 500);
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("[shopify-webhook] Supabase service-role env missing");
    return ok({ ok: false, error: "server misconfigured" }, 500);
  }

  // Read raw body for HMAC verification — must verify against the EXACT
  // bytes Shopify sent (parsed JSON would lose whitespace + key order).
  const rawBody = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
  const shopDomain = req.headers.get("x-shopify-shop-domain");
  const topic = req.headers.get("x-shopify-topic");
  if (!(await verifyShopifyHmac(rawBody, hmacHeader, SHOPIFY_CLIENT_SECRET))) {
    console.warn("[shopify-webhook] HMAC verification failed", { topic, shopDomain });
    return ok({ ok: false, error: "invalid signature" }, 401);
  }

  let order: any;
  try { order = JSON.parse(rawBody); } catch {
    return ok({ ok: false, error: "bad json" }, 400);
  }

  if (topic === "orders/paid") return handleOrderPaid(order);
  if (topic === "orders/refunded") return handleOrderRefunded(order);

  console.log("[shopify-webhook] ignoring topic", topic);
  return ok({ ok: true, ignored: topic });
});

// ─── orders/paid handler ────────────────────────────────────────────────
async function handleOrderPaid(order: any): Promise<Response> {
  // Extract discount codes applied to this order. Shopify includes
  // `discount_codes: [{ code, amount, type }]` on order payloads.
  const codesOnOrder: string[] = Array.isArray(order.discount_codes)
    ? order.discount_codes.map((d: any) => String(d.code || "")).filter(Boolean)
    : [];
  if (codesOnOrder.length === 0) {
    return ok({ ok: true, no_codes: true });
  }

  // Look up each code against ambassador_discount_codes (live OR deleted —
  // soft-deleted rows preserve attribution for historical orders).
  // PostgREST: pass codes as a comma-separated list via in.(...).
  const lookupCodes = codesOnOrder.map(c => `"${c}"`).join(",");
  const lookupQuery = `/rest/v1/ambassador_discount_codes?or=(code.in.(${lookupCodes}),internal_code.in.(${lookupCodes}))&select=id,ambassador_id,code,internal_code,role,template_id`;
  const lookupResp = await supabaseFetch(lookupQuery);
  if (!lookupResp.ok) {
    console.error("[shopify-webhook] code lookup failed", lookupResp.status, lookupResp.data);
    return ok({ ok: false, error: "code lookup failed" }, 500);
  }
  const matches: any[] = Array.isArray(lookupResp.data) ? lookupResp.data : [];
  if (matches.length === 0) {
    return ok({ ok: true, no_match: true, codes: codesOnOrder });
  }

  // If multiple codes from different ambassadors → conflict flag.
  // For now we attribute to the FIRST matched ambassador (admin can
  // resolve via Phase 1B.5 queue). Mark is_conflict on the journey.
  const uniqueAmbIds = Array.from(new Set(matches.map(m => m.ambassador_id)));
  const ambassadorId = matches[0].ambassador_id;
  const isMultiAmbConflict = uniqueAmbIds.length > 1;

  // Fetch commission_config for excluded product types + thresholds.
  const cfgResp = await supabaseFetch(`/rest/v1/commission_config?select=excluded_product_types,confirmation_min,pairing_window_days&limit=1`);
  const cfg = (Array.isArray(cfgResp.data) && cfgResp.data[0]) || {};
  const excludedTypes: string[] = Array.isArray(cfg.excluded_product_types) ? cfg.excluded_product_types : ["Merch"];
  const confirmationMin: number = typeof cfg.confirmation_min === "number" ? cfg.confirmation_min : CONFIRMATION_MIN;
  const pairingWindowDays: number = typeof cfg.pairing_window_days === "number" ? cfg.pairing_window_days : PAIRING_WINDOW_DAYS;

  const subtotal = parseFloat(String(order.subtotal_price || "0"));
  const tax = parseFloat(String(order.total_tax || "0"));
  const shipping = parseFloat(String(order.total_shipping_price_set?.shop_money?.amount || "0"));
  const total = parseFloat(String(order.total_price || "0"));
  const commissionEligibleSubtotal = computeEligibleSubtotal(order, excludedTypes);
  const customerEmail = order.customer?.email || order.email || null;
  const customerShopifyId = order.customer?.id ? String(order.customer.id) : null;
  const customerName = `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim() || null;
  const customerNameNorm = normalizeName(order.customer?.first_name, order.customer?.last_name);

  // Pick the discount code that earned attribution — first match belonging
  // to the winning ambassador. Enables per-code breakdown without parsing
  // raw_webhook.discount_codes downstream.
  const attributingCodeId = matches.find(m => m.ambassador_id === ambassadorId)?.id || matches[0].id;

  // Idempotent insert — UNIQUE on shopify_order_id dedupes Shopify retries.
  const insertOrderBody = {
    ambassador_id: ambassadorId,
    discount_code_id: attributingCodeId,
    shopify_order_id: String(order.id),
    shopify_order_number: order.name || null,
    shopify_customer_id: customerShopifyId,
    customer_email: customerEmail,
    customer_name: customerName,
    customer_name_normalized: customerNameNorm,
    subtotal,
    commission_eligible_subtotal: commissionEligibleSubtotal,
    tax,
    shipping,
    total,
    refunded_amount: 0,
    line_items: Array.isArray(order.line_items) ? order.line_items : [],
    order_date: order.created_at || new Date().toISOString(),
    fully_paid_at: order.processed_at || order.created_at || new Date().toISOString(),
    classification: "unclassified",
    raw_webhook: order,
  };
  // ON CONFLICT DO NOTHING via Prefer header.
  const insertResp = await supabaseFetch(`/rest/v1/ambassador_orders?on_conflict=shopify_order_id`, {
    method: "POST",
    headers: { "Prefer": "return=representation,resolution=ignore-duplicates" },
    body: JSON.stringify(insertOrderBody),
  });
  if (!insertResp.ok) {
    console.error("[shopify-webhook] order insert failed", insertResp.status, insertResp.data);
    return ok({ ok: false, error: "order insert failed", detail: insertResp.data }, 500);
  }
  // If insertResp.data is empty, the row already existed (duplicate retry) — bail.
  if (!Array.isArray(insertResp.data) || insertResp.data.length === 0) {
    console.log("[shopify-webhook] duplicate order, skipping classification", order.id);
    return ok({ ok: true, duplicate: true });
  }
  const insertedOrder = insertResp.data[0];

  // ─── CLASSIFICATION + JOURNEY STATE MACHINE ───
  // Try to find an OPEN journey for this (ambassador, customer) within the
  // pairing window. "Open" = state='deposit_only' (waiting on confirmation)
  // OR state='walk_in' (split walk-in accumulating). Match on any of the
  // 3 customer keys.
  const windowCutoff = new Date(Date.now() - pairingWindowDays * 24 * 60 * 60 * 1000).toISOString();
  const customerOrParts: string[] = [];
  if (customerEmail) customerOrParts.push(`customer_email.eq.${encodeURIComponent(customerEmail)}`);
  if (customerShopifyId) customerOrParts.push(`customer_shopify_id.eq.${encodeURIComponent(customerShopifyId)}`);
  if (customerNameNorm) customerOrParts.push(`customer_name_normalized.eq.${encodeURIComponent(customerNameNorm)}`);
  let openJourney: any = null;
  if (customerOrParts.length > 0) {
    const jq = `/rest/v1/ambassador_journeys?ambassador_id=eq.${ambassadorId}&state=in.(deposit_only,walk_in)&deposit_started_at=gte.${windowCutoff}&or=(${customerOrParts.join(",")})&order=deposit_started_at.desc&limit=1`;
    const jr = await supabaseFetch(jq);
    if (jr.ok && Array.isArray(jr.data) && jr.data[0]) openJourney = jr.data[0];
  }

  // Determine classification + journey action.
  let classification: string = "unclassified";
  let action: "new_deposit" | "add_to_deposit_journey" | "new_walk_in" | "none" = "none";

  const isDepositAmount = Math.abs(subtotal - DEPOSIT_AMOUNT) < 0.01;
  if (openJourney) {
    // Customer has an open journey — this order is a follow-up.
    classification = openJourney.state === "deposit_only" ? "confirmation_part" : "walk_in_part";
    action = "add_to_deposit_journey";
  } else if (isDepositAmount) {
    classification = "deposit";
    action = "new_deposit";
  } else if (subtotal >= confirmationMin) {
    classification = "walk_in_part";
    action = "new_walk_in";
  }

  // Update ambassador_orders.classification (always set).
  await supabaseFetch(`/rest/v1/ambassador_orders?id=eq.${insertedOrder.id}`, {
    method: "PATCH",
    headers: { "Prefer": "return=minimal" },
    body: JSON.stringify({ classification, updated_at: new Date().toISOString() }),
  });

  // ─── JOURNEY MUTATIONS ───
  if (action === "new_deposit") {
    const expiresAt = new Date(Date.now() + pairingWindowDays * 24 * 60 * 60 * 1000).toISOString();
    const journeyInsert = await supabaseFetch(`/rest/v1/ambassador_journeys`, {
      method: "POST",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify({
        ambassador_id: ambassadorId,
        customer_email: customerEmail,
        customer_shopify_id: customerShopifyId,
        customer_name_normalized: customerNameNorm,
        state: "deposit_only",
        deposit_subtotal: subtotal,
        confirmation_subtotal: 0,
        commission_eligible_total: commissionEligibleSubtotal,
        commission_amount: 0,
        deposit_started_at: order.created_at || new Date().toISOString(),
        expires_at: expiresAt,
        is_conflict: isMultiAmbConflict,
      }),
    });
    if (journeyInsert.ok && Array.isArray(journeyInsert.data) && journeyInsert.data[0]) {
      const jId = journeyInsert.data[0].id;
      await supabaseFetch(`/rest/v1/ambassador_orders?id=eq.${insertedOrder.id}`, {
        method: "PATCH",
        headers: { "Prefer": "return=minimal" },
        body: JSON.stringify({ journey_id: jId }),
      });
    }
  } else if (action === "new_walk_in") {
    // Look up ambassador's commission rate.
    const ambResp = await supabaseFetch(`/rest/v1/ambassadors?id=eq.${ambassadorId}&select=commission_rate_pct`);
    const rate = (Array.isArray(ambResp.data) && ambResp.data[0]?.commission_rate_pct) || 5.0;
    const commission = commissionEligibleSubtotal * (rate / 100);
    const journeyInsert = await supabaseFetch(`/rest/v1/ambassador_journeys`, {
      method: "POST",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify({
        ambassador_id: ambassadorId,
        customer_email: customerEmail,
        customer_shopify_id: customerShopifyId,
        customer_name_normalized: customerNameNorm,
        state: "walk_in",
        deposit_subtotal: 0,
        confirmation_subtotal: subtotal,
        commission_eligible_total: commissionEligibleSubtotal,
        commission_amount: commission,
        deposit_started_at: order.created_at || new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        is_conflict: isMultiAmbConflict,
      }),
    });
    if (journeyInsert.ok && Array.isArray(journeyInsert.data) && journeyInsert.data[0]) {
      const jId = journeyInsert.data[0].id;
      await supabaseFetch(`/rest/v1/ambassador_orders?id=eq.${insertedOrder.id}`, {
        method: "PATCH",
        headers: { "Prefer": "return=minimal" },
        body: JSON.stringify({ journey_id: jId }),
      });
    }
  } else if (action === "add_to_deposit_journey") {
    // Accumulate this order's subtotal into the journey + check thresholds.
    const newConfirmation = parseFloat(String(openJourney.confirmation_subtotal || "0")) + subtotal;
    const newEligible = parseFloat(String(openJourney.commission_eligible_total || "0")) + commissionEligibleSubtotal;
    const updatePatch: any = {
      confirmation_subtotal: newConfirmation,
      commission_eligible_total: newEligible,
      updated_at: new Date().toISOString(),
    };
    // If accumulated confirmation crosses the threshold, flip state +
    // compute commission.
    const wasDepositOnly = openJourney.state === "deposit_only";
    if (wasDepositOnly && newConfirmation >= confirmationMin) {
      const ambResp = await supabaseFetch(`/rest/v1/ambassadors?id=eq.${ambassadorId}&select=commission_rate_pct`);
      const rate = (Array.isArray(ambResp.data) && ambResp.data[0]?.commission_rate_pct) || 5.0;
      // commission_eligible_total already accumulates the deposit's eligible
      // amount (set when the deposit was first ingested) + every confirmation
      // part's eligible amount. Don't add deposit_subtotal again — that
      // would double-count the deposit.
      updatePatch.commission_amount = newEligible * (rate / 100);
      updatePatch.state = "confirmed";
      updatePatch.confirmed_at = new Date().toISOString();
    }
    if (isMultiAmbConflict) updatePatch.is_conflict = true;
    await supabaseFetch(`/rest/v1/ambassador_journeys?id=eq.${openJourney.id}`, {
      method: "PATCH",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify(updatePatch),
    });
    // Link the order to the journey.
    await supabaseFetch(`/rest/v1/ambassador_orders?id=eq.${insertedOrder.id}`, {
      method: "PATCH",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({ journey_id: openJourney.id }),
    });
  }

  return ok({
    ok: true,
    order_id: order.id,
    ambassador_id: ambassadorId,
    classification,
    action,
    conflict: isMultiAmbConflict,
  });
}

// ─── orders/refunded handler ────────────────────────────────────────────
// Shopify fires this whenever a refund is processed on an order. The
// payload is the FULL order with the updated `refunds[]` array — every
// refund (current + historical) is included, so we recompute totals from
// scratch (idempotent) rather than incrementally adding.
//
// Refund impact rules:
//   1. Look up the ambassador_orders row by shopify_order_id. If no
//      match → ack and ignore (refund of a non-ambassador order).
//   2. Sum `transactions[].amount` where kind === 'refund' for cumulative
//      refunded_amount on the order row.
//   3. Sum non-merch refund_line_items (looked up via parent line_item's
//      product_type) for commissionable refund.
//   4. New commission_eligible_subtotal = original_eligible - commissionable_refund.
//   5. Recompute the linked journey's commission_eligible_total + commission_amount
//      by summing all journey orders' (post-refund) eligible.
//   6. State transitions:
//      - state='paid' → flip to 'clawed_back'. Reconciliation happens in
//        the next payout cycle via ambassador_payouts.clawback_amount.
//      - state='confirmed'/'walk_in' with newCommission === 0 → also
//        flip to 'clawed_back' (full refund, never to be paid).
//      - Otherwise just reduce commission_amount; keep state stable.
async function handleOrderRefunded(order: any): Promise<Response> {
  const shopifyOrderId = String(order.id || "");
  if (!shopifyOrderId) return ok({ ok: false, error: "no order id" }, 400);

  // Look up our ambassador_orders row.
  const aoResp = await supabaseFetch(`/rest/v1/ambassador_orders?shopify_order_id=eq.${shopifyOrderId}&select=id,ambassador_id,journey_id,commission_eligible_subtotal,subtotal,classification`);
  if (!aoResp.ok) {
    console.error("[shopify-webhook] refund order lookup failed", aoResp.status, aoResp.data);
    return ok({ ok: false, error: "lookup failed" }, 500);
  }
  if (!Array.isArray(aoResp.data) || aoResp.data.length === 0) {
    return ok({ ok: true, no_match: true, shopify_order_id: shopifyOrderId });
  }
  const aoRow = aoResp.data[0];

  // Fetch commission_config for excluded product types.
  const cfgResp = await supabaseFetch(`/rest/v1/commission_config?select=excluded_product_types&limit=1`);
  const cfg = (Array.isArray(cfgResp.data) && cfgResp.data[0]) || {};
  const excludedTypes: string[] = Array.isArray(cfg.excluded_product_types) ? cfg.excluded_product_types : ["Merch"];

  // Walk the refunds array and accumulate (a) cumulative dollar refund
  // and (b) commissionable refund (non-merch line items only).
  const refunds: any[] = Array.isArray(order.refunds) ? order.refunds : [];
  const lineItemsById: Record<string, any> = {};
  for (const li of (order.line_items || [])) {
    if (li && li.id != null) lineItemsById[String(li.id)] = li;
  }
  let totalRefundedAmount = 0;
  let commissionableRefund = 0;
  for (const r of refunds) {
    for (const t of (r.transactions || [])) {
      if (t?.kind === "refund") {
        totalRefundedAmount += parseFloat(String(t.amount || "0")) || 0;
      }
    }
    for (const rli of (r.refund_line_items || [])) {
      const parent = lineItemsById[String(rli.line_item_id)];
      const pt = parent?.product_type || "";
      if (excludedTypes.includes(pt)) continue;
      // Prefer subtotal_set.shop_money.amount (post-discount, includes
      // proportional allocation of order-level discounts); fall back to
      // the deprecated `subtotal` scalar.
      const sub = parseFloat(String(
        rli?.subtotal_set?.shop_money?.amount ?? rli?.subtotal ?? "0",
      )) || 0;
      commissionableRefund += sub;
    }
  }

  // Recompute eligible from the (refund-inclusive) order payload, then
  // subtract the commissionable refund.
  const originalEligible = computeEligibleSubtotal(order, excludedTypes);
  const newEligibleSubtotal = Math.max(0, originalEligible - commissionableRefund);

  // Update the order row.
  await supabaseFetch(`/rest/v1/ambassador_orders?id=eq.${aoRow.id}`, {
    method: "PATCH",
    headers: { "Prefer": "return=minimal" },
    body: JSON.stringify({
      refunded_amount: totalRefundedAmount,
      commission_eligible_subtotal: newEligibleSubtotal,
      raw_webhook: order,
      updated_at: new Date().toISOString(),
    }),
  });

  // Recompute the journey's totals if linked.
  if (aoRow.journey_id) {
    const journeyResp = await supabaseFetch(`/rest/v1/ambassador_journeys?id=eq.${aoRow.journey_id}&select=*`);
    const journey: any = (Array.isArray(journeyResp.data) && journeyResp.data[0]) || null;
    if (journey) {
      // Sum all (post-refund) eligibles across this journey's orders.
      const sumResp = await supabaseFetch(`/rest/v1/ambassador_orders?journey_id=eq.${journey.id}&select=commission_eligible_subtotal,subtotal,refunded_amount`);
      const journeyOrders: any[] = Array.isArray(sumResp.data) ? sumResp.data : [];
      const newEligibleTotal = journeyOrders.reduce(
        (acc, o) => acc + (parseFloat(String(o.commission_eligible_subtotal || "0")) || 0),
        0,
      );

      // Look up ambassador's commission rate.
      const ambResp = await supabaseFetch(`/rest/v1/ambassadors?id=eq.${journey.ambassador_id}&select=commission_rate_pct`);
      const rate = (Array.isArray(ambResp.data) && ambResp.data[0]?.commission_rate_pct) || 5.0;
      const newCommission = newEligibleTotal * (rate / 100);

      const patch: any = {
        commission_eligible_total: newEligibleTotal,
        commission_amount: newCommission,
        updated_at: new Date().toISOString(),
      };

      // State transitions.
      if (journey.state === "paid") {
        // Already paid out — flip to clawed_back. Next payout reconciles
        // via ambassador_payouts.clawback_amount.
        patch.state = "clawed_back";
      } else if ((journey.state === "confirmed" || journey.state === "walk_in") && newCommission === 0) {
        // Unpaid but the refund zero'd out commissionable revenue → mark
        // clawed_back so nothing pays out.
        patch.state = "clawed_back";
      }
      // For deposit_only: just reduce eligible_total. If the deposit was
      // fully refunded, the journey effectively dies but admin can clean
      // it up (or it'll auto-expire when expires_at passes).

      await supabaseFetch(`/rest/v1/ambassador_journeys?id=eq.${journey.id}`, {
        method: "PATCH",
        headers: { "Prefer": "return=minimal" },
        body: JSON.stringify(patch),
      });
    }
  }

  return ok({
    ok: true,
    order_id: order.id,
    ambassador_id: aoRow.ambassador_id,
    refunded_amount: totalRefundedAmount,
    commissionable_refund: commissionableRefund,
    new_eligible_subtotal: newEligibleSubtotal,
  });
}
