// Trailhead — Edge Function: shopify-register-webhooks
//
// One-shot admin action. Registers Shopify webhooks pointing at our
// shopify-webhook edge function. Idempotent — lists existing webhooks
// first and skips any already pointing at our URL.
//
// Topics registered:
//   - orders/paid       (Phase 1B core — commission ingestion)
//   - orders/refunded   (Phase 1B.6 hook — handler will ignore until built)
//
// DEPLOY: `supabase functions deploy shopify-register-webhooks`
//   (WITH JWT verification — admin-only via service-role check)
//
// Required secrets:
//   SHOPIFY_ADMIN_TOKEN, SHOPIFY_SHOP_DOMAIN
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const SHOPIFY_TOKEN  = Deno.env.get("SHOPIFY_ADMIN_TOKEN");
const SHOPIFY_DOMAIN = Deno.env.get("SHOPIFY_SHOP_DOMAIN");
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const API_VERSION    = "2026-04";

const WEBHOOK_URL = `https://babbgaziiyjfaqjsaxgd.supabase.co/functions/v1/shopify-webhook`;
const TOPICS = ["orders/paid", "orders/refunded"];

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

async function shopifyAdminFetch(path: string, init: RequestInit = {}) {
  const r = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}${path}`, {
    ...init,
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_TOKEN!,
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(init.headers || {}),
    },
  });
  let data: any = null;
  try { data = await r.json(); } catch {}
  return { ok: r.ok, status: r.status, data };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
  if (!SHOPIFY_TOKEN || !SHOPIFY_DOMAIN) return json({ ok: false, error: "SHOPIFY secrets missing" }, 500);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ ok: false, error: "Supabase service-role env missing" }, 500);

  const userId = extractUserId(req.headers.get("authorization"));
  if (!userId) return json({ ok: false, error: "unauthenticated" }, 401);
  if (!(await isAdmin(userId))) return json({ ok: false, error: "not authorized" }, 403);

  // List existing webhooks → skip topics that are already pointing at our URL.
  const existing = await shopifyAdminFetch(`/webhooks.json?limit=250`);
  if (!existing.ok) {
    return json({ ok: false, error: "couldn't list existing webhooks", detail: existing.data }, 502);
  }
  const existingList: any[] = Array.isArray(existing.data?.webhooks) ? existing.data.webhooks : [];
  const alreadyOk = (topic: string) => existingList.some(w => w.topic === topic && w.address === WEBHOOK_URL);

  const results: any[] = [];
  for (const topic of TOPICS) {
    if (alreadyOk(topic)) {
      results.push({ topic, status: "already_registered" });
      continue;
    }
    // If the topic exists but points elsewhere (e.g. old dev URL), delete + re-register.
    const stale = existingList.find(w => w.topic === topic);
    if (stale) {
      const del = await shopifyAdminFetch(`/webhooks/${stale.id}.json`, { method: "DELETE" });
      if (!del.ok) console.warn("[register-webhooks] stale delete failed", topic, del.status);
    }
    const reg = await shopifyAdminFetch(`/webhooks.json`, {
      method: "POST",
      body: JSON.stringify({
        webhook: {
          topic,
          address: WEBHOOK_URL,
          format: "json",
        },
      }),
    });
    if (reg.ok && reg.data?.webhook?.id) {
      results.push({ topic, status: "registered", id: reg.data.webhook.id });
    } else {
      results.push({ topic, status: "failed", error: reg.data });
    }
  }

  return json({ ok: true, webhook_url: WEBHOOK_URL, results });
});
