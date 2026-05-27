// Trailhead — Edge Function: shopify-backfill-orders
//
// Admin-only one-shot. Pulls historical Shopify orders matching an
// ambassador's discount codes and ingests them through the same
// classification + journey state machine the live webhook uses.
//
// Used for:
//   - TESTING the commission engine without placing new orders
//   - MIGRATING real ambassador historical attribution from Collabs era
//
// Processes orders in CHRONOLOGICAL order (oldest first) so deposits
// land before their confirmations and journeys form correctly.
//
// Request (POST, authenticated, admin-only):
//   { ambassador_id: uuid,
//     since_date?: ISO date string  // default: 12 months ago
//   }
//
// Response 200:
//   { ok: true, summary: { processed, ingested, duplicates, journeys_created, errors: [...] } }
//
// DEPLOY: `supabase functions deploy shopify-backfill-orders`
//   (WITH JWT verification — admin-only via service-role check)

const SHOPIFY_TOKEN  = Deno.env.get("SHOPIFY_ADMIN_TOKEN");
const SHOPIFY_DOMAIN = Deno.env.get("SHOPIFY_SHOP_DOMAIN");
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const API_VERSION    = "2026-04";

const DEPOSIT_AMOUNT      = 500;
const CONFIRMATION_MIN    = 5000;
const PAIRING_WINDOW_DAYS = 180;

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
    return (payload && typeof payload.sub === "string") ? payload.sub : null;
  } catch { return null; }
}

async function isAdmin(userId: string): Promise<boolean> {
  if (!SUPABASE_URL || !SERVICE_KEY) return false;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=role`, {
      headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` },
    });
    if (!r.ok) return false;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0]?.role === "admin";
  } catch { return false; }
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
  try { data = await resp.json(); } catch {}
  return { ok: resp.ok, status: resp.status, data };
}

async function shopifyGraphQL(query: string, variables: Record<string, unknown> = {}): Promise<{ ok: boolean; data: any; errors?: any }> {
  const resp = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_TOKEN!,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  let body: any = null;
  try { body = await resp.json(); } catch {}
  return { ok: resp.ok && !body?.errors, data: body?.data, errors: body?.errors };
}

