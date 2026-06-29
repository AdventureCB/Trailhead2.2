// Trailhead — Edge Function: shopify-refresh-gift-card
//
// JWT-required. Owner-or-admin. Fetches the current gift card balance
// from Shopify and updates profile cache cols (lpo_gift_card_balance_cents
// + lpo_gift_card_synced_at). Powers the refresh button on the user's
// VIEW GIFT CARD modal so users can verify spends without waiting for
// the next payout.
//
// Request (POST, JWT):
//   { user_id?: uuid }   — admin only; omit to refresh own card
//
// Response 200: { ok: true, balance_cents: number, last4: string|null, synced_at: string }
// Response 4xx/5xx: { ok: false, error: string, detail?: any }
//
// DEPLOY:
//   supabase functions deploy shopify-refresh-gift-card

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);

  if (!SHOPIFY_TOKEN || !SHOPIFY_DOMAIN || !SUPABASE_URL || !SERVICE_KEY) {
    return json({ ok: false, error: "server not configured" }, 500);
  }

  const callerUid = extractUserId(req.headers.get("authorization"));
  if (!callerUid) return json({ ok: false, error: "unauthorized" }, 401);

  let payload: { user_id?: string };
  try { payload = await req.json().catch(() => ({})); } catch { payload = {}; }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Resolve target user: caller's own id, or admin specifying another.
  let targetUid = callerUid;
  if (payload?.user_id && payload.user_id !== callerUid) {
    const { data: callerProfile } = await sb.from("profiles").select("role").eq("id", callerUid).maybeSingle();
    if (!callerProfile || (callerProfile as any).role !== "admin") {
      return json({ ok: false, error: "forbidden — only admin can refresh another user's card" }, 403);
    }
    targetUid = payload.user_id;
  }

  // Pull profile to get the cached gift card id.
  const { data: profile, error: profErr } = await sb
    .from("profiles")
    .select("lpo_gift_card_id, lpo_gift_card_last4, lpo_gift_card_balance_cents, lpo_gift_card_synced_at")
    .eq("id", targetUid)
    .maybeSingle();
  if (profErr) return json({ ok: false, error: "profile lookup failed", detail: profErr.message }, 500);
  if (!profile || !(profile as any).lpo_gift_card_id) {
    return json({ ok: true, balance_cents: 0, last4: null, synced_at: null, has_card: false });
  }
  const giftCardId = (profile as any).lpo_gift_card_id;

  // Fetch from Shopify.
  const url = `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/gift_cards/${giftCardId}.json`;
  const res = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_TOKEN!,
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return json({ ok: false, error: "shopify fetch failed", status: res.status, detail: text.slice(0, 400) }, 502);
  }
  const body = await res.json();
  if (!body?.gift_card) return json({ ok: false, error: "gift card not found in shopify response" }, 502);

  const balanceCents = Math.round(Number(body.gift_card.balance || 0) * 100);
  const last4 = String(body.gift_card.last_characters || (profile as any).lpo_gift_card_last4 || "").slice(-4) || null;
  const syncedAt = new Date().toISOString();

  // Update cache.
  const { error: upErr } = await sb
    .from("profiles")
    .update({
      lpo_gift_card_balance_cents: balanceCents,
      lpo_gift_card_last4: last4,
      lpo_gift_card_synced_at: syncedAt,
    })
    .eq("id", targetUid);
  if (upErr) console.warn("[shopify-refresh-gift-card] cache update failed", upErr);

  return json({ ok: true, balance_cents: balanceCents, last4, synced_at: syncedAt, has_card: true });
});
