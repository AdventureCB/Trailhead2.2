// Vercel serverless function — ambassador share-link redirect.
//
// URL pattern (via vercel.json rewrite): /r/:code → /api/r?code=:code
//
//   1. Calls bump_discount_code_click RPC to increment click_count + set
//      last_clicked_at on the matching ambassador_discount_codes row.
//      Looks up by public code OR internal code; ignores soft-deleted.
//   2. If the code resolves → 302 to Shopify's /discount/CODE pattern,
//      which sets a session cookie and persists the discount through to
//      checkout (more reliable than ?discount= query param).
//   3. If the code doesn't resolve (typo / deleted) → still redirect to
//      the storefront so the customer isn't dead-ended; they just won't
//      get the discount. Optionally we could 404 — but that's hostile.
//
// Headers: no-store so analytics aren't cached anywhere upstream.

const SUPABASE_URL = "https://babbgaziiyjfaqjsaxgd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_rGrh2oIi8fuBv_9w9ZSneg_H6HdBmk-";
const STORE_BASE = "https://lonepeakoverland.com";

module.exports = async (req, res) => {
  const raw = (req.query && req.query.code) || "";
  const code = String(raw).toUpperCase().replace(/[^A-Z0-9_\-]/g, "");

  // Validate before hitting Supabase to keep noise out of logs.
  if (!code || code.length < 2 || code.length > 50) {
    res.setHeader("Cache-Control", "no-store");
    return res.redirect(302, STORE_BASE + "/");
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bump_discount_code_click`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_code: code }),
    });
    // Don't block the redirect on RPC failure — telemetry is best-effort.
    if (!r.ok) {
      console.warn("[/r] bump rpc non-ok", r.status, await r.text().catch(() => ""));
    }
  } catch (e) {
    console.warn("[/r] bump rpc threw", (e && e.message) || String(e));
  }

  // Shopify discount-URL pattern: /discount/CODE applies the code +
  // sets a session cookie, then redirects to the `redirect` path
  // (homepage by default). More reliable than ?discount= query param.
  res.setHeader("Cache-Control", "no-store");
  return res.redirect(302, `${STORE_BASE}/discount/${encodeURIComponent(code)}?redirect=/`);
};
