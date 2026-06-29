// Trailhead — Edge Function: shopify-create-discount-code
//
// Creates TWO Shopify discount codes per logical "discount" + persists
// one row in `ambassador_discount_codes`:
//
//   - **Public code** (e.g. KYLELPO500, KYLELPO-HOLIDAY) — $0 effective
//     discount; ambassador shares this with customers; attaches to the
//     order for attribution.
//   - **Internal code** (e.g. KYLELPO500C, KYLELPO-HOLIDAY-C) — the
//     ACTUAL discount value ($500 fixed for primary, template value for
//     bulk_promo); applied manually by Lone Peak staff on qualifying
//     orders.
//
// Commission attribution (Phase 1B) uses prefix-matching against
// `ambassadors.base_code` — any code on an order that starts with the
// base attributes to that ambassador, regardless of which of the two
// codes was used.
//
// Request (POST, authenticated, admin-only):
//   action="create" (default):
//     { ambassador_id: uuid,
//       base_code: "KYLELPO",
//       role: "primary" | "bulk_promo",
//       template_id?: uuid,           // required when role = bulk_promo
//       replace_existing?: boolean,   // if true: delete existing Shopify codes
//                                     // + DB row for (ambassador, role[, template])
//                                     // before creating new. Used by REBUILD
//                                     // action and when admin overrides values.
//       custom_public_code?: string,  // override the auto-derived public code
//                                     // (e.g. "KYLEISCOOL" instead of "KYLELPO500").
//                                     // Internal code becomes <custom> + "C".
//     }
//   action="delete":
//     { action: "delete", code_id: uuid }   // deletes Shopify codes + DB row
//                                            // for that ambassador_discount_codes row.
//                                            // Graceful on Shopify 404 (already deleted manually).
//   action="import_legacy":
//     { action: "import_legacy", ambassador_id, code, label? }
//                                            // Links an EXISTING Shopify discount
//                                            // code (created pre-Trailhead) to an
//                                            // ambassador for attribution. Inserts
//                                            // role='legacy' + visibility='hidden'
//                                            // so the ambassador's dashboard never
//                                            // surfaces it. Looks up the Shopify
//                                            // discount via /discount_codes/lookup.
//
// Response 200: { ok: true, code_row?: {...}, deleted?: true }
// Response 4xx/5xx: { ok: false, error: "...", detail?: ... }
//
// DEPLOY: `supabase functions deploy shopify-create-discount-code`

const SHOPIFY_TOKEN  = Deno.env.get("SHOPIFY_ADMIN_TOKEN");
const SHOPIFY_DOMAIN = Deno.env.get("SHOPIFY_SHOP_DOMAIN");
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const API_VERSION    = "2026-04";
// Shopify product ID for the DEPOSIT product. Primary PUBLIC codes are
// scoped to discount only this product (0% off, attaches for attribution),
// so ambassador codes can't be used to grab free shipping on accessories
// or merch. Set via:
//   supabase secrets set SHOPIFY_DEPOSIT_PRODUCT_ID=1234567890
const DEPOSIT_PRODUCT_ID = Deno.env.get("SHOPIFY_DEPOSIT_PRODUCT_ID");

// Primary code defaults — mirror commission_config.confirmation_min.
const PRIMARY_DISCOUNT_VALUE = 500;
const PRIMARY_CODE_SUFFIX    = "500";        // KYLELPO + "500" → KYLELPO500
const INTERNAL_CODE_SUFFIX   = "C";          // KYLELPO500 + "C" → KYLELPO500C

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

async function isAdmin(userId: string): Promise<boolean> {
  if (!SUPABASE_URL || !SERVICE_KEY) return false;
  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=role`, {
      headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` },
    });
    if (!resp.ok) return false;
    const rows = await resp.json();
    return Array.isArray(rows) && rows[0] && rows[0].role === "admin";
  } catch { return false; }
}

function normalizeBase(raw: string): string {
  const cleaned = (raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 14);                                 // leave room for the suffix
  if (cleaned.length >= 3) return cleaned;
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return ("AMB" + rand).slice(0, 14);
}

async function shopifyAdminFetch(path: string, init: RequestInit = {}) {
  const url = `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}${path}`;
  const resp = await fetch(url, {
    ...init,
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_TOKEN!,
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(init.headers || {}),
    },
  });
  let data: any = null;
  try { data = await resp.json(); } catch { /* may be empty */ }
  return { ok: resp.ok, status: resp.status, data };
}

