// Trailhead — Edge Function: shopify-lookup-order
//
// Admin-only Shopify order lookup. Powers the "MANUAL ADD ORDER" modal on
// the AdminDashboardScreen AMBASSADORS sub-tab — admin types a Shopify
// order number, we hit the Admin API to pre-fill subtotal / customer /
// date / line items so the modal isn't free-form typing (typos + bad
// numbers were the original concern).
//
// Request (POST, authenticated, admin-only):
//   { order_number: "#12345" }       — pass with or without leading #
//
// Response 200:
//   { ok: true, order: {
//       shopify_order_id, shopify_order_number, subtotal,
//       suggested_eligible,             // subtotal minus excluded product_types
//       customer_email, customer_shopify_id, customer_name,
//       order_date, financial_status, line_items: [{title, product_type, ...}]
//     } }
// Response 404: { ok: false, error: "order not found" }
// Response 4xx/5xx: { ok: false, error: "...", detail?: ... }
//
// DEPLOY: `supabase functions deploy shopify-lookup-order`

const SHOPIFY_TOKEN  = Deno.env.get("SHOPIFY_ADMIN_TOKEN");
const SHOPIFY_DOMAIN = Deno.env.get("SHOPIFY_SHOP_DOMAIN");
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const API_VERSION    = "2026-04";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

function extractUserId(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const payload = token.split(".")[1];
    const padded = payload + "=".repeat((4 - payload.length % 4) % 4);
    const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded).sub || null;
  } catch { return null; }
}

async function isAdmin(uid: string): Promise<boolean> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${uid}&select=role`, {
      headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (!r.ok) return false;
    const data = await r.json();
    return Array.isArray(data) && data[0]?.role === "admin";
  } catch { return false; }
}

async function shopifyAdminFetch(path: string) {
  const url = `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}${path}`;
  const resp = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_TOKEN!,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  });
  let data: any = null;
  try { data = await resp.json(); } catch { /* may be empty */ }
  return { ok: resp.ok, status: resp.status, data };
}

// Fetch the platform-wide excluded product_types list from commission_config.
// Used to derive `suggested_eligible` = subtotal minus excluded line items
// so the modal pre-fills the right commission base.
async function loadExcludedTypes(): Promise<string[]> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/commission_config?select=excluded_product_types&limit=1`, {
      headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (!r.ok) return ["Merch"];
    const data = await r.json();
    const row = Array.isArray(data) ? data[0] : null;
    return Array.isArray(row?.excluded_product_types) ? row.excluded_product_types : ["Merch"];
  } catch { return ["Merch"]; }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
  if (!SHOPIFY_TOKEN || !SHOPIFY_DOMAIN) return json({ ok: false, error: "SHOPIFY secrets missing" }, 500);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ ok: false, error: "Supabase env missing" }, 500);

  const userId = extractUserId(req.headers.get("authorization"));
  if (!userId) return json({ ok: false, error: "unauthenticated" }, 401);
  if (!(await isAdmin(userId))) return json({ ok: false, error: "not authorized" }, 403);

  let body: any;
  try { body = await req.json(); } catch { return json({ ok: false, error: "bad json" }, 400); }
  const raw = String(body?.order_number || "").trim();
  if (!raw) return json({ ok: false, error: "order_number required" }, 400);
  // Shopify's `name` field includes the leading #. Accept both forms.
  const orderName = raw.startsWith("#") ? raw : `#${raw}`;

  // Shopify search by name. status=any returns open + closed + cancelled,
  // important for backfill / corrections on archived orders.
  const resp = await shopifyAdminFetch(`/orders.json?name=${encodeURIComponent(orderName)}&status=any&limit=1`);
  if (!resp.ok) {
    return json({ ok: false, error: "shopify lookup failed", detail: resp.data }, 502);
  }
  const orders = resp.data?.orders;
  if (!Array.isArray(orders) || orders.length === 0) {
    return json({ ok: false, error: `order ${orderName} not found in Shopify` }, 404);
  }
  const o = orders[0];

  // Pull excluded product types so we can suggest the commission base.
  const excluded = await loadExcludedTypes();
  const lineItems = Array.isArray(o.line_items) ? o.line_items : [];
  let excludedTotal = 0;
  for (const li of lineItems) {
    const type = li.product_type || "";
    if (excluded.includes(type)) {
      const lineSubtotal = parseFloat(li.price || "0") * (li.quantity || 1);
      excludedTotal += lineSubtotal;
    }
  }
  const subtotal = parseFloat(o.subtotal_price || "0");
  const suggestedEligible = Math.max(0, subtotal - excludedTotal);

  const customer = o.customer || {};
  const customerName = [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim() || null;

  return json({
    ok: true,
    order: {
      shopify_order_id: String(o.id),
      shopify_order_number: o.name,                    // e.g. "#12345"
      subtotal,
      suggested_eligible: suggestedEligible,
      customer_email: customer.email || o.email || null,
      customer_shopify_id: customer.id ? String(customer.id) : null,
      customer_name: customerName,
      order_date: o.processed_at || o.created_at,
      financial_status: o.financial_status,
      line_items: lineItems.map((li: any) => ({
        title: li.title,
        product_type: li.product_type,
        quantity: li.quantity,
        price: parseFloat(li.price || "0"),
        excluded: excluded.includes(li.product_type || ""),
      })),
    },
  });
});
