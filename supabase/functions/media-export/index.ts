// Trailhub — Edge Function: media-export
//
// Mirrors public user-generated media into Dropbox for the social-media
// flywheel. Called by DB triggers (see 20261014_media_exports.sql) with
// { table, id }, authenticated by the Vault shared secret header.
//
// Per row it resolves every storage media URL, names each file
//   <handle>_<context>_<YYYY-MM-DD>_<n>.<ext>
// and asks Dropbox to fetch it (files/save_url — Dropbox pulls straight from
// public storage, nothing streams through here). Folder layout:
//   <ROOT>/Builds/<year>/
//   <ROOT>/Feed/<year>/
//   <ROOT>/Trip Reports/<year>/<handle>_<slug>/   (+ <handle>_<slug>_map.png)
//   <ROOT>/Camp Spots/<year>/
//   <ROOT>/Gear Drops/<drop-slug>/
// The `media_exports` ledger makes re-fires + backfills idempotent.
//
// DEPLOY: supabase functions deploy media-export --no-verify-jwt
// Secrets: DROPBOX_APP_KEY, DROPBOX_APP_SECRET, DROPBOX_REFRESH_TOKEN,
//          DROPBOX_ROOT_PATH (default "/Trailhub Media"), MAPBOX_TOKEN,
//          SEND_PUSH_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const SHARED_SECRET = Deno.env.get("SEND_PUSH_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const DBX_KEY = Deno.env.get("DROPBOX_APP_KEY");
const DBX_SECRET = Deno.env.get("DROPBOX_APP_SECRET");
const DBX_REFRESH = Deno.env.get("DROPBOX_REFRESH_TOKEN");
const ROOT = (Deno.env.get("DROPBOX_ROOT_PATH") || "/Trailhub Media").replace(/\/+$/, "");
const MAPBOX_TOKEN = Deno.env.get("MAPBOX_TOKEN");
const SITE = "https://trailhead.lonepeakoverland.com";

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
function safeEqual(a: string, b: string) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }

// ── Supabase (service role) ──────────────────────────────────────────────────
async function sb(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers || {}) } });
  const text = await res.text(); let data: any = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(`supabase ${path} ${res.status}: ${typeof data === "string" ? data : JSON.stringify(data).slice(0, 300)}`);
  return data;
}