function normalizeName(first?: string | null, last?: string | null): string | null {
  const parts = [first, last].filter(Boolean).map(s => String(s).trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(" ").toLowerCase().replace(/\s+/g, " ");
}

// Commission-eligible subtotal = order subtotal (already AFTER all discounts,
// including order-level discount allocations like the staff-applied $500 off)
// minus the post-discount value of any merch line items.
//
// Bug history: previously summed line items' `discountedTotalSet`, which is
// post-LINE-level discounts but DOES NOT include order-level discount
// allocations. That over-counted by the full order-level discount amount
// (e.g. $500 for the staff-applied confirmation discount).
function computeEligibleFromOrder(order: any, lineItems: any[], excludedTypes: string[]): number {
  const orderSubtotal = parseFloat(String(order?.subtotalPriceSet?.shopMoney?.amount || "0"));
  if (excludedTypes.length === 0) return Math.max(0, orderSubtotal);
  // Subtract merch line items' true post-discount value: discountedTotalSet
  // MINUS each line's order-level discount allocations.
  let merchPostDiscount = 0;
  for (const li of lineItems || []) {
    const pt = li?.product?.productType || "";
    if (!excludedTypes.includes(pt)) continue;
    const discounted = parseFloat(String(li?.discountedTotalSet?.shopMoney?.amount || "0"));
    const allocs = li?.discountAllocations || [];
    const allocSum = allocs.reduce((acc: number, a: any) => acc + (parseFloat(String(a?.allocatedAmountSet?.shopMoney?.amount || "0")) || 0), 0);
    merchPostDiscount += Math.max(0, discounted - allocSum);
  }
  return Math.max(0, orderSubtotal - merchPostDiscount);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
  if (!SHOPIFY_TOKEN || !SHOPIFY_DOMAIN) return json({ ok: false, error: "SHOPIFY secrets missing" }, 500);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ ok: false, error: "Supabase service-role env missing" }, 500);

  const userId = extractUserId(req.headers.get("authorization"));
  if (!userId) return json({ ok: false, error: "unauthenticated" }, 401);
  if (!(await isAdmin(userId))) return json({ ok: false, error: "not authorized" }, 403);

  let body: any = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "bad json" }, 400); }
  const ambassadorId = body.ambassador_id;
  if (!ambassadorId) return json({ ok: false, error: "missing ambassador_id" }, 400);
  const sinceDate = body.since_date
    ? new Date(body.since_date).toISOString()
    : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();   // default: 12 months back

  // Look up this ambassador's codes (any status — including soft-deleted
  // so we can backfill orders that used a now-deleted code).
  const codesResp = await supabaseFetch(`/rest/v1/ambassador_discount_codes?ambassador_id=eq.${ambassadorId}&select=code,internal_code,role`);
  if (!codesResp.ok) return json({ ok: false, error: "couldn't load ambassador's codes", detail: codesResp.data }, 502);
  const codeRows: any[] = Array.isArray(codesResp.data) ? codesResp.data : [];
  const codes = new Set<string>();
  for (const r of codeRows) {
    if (r.code) codes.add(r.code);
    if (r.internal_code) codes.add(r.internal_code);
  }
  if (codes.size === 0) {
    return json({ ok: false, error: "ambassador has no discount codes to backfill" }, 400);
  }

  // Fetch commission_config for excluded types + thresholds.
  const cfgResp = await supabaseFetch(`/rest/v1/commission_config?select=excluded_product_types,confirmation_min,pairing_window_days&limit=1`);
  const cfg = (Array.isArray(cfgResp.data) && cfgResp.data[0]) || {};
  const excludedTypes: string[] = Array.isArray(cfg.excluded_product_types) ? cfg.excluded_product_types : ["Merch"];
  const confirmationMin: number = typeof cfg.confirmation_min === "number" ? cfg.confirmation_min : CONFIRMATION_MIN;
  const pairingWindowDays: number = typeof cfg.pairing_window_days === "number" ? cfg.pairing_window_days : PAIRING_WINDOW_DAYS;

  // GraphQL query: orders that USED any of these codes, paid status, since
  // the cutoff, sorted CHRONOLOGICALLY (oldest first) so deposits land
  // before confirmations and journeys form correctly. Up to 250 per page.
  const codeFilters = Array.from(codes).map(c => `discount_code:"${c.replace(/"/g, "")}"`).join(" OR ");
  const queryStr = `(${codeFilters}) AND financial_status:paid AND created_at:>='${sinceDate.slice(0, 10)}'`;

  const allOrders: any[] = [];
  let cursor: string | null = null;
  let safety = 20;   // up to 20 pages × 250 = 5000 orders. Bail if more.
  while (safety-- > 0) {
    const gqlQuery = `
      query($cursor: String, $q: String!) {
        orders(first: 250, after: $cursor, sortKey: CREATED_AT, reverse: false, query: $q) {
          edges {
            cursor
            node {
              id
              legacyResourceId
              name
              createdAt
              processedAt
              subtotalPriceSet { shopMoney { amount } }
              totalTaxSet { shopMoney { amount } }
              totalShippingPriceSet { shopMoney { amount } }
              totalPriceSet { shopMoney { amount } }
              discountCodes
              customer { id email firstName lastName }
              lineItems(first: 50) {
                edges {
                  node {
                    quantity
                    product { productType }
                    originalUnitPriceSet { shopMoney { amount } }
                    discountedTotalSet { shopMoney { amount } }
                    discountAllocations {
                      allocatedAmountSet { shopMoney { amount } }
                    }
                  }
                }
              }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    `;
    const res = await shopifyGraphQL(gqlQuery, { cursor, q: queryStr });
    if (!res.ok) {
      return json({ ok: false, error: "Shopify GraphQL query failed", detail: res.errors }, 502);
    }
    const edges = res.data?.orders?.edges || [];
    for (const e of edges) allOrders.push(e.node);
    if (!res.data?.orders?.pageInfo?.hasNextPage) break;
    cursor = res.data.orders.pageInfo.endCursor;
  }

  // Process each order in chronological order through the same logic as
  // the live webhook. (Duplicated for now; refactor into shared helper
  // later if both diverge.)
  const summary = {
    found: allOrders.length,
    processed: 0,
    ingested: 0,
    duplicates: 0,
    journeys_created: 0,
    journeys_updated: 0,
    journeys_confirmed: 0,
    errors: [] as { order: string; error: string }[],
  };

  for (const order of allOrders) {
    summary.processed++;
    try {
      const orderId = String(order.legacyResourceId);
      const subtotal = parseFloat(String(order.subtotalPriceSet?.shopMoney?.amount || "0"));
      const tax = parseFloat(String(order.totalTaxSet?.shopMoney?.amount || "0"));
      const shipping = parseFloat(String(order.totalShippingPriceSet?.shopMoney?.amount || "0"));
      const total = parseFloat(String(order.totalPriceSet?.shopMoney?.amount || "0"));
      const lineItems = (order.lineItems?.edges || []).map((e: any) => e.node);
      const commissionEligibleSubtotal = computeEligibleFromOrder(order, lineItems, excludedTypes);
      const customerEmail = order.customer?.email || null;
      const customerShopifyId = order.customer?.id ? String(order.customer.id).replace(/^gid:\/\/shopify\/Customer\//, "") : null;
      const customerName = `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() || null;
      const customerNameNorm = normalizeName(order.customer?.firstName, order.customer?.lastName);

      // Insert ambassador_orders (idempotent via shopify_order_id UNIQUE).
      const insertBody = {
        ambassador_id: ambassadorId,
        shopify_order_id: orderId,
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
        line_items: lineItems,
        order_date: order.createdAt || new Date().toISOString(),
        fully_paid_at: order.processedAt || order.createdAt || new Date().toISOString(),
        classification: "unclassified",
        raw_webhook: order,
      };
      const insertResp = await supabaseFetch(`/rest/v1/ambassador_orders?on_conflict=shopify_order_id`, {
        method: "POST",
        headers: { "Prefer": "return=representation,resolution=ignore-duplicates" },
        body: JSON.stringify(insertBody),
      });
      if (!insertResp.ok) {
        summary.errors.push({ order: orderId, error: `insert failed: ${JSON.stringify(insertResp.data).slice(0, 120)}` });
        continue;
      }
      if (!Array.isArray(insertResp.data) || insertResp.data.length === 0) {
        summary.duplicates++;
        continue;
      }
      summary.ingested++;
      const insertedOrder = insertResp.data[0];

      // Classification + journey state (same logic as live webhook).
      const windowCutoff = new Date(new Date(order.createdAt).getTime() - pairingWindowDays * 24 * 60 * 60 * 1000).toISOString();
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

      let classification = "unclassified";
      let action: "new_deposit" | "add_to_deposit_journey" | "new_walk_in" | "none" = "none";
      const isDepositAmount = Math.abs(subtotal - DEPOSIT_AMOUNT) < 0.01;
      if (openJourney) {
        classification = openJourney.state === "deposit_only" ? "confirmation_part" : "walk_in_part";
        action = "add_to_deposit_journey";
      } else if (isDepositAmount) {
        classification = "deposit";
        action = "new_deposit";
      } else if (subtotal >= confirmationMin) {
        classification = "walk_in_part";
        action = "new_walk_in";
      }

      await supabaseFetch(`/rest/v1/ambassador_orders?id=eq.${insertedOrder.id}`, {
        method: "PATCH",
        headers: { "Prefer": "return=minimal" },
        body: JSON.stringify({ classification, updated_at: new Date().toISOString() }),
      });

      if (action === "new_deposit") {
        const expiresAt = new Date(new Date(order.createdAt).getTime() + pairingWindowDays * 24 * 60 * 60 * 1000).toISOString();
        const ji = await supabaseFetch(`/rest/v1/ambassador_journeys`, {
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
            deposit_started_at: order.createdAt,
            expires_at: expiresAt,
          }),
        });
        if (ji.ok && Array.isArray(ji.data) && ji.data[0]) {
          summary.journeys_created++;
          await supabaseFetch(`/rest/v1/ambassador_orders?id=eq.${insertedOrder.id}`, {
            method: "PATCH", headers: { "Prefer": "return=minimal" },
            body: JSON.stringify({ journey_id: ji.data[0].id }),
          });
        }
      } else if (action === "new_walk_in") {
        const ambResp = await supabaseFetch(`/rest/v1/ambassadors?id=eq.${ambassadorId}&select=commission_rate_pct`);
        const rate = (Array.isArray(ambResp.data) && ambResp.data[0]?.commission_rate_pct) || 5.0;
        const commission = commissionEligibleSubtotal * (rate / 100);
        const ji = await supabaseFetch(`/rest/v1/ambassador_journeys`, {
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
            deposit_started_at: order.createdAt,
            confirmed_at: order.createdAt,
          }),
        });
        if (ji.ok && Array.isArray(ji.data) && ji.data[0]) {
          summary.journeys_created++;
          await supabaseFetch(`/rest/v1/ambassador_orders?id=eq.${insertedOrder.id}`, {
            method: "PATCH", headers: { "Prefer": "return=minimal" },
            body: JSON.stringify({ journey_id: ji.data[0].id }),
          });
        }
      } else if (action === "add_to_deposit_journey") {
        const newConfirmation = parseFloat(String(openJourney.confirmation_subtotal || "0")) + subtotal;
        const newEligible = parseFloat(String(openJourney.commission_eligible_total || "0")) + commissionEligibleSubtotal;
        const updatePatch: any = {
          confirmation_subtotal: newConfirmation,
          commission_eligible_total: newEligible,
          updated_at: new Date().toISOString(),
        };
        const wasDepositOnly = openJourney.state === "deposit_only";
        if (wasDepositOnly && newConfirmation >= confirmationMin) {
          const ambResp = await supabaseFetch(`/rest/v1/ambassadors?id=eq.${ambassadorId}&select=commission_rate_pct`);
          const rate = (Array.isArray(ambResp.data) && ambResp.data[0]?.commission_rate_pct) || 5.0;
          // commission_eligible_total already accumulates deposit + all
          // confirmation_part eligible amounts. Don't add deposit_subtotal
          // again — double-counts the deposit.
          updatePatch.commission_amount = newEligible * (rate / 100);
          updatePatch.state = "confirmed";
          updatePatch.confirmed_at = order.createdAt;
          summary.journeys_confirmed++;
        }
        const ju = await supabaseFetch(`/rest/v1/ambassador_journeys?id=eq.${openJourney.id}`, {
          method: "PATCH",
          headers: { "Prefer": "return=minimal" },
          body: JSON.stringify(updatePatch),
        });
        if (ju.ok) summary.journeys_updated++;
        await supabaseFetch(`/rest/v1/ambassador_orders?id=eq.${insertedOrder.id}`, {
          method: "PATCH", headers: { "Prefer": "return=minimal" },
          body: JSON.stringify({ journey_id: openJourney.id }),
        });
      }
    } catch (e: any) {
      summary.errors.push({ order: String(order.legacyResourceId || order.id), error: e.message || String(e) });
    }
  }

  return json({ ok: true, summary, since_date: sinceDate, codes_queried: Array.from(codes) });
});