async function supabaseFetch(path: string, init: RequestInit = {}) {
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

// Build a Shopify price_rule body. The "public" variant has zero monetary
// impact via free_shipping (free shipping is the only zero-impact discount
// type Shopify accepts natively). The "internal" variant carries the real
// discount amount.
function buildPriceRule(args: {
  title: string;
  variant: "public" | "internal";
  role?: string;                     // 'primary' | 'bulk_promo' — public variant
                                     // for primary is scoped to DEPOSIT only.
  kind?: string;
  value?: number | null;
  minPurchase?: number | null;
  startsAt?: string | null;          // ISO timestamp; null → starts immediately
  endsAt?: string | null;            // ISO timestamp; null → never expires
}) {
  const base: any = {
    title: args.title,
    customer_selection: "all",
    starts_at: args.startsAt || new Date().toISOString(),
    usage_limit: null,
    once_per_customer: false,
  };
  // ends_at: only set if provided. Shopify treats absence as "never expires".
  if (args.endsAt) base.ends_at = args.endsAt;

  // PUBLIC code: attaches to the order for ambassador attribution but
  // shouldn't actually discount anything for the customer.
  //
  // PRIMARY public: scoped to the DEPOSIT product (entitled_product_ids).
  //   - Code is rejected by Shopify if no DEPOSIT in cart → prevents
  //     ambassadors' customers from using the code to score free shipping
  //     on accessories/merch.
  //   - Cart contains DEPOSIT → code applies 0% off the DEPOSIT line item
  //     (literal $0 effect — code attached for attribution).
  //   - Shopify rejects fixed_amount value=0.00 but percentage value=-0.0
  //     is accepted (0% off = no change).
  //
  // BULK_PROMO public: stays as free-shipping (broad applies-to-all).
  // Bulk promos exist for general purchases (e.g. Holiday sale) — scoping
  // them to DEPOSIT would defeat the point of the promo.
  if (args.variant === "public") {
    if (args.role === "primary") {
      if (!DEPOSIT_PRODUCT_ID) {
        throw new Error("SHOPIFY_DEPOSIT_PRODUCT_ID secret missing — set it before creating primary codes.");
      }
      return {
        price_rule: {
          ...base,
          target_type: "line_item",
          target_selection: "entitled",
          entitled_product_ids: [Number(DEPOSIT_PRODUCT_ID)],
          allocation_method: "across",
          value_type: "percentage",
          value: "-0.0",
        },
      };
    }
    // bulk_promo / fallback: free shipping
    return {
      price_rule: {
        ...base,
        target_type: "shipping_line",
        target_selection: "all",
        allocation_method: "each",
        value_type: "percentage",
        value: "-100.0",
      },
    };
  }

  // INTERNAL: the actual discount the staff applies on qualifying orders.
  const { kind, value, minPurchase } = args;
  if (minPurchase != null && minPurchase > 0) {
    base.prerequisite_subtotal_range = { greater_than_or_equal_to: minPurchase.toFixed(2) };
  }
  if (kind === "fixed_amount") {
    return {
      price_rule: {
        ...base,
        target_type: "line_item",
        target_selection: "all",
        allocation_method: "across",
        value_type: "fixed_amount",
        value: `-${(value || 0).toFixed(2)}`,
      },
    };
  }
  if (kind === "free_shipping") {
    return {
      price_rule: {
        ...base,
        target_type: "shipping_line",
        target_selection: "all",
        allocation_method: "each",
        value_type: "percentage",
        value: "-100.0",
      },
    };
  }
  // Default: percentage.
  return {
    price_rule: {
      ...base,
      target_type: "line_item",
      target_selection: "all",
      allocation_method: "across",
      value_type: "percentage",
      value: `-${(value || 0).toFixed(1)}`,
    },
  };
}

// Resolve role-specific config: code naming + the internal-code's kind/value/min
// + active date range (from the template, if applicable).
async function resolveRoleConfig(role: string, baseCode: string, body: any): Promise<
  | { publicCode: string; internalCode: string; kind: string; value: number | null; minPurchase: number | null; label: string; templateId: string | null; startsAt: string | null; endsAt: string | null }
  | { error: string; status: number }
> {
  if (role === "primary") {
    return {
      publicCode: `${baseCode}${PRIMARY_CODE_SUFFIX}`,                             // KYLELPO500
      internalCode: `${baseCode}${PRIMARY_CODE_SUFFIX}${INTERNAL_CODE_SUFFIX}`,    // KYLELPO500C
      kind: "fixed_amount",
      value: PRIMARY_DISCOUNT_VALUE,
      minPurchase: null,                                                            // staff applies manually only on qualifying orders
      label: `Primary — $${PRIMARY_DISCOUNT_VALUE} off (staff-applied on $5,000+ orders)`,
      templateId: null,
      startsAt: null,                                                               // always active
      endsAt: null,
    };
  }
  if (role === "bulk_promo") {
    const templateId = body.template_id;
    if (!templateId) return { error: "bulk_promo role requires template_id", status: 400 };
    const tpl = await supabaseFetch(`/rest/v1/ambassador_discount_templates?id=eq.${templateId}&select=*`);
    const row = Array.isArray(tpl.data) ? tpl.data[0] : null;
    if (!row) return { error: "template not found", status: 404 };
    if (row.status !== "active") return { error: "template is archived", status: 400 };
    const suffix = normalizeBase(row.code_suffix);
    return {
      publicCode: `${baseCode}-${suffix}`,                                          // KYLELPO-HOLIDAY
      internalCode: `${baseCode}-${suffix}-${INTERNAL_CODE_SUFFIX}`,                // KYLELPO-HOLIDAY-C
      kind: row.kind,
      value: row.value,
      minPurchase: row.min_purchase_amount,
      label: row.label,
      templateId,
      startsAt: row.starts_at || null,                                              // template-defined active window
      endsAt: row.ends_at || null,
    };
  }
  return { error: `unknown role: ${role}`, status: 400 };
}

// Create one Shopify code (price_rule + discount_code pair). Returns the
// IDs or an error. Rollback handled by caller.
// Look up an existing Shopify discount code by its text. Returns the
// price_rule_id + discount_id so callers can reuse instead of recreating.
// Used for idempotency on retry-create flows (admin "RETRY PRIMARY CODE"
// after the orphan-row trap, see project_ambassador_program memory). 404
// from Shopify means the code doesn't exist yet — return null so caller
// proceeds with creation.
async function lookupExistingShopifyCode(code: string): Promise<
  { found: true; priceRuleId: string; discountId: string; finalCode: string }
  | { found: false }
  | { found: false; error: true; status: number; detail?: any }
> {
  if (!code) return { found: false };
  const r = await shopifyAdminFetch(`/discount_codes/lookup.json?code=${encodeURIComponent(code)}`, { method: "GET" });
  if (r.status === 404) return { found: false };
  if (!r.ok) return { found: false, error: true, status: r.status, detail: r.data };
  const dc = r.data?.discount_code;
  if (!dc?.id || !dc?.price_rule_id) return { found: false };
  return {
    found: true,
    priceRuleId: String(dc.price_rule_id),
    discountId: String(dc.id),
    finalCode: String(dc.code),
  };
}

async function createShopifyCode(args: {
  title: string;
  variant: "public" | "internal";
  role?: string;
  code: string;
  kind?: string;
  value?: number | null;
  minPurchase?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
}): Promise<{ ok: true; priceRuleId: string; discountId: string; finalCode: string; reused?: boolean } | { ok: false; error: string; status: number; detail?: any }> {
  // Idempotency check — if a Shopify discount with this exact code text
  // already exists, reuse its IDs instead of creating new. Two scenarios
  // this fixes:
  //   (1) Admin "RETRY PRIMARY CODE" after a prior partial-failure left
  //       Shopify codes provisioned without a matching DB row (no
  //       attribution lost because we reuse the same codes).
  //   (2) Same-base-code admin re-runs (replace_existing not set) — used
  //       to fail with "already taken" 422; now silently reuses.
  // If lookup itself errors (5xx from Shopify), fall through to create
  // and let that path error naturally — better than masking a real outage.
  const existing = await lookupExistingShopifyCode(args.code);
  if ((existing as any).found === true) {
    const e = existing as { found: true; priceRuleId: string; discountId: string; finalCode: string };
    return { ok: true, priceRuleId: e.priceRuleId, discountId: e.discountId, finalCode: e.finalCode, reused: true };
  }

  let prBody: any;
  try { prBody = buildPriceRule(args); }
  catch (e: any) { return { ok: false, error: e.message || String(e), status: 500 }; }
  const pr = await shopifyAdminFetch("/price_rules.json", {
    method: "POST",
    body: JSON.stringify(prBody),
  });
  if (!pr.ok || !pr.data?.price_rule?.id) {
    return { ok: false, error: `Shopify price_rule create failed (${args.variant})`, status: 502, detail: pr.data };
  }
  const priceRuleId = String(pr.data.price_rule.id);
  const dc = await shopifyAdminFetch(`/price_rules/${priceRuleId}/discount_codes.json`, {
    method: "POST",
    body: JSON.stringify({ discount_code: { code: args.code } }),
  });
  if (!dc.ok || !dc.data?.discount_code?.id) {
    try { await shopifyAdminFetch(`/price_rules/${priceRuleId}.json`, { method: "DELETE" }); } catch (_) {}
    const taken = dc.status === 422 && JSON.stringify(dc.data).toLowerCase().includes("has already been taken");
    return {
      ok: false,
      error: taken
        ? `Discount code "${args.code}" is already taken on Shopify — pick a different base code.`
        : `Shopify discount_code create failed (${args.variant})`,
      status: taken ? 409 : 502,
      detail: dc.data,
    };
  }
  return { ok: true, priceRuleId, discountId: String(dc.data.discount_code.id), finalCode: String(dc.data.discount_code.code) };
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

  // ─── IMPORT_LEGACY ACTION ─── link EXISTING Shopify codes to an ambassador
  // for attribution. Legacy = Collabs-era prefix-pair: a deposit/public code
  // (customer-facing, attaches to deposit orders for attribution, often $0
  // effective) AND an internal/discount code (staff-applies on qualifying
  // orders to grant the actual discount). Either or both can be linked in
  // one row. Inserted with role='legacy' + visibility='hidden' so the
  // ambassador's dashboard never surfaces them (admin-only management).
  //
  // Body: { action: "import_legacy", ambassador_id,
  //         code?: string,             // public/deposit code from Collabs
  //         internal_code?: string,    // staff-applied discount code
  //         label?: string }
  // At least one of `code` / `internal_code` must be provided.
  if (body.action === "import_legacy") {
    const ambassadorId = body.ambassador_id;
    const rawPublic = (body.code || "").toString().trim();
    const rawInternal = (body.internal_code || "").toString().trim();
    const label = body.label || "Legacy code (pre-Trailhead)";
    if (!ambassadorId) return json({ ok: false, error: "missing ambassador_id" }, 400);
    if (!rawPublic && !rawInternal) return json({ ok: false, error: "must provide at least one of `code` (deposit/public) or `internal_code` (staff-applied)" }, 400);

    // Reject if EITHER code is already linked to a live row (don't double-import).
    for (const [field, val] of [["code", rawPublic], ["internal_code", rawInternal]] as const) {
      if (!val) continue;
      const dupQuery = field === "code"
        ? `/rest/v1/ambassador_discount_codes?or=(code.eq.${encodeURIComponent(val)},internal_code.eq.${encodeURIComponent(val)})&status=neq.deleted&select=id,ambassador_id,code,internal_code`
        : `/rest/v1/ambassador_discount_codes?or=(code.eq.${encodeURIComponent(val)},internal_code.eq.${encodeURIComponent(val)})&status=neq.deleted&select=id,ambassador_id,code,internal_code`;
      const dupLookup = await supabaseFetch(dupQuery);
      if (dupLookup.ok && Array.isArray(dupLookup.data) && dupLookup.data[0]) {
        const dup = dupLookup.data[0];
        return json({
          ok: false,
          error: dup.ambassador_id === ambassadorId
            ? `Code "${val}" is already imported for this ambassador.`
            : `Code "${val}" is already linked to a different ambassador. Unlink there first.`,
        }, 409);
      }
    }

    // Look up the public code in Shopify if provided. Shopify's
    // /discount_codes/lookup.json returns 303 → fetch follows the redirect
    // and we get the resolved discount_code object.
    const lookupCode = async (code: string) => {
      if (!code) return { ok: true, dc: null };
      const r = await shopifyAdminFetch(`/discount_codes/lookup.json?code=${encodeURIComponent(code)}`, { method: "GET" });
      if (!r.ok) return { ok: false, status: r.status, detail: r.data };
      const dc = r.data?.discount_code;
      if (!dc || !dc.id || !dc.price_rule_id) return { ok: false, status: 502, detail: r.data };
      return { ok: true, dc };
    };
    const fetchPriceRuleDetails = async (priceRuleId: string) => {
      try {
        const pr = await shopifyAdminFetch(`/price_rules/${priceRuleId}.json`, { method: "GET" });
        if (pr.ok && pr.data?.price_rule) {
          const rule = pr.data.price_rule;
          let k = "fixed_amount";
          if (rule.value_type === "percentage") k = "percentage";
          else if (rule.target_type === "shipping_line") k = "free_shipping";
          const v = rule.value != null ? Math.abs(parseFloat(String(rule.value))) : null;
          const mp = rule.prerequisite_subtotal_range?.greater_than_or_equal_to
            ? parseFloat(String(rule.prerequisite_subtotal_range.greater_than_or_equal_to))
            : null;
          return { kind: k, value: v, minPurchase: mp };
        }
      } catch (e) { console.warn("[import_legacy] price_rule fetch failed (continuing)", e); }
      return { kind: "fixed_amount", value: null, minPurchase: null };
    };

    const pubLookup = await lookupCode(rawPublic);
    if (!pubLookup.ok) {
      return json({
        ok: false,
        error: pubLookup.status === 404
          ? `Public/deposit code "${rawPublic}" doesn't exist in your Shopify store.`
          : `Shopify lookup failed for "${rawPublic}" (${pubLookup.status}).`,
        detail: pubLookup.detail,
      }, pubLookup.status === 404 ? 404 : 502);
    }
    const intlLookup = await lookupCode(rawInternal);
    if (!intlLookup.ok) {
      return json({
        ok: false,
        error: intlLookup.status === 404
          ? `Internal/discount code "${rawInternal}" doesn't exist in your Shopify store.`
          : `Shopify lookup failed for "${rawInternal}" (${intlLookup.status}).`,
        detail: intlLookup.detail,
      }, intlLookup.status === 404 ? 404 : 502);
    }

    // Kind/value/minPurchase populated from whichever has a real discount
    // (typically the internal code carries the actual discount value).
    let kind = "fixed_amount";
    let value: number | null = null;
    let minPurchase: number | null = null;
    if (intlLookup.dc) {
      const det = await fetchPriceRuleDetails(String(intlLookup.dc.price_rule_id));
      kind = det.kind; value = det.value; minPurchase = det.minPurchase;
    } else if (pubLookup.dc) {
      const det = await fetchPriceRuleDetails(String(pubLookup.dc.price_rule_id));
      kind = det.kind; value = det.value; minPurchase = det.minPurchase;
    }

    const insertBody: Record<string, unknown> = {
      ambassador_id: ambassadorId,
      role: "legacy",
      // If only internal_code provided, use it as `code` too (schema requires
      // `code` to be non-null) and clear internal_code to avoid duplicate-
      // looking row.
      code: pubLookup.dc ? String(pubLookup.dc.code) : (intlLookup.dc ? String(intlLookup.dc.code) : rawInternal),
      shopify_price_rule_id: pubLookup.dc ? String(pubLookup.dc.price_rule_id) : (intlLookup.dc ? String(intlLookup.dc.price_rule_id) : null),
      shopify_discount_id: pubLookup.dc ? String(pubLookup.dc.id) : (intlLookup.dc ? String(intlLookup.dc.id) : null),
      internal_code: pubLookup.dc && intlLookup.dc ? String(intlLookup.dc.code) : null,
      internal_shopify_price_rule_id: pubLookup.dc && intlLookup.dc ? String(intlLookup.dc.price_rule_id) : null,
      internal_shopify_discount_id: pubLookup.dc && intlLookup.dc ? String(intlLookup.dc.id) : null,
      kind,
      value,
      min_purchase_amount: minPurchase,
      applies_to: "all",
      template_id: null,
      label,
      visibility: "hidden",
    };
    const ins = await supabaseFetch(`/rest/v1/ambassador_discount_codes`, {
      method: "POST",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify(insertBody),
    });
    if (!ins.ok) {
      return json({ ok: false, error: `DB insert failed for legacy code(s)`, detail: ins.data }, 502);
    }
    return json({ ok: true, code_row: Array.isArray(ins.data) ? ins.data[0] : ins.data });
  }

  // ─── DELETE ACTION ─── soft-delete: kill the Shopify codes (no new
  // orders can use them) but mark the DB row status='deleted' so Phase
  // 1B's webhook can still attribute historical orders that used this
  // code BEFORE deletion. Partial unique indexes (status != 'deleted')
  // free the code name for reuse. Graceful on Shopify 404 (admin may
  // have manually deleted in Shopify admin first).
  if (body.action === "delete") {
    const codeId = body.code_id;
    if (!codeId) return json({ ok: false, error: "missing code_id" }, 400);
    const lookup = await supabaseFetch(`/rest/v1/ambassador_discount_codes?id=eq.${codeId}&select=*`);
    const row = Array.isArray(lookup.data) ? lookup.data[0] : null;
    if (!row) return json({ ok: false, error: "code row not found" }, 404);
    // Best-effort Shopify deletions — 404 means already gone, treat as success.
    for (const prId of [row.shopify_price_rule_id, row.internal_shopify_price_rule_id]) {
      if (!prId) continue;
      try {
        const r = await shopifyAdminFetch(`/price_rules/${prId}.json`, { method: "DELETE" });
        if (!r.ok && r.status !== 404) {
          console.warn("[delete] shopify price_rule delete non-404 fail", prId, r.status, r.data);
        }
      } catch (e) { console.error("[delete] shopify price_rule delete threw", prId, e); }
    }
    // Soft-delete in DB — preserve the row for historical attribution.
    const upd = await supabaseFetch(`/rest/v1/ambassador_discount_codes?id=eq.${codeId}`, {
      method: "PATCH",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({ status: "deleted", updated_at: new Date().toISOString() }),
    });
    if (!upd.ok) return json({ ok: false, error: "Couldn't soft-delete code row in DB", detail: upd.data }, 502);
    return json({ ok: true, deleted: true, code: row.code, internal_code: row.internal_code });
  }

  // ─── CREATE ACTION (default) ───
  const role = body.role || "primary";
  const ambassadorId = body.ambassador_id;
  const baseCode = normalizeBase(body.base_code || "");
  if (!ambassadorId) return json({ ok: false, error: "missing ambassador_id" }, 400);
  if (!baseCode) return json({ ok: false, error: "missing or invalid base_code" }, 400);

  const cfg = await resolveRoleConfig(role, baseCode, body);
  if ("error" in cfg) return json({ ok: false, error: cfg.error }, cfg.status);

  // Custom code override — admin sets a code name that doesn't follow the
  // auto-derivation pattern (e.g. KYLEISCOOL instead of KYLELPO500).
  // Internal code automatically becomes <custom> + "C". Caller is expected
  // to also pass replace_existing=true if a code already exists for this
  // (ambassador, role[, template]) tuple. Allows up to 30 chars (leaving
  // room for the "C" suffix; Shopify accepts much longer but shorter is
  // friendlier for customers).
  if (typeof body.custom_public_code === "string" && body.custom_public_code.trim().length > 0) {
    const custom = body.custom_public_code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 30);
    if (custom.length < 3) return json({ ok: false, error: "custom_public_code too short (min 3 alphanumeric chars after normalization)" }, 400);
    cfg.publicCode = custom;
    cfg.internalCode = `${custom}${INTERNAL_CODE_SUFFIX}`;
  }

  // ─── REPLACE_EXISTING ─── used by REBUILD PRIMARY and EDIT CODE (rename).
  // Find any LIVE ambassador_discount_codes row(s) for (ambassador, role
  // [, template_id]), kill their Shopify codes, and soft-delete the DB rows
  // (status='deleted') so future webhook attribution can still look them
  // up. Partial unique indexes mean the new insert won't collide.
  if (body.replace_existing === true) {
    let existingQuery = `/rest/v1/ambassador_discount_codes?ambassador_id=eq.${ambassadorId}&role=eq.${role}&status=neq.deleted&select=*`;
    if (role === "bulk_promo" && cfg.templateId) {
      existingQuery += `&template_id=eq.${cfg.templateId}`;
    }
    const existing = await supabaseFetch(existingQuery);
    if (existing.ok && Array.isArray(existing.data)) {
      for (const row of existing.data) {
        if (row.shopify_price_rule_id) {
          try { await shopifyAdminFetch(`/price_rules/${row.shopify_price_rule_id}.json`, { method: "DELETE" }); } catch (e) { console.error("[rebuild] public price_rule delete failed", row.id, e); }
        }
        if (row.internal_shopify_price_rule_id) {
          try { await shopifyAdminFetch(`/price_rules/${row.internal_shopify_price_rule_id}.json`, { method: "DELETE" }); } catch (e) { console.error("[rebuild] internal price_rule delete failed", row.id, e); }
        }
      }
      // Soft-delete the existing rows. The partial unique index excludes
      // status='deleted' so the upcoming insert with the new code name
      // (or same name on rebuild) won't collide.
      let dbUpdateUrl = `/rest/v1/ambassador_discount_codes?ambassador_id=eq.${ambassadorId}&role=eq.${role}&status=neq.deleted`;
      if (role === "bulk_promo" && cfg.templateId) {
        dbUpdateUrl += `&template_id=eq.${cfg.templateId}`;
      }
      const upd = await supabaseFetch(dbUpdateUrl, {
        method: "PATCH",
        headers: { "Prefer": "return=minimal" },
        body: JSON.stringify({ status: "deleted", updated_at: new Date().toISOString() }),
      });
      if (!upd.ok) {
        return json({ ok: false, error: "Couldn't soft-delete existing code rows in DB", detail: upd.data }, 502);
      }
    }
  }

  // Build a human-readable value label used in the price_rule titles
  // visible inside Shopify admin → Discounts. Format is Kyle's spec:
  //   Public:   "<HANDLE> - <VALUE> - (Public $0 discount)"
  //   Internal: "<HANDLE> - <VALUE> - (actual <VALUE> discount)"
  const valueLabel = cfg.kind === "fixed_amount" && cfg.value != null
    ? `$${Number(cfg.value).toLocaleString()}`
    : cfg.kind === "percentage" && cfg.value != null
      ? `${cfg.value}%`
      : "FREE SHIP";
  const publicTitle = `${baseCode} - ${valueLabel} - (Public $0 discount)`;
  const internalTitle = `${baseCode} - ${valueLabel} - (actual ${valueLabel} discount)`;

  // 1. Create PUBLIC code (scoped to DEPOSIT for primary, free-shipping otherwise)
  const pub = await createShopifyCode({
    title: publicTitle,
    variant: "public",
    role,
    code: cfg.publicCode,
    startsAt: cfg.startsAt,
    endsAt: cfg.endsAt,
  });
  if (!pub.ok) {
    return json({ ok: false, error: pub.error, detail: pub.detail, code_attempted: cfg.publicCode }, pub.status);
  }

  // 2. Create INTERNAL code (the real discount — staff applies on qualifying orders)
  const intl = await createShopifyCode({
    title: internalTitle,
    variant: "internal",
    role,
    code: cfg.internalCode,
    kind: cfg.kind,
    value: cfg.value,
    minPurchase: cfg.minPurchase,
    startsAt: cfg.startsAt,
    endsAt: cfg.endsAt,
  });
  if (!intl.ok) {
    // Roll back the public price_rule we just created so we don't orphan it.
    try { await shopifyAdminFetch(`/price_rules/${pub.priceRuleId}.json`, { method: "DELETE" }); } catch (_) {}
    return json({ ok: false, error: intl.error, detail: intl.detail, code_attempted: cfg.internalCode }, intl.status);
  }

  // 3. Persist one row in ambassador_discount_codes with BOTH code IDs.
  const insertBody = {
    ambassador_id: ambassadorId,
    role,
    code: pub.finalCode,
    shopify_price_rule_id: pub.priceRuleId,
    shopify_discount_id: pub.discountId,
    internal_code: intl.finalCode,
    internal_shopify_price_rule_id: intl.priceRuleId,
    internal_shopify_discount_id: intl.discountId,
    kind: cfg.kind,
    value: cfg.value,
    min_purchase_amount: cfg.minPurchase,
    applies_to: "all",
    template_id: cfg.templateId,
    label: cfg.label,
  };
  const ins = await supabaseFetch(`/rest/v1/ambassador_discount_codes`, {
    method: "POST",
    headers: { "Prefer": "return=representation" },
    body: JSON.stringify(insertBody),
  });
  if (!ins.ok) {
    return json({
      ok: false,
      error: `Public + internal codes created on Shopify but local DB insert failed — manual cleanup needed.`,
      detail: ins.data,
      shopify_public_price_rule_id: pub.priceRuleId,
      shopify_internal_price_rule_id: intl.priceRuleId,
      public_code: pub.finalCode,
      internal_code: intl.finalCode,
    }, 502);
  }

  return json({
    ok: true,
    code_row: Array.isArray(ins.data) ? ins.data[0] : ins.data,
  });
});