// ── Dropbox ──────────────────────────────────────────────────────────────────
let _token: { value: string; exp: number } | null = null;
async function dbxToken(): Promise<string> {
  if (_token && Date.now() < _token.exp) return _token.value;
  const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: DBX_REFRESH!, client_id: DBX_KEY!, client_secret: DBX_SECRET! });
  const res = await fetch("https://api.dropboxapi.com/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const d = await res.json();
  if (!res.ok || !d.access_token) throw new Error("dropbox token refresh failed: " + JSON.stringify(d).slice(0, 200));
  _token = { value: d.access_token, exp: Date.now() + Math.max(60, (d.expires_in || 14400) - 300) * 1000 };
  return _token.value;
}
// Team space: files live under the team's root namespace, not the member's
// home. Resolve once and send it as the path root on every call.
let _pathRoot: string | null | undefined = undefined;
async function dbxPathRootHeader(): Promise<Record<string, string>> {
  if (_pathRoot === undefined) {
    try {
      const res = await fetch("https://api.dropboxapi.com/2/users/get_current_account", { method: "POST", headers: { Authorization: `Bearer ${await dbxToken()}` } });
      const d = await res.json();
      const ri = d && d.root_info;
      // Team accounts report root_info as the member's home (tag "user") but
      // still expose the TEAM root namespace. Whenever a distinct team root
      // exists, write there — that's the shared space the social team sees,
      // not the admin's personal "/Lone Peak Admin" folder.
      const teamRoot = ri && ri.root_namespace_id && ri.root_namespace_id !== ri.home_namespace_id ? ri.root_namespace_id : null;
      _pathRoot = teamRoot ? JSON.stringify({ ".tag": "root", root: teamRoot }) : null;
    } catch (e) { console.warn("[dbx] account lookup failed", e); _pathRoot = null; }
  }
  return _pathRoot ? { "Dropbox-API-Path-Root": _pathRoot } : {};
}
// Dropbox serializes writes per shared folder: parallel invocations writing
// into the same folder get 409 too_many_write_operations (or 429). Those are
// retryable — honor Retry-After, back off with jitter, give up after ~1 min.
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
function retryable(status: number, text: string) {
  return status === 429 || (status === 409 && /too_many_write_operations|too_many_requests/.test(text)) || status >= 500;
}
async function dbxRaw(url: string, headers: Record<string, string>, body: BodyInit, label: string) {
  let wait = 1000;
  for (let attempt = 0; attempt < 7; attempt++) {
    const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${await dbxToken()}`, ...(await dbxPathRootHeader()), ...headers }, body });
    const text = await res.text();
    if (res.ok) { try { return text ? JSON.parse(text) : null; } catch { return text; } }
    if (retryable(res.status, text) && attempt < 6) {
      const ra = Number(res.headers.get("Retry-After") || 0);
      await sleep(Math.max(ra * 1000, wait) + Math.random() * 500);
      wait = Math.min(wait * 2, 16000);
      continue;
    }
    throw new Error(`dropbox ${label} ${res.status}: ${text.slice(0, 300)}`);
  }
  throw new Error(`dropbox ${label}: retries exhausted`);
}
async function dbx(endpoint: string, body: unknown) {
  return dbxRaw(`https://api.dropboxapi.com/2/${endpoint}`, { "Content-Type": "application/json" }, JSON.stringify(body), endpoint);
}
async function dbxEnsureFolder(path: string) {
  try { await dbx("files/create_folder_v2", { path, autorename: false }); }
  catch (e) { const m = String((e as Error).message || ""); if (!/conflict/.test(m)) throw e; }
}
// save_url is async: acceptance ≠ success. The fetch+commit happens later and
// can still fail (most often the per-folder write lock when many jobs commit at
// once). Poll the job to a terminal state and retry the whole save on failure.
async function dbxSaveUrl(path: string, url: string): Promise<"done" | "sent"> {
  let wait = 1500;
  for (let attempt = 0; attempt < 4; attempt++) {
    const d = await dbx("files/save_url", { path, url });
    if (d && d[".tag"] === "complete") return "done";
    const jobId = d && d.async_job_id;
    if (!jobId) return "sent";
    for (let poll = 0; poll < 10; poll++) {
      await sleep(1000);
      const st = await dbx("files/save_url/check_job_status", { async_job_id: jobId });
      const tag = st && st[".tag"];
      if (tag === "complete") return "done";
      if (tag === "failed") {
        const why = JSON.stringify(st.failed || st).slice(0, 200);
        if (attempt === 3) throw new Error(`save_url job failed: ${why}`);
        console.warn("[dbx] save_url job failed, retrying:", why);
        await sleep(wait + Math.random() * 800); wait = Math.min(wait * 2, 12000);
        break; // → next attempt
      }
      // in_progress → keep polling
      if (poll === 9) return "sent"; // still running; reconciliation will confirm later
    }
  }
  return "sent";
}
// Does the file exist in Dropbox? Used to reconcile earlier "sent" rows.
async function dbxExists(path: string): Promise<boolean> {
  try { const m = await dbx("files/get_metadata", { path }); return !!(m && m[".tag"] === "file"); }
  catch (e) { if (/not_found/.test(String((e as Error).message))) return false; throw e; }
}
async function dbxUploadBytes(path: string, bytes: Uint8Array) {
  await dbxRaw("https://content.dropboxapi.com/2/files/upload", { "Content-Type": "application/octet-stream", "Dropbox-API-Arg": JSON.stringify({ path, mode: "overwrite", mute: true }) }, bytes, "files/upload");
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const slug = (s: unknown, max = 48) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max) || "untitled";
const ymd = (iso: string | null | undefined) => { const d = iso ? new Date(iso) : new Date(); return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10); };
const yearOf = (iso: string | null | undefined) => ymd(iso).slice(0, 4);
function extOf(url: string) {
  const m = url.split("?")[0].match(/\.([a-z0-9]{2,5})$/i);
  const e = (m ? m[1] : "jpg").toLowerCase();
  return /^(jpe?g|png|webp|gif|heic|mp4|mov|webm|m4v)$/.test(e) ? (e === "jpeg" ? "jpg" : e) : "jpg";
}
// Walk any JSON and collect our storage media URLs (dedupe, normalize
// /render/image/ transforms back to the original object). Schema-agnostic on
// purpose: build_data / route_data / progress all nest photos differently.
function collectMediaUrls(node: unknown, out = new Set<string>()): Set<string> {
  if (!node) return out;
  if (typeof node === "string") {
    if (node.indexOf("/storage/v1/") >= 0 && /^https?:\/\//.test(node)) out.add(node.replace("/storage/v1/render/image/", "/storage/v1/object/").split("?")[0]);
    return out;
  }
  if (Array.isArray(node)) { node.forEach(n => collectMediaUrls(n, out)); return out; }
  if (typeof node === "object") { Object.values(node as Record<string, unknown>).forEach(v => collectMediaUrls(v, out)); }
  return out;
}
async function handleFor(userId: string | null): Promise<string> {
  if (!userId) return "user";
  try { const p = await sb(`profiles?id=eq.${userId}&select=handle`); return slug(p?.[0]?.handle || userId.slice(0, 8), 32); } catch { return userId.slice(0, 8); }
}
// Ledger rows for this source: done = confirmed in Dropbox; sent = accepted
// but unconfirmed (verify before trusting); error = retry.
async function ledgerRows(table: string, id: string): Promise<Map<string, { status: string; path: string | null }>> {
  const out = new Map<string, { status: string; path: string | null }>();
  try { const rows = await sb(`media_exports?source_table=eq.${table}&source_id=eq.${id}&select=media_key,status,dropbox_path`); (rows || []).forEach((r: any) => out.set(r.media_key, { status: r.status, path: r.dropbox_path })); }
  catch { /* treat as empty */ }
  return out;
}
async function ledger(table: string, id: string, userId: string | null, key: string, path: string | null, status: string, error?: string) {
  try { await sb(`media_exports`, { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ source_table: table, source_id: id, user_id: userId, media_key: key, dropbox_path: path, status, error: error ? error.slice(0, 500) : null }) }); }
  catch (e) { console.warn("[ledger]", e); }
}

