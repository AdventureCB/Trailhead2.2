// Trailhead — Edge Function: raffle-pick-winner
//
// Picks a random winner for an event drawing, mints a one-time Shopify
// discount code, stores it (admin+winner RLS), and fires a "you won" push.
//
// Caller must be an ADMIN or an assigned HOST of the event (raffle_hosts).
// The draw is atomic: the event row is flipped 'collecting' → 'drawn' with a
// status-guarded UPDATE, so two hosts tapping at once can't crown two winners.
//
// The Shopify code = <event.code_prefix><last4 of winner phone>, a
// fixed_amount discount off orders >= min, usage_limit 1, expiring in
// event.code_expiry_days. The code is NEVER returned to the caller (a host
// may be a non-admin) — it lives in raffle_winner_codes, readable only by
// the admin + the winner. The push carries no code (lock-screen safety).
//
// DEPLOY: supabase functions deploy raffle-pick-winner
// Secrets: SHOPIFY_ADMIN_TOKEN, SHOPIFY_SHOP_DOMAIN, SUPABASE_URL,
//          SUPABASE_SERVICE_ROLE_KEY

const SHOPIFY_TOKEN  = Deno.env.get("SHOPIFY_ADMIN_TOKEN");
const SHOPIFY_DOMAIN = Deno.env.get("SHOPIFY_SHOP_DOMAIN");
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const API_VERSION    = "2026-04";

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
async function sb(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; data: any }> {
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Accept: "application/json", ...(init.headers || {}) },
  });
  let data: any = null; try { data = await r.json(); } catch {}
  return { ok: r.ok, status: r.status, data };
}
async function shopify(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; data: any }> {
  const r = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}${path}`, {
    ...init,
    headers: { "X-Shopify-Access-Token": SHOPIFY_TOKEN!, "Content-Type": "application/json", Accept: "application/json", ...(init.headers || {}) },
  });
  let data: any = null; try { data = await r.json(); } catch {}
  return { ok: r.ok, status: r.status, data };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
  if (!SHOPIFY_TOKEN || !SHOPIFY_DOMAIN || !SUPABASE_URL || !SERVICE_KEY) return json({ ok: false, error: "server not configured" }, 500);

  const uid = extractUserId(req.headers.get("authorization"));
  if (!uid) return json({ ok: false, error: "unauthorized" }, 401);

  let body: any = {}; try { body = await req.json(); } catch {}
  const eventId = String(body?.event_id || "");
  if (!eventId) return json({ ok: false, error: "event_id required" }, 400);

  // ── Authorize: admin OR assigned host ──
  const profResp = await sb(`/rest/v1/profiles?id=eq.${uid}&select=role`);
  const isAdmin = Array.isArray(profResp.data) && profResp.data[0]?.role === "admin";
  let isHost = isAdmin;
  if (!isHost) {
    const hostResp = await sb(`/rest/v1/raffle_hosts?event_id=eq.${eventId}&user_id=eq.${uid}&select=user_id`);
    isHost = Array.isArray(hostResp.data) && hostResp.data.length > 0;
  }
  if (!isHost) return json({ ok: false, error: "not authorized to run this drawing" }, 403);

  // ── Load event ──
  const evResp = await sb(`/rest/v1/raffle_events?id=eq.${eventId}&select=*`);
  const event = Array.isArray(evResp.data) ? evResp.data[0] : null;
  if (!event) return json({ ok: false, error: "event not found" }, 404);
  if (event.status !== "collecting") return json({ ok: false, error: `drawing is '${event.status}', not open` }, 400);

  // ── Pick a random entry ──
  const entriesResp = await sb(`/rest/v1/raffle_entries?event_id=eq.${eventId}&select=id,user_id,name,email,phone`);
  const entries: any[] = Array.isArray(entriesResp.data) ? entriesResp.data : [];
  if (entries.length === 0) return json({ ok: false, error: "no entries to draw from" }, 400);
  const winner = entries[Math.floor(Math.random() * entries.length)];

  // ── Atomic claim: only succeeds if still 'collecting' ──
  const claim = await sb(`/rest/v1/raffle_events?id=eq.${eventId}&status=eq.collecting`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ status: "drawn", winner_entry_id: winner.id, updated_at: new Date().toISOString() }),
  });
  if (!claim.ok || !Array.isArray(claim.data) || claim.data.length === 0) {
    return json({ ok: false, error: "drawing was already run" }, 409);
  }
  // Mark the winning entry.
  await sb(`/rest/v1/raffle_entries?id=eq.${winner.id}`, {
    method: "PATCH", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ is_winner: true, won_at: new Date().toISOString() }),
  });

  // ── Mint the Shopify one-time code ──
  const last4 = String(winner.phone || "").replace(/\D/g, "").slice(-4) || String(Math.floor(1000 + Math.random() * 9000));
  const prefix = String(event.code_prefix || "WIN").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const discountDollars = (Number(event.discount_cents) || 0) / 100;
  const minDollars = (Number(event.min_purchase_cents) || 0) / 100;
  const expiryDays = Number(event.code_expiry_days) || 30;
  const endsAt = new Date(Date.now() + expiryDays * 86400000).toISOString();

  // Create the price rule (fixed amount off, min subtotal, single use).
  const prBody = {
    price_rule: {
      title: `Raffle — ${event.name} — ${prefix}${last4}`,
      target_type: "line_item",
      target_selection: "all",
      allocation_method: "across",
      value_type: "fixed_amount",
      value: `-${discountDollars.toFixed(2)}`,
      customer_selection: "all",
      once_per_customer: true,
      usage_limit: 1,
      prerequisite_subtotal_range: { greater_than_or_equal_to: minDollars.toFixed(2) },
      starts_at: new Date().toISOString(),
      ends_at: endsAt,
    },
  };
  const pr = await shopify("/price_rules.json", { method: "POST", body: JSON.stringify(prBody) });
  if (!pr.ok || !pr.data?.price_rule?.id) {
    // Draw already committed; surface the failure so admin can retry code gen.
    console.error("[raffle-pick-winner] price_rule create failed", pr.status, pr.data);
    return json({ ok: false, error: "winner picked but Shopify code failed — check Shopify", detail: pr.data, winner: { user_id: winner.user_id, name: winner.name } }, 502);
  }
  const priceRuleId = String(pr.data.price_rule.id);
  // Discount code — retry with a numeric suffix on collision.
  let finalCode = `${prefix}${last4}`;
  let discountId: string | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const tryCode = attempt === 0 ? finalCode : `${prefix}${last4}${attempt + 1}`;
    const dc = await shopify(`/price_rules/${priceRuleId}/discount_codes.json`, { method: "POST", body: JSON.stringify({ discount_code: { code: tryCode } }) });
    if (dc.ok && dc.data?.discount_code?.id) { finalCode = tryCode; discountId = String(dc.data.discount_code.id); break; }
    const taken = dc.status === 422 && JSON.stringify(dc.data).toLowerCase().includes("already been taken");
    if (!taken) { console.error("[raffle-pick-winner] discount_code create failed", dc.status, dc.data); }
  }
  if (!discountId) {
    return json({ ok: false, error: "winner picked but code creation failed — check Shopify", winner: { user_id: winner.user_id, name: winner.name } }, 502);
  }

  // ── Store the code (admin + winner RLS) ──
  await sb(`/rest/v1/raffle_winner_codes`, {
    method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      event_id: eventId, entry_id: winner.id, user_id: winner.user_id,
      code: finalCode, shopify_price_rule_id: priceRuleId, shopify_discount_id: discountId,
      discount_cents: event.discount_cents, min_purchase_cents: event.min_purchase_cents, expires_at: endsAt,
    }),
  });

  // ── Push + bell notification (no code in the body — lock-screen safe) ──
  await sb(`/rest/v1/notifications`, {
    method: "POST", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: winner.user_id,
      actor_id: uid,
      actor_name: "Trailhub",
      type: "raffle_won",
      text: `🎉 You won ${event.name}! Open the app to grab your prize code.`,
      target: event.slug,  // send-push routes raffle_won → /win/<slug>
    }),
  });

  // ── DM the winner the actual code, from a fixed admin account when
  // configured (RAFFLE_DM_SENDER_ID), else from the host who ran the draw. ──
  const DM_SENDER = Deno.env.get("RAFFLE_DM_SENDER_ID") || uid;
  try {
    const dollars = (Number(event.discount_cents) || 0) / 100;
    const minD = (Number(event.min_purchase_cents) || 0) / 100;
    const expLabel = new Date(endsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const dmBody = `🎉 Congratulations — you won ${event.name}!\n\nYour one-time code for $${dollars.toLocaleString()} off (on $${minD.toLocaleString()}+ orders): ${finalCode}\n\nExpires ${expLabel}. Redeem at checkout on lonepeakoverland.com. Keep this code private.`;
    await sb(`/rest/v1/rpc/raffle_send_winner_dm`, {
      method: "POST", headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ p_sender: DM_SENDER, p_recipient: winner.user_id, p_body: dmBody }),
    });
  } catch (e) { console.warn("[raffle-pick-winner] winner DM failed (non-fatal)", e); }

  return json({
    ok: true,
    winner: { entry_id: winner.id, user_id: winner.user_id, name: winner.name, email: winner.email },
    // Code intentionally NOT returned — admin + winner read it via RLS.
  });
});
