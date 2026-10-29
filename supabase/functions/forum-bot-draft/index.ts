// forum-bot-draft — API for an external bot (Grok) to DRAFT forum threads.
//
// Nothing publishes from here. Each call creates a row in
// public.forum_bot_drafts; admins get a bell + push, open Admin → BOT DRAFTS,
// edit, and APPROVE & PUBLISH (publish_forum_bot_draft RPC) or REJECT.
//
// Auth: `x-api-key: <FORUM_BOT_API_KEY>` (deploy with --no-verify-jwt; the
// bot has no Supabase session). Rotate with `supabase secrets set`.
//
// POST JSON — `action` picks the call (default "create"):
//   create         { title, subcategory_slug, body_markdown | sections[], photos[], members_only_hours?, notes?, source? }
//                  → { ok, id, status, review_url }
//   status         { id } → { ok, id, status, thread_url?, review_notes? }
//   subcategories  {}     → { ok, subcategories: [{slug, name, category}] }
//   list           { limit? } → { ok, drafts: [...] }   (the bot's own recent drafts)
//
// Body formats for `create`:
//   body_markdown — "## Heading" lines start a new section (its subheading);
//                   paragraphs, - bullets, 1. lists, **bold**, *italic*,
//                   [text](https://url) are converted to the forum's HTML.
//   sections      — [{ subheading, body }] with body already HTML (p/strong/em/a/ul/ol/li only).
//   photos        — ["https://…jpg"] or [{ url, alt }]; images are copied into our
//                   storage (post-photos/bot/…) so they're permanent + exported. First = hero.
//
// Secrets: FORUM_BOT_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto).

const API_KEY = Deno.env.get("FORUM_BOT_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE = "https://trailhead.lonepeakoverland.com";
const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
function safeEqual(a: string, b: string) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }

async function sb(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers || {}) } });
  const text = await res.text(); let data: any = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(`supabase ${path} ${res.status}: ${typeof data === "string" ? data : JSON.stringify(data).slice(0, 300)}`);
  return data;
}

// ── YouTube ─────────────────────────────────────────────────────────────────
// Mirrors the app's parseYouTubeId. A section may carry ONE video, stored as
// `videoUrl` (canonical watch URL); the thread renders it as an embed below
// the section's text.
function parseYouTubeId(input: unknown): string | null {
  if (!input || typeof input !== "string") return null;
  const t = input.trim();
  if (!t) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(t)) return t;
  let m;
  if ((m = t.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/))) return m[1];
  if ((m = t.match(/youtu\.be\/([A-Za-z0-9_-]{11})/))) return m[1];
  if ((m = t.match(/[?&]v=([A-Za-z0-9_-]{11})/))) return m[1];
  return null;
}
const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
// A line that is ONLY a YouTube link (optionally "@youtube <url>" / "video: <url>").
function youtubeLineId(line: string): string | null {
  const t = line.trim().replace(/^(?:@youtube|youtube:|video:)\s*/i, "");
  if (!/^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/\S+$/i.test(t)) return null;
  return parseYouTubeId(t);
}