// Google-style polyline encoding for the Mapbox Static Images path overlay.
function encodePolyline(points: [number, number][]) { // [lng, lat]
  let out = "", plat = 0, plng = 0;
  const enc = (v: number) => { let s = ""; v = v < 0 ? ~(v << 1) : (v << 1); while (v >= 0x20) { s += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; } return s + String.fromCharCode(v + 63); };
  for (const [lng, lat] of points) { const la = Math.round(lat * 1e5), lo = Math.round(lng * 1e5); out += enc(la - plat) + enc(lo - plng); plat = la; plng = lo; }
  return out;
}
async function routeMapPng(geom: [number, number][], start: [number, number] | null): Promise<Uint8Array | null> {
  if (!MAPBOX_TOKEN || !geom || geom.length < 2) return null;
  const pts = geom.length > 90 ? geom.filter((_, i) => i % Math.ceil(geom.length / 90) === 0).concat([geom[geom.length - 1]]) : geom;
  const path = `path-4+c49a6c-0.95(${encodeURIComponent(encodePolyline(pts))})`;
  const pin = start ? `,pin-s+bd472a(${start[0]},${start[1]})` : "";
  const url = `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/${path}${pin}/auto/1200x800@2x?padding=60&access_token=${MAPBOX_TOKEN}`;
  // The token is URL-restricted to our domain — send a matching Referer.
  const res = await fetch(url, { headers: { Referer: SITE + "/", Origin: SITE } });
  if (!res.ok) { console.warn("[map] static image failed", res.status, (await res.text()).slice(0, 200)); return null; }
  return new Uint8Array(await res.arrayBuffer());
}

