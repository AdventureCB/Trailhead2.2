// Trailhub — Edge Function: raffle-crm-sync
//
// Pushes an opted-in raffle entry into Pipedrive so the sales team can work
// every entrant, not just the winner. Called by the DB trigger
// `raffle_entries_crm_sync` (pg_net) with { entry_id }, authenticated by the
// shared Vault secret in `x-trailhead-push-secret` (same as send-push).
//
// What it does, idempotently (skips if crm_synced_at is already set):
//   1. Person: find by email (then phone) or create — name / email / phone.
//   2. Deal: "Trailhub Raffle · <event> · <name>" in the lead-working
//      pipeline, first stage "Lead Pool" (PIPEDRIVE_STAGE_ID, default 62).
//   3. Note on the deal: event, consent timestamp, Trailhub handle.
//   4. Writes crm_person_id / crm_lead_id (deal id) / crm_synced_at back to
//      raffle_entries, or crm_error on failure (re-queue via
//      admin_resync_raffle_crm).
//
// DEPLOY: supabase functions deploy raffle-crm-sync --no-verify-jwt
//   (--no-verify-jwt: the trigger has no user JWT; the secret header gates it)
// Secrets: PIPEDRIVE_API_TOKEN (required), PIPEDRIVE_STAGE_ID (optional),
//          SEND_PUSH_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const PIPEDRIVE_TOKEN = Deno.env.get("PIPEDRIVE_API_TOKEN");
const STAGE_ID = Number(Deno.env.get("PIPEDRIVE_STAGE_ID") || "62"); // "Lead Pool"
const SHARED_SECRET = Deno.env.get("SEND_PUSH_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PD = "https://api.pipedrive.com/v1";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// Constant-time compare so the shared secret can't be timing-probed.
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Supabase REST helpers (service role — bypasses RLS on purpose).
async function sb(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers || {}) },
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(`supabase ${path} ${res.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
  return data;
}

// Pipedrive helpers.
async function pd(method: string, path: string, body?: unknown) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${PD}${path}${sep}api_token=${PIPEDRIVE_TOKEN}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(`pipedrive ${method} ${path} ${res.status}: ${data.error || data.error_info || JSON.stringify(data).slice(0, 200)}`);
  return data.data;
}

async function findPerson(email: string | null, phone: string | null): Promise<number | null> {
  for (const [term, field] of [[email, "email"], [phone, "phone"]] as const) {
    if (!term || term.length < 2) continue;
    try {
      const r = await pd("GET", `/persons/search?term=${encodeURIComponent(term)}&fields=${field}&exact_match=true&limit=1`);
      const hit = r?.items?.[0]?.item;
      if (hit?.id) return hit.id;
    } catch (e) { console.warn("[crm] person search failed", field, e); }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const header = req.headers.get("x-trailhead-push-secret") || "";
  if (!SHARED_SECRET || !safeEqual(header, SHARED_SECRET)) return json({ error: "unauthorized" }, 401);
  if (!PIPEDRIVE_TOKEN) return json({ error: "PIPEDRIVE_API_TOKEN not set" }, 500);

  let entryId: string | null = null;
  try { entryId = (await req.json())?.entry_id || null; } catch { /* fallthrough */ }
  if (!entryId) return json({ error: "entry_id required" }, 400);

  // Load entry + event + profile handle.
  const rows = await sb(`raffle_entries?id=eq.${entryId}&select=id,name,email,phone,contact_opt_in,contact_opt_in_at,crm_synced_at,created_at,user_id,event_id,raffle_events(name,slug)`);
  const entry = rows?.[0];
  if (!entry) return json({ error: "entry not found" }, 404);
  if (!entry.contact_opt_in) return json({ ok: true, skipped: "no consent" });
  if (entry.crm_synced_at) return json({ ok: true, skipped: "already synced" });

  let handle: string | null = null;
  try { const p = await sb(`profiles?id=eq.${entry.user_id}&select=handle`); handle = p?.[0]?.handle || null; } catch { /* optional */ }

  const eventName = entry.raffle_events?.name || "Raffle";
  const name = (entry.name || handle || entry.email || "Raffle entrant").trim();
  const email = (entry.email || "").trim() || null;
  const phone = (entry.phone || "").trim() || null;

  try {
    // 1. Person (dedupe on email, then phone).
    let personId = await findPerson(email, phone);
    if (!personId) {
      const person = await pd("POST", "/persons", {
        name,
        email: email ? [{ value: email, primary: true, label: "work" }] : undefined,
        phone: phone ? [{ value: phone, primary: true, label: "mobile" }] : undefined,
        visible_to: 3,
      });
      personId = person.id;
    }

    // 2. Deal in the lead-working pipeline (stage decides the pipeline).
    const deal = await pd("POST", "/deals", {
      title: `Trailhub Raffle · ${eventName} · ${name}`,
      person_id: personId,
      stage_id: STAGE_ID,
      visible_to: 3,
    });

    // 3. Note with the consent trail.
    const optedAt = entry.contact_opt_in_at || entry.created_at;
    await pd("POST", "/notes", {
      deal_id: deal.id,
      person_id: personId,
      content:
        `<b>Trailhub raffle entry</b> — ${eventName}<br>` +
        `Opted in to sales contact (phone / text / email) on ${new Date(optedAt).toLocaleString("en-US", { timeZone: "America/Los_Angeles" })} PT.<br>` +
        (handle ? `Trailhub handle: @${handle}<br>` : "") +
        (phone ? `Phone: ${phone}<br>` : "") +
        (email ? `Email: ${email}` : ""),
    });

    // 4. Bookkeeping.
    await sb(`raffle_entries?id=eq.${entryId}`, {
      method: "PATCH",
      body: JSON.stringify({ crm_person_id: String(personId), crm_lead_id: String(deal.id), crm_synced_at: new Date().toISOString(), crm_error: null }),
    });
    return json({ ok: true, person_id: personId, deal_id: deal.id });
  } catch (e) {
    const msg = (e as Error)?.message || String(e);
    console.error("[raffle-crm-sync]", entryId, msg);
    try { await sb(`raffle_entries?id=eq.${entryId}`, { method: "PATCH", body: JSON.stringify({ crm_error: msg.slice(0, 500) }) }); } catch { /* best effort */ }
    return json({ error: msg }, 502);
  }
});