// ── Markdown → forum sections ───────────────────────────────────────────────
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function inline(md: string): string {
  let s = esc(md);
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, t, u) => `<a href="${u.replace(/"/g, "&quot;")}" target="_blank" rel="noopener">${t}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  return s;
}
function blocksToHtml(lines: string[]): string {
  const out: string[] = [];
  let para: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.kind}>${list.items.map(i => `<li>${inline(i)}</li>`).join("")}</${list.kind}>`); list = null; } };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    const ul = line.match(/^\s*[-*•]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      flushPara();
      const kind = ul ? "ul" : "ol";
      if (!list || list.kind !== kind) { flushList(); list = { kind, items: [] }; }
      list.items.push((ul || ol)![1]);
      continue;
    }
    if (!line.trim()) { flushPara(); flushList(); continue; }
    flushList();
    para.push(line.trim());
  }
  flushPara(); flushList();
  return out.join("");
}
type Section = { subheading: string; body: string; videoUrl?: string } | { type: "url"; label: string; url: string };
const isUrlSection = (s: any) => s && s.type === "url";
// A line that is a call-to-action button: "[button: Label](https://url)" or
// "@button Label | https://url". Becomes its own {type:'url'} section at that
// position (the thread renders it as a full-width copper button).
function buttonLine(line: string): { label: string; url: string } | null {
  let m = line.trim().match(/^\[button:\s*([^\]]+?)\s*\]\((https?:\/\/\S+?)\)$/i);
  if (!m) m = line.trim().match(/^@button\s+(.+?)\s*\|\s*(https?:\/\/\S+)$/i);
  return m ? { label: m[1].trim().slice(0, 80), url: m[2].trim() } : null;
}
function markdownToSections(md: string, title: string): Section[] {
  type Draft = { subheading: string; lines: string[]; videoUrl?: string } | { type: "url"; label: string; url: string };
  const sections: Draft[] = [{ subheading: "", lines: [] }];
  const last = () => sections[sections.length - 1];
  const lastText = () => { const l = last(); if ("type" in l) { const n = { subheading: "", lines: [] as string[] }; sections.push(n); return n; } return l; };
  for (const line of md.replace(/\r/g, "").split("\n")) {
    const h = line.match(/^\s*#{1,3}\s+(.+?)\s*#*\s*$/);
    if (h) {
      // A leading "# Title" that just repeats the thread title isn't a section.
      const first = sections[0] as any;
      if (sections.length === 1 && !("type" in first) && first.lines.join("").trim() === "" && h[1].trim().toLowerCase() === (title || "").trim().toLowerCase()) continue;
      sections.push({ subheading: h[1].trim(), lines: [] });
      continue;
    }
    const btn = buttonLine(line);
    if (btn) { sections.push({ type: "url", label: btn.label, url: btn.url }); continue; }
    // A YouTube link alone on a line → that section's embedded video (one per
    // section; a second one starts a new untitled section so nothing is lost).
    const vid = youtubeLineId(line);
    if (vid) {
      let cur = lastText();
      if (cur.videoUrl) { cur = { subheading: "", lines: [] }; sections.push(cur); }
      cur.videoUrl = youtubeWatchUrl(vid);
      continue;
    }
    lastText().lines.push(line);
  }
  return sections
    .map((s): Section => {
      if ("type" in s) return { type: "url", label: s.label, url: s.url };
      const o: Section = { subheading: s.subheading, body: blocksToHtml(s.lines) };
      if (s.videoUrl) (o as any).videoUrl = s.videoUrl;
      return o;
    })
    .filter((s: any) => s.type === "url" ? /^https?:\/\/\S+$/i.test(s.url) : (s.subheading || s.body || s.videoUrl));
}

// Minimal allowlist sanitizer for bot-supplied HTML sections.
function sanitizeHtml(html: string): string {
  let s = String(html || "");
  s = s.replace(/<\s*(script|style|iframe|object|embed|form|input|svg|math)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  s = s.replace(/<\s*\/?\s*(?!\/?(p|br|strong|b|em|i|u|a|ul|ol|li|code|blockquote)\b)[a-z][^>]*>/gi, "");
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/href\s*=\s*("|')\s*javascript:[^"']*\1/gi, 'href="#"');
  return s;
}

// ── Photos → our storage ────────────────────────────────────────────────────
async function importPhoto(src: string, alt: string): Promise<{ url: string; alt: string } | null> {
  if (!/^https?:\/\//i.test(src)) return null;
  if (src.startsWith(`${SUPABASE_URL}/storage/v1/object/public/`)) return { url: src, alt };
  const res = await fetch(src, { headers: { "User-Agent": "TrailhubBot/1.0" } });
  if (!res.ok) return null;
  const ct = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" } as Record<string, string>)[ct];
  if (!ext) return null;
  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_PHOTO_BYTES) return null;
  const path = `bot/${crypto.randomUUID()}.${ext}`;
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/post-photos/${path}`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": ct, "x-upsert": "false" },
    body: buf,
  });
  if (!up.ok) { console.warn("[bot] upload failed", up.status, await up.text()); return null; }
  return { url: `${SUPABASE_URL}/storage/v1/object/public/post-photos/${path}`, alt };
}

// ── Actions ─────────────────────────────────────────────────────────────────
async function subcategories() {
  const subs = await sb(`forum_subcategories?select=slug,name,sort_order,category:forum_categories(slug,name,sort_order)&order=sort_order.asc`);
  return (subs || []).map((s: any) => ({ slug: s.slug, name: s.name, category: s.category?.name || "", category_slug: s.category?.slug || "" }))
    .sort((a: any, b: any) => (a.category + a.name).localeCompare(b.category + b.name));
}

async function create(body: any) {
  const title = String(body.title || "").trim();
  if (!title) return json({ error: "title required" }, 400);
  if (title.length > 160) return json({ error: "title too long (160 max)" }, 400);
  const subSlug = String(body.subcategory_slug || "").trim() || null;
  if (subSlug) {
    const ok = await sb(`forum_subcategories?slug=eq.${encodeURIComponent(subSlug)}&select=slug&limit=1`);
    if (!ok || !ok.length) return json({ error: `unknown subcategory_slug "${subSlug}" — call action=subcategories for valid values` }, 400);
  }
  let sections: Section[] = [];
  const badVideos: string[] = [];
  const badButtons: string[] = [];
  if (Array.isArray(body.sections) && body.sections.length) {
    sections = body.sections.map((s: any): Section | null => {
      if (s && (s.type === "url" || s.type === "button")) {
        const url = String(s.url || "").trim();
        if (!/^https?:\/\/\S+$/i.test(url)) { badButtons.push(url || "(empty url)"); return null; }
        return { type: "url", label: String(s.label || s.text || "Open link").trim().slice(0, 80), url };
      }
      const o: any = { subheading: String(s?.subheading || "").trim().slice(0, 200), body: sanitizeHtml(String(s?.body || s?.body_html || "")) };
      const raw = s?.video_url ?? s?.videoUrl ?? s?.youtube ?? s?.youtube_url;
      if (raw) { const id = parseYouTubeId(String(raw)); if (id) o.videoUrl = youtubeWatchUrl(id); else badVideos.push(String(raw)); }
      return o;
    }).filter((s: any) => s && (s.type === "url" || s.subheading || s.body || s.videoUrl)) as Section[];
  } else if (typeof body.body_markdown === "string" && body.body_markdown.trim()) {
    sections = markdownToSections(body.body_markdown, title);
  } else if (typeof body.body_html === "string" && body.body_html.trim()) {
    sections = [{ subheading: "", body: sanitizeHtml(body.body_html) }];
  }
  // Top-level video_url → the first section (or its own section if that one already has a video).
  const topVideo = body.video_url ?? body.videoUrl ?? body.youtube_url;
  if (topVideo) {
    const id = parseYouTubeId(String(topVideo));
    if (!id) badVideos.push(String(topVideo));
    else if (!sections.length) sections.push({ subheading: "", body: "", videoUrl: youtubeWatchUrl(id) });
    else if (!sections[0].videoUrl) sections[0].videoUrl = youtubeWatchUrl(id);
    else sections.splice(1, 0, { subheading: "", body: "", videoUrl: youtubeWatchUrl(id) });
  }
  // Top-level buttons[] → appended after the body, in order.
  const btns = Array.isArray(body.buttons) ? body.buttons : (body.button ? [body.button] : []);
  for (const b of btns.slice(0, 5)) {
    const url = String((b && (b.url || b.href)) || "").trim();
    if (!/^https?:\/\/\S+$/i.test(url)) { badButtons.push(url || "(empty url)"); continue; }
    sections.push({ type: "url", label: String((b && (b.label || b.text)) || "Open link").trim().slice(0, 80), url });
  }
  if (badButtons.length) return json({ error: `button url must be a full https:// link: ${badButtons.join(", ")}` }, 400);
  if (badVideos.length) return json({ error: `not a YouTube link: ${badVideos.join(", ")} — use a youtube.com/watch?v=…, youtu.be/…, or shorts URL` }, 400);
  if (!sections.length) return json({ error: "body_markdown, body_html, sections, or video_url required" }, 400);

  const photos: Array<{ url: string; alt: string }> = [];
  const rawPhotos = Array.isArray(body.photos) ? body.photos.slice(0, MAX_PHOTOS) : [];
  for (const p of rawPhotos) {
    const src = typeof p === "string" ? p : p?.url;
    const alt = (typeof p === "object" && p?.alt) ? String(p.alt).slice(0, 300) : "";
    if (!src) continue;
    try { const got = await importPhoto(String(src), alt); if (got) photos.push(got); } catch (e) { console.warn("[bot] photo", src, e); }
  }

  const hours = Math.max(0, Math.min(720, parseInt(body.members_only_hours, 10) || 0));
  const row = await sb("forum_bot_drafts", {
    method: "POST",
    body: JSON.stringify({
      source: String(body.source || "grok").slice(0, 40),
      title, subcategory_slug: subSlug, sections, photos,
      members_only_hours: hours,
      bot_notes: body.notes ? String(body.notes).slice(0, 2000) : null,
      raw: body,
    }),
  });
  const d = Array.isArray(row) ? row[0] : row;
  return json({ ok: true, id: d.id, status: d.status, review_url: `${SITE}/admin`, message: "Draft saved. An admin will review, edit, and publish it." });
}

async function status(body: any) {
  const id = String(body.id || "");
  if (!id) return json({ error: "id required" }, 400);
  const rows = await sb(`forum_bot_drafts?id=eq.${encodeURIComponent(id)}&select=id,status,review_notes,reviewed_at,thread_id,created_at&limit=1`);
  const d = rows && rows[0];
  if (!d) return json({ error: "not found" }, 404);
  let thread_url: string | null = null;
  if (d.thread_id) {
    const t = await sb(`forum_threads?id=eq.${d.thread_id}&select=slug,subcategory_slug&limit=1`);
    if (t && t[0]) thread_url = `${SITE}/forum/${t[0].subcategory_slug}/${t[0].slug}`;
  }
  return json({ ok: true, id: d.id, status: d.status, review_notes: d.review_notes, reviewed_at: d.reviewed_at, thread_url, created_at: d.created_at });
}

async function list(body: any) {
  const limit = Math.max(1, Math.min(100, parseInt(body.limit, 10) || 20));
  const rows = await sb(`forum_bot_drafts?select=id,title,status,subcategory_slug,review_notes,thread_id,created_at&order=created_at.desc&limit=${limit}`);
  return json({ ok: true, drafts: rows || [] });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-api-key", "Access-Control-Allow-Methods": "POST, OPTIONS" } });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const key = req.headers.get("x-api-key") || (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!API_KEY || !safeEqual(key, API_KEY)) return json({ error: "unauthorized" }, 401);
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const action = String(body.action || "create");
  try {
    if (action === "create") return await create(body);
    if (action === "status") return await status(body);
    if (action === "subcategories") return json({ ok: true, subcategories: await subcategories() });
    if (action === "list") return await list(body);
    return json({ error: `unknown action "${action}"` }, 400);
  } catch (e) {
    console.error("[forum-bot-draft]", e);
    return json({ error: (e as Error).message || "server error" }, 500);
  }
});