// ── Per-table resolution → list of { key, url?|bytes?, folder, filename } ──
type Item = { key: string; url?: string; bytes?: Uint8Array; folder: string; filename: string };

async function resolve(table: string, id: string): Promise<{ userId: string | null; items: Item[] }> {
  if (table === "posts") {
    const r = (await sb(`posts?id=eq.${id}&select=id,user_id,data,hidden_at,created_at`))?.[0];
    if (!r || r.hidden_at) return { userId: null, items: [] };
    const h = await handleFor(r.user_id);
    const urls = Array.from(collectMediaUrls(r.data?.photoUrls));
    const folder = `${ROOT}/Feed/${yearOf(r.created_at)}`;
    return { userId: r.user_id, items: urls.map((u, i) => ({ key: u, url: u, folder, filename: `${h}_post_${ymd(r.created_at)}_${i + 1}.${extOf(u)}` })) };
  }
  if (table === "builds") {
    const r = (await sb(`builds?id=eq.${id}&select=id,user_id,name,year,make,model,build_data,created_at`))?.[0];
    if (!r) return { userId: null, items: [] };
    const h = await handleFor(r.user_id);
    const ctx = slug([r.year, r.make, r.model].filter(Boolean).join("-") || r.name, 40);
    const urls = Array.from(collectMediaUrls(r.build_data));
    const folder = `${ROOT}/Builds/${yearOf(r.created_at)}`;
    return { userId: r.user_id, items: urls.map((u, i) => ({ key: u, url: u, folder, filename: `${h}_${ctx}_${ymd(r.created_at)}_${i + 1}.${extOf(u)}` })) };
  }
  if (table === "camping_spots") {
    const r = (await sb(`camping_spots?id=eq.${id}&select=id,user_id,name,photos,visibility,created_at`))?.[0];
    if (!r || (r.visibility && r.visibility !== "public")) return { userId: null, items: [] };
    const h = await handleFor(r.user_id);
    const urls = Array.from(collectMediaUrls(r.photos));
    const folder = `${ROOT}/Camp Spots/${yearOf(r.created_at)}`;
    return { userId: r.user_id, items: urls.map((u, i) => ({ key: u, url: u, folder, filename: `${h}_${slug(r.name, 40)}_${ymd(r.created_at)}_${i + 1}.${extOf(u)}` })) };
  }
  if (table === "trip_reports") {
    const r = (await sb(`trip_reports?id=eq.${id}&select=id,user_id,kind,status,visibility,slug,name,route_data,route_geom,progress,gear_drop_id,gd_review_status,start_lat,start_lng,created_at`))?.[0];
    if (!r) return { userId: null, items: [] };
    const h = await handleFor(r.user_id);
    if (r.kind === "gear_drop_run") {
      if (r.gd_review_status === "rejected") return { userId: null, items: [] };
      let dropSlug = "gear-drop";
      try { const d = (await sb(`gear_drops?id=eq.${r.gear_drop_id}&select=slug,title`))?.[0]; dropSlug = slug(d?.slug || d?.title || dropSlug, 48); } catch { /* keep default */ }
      const subs = Array.isArray(r.progress?.submissions) ? r.progress.submissions : [];
      const folder = `${ROOT}/Gear Drops/${dropSlug}`;
      const items: Item[] = [];
      subs.forEach((s: any) => { const u = s && typeof s.photoUrl === "string" ? s.photoUrl.split("?")[0] : null; if (u && u.indexOf("/storage/v1/") >= 0) items.push({ key: u, url: u, folder, filename: `${h}_stop${(s.waypointIdx ?? 0) + 1}_${ymd(s.submittedAt || r.created_at)}.${extOf(u)}` }); });
      return { userId: r.user_id, items };
    }
    if (r.status !== "published" || (r.visibility && r.visibility !== "public")) return { userId: null, items: [] };
    const tslug = slug(r.slug || r.name, 48);
    const folder = `${ROOT}/Trip Reports/${yearOf(r.created_at)}/${h}_${tslug}`;
    const urls = Array.from(collectMediaUrls(r.route_data));
    const items: Item[] = urls.map((u, i) => ({ key: u, url: u, folder, filename: `${h}_${tslug}_${ymd(r.created_at)}_${i + 1}.${extOf(u)}` }));
    // Map of the route — generated server-side and uploaded as bytes.
    const geom = Array.isArray(r.route_geom) ? r.route_geom.filter((p: any) => Array.isArray(p) && p.length >= 2) : [];
    if (geom.length >= 2) {
      const png = await routeMapPng(geom, (r.start_lng != null && r.start_lat != null) ? [r.start_lng, r.start_lat] : null);
      if (png) items.push({ key: `map:${r.id}`, bytes: png, folder, filename: `${h}_${tslug}_map.png` });
    }
    return { userId: r.user_id, items };
  }
  return { userId: null, items: [] };
}

