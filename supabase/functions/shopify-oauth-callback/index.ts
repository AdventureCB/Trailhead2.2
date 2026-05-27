// Trailhead — Edge Function: shopify-oauth-callback
//
// One-shot handler for the Shopify OAuth install flow. Receives the
// authorization-code redirect from Shopify after the store owner clicks
// "Install" on the custom app, exchanges the code for a long-lived
// offline Admin API access token, and displays it ONCE on screen so the
// admin can copy it into Supabase secrets via `supabase secrets set`.
//
// This function is deployed WITHOUT --no-verify-jwt because… wait, that's
// not right either. The OAuth callback is hit by SHOPIFY redirecting the
// admin's browser — there's no Supabase JWT in that flow. So we deploy
// WITH --no-verify-jwt (public function) and validate the request using
// Shopify's HMAC signature + shop domain check instead.
//
// DEPLOY: `supabase functions deploy shopify-oauth-callback --no-verify-jwt`
//
// Required secrets:
//   SHOPIFY_CLIENT_ID      — from Dev Dashboard → Settings → Credentials
//   SHOPIFY_CLIENT_SECRET  — from Dev Dashboard → Settings → Credentials
//
// Once the admin captures the token, they should run:
//   supabase secrets set SHOPIFY_ADMIN_TOKEN=shpat_xxx SHOPIFY_SHOP_DOMAIN=xxx.myshopify.com
// and DELETE this function (it's single-use install machinery, no reason
// to leave a public callback endpoint around).

const CLIENT_ID     = Deno.env.get("SHOPIFY_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("SHOPIFY_CLIENT_SECRET");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { ...CORS, "Content-Type": "text/html; charset=utf-8" },
  });
}

// Verify the HMAC signature Shopify includes in every redirect.
// Algorithm: HMAC-SHA256 of all query params (sorted, joined by &) EXCEPT
// the hmac itself, keyed by client_secret. Constant-time compare result.
async function verifyShopifyHmac(url: URL, secret: string): Promise<boolean> {
  const params = new URLSearchParams(url.search);
  const hmac = params.get("hmac");
  if (!hmac) return false;
  params.delete("hmac");
  params.delete("signature"); // legacy param Shopify also strips
  // Sort + serialize
  const sorted = Array.from(params.entries()).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  const message = sorted.map(([k, v]) => `${k}=${v}`).join("&");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const computed = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  // Constant-time compare
  if (computed.length !== hmac.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ hmac.charCodeAt(i);
  return diff === 0;
}

// Reject anything that doesn't look like a *.myshopify.com domain.
function isValidShopDomain(shop: string | null): boolean {
  if (!shop) return false;
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(shop);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "GET") return html("Method not allowed", 405);
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return html("<h1>Server misconfigured</h1><p>SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET secrets are not set on the edge function.</p>", 500);
  }

  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  const code = url.searchParams.get("code");

  if (!isValidShopDomain(shop)) {
    return html("<h1>Invalid shop domain</h1><p>The <code>shop</code> query param is missing or not a *.myshopify.com domain.</p>", 400);
  }
  if (!code) {
    return html("<h1>Missing code</h1><p>The <code>code</code> query param is missing — did the install actually start from the Shopify auth URL?</p>", 400);
  }
  const validHmac = await verifyShopifyHmac(url, CLIENT_SECRET);
  if (!validHmac) {
    return html("<h1>HMAC verification failed</h1><p>The signature on this callback didn't match. Aborting to prevent token theft.</p>", 401);
  }

  // Exchange the authorization code for a long-lived offline access token.
  // Shopify endpoint: POST /admin/oauth/access_token
  let tokenJson: { access_token?: string; scope?: string; error?: string };
  try {
    const tokenResp = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      }),
    });
    tokenJson = await tokenResp.json();
    if (!tokenResp.ok || !tokenJson.access_token) {
      return html(
        `<h1>Token exchange failed</h1><pre>${JSON.stringify(tokenJson, null, 2)}</pre>`,
        502,
      );
    }
  } catch (e) {
    return html(`<h1>Token exchange threw</h1><pre>${String(e)}</pre>`, 500);
  }

  // Success — display once. The admin should immediately copy this into
  // Supabase secrets and delete this function from their project.
  return html(`<!doctype html>
<html><head>
  <meta charset="utf-8" />
  <title>Trailhead — Shopify token captured</title>
  <style>
    body { font: 14px/1.5 -apple-system, system-ui, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 16px; background: #111; color: #eee; }
    h1 { color: #5B8C5A; }
    pre, code { background: #2A2A28; padding: 12px; border-radius: 6px; display: block; overflow-x: auto; word-break: break-all; user-select: all; }
    .warn { background: #BD472A22; border: 1px solid #BD472A; padding: 12px; border-radius: 8px; margin: 16px 0; }
  </style>
</head><body>
  <h1>✅ Token captured</h1>
  <p>Copy the values below into Supabase secrets <strong>now</strong> — they are not stored anywhere by this function and reloading this page will not show them again.</p>

  <p><strong>Shop domain:</strong></p>
  <code>${shop}</code>

  <p><strong>Admin API access token:</strong></p>
  <code>${tokenJson.access_token}</code>

  <p><strong>Granted scopes:</strong></p>
  <code>${tokenJson.scope || "(not returned)"}</code>

  <div class="warn">
    <strong>Next steps:</strong>
    <ol>
      <li>Copy the token + shop domain above</li>
      <li>Run in your terminal:
        <pre>supabase secrets set SHOPIFY_ADMIN_TOKEN=${tokenJson.access_token} SHOPIFY_SHOP_DOMAIN=${shop}</pre>
      </li>
      <li>Tell Claude the secrets are set</li>
      <li>Delete this function: <code>supabase functions delete shopify-oauth-callback</code></li>
    </ol>
  </div>
</body></html>`);
});