// ── HTTP entry ───────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const header = req.headers.get("x-trailhead-push-secret") || "";
  if (!SHARED_SECRET || !safeEqual(header, SHARED_SECRET)) return json({ error: "unauthorized" }, 401);
  if (!DBX_KEY || !DBX_SECRET || !DBX_REFRESH) return json({ error: "Dropbox secrets not set" }, 500);
  let body: any = null; try { body = await req.json(); } catch { /* fallthrough */ }
  const table = body?.table, id = body?.id;
  if (!table || !id) return json({ error: "table + id required" }, 400);

  try {
    // Backfills fire every row at once; spread the invocations out a little so
    // they don't all hit Dropbox's per-folder write lock in the same instant.
    await sleep(Math.random() * 2500);
    const { userId, items } = await resolve(table, id);
    const seen = await ledgerRows(table, id);
    // Decide per item: done → skip; sent → verify it's really in Dropbox
    // (promote to done, else redo); error/unknown → do it.
    const todo: Item[] = [];
    let skipped = 0;
    for (const it of items) {
      const row = seen.get(it.key);
      if (row && row.status === "done") { skipped++; continue; }
      if (row && row.status === "sent" && row.path) {
        let exists = false;
        try { exists = await dbxExists(row.path); } catch (e) { console.warn("[dbx] metadata check failed", e); }
        if (exists) { await ledger(table, id, userId, it.key, row.path, "done"); skipped++; continue; }
      }
      todo.push(it);
    }
    if (!todo.length) return json({ ok: true, exported: 0, skipped });
    const folders = new Set(todo.map(it => it.folder));
    for (const f of folders) { try { await dbxEnsureFolder(f); } catch (e) { console.warn("[dbx] folder", f, e); } }
    let exported = 0, failed = 0;
    for (const it of todo) {
      const path = `${it.folder}/${it.filename}`;
      try {
        let status: "done" | "sent" = "done";
        if (it.bytes) await dbxUploadBytes(path, it.bytes);
        else if (it.url) status = await dbxSaveUrl(path, it.url);
        await ledger(table, id, userId, it.key, path, status);
        exported++;
      } catch (e) {
        failed++;
        const msg = (e as Error)?.message || String(e);
        console.error("[media-export]", table, id, it.filename, msg);
        await ledger(table, id, userId, it.key, path, "error", msg);
      }
      await new Promise(r => setTimeout(r, 150)); // be gentle with Dropbox's save_url rate limit
    }
    return json({ ok: true, exported, failed, skipped: items.length - todo.length });
  } catch (e) {
    const msg = (e as Error)?.message || String(e);
    console.error("[media-export] fatal", table, id, msg);
    return json({ error: msg }, 500);
  }
});
