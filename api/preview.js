// Vercel serverless function — generates Open Graph / Twitter card meta
// tags for shareable Trailhead URLs so when users paste a link into
// social media (iMessage, Twitter, Slack, Facebook, Discord, etc.) the
// platform's link scraper sees a rich preview instead of a bare URL.
//
// Scrapers don't execute JavaScript, so the meta tags MUST be present
// in the initial HTML response. This function:
//   1. Reads the deployed deploy-v2.2/index.html (the SPA shell)
//   2. Looks up the entity (trip / plan / spot / build / hq) in Supabase
//   3. Injects og:* + twitter:* meta tags into the <head>
//   4. Returns the modified HTML
//
// Humans loading the page get the SPA loaded normally — they never
// see the meta tags. Scrapers see the tags and render a preview card.
//
// Routed via vercel.json rewrites:
//   /trips/:slug  → /api/preview?type=trip&id=:slug
//   /plans/:slug  → /api/preview?type=plan&id=:slug
//   /spots/:id    → /api/preview?type=spot&id=:id
//   /builds/:id   → /api/preview?type=build&id=:id
//   /hq           → /api/preview?type=hq

const fs = require("node:fs");
const path = require("node:path");

const SUPABASE_URL = "https://babbgaziiyjfaqjsaxgd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_rGrh2oIi8fuBv_9w9ZSneg_H6HdBmk-";
const MAPBOX_TOKEN = "pk.eyJ1IjoibG9uZXBlYWtvdmVybGFuZCIsImEiOiJjbW91ODliaDQwNzMzMnBweGNkN3JtMjRwIn0.PAkLOo_i_5FuW9w1VH-mIw";

// Lone Peak HQ — must match LPO_HQ in trailhead-v1.jsx.
const LPO_HQ = {
  name: "Lone Peak Overland HQ",
  address: "Wenatchee, WA",
  lat: 47.405197703380196,
  lng: -120.2072479120492,
};

// Forum subcategory slug → display name + parent category. Mirrors
// forumData.categories in trailhead-v1.jsx so the OG handler can render
// breadcrumbs + landing pages without an extra round trip. Keep in sync;
// when admin category CRUD ships, swap for a DB query.
// Forum subcategory → display info map. Phase 2: backed by DB. Populated
// lazily by `loadForumSubs()` at handler entry with a 60s in-memory TTL
// so admin renames + new subs propagate to SSR/OG within a minute without
// hitting Supabase on every request. Stale-cache fallback if the fetch
// fails so previews keep working through transient DB hiccups.
let FORUM_SUB_TO_INFO = {};
let FORUM_SUBS_LOADED_AT = 0;
const FORUM_SUBS_TTL_MS = 60_000;
async function loadForumSubs() {
  const fresh = Date.now() - FORUM_SUBS_LOADED_AT < FORUM_SUBS_TTL_MS && Object.keys(FORUM_SUB_TO_INFO).length > 0;
  if (fresh) return;
  try {
    const [cats, subs] = await Promise.all([
      supabaseFetchAll("forum_categories", "select=id,slug,name"),
      supabaseFetchAll("forum_subcategories", "select=id,category_id,slug,name"),
    ]);
    if (!Array.isArray(cats) || !Array.isArray(subs)) return;
    const catById = {};
    cats.forEach(c => { catById[c.id] = c; });
    const next = {};
    subs.forEach(s => {
      const cat = catById[s.category_id];
      if (!cat) return;
      next[s.slug] = { name: s.name, catName: cat.name, catSlug: cat.slug };
    });
    if (Object.keys(next).length > 0) {
      FORUM_SUB_TO_INFO = next;
      FORUM_SUBS_LOADED_AT = Date.now();
    }
  } catch (e) {
    // Leave the existing cache (even if empty) — fresher than nothing.
  }
}

// Read the SPA shell once at module load. `includeFiles` in vercel.json
// makes deploy-v2.2/index.html available to the function bundle.
let SPA_HTML = "";
try {
  SPA_HTML = fs.readFileSync(path.join(process.cwd(), "deploy-v2.2", "index.html"), "utf-8");
} catch (e) {
  // Fallback if the file isn't bundled — at least scrapers still get
  // the meta tags. The bundle reference will be missing.
  SPA_HTML = `<!DOCTYPE html><html><head><title>Trailhead</title></head><body><div id="root"></div></body></html>`;
}

const escapeHtml = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Strip script tags + event handlers + javascript: URIs from user-generated
// HTML before injecting into the SSR shell. Forum body HTML comes from a
// contenteditable on the client; benign in practice but we belt-and-suspenders
// it server-side because we're echoing it raw into the initial response.
function sanitizeForumHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<\s*(script|iframe|object|embed|style|link|meta|form)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|object|embed|style|link|meta|form)\b[^>]*\/?\s*>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript\s*:/gi, "");
}

// Build the server-rendered article HTML for a forum thread. Injected into
// the SPA root div so crawlers (Googlebot, Bingbot) see the actual content
// in the initial HTML response — no "Loading Trailhead…" stall — and users
// loading the page over slow connections see the article paint immediately
// before the React bundle parses. React replaces the root's children on
// mount, so this content is transient for humans but indexable for bots.
function buildForumThreadSSR(article, canonicalUrl, origin) {
  if (!article || !article.title) return "";
  const titleHtml = escapeHtml(article.title);
  const author = article.author || {};
  const authorName = escapeHtml(author.name || "Author");
  const authorHandle = author.handle ? escapeHtml(author.handle) : "";
  const authorAvatar = author.avatarUrl ? escapeHtml(author.avatarUrl) : "";
  const dateIso = article.createdAt ? new Date(article.createdAt).toISOString() : "";
  const dateStr = article.createdAt
    ? new Date(article.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";
  // Sections HTML — each subheading becomes <h2>; bodies are sanitized.
  let sectionsHtml = "";
  if (Array.isArray(article.sections) && article.sections.length > 0) {
    sectionsHtml = article.sections.map(s => {
      if (!s) return "";
      const sub = (s.subheading || "").trim();
      const body = sanitizeForumHtml((s.body || "").trim());
      if (!sub && !body) return "";
      const subPart = sub ? `<h2 style="font-size:22px;font-family:'Trebuchet MS',sans-serif;color:#fff;margin:28px 0 10px;line-height:1.3;font-weight:700;">${escapeHtml(sub)}</h2>` : "";
      const bodyPart = body ? `<div style="font-size:16px;color:#F5F2ED;">${body}</div>` : "";
      return subPart + bodyPart;
    }).join("\n");
  } else if (article.bodyFallback) {
    sectionsHtml = `<div style="font-size:16px;color:#F5F2ED;">${sanitizeForumHtml(article.bodyFallback)}</div>`;
  }
  // Replies section — every reply rendered as its own <article> with
  // author byline, datetime, and body. Top-level replies + nested replies
  // collapse to a flat list (preserving order) but indent depth-1 replies
  // for visual hierarchy.
  const replies = Array.isArray(article.replies) ? article.replies : [];
  const replyCount = replies.length;
  let repliesHtml = "";
  if (replyCount > 0) {
    repliesHtml = `
      <section style="margin-top:40px;padding-top:24px;border-top:1px solid #2A2A28;">
        <h2 style="font-size:18px;font-family:'Trebuchet MS',sans-serif;color:#fff;margin:0 0 20px;font-weight:700;letter-spacing:0.5px;">Discussion (${replyCount})</h2>
        ${replies.map(r => {
          if (!r) return "";
          const ra = r.author || {};
          const raName = escapeHtml(ra.name || "Author");
          const raHandle = ra.handle ? escapeHtml(ra.handle) : "";
          const raAvatar = ra.avatarUrl ? escapeHtml(ra.avatarUrl) : "";
          const raIso = r.createdAt ? new Date(r.createdAt).toISOString() : "";
          const raDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
          const indent = r.parentId ? "margin-left:32px;" : "";
          const bodySan = sanitizeForumHtml(r.body || "");
          const raInitial = (ra.name || "A").charAt(0).toUpperCase();
          const raAvatarBlock = raAvatar
            ? `<img src="${raAvatar}" alt="${raName}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;" />`
            : `<div style="width:32px;height:32px;border-radius:50%;background:#C49A6C;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="font-family:'Trebuchet MS',sans-serif;font-size:13px;font-weight:700;color:#fff;">${escapeHtml(raInitial)}</span></div>`;
          return `
            <article style="display:flex;gap:12px;padding:14px 0;border-bottom:1px solid #2A2A28;${indent}">
              ${raAvatarBlock}
              <div style="flex:1;min-width:0;">
                <div style="font-family:'Trebuchet MS',sans-serif;font-size:12px;margin-bottom:4px;color:#8B7D6B;">
                  <strong style="color:#fff;font-weight:600;font-size:13px;">${raName}</strong>
                  ${raHandle ? ` · <span style="color:#C49A6C;">@${raHandle}</span>` : ""}
                  · <time datetime="${raIso}">${escapeHtml(raDate)}</time>
                </div>
                <div style="font-size:14px;color:#F5F2ED;line-height:1.6;">${bodySan}</div>
              </div>
            </article>
          `;
        }).join("\n")}
      </section>
    `;
  }
  const subSlug = article.subcategorySlug ? escapeHtml(article.subcategorySlug) : "";
  const subInfo = subSlug && FORUM_SUB_TO_INFO[article.subcategorySlug];
  const subName = subInfo ? escapeHtml(subInfo.name) : (subSlug ? subSlug.replace(/-/g, " ") : "");
  const crumbs = [
    `<a href="${origin}/" style="color:#C49A6C;text-decoration:none;">Trailhead</a>`,
    `<a href="${origin}/" style="color:#C49A6C;text-decoration:none;">Forum</a>`,
    subSlug ? `<a href="${origin}/forum/${subSlug}" style="color:#C49A6C;text-decoration:none;">${subName}</a>` : "",
  ].filter(Boolean).join(' <span style="color:#8B7D6B;">/</span> ');
  const initial = (author.name || "A").charAt(0).toUpperCase();
  const avatarBlock = authorAvatar
    ? `<img src="${authorAvatar}" alt="${authorName}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0;" />`
    : `<div style="width:48px;height:48px;border-radius:50%;background:#C49A6C;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="font-family:'Trebuchet MS',sans-serif;font-size:18px;font-weight:700;color:#fff;">${escapeHtml(initial)}</span></div>`;
  const statsRow = `
    <div style="display:flex;gap:18px;margin:14px 0 0;font-family:'Trebuchet MS',sans-serif;font-size:11px;color:#8B7D6B;">
      ${typeof article.viewCount === "number" ? `<span>${article.viewCount} view${article.viewCount === 1 ? "" : "s"}</span>` : ""}
      ${typeof article.replyCount === "number" ? `<span>${article.replyCount} repl${article.replyCount === 1 ? "y" : "ies"}</span>` : ""}
      ${typeof article.likeCount === "number" && article.likeCount > 0 ? `<span>${article.likeCount} like${article.likeCount === 1 ? "" : "s"}</span>` : ""}
    </div>
  `;
  return `
    <article style="max-width:720px;margin:0 auto;padding:32px 20px 80px;color:#fff;background:#111111;min-height:100vh;font-family:'Source Serif 4',Georgia,serif;line-height:1.7;box-sizing:border-box;">
      <nav style="font-family:'Trebuchet MS',sans-serif;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:24px;color:#8B7D6B;">
        ${crumbs}
      </nav>
      <h1 style="margin:0 0 16px;font-size:32px;font-family:'Trebuchet MS','Gill Sans',sans-serif;line-height:1.2;font-weight:700;color:#fff;">${titleHtml}</h1>
      <div style="display:flex;align-items:center;gap:14px;padding:16px 0 24px;margin-bottom:24px;border-bottom:1px solid #2A2A28;">
        ${avatarBlock}
        <div style="display:flex;flex-direction:column;gap:2px;font-family:'Trebuchet MS',sans-serif;">
          <span style="font-size:15px;font-weight:700;color:#fff;">${authorName}</span>
          <span style="font-size:12px;color:#8B7D6B;">${authorHandle ? `<span style="color:#C49A6C;">@${authorHandle}</span> · ` : ""}<time datetime="${dateIso}">${escapeHtml(dateStr)}</time></span>
        </div>
      </div>
      ${sectionsHtml}
      ${statsRow}
      ${repliesHtml}
      <footer style="margin-top:48px;padding-top:24px;border-top:1px solid #2A2A28;font-family:'Trebuchet MS',sans-serif;font-size:12px;color:#8B7D6B;">
        Posted by <a href="${origin}/" style="color:#C49A6C;text-decoration:none;">${authorName}</a> ${authorHandle ? `(@${authorHandle})` : ""} on the <a href="${origin}/" style="color:#C49A6C;text-decoration:none;">Trailhead Overlanding Forum</a> — the community for overlanders sharing trips, builds, and trail knowledge.
      </footer>
    </article>
  `;
}

// Mapbox Static Images — kind-tinted pin centered on the entity. 1200x630
// is the recommended OG image aspect (1.91:1). Zoom 14 is tuned so the
// pin reads clearly on iMessage's compact card preview (was 12 — too
// regional, the pin disappeared into the basemap).
const staticMap = (lng, lat, color, marker, zoom = 14) =>
  `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/pin-l-${marker}+${color.replace("#", "")}(${lng},${lat})/${lng},${lat},${zoom},0/1200x630@2x?access_token=${MAPBOX_TOKEN}`;

// Encode an array of [lng, lat] tuples as a Google polyline (precision 5)
// for use as a path overlay on Mapbox Static Images. Mapbox swaps lat/lng
// internally — we encode in [lat, lng] order as the polyline spec requires.
function encodePolyline(coords) {
  let result = "";
  let prevLat = 0, prevLng = 0;
  const enc = (val) => {
    let n = val < 0 ? ~(val << 1) : (val << 1);
    let out = "";
    while (n >= 0x20) {
      out += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
      n >>>= 5;
    }
    out += String.fromCharCode(n + 63);
    return out;
  };
  for (let i = 0; i < coords.length; i++) {
    const [lng, lat] = coords[i];
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    const latE5 = Math.round(lat * 1e5);
    const lngE5 = Math.round(lng * 1e5);
    result += enc(latE5 - prevLat);
    result += enc(lngE5 - prevLng);
    prevLat = latE5;
    prevLng = lngE5;
  }
  return result;
}

// Build a Mapbox Static Images URL with a path overlay (full route line
// + start/end pins) auto-bounded to fit. Used for trip / plan previews
// so the OG card shows the entire route, not just the start point.
const staticMapWithPath = (coords, lineColor, accentColor) => {
  if (!Array.isArray(coords) || coords.length < 2) return null;
  // Cap the polyline length — Mapbox URL has a ~8KB limit. ~80 simplified
  // points (the row's stored shape) keeps us comfortably under.
  const trimmed = coords.length > 100
    ? coords.filter((_, i) => i % Math.ceil(coords.length / 100) === 0)
    : coords;
  const encoded = encodeURIComponent(encodePolyline(trimmed));
  const startLng = trimmed[0][0], startLat = trimmed[0][1];
  const endLng = trimmed[trimmed.length - 1][0], endLat = trimmed[trimmed.length - 1][1];
  const startPin = `pin-s+${accentColor.replace("#", "")}(${startLng},${startLat})`;
  const endPin = `pin-s-circle+${accentColor.replace("#", "")}(${endLng},${endLat})`;
  const path = `path-5+${lineColor.replace("#", "")}-1(${encoded})`;
  // /auto/ tells Mapbox to fit-bounds the overlay; padding keeps the
  // line off the edges. @2x renders at retina for sharper iMessage cards.
  return `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/${path},${startPin},${endPin}/auto/1200x630@2x?padding=60&access_token=${MAPBOX_TOKEN}`;
};

async function supabaseFetch(table, queryStr) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${queryStr}`;
  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] || null : null;
  } catch (e) {
    return null;
  }
}

// Same as supabaseFetch but returns the full result array (not just rows[0]).
async function supabaseFetchAll(table, queryStr) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${queryStr}`;
  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    return [];
  }
}

// Looks up an alt-text string on a photo object that matches the given
// URL. Photos are stored as `{url, alt}` objects (post-May-2026 uploads)
// or bare URL strings (legacy). Returns "" when no alt is available so
// the caller can OR it into a fallback.
function findPhotoAlt(photos, url) {
  if (!Array.isArray(photos) || !url) return "";
  for (const p of photos) {
    if (!p || typeof p !== "object") continue;
    if (p.url === url && typeof p.alt === "string" && p.alt) return p.alt;
  }
  return "";
}

async function resolveEntity(type, id) {
  if (!type) return null;
  if (type === "trip" || type === "plan") {
    const want = type === "plan" ? "plan" : "report";
    const row = await supabaseFetch(
      "trip_reports",
      `slug=eq.${encodeURIComponent(id)}&select=name,slug,description,hero_img,start_lat,start_lng,kind,distance_mi,elev_gain_ft,duration_min,region,state_code,terrains,tags,difficulty,planned_start,planned_end,route_geom,route_data,created_at,updated_at,user_id&limit=1`
    );
    if (!row) return null;
    if (row.kind && row.kind !== want) return null;
    const isReport = row.kind !== "plan";
    const accent = isReport ? "8b6faf" : "BD472A";
    const routeMap = Array.isArray(row.route_geom) && row.route_geom.length >= 2
      ? staticMapWithPath(row.route_geom, accent, accent)
      : null;
    const pinMap = row.start_lng != null && row.start_lat != null
      ? staticMap(row.start_lng, row.start_lat, accent, isReport ? "circle" : "marker", 14)
      : null;
    const stat = row.distance_mi != null ? ` · ${Number(row.distance_mi).toFixed(1)} mi` : "";
    const image = routeMap || row.hero_img || pinMap;
    let imageAlt = "";
    if (image && image === row.hero_img) {
      const photos = row.route_data && Array.isArray(row.route_data.photos) ? row.route_data.photos : [];
      imageAlt = findPhotoAlt(photos, row.hero_img);
    }
    if (!imageAlt) {
      imageAlt = `${row.name} ${isReport ? "trip report" : "trip plan"} route map on Trailhead`;
    }
    // Author profile for E-E-A-T Person schema.
    let author = null;
    if (row.user_id) {
      const prof = await supabaseFetch(
        "profiles",
        `id=eq.${encodeURIComponent(row.user_id)}&select=full_name,handle,avatar_url&limit=1`
      );
      if (prof) author = { name: prof.full_name || prof.handle || "Author", handle: prof.handle || "", avatarUrl: prof.avatar_url || null };
    }
    return {
      title: `${row.name}${isReport ? " · Trip Report" : " · Trip Plan"}`,
      description:
        row.description ||
        `${isReport ? "Overlanding trip report" : "Planned overlanding trip"}${stat} on Trailhead.`,
      image,
      imageAlt,
      jsonLd: {
        kind: "TripReport",
        isReport,
        title: row.name,
        description: row.description || "",
        image,
        createdAt: row.created_at,
        modifiedAt: row.updated_at && row.updated_at !== row.created_at ? row.updated_at : null,
        author,
        startLat: row.start_lat,
        startLng: row.start_lng,
        region: row.region,
        stateCode: row.state_code,
        terrains: Array.isArray(row.terrains) ? row.terrains : [],
        tags: Array.isArray(row.tags) ? row.tags : [],
        difficulty: row.difficulty,
        distanceMi: row.distance_mi,
        elevGainFt: row.elev_gain_ft,
        durationMin: row.duration_min,
        plannedStart: row.planned_start,
        plannedEnd: row.planned_end,
      },
      breadcrumb: {
        items: [
          { name: "Trailhead", url: null }, // url filled in handler with origin
          { name: isReport ? "Trip Reports" : "Trip Plans", url: null },
          { name: row.name, url: null },
        ],
      },
    };
  }
  if (type === "gear-drop") {
    const row = await supabaseFetch(
      "gear_drops",
      `slug=eq.${encodeURIComponent(id)}&select=title,slug,brand_partner_name,brand_logo_url,hero_img,about,prize_title,prize_description,prize_value_cents,prize_photos,status,starts_at,ends_at,start_lat,start_lng,host_admin_id,winner_announced_at,created_at,updated_at&limit=1`
    );
    if (!row) return null;
    // Don't surface drafts publicly.
    if (row.status === "draft") return null;
    const accent = "4A7C59"; // gear drops green
    const startMap = (row.start_lat != null && row.start_lng != null)
      ? staticMap(row.start_lng, row.start_lat, accent, "marker", 11)
      : null;
    const image = row.hero_img || startMap;
    // Strip HTML for og:description (rich text source → plain text summary).
    const stripHtml = (s) => (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const aboutPlain = stripHtml(row.about);
    const prizePlain = stripHtml(row.prize_description);
    const description = aboutPlain
      || (prizePlain ? `Prize: ${row.prize_title}. ${prizePlain}` : `Sponsored gear drop event with prize: ${row.prize_title || "TBA"}.`);
    let imageAlt = "";
    if (image && image === row.hero_img && Array.isArray(row.prize_photos)) {
      imageAlt = findPhotoAlt(row.prize_photos, row.hero_img);
    }
    if (!imageAlt) imageAlt = `${row.title} gear drop — hosted by ${row.brand_partner_name || "Lone Peak Overland"}`;
    const prizeValueUsd = row.prize_value_cents != null ? (row.prize_value_cents / 100).toFixed(2) : null;
    return {
      title: `${row.title} · Gear Drop`,
      description: description.length > 240 ? description.slice(0, 237) + "…" : description,
      image,
      imageAlt,
      jsonLd: {
        kind: "GearDrop",
        title: row.title,
        slug: row.slug,
        description: aboutPlain,
        image,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        startLat: row.start_lat,
        startLng: row.start_lng,
        brand: row.brand_partner_name,
        brandLogoUrl: row.brand_logo_url,
        prizeTitle: row.prize_title,
        prizeDescription: prizePlain,
        prizeValueUsd,
        status: row.status,
        winnerAnnouncedAt: row.winner_announced_at,
        createdAt: row.created_at,
        modifiedAt: row.updated_at && row.updated_at !== row.created_at ? row.updated_at : null,
      },
      breadcrumb: {
        items: [
          { name: "Trailhead", url: null },
          { name: "Gear Drops", url: null },
          { name: row.title, url: null },
        ],
      },
    };
  }
  if (type === "spot") {
    const row = await supabaseFetch(
      "camping_spots",
      `id=eq.${encodeURIComponent(id)}&visibility=eq.public&select=name,description,lat,lng,spot_type,fee,source,photos,created_at,updated_at&limit=1`
    );
    if (!row) return null;
    // Spot OG image is currently always a Mapbox static map (no photo
    // hero). Describe the location for accessibility.
    const firstPhotoAlt = row.photos && row.photos[0] && typeof row.photos[0].alt === "string" ? row.photos[0].alt : "";
    const firstPhotoUrl = row.photos && row.photos[0]
      ? (typeof row.photos[0] === "string" ? row.photos[0] : row.photos[0].url)
      : null;
    const image = firstPhotoUrl || (row.lng != null && row.lat != null ? staticMap(row.lng, row.lat, "5B8C5A", "circle") : null);
    return {
      title: `${row.name} · Camping Spot`,
      description:
        row.description ||
        `Camping spot on Trailhead${row.spot_type && row.spot_type !== "unknown" ? ` · ${row.spot_type}` : ""}.`,
      image,
      imageAlt: firstPhotoAlt || `${row.name} camping spot location map`,
      jsonLd: {
        kind: "CampingSpot",
        name: row.name,
        description: row.description || "",
        image,
        lat: row.lat,
        lng: row.lng,
        spotType: row.spot_type,
        fee: row.fee,
        source: row.source,
        createdAt: row.created_at,
        modifiedAt: row.updated_at && row.updated_at !== row.created_at ? row.updated_at : null,
      },
      breadcrumb: {
        items: [
          { name: "Trailhead", url: null },
          { name: "Camping Spots", url: null },
          { name: row.name, url: null },
        ],
      },
    };
  }
  if (type === "build") {
    const row = await supabaseFetch(
      "builds",
      `id=eq.${encodeURIComponent(id)}&select=name,year,make,model,trim,hero_img,build_data,created_at,updated_at,user_id&limit=1`
    );
    if (!row) return null;
    const sub = [row.year, row.make, row.model, row.trim].filter(Boolean).join(" ");
    const image = row.hero_img || null;
    const mainPhotos = row.build_data && Array.isArray(row.build_data.mainPhotos) ? row.build_data.mainPhotos : [];
    const heroAlt = findPhotoAlt(mainPhotos, image);
    let author = null;
    if (row.user_id) {
      const prof = await supabaseFetch(
        "profiles",
        `id=eq.${encodeURIComponent(row.user_id)}&select=full_name,handle,avatar_url&limit=1`
      );
      if (prof) author = { name: prof.full_name || prof.handle || "Owner", handle: prof.handle || "", avatarUrl: prof.avatar_url || null };
    }
    return {
      title: `${row.name || sub || "Build"} · Trailhead`,
      description: sub ? `${sub} · Overlanding build on Trailhead.` : "Overlanding build on Trailhead.",
      image,
      imageAlt: heroAlt || `${row.name || sub} overlanding build photo`,
      jsonLd: {
        kind: "Build",
        name: row.name,
        year: row.year,
        make: row.make,
        model: row.model,
        trim: row.trim,
        image,
        createdAt: row.created_at,
        modifiedAt: row.updated_at && row.updated_at !== row.created_at ? row.updated_at : null,
        author,
      },
      breadcrumb: {
        items: [
          { name: "Trailhead", url: null },
          { name: "Builds", url: null },
          { name: row.name || sub, url: null },
        ],
      },
    };
  }
  if (type === "hq") {
    return {
      title: LPO_HQ.name,
      description: `${LPO_HQ.address} · The home base of the Lone Peak Overland community.`,
      image: staticMap(LPO_HQ.lng, LPO_HQ.lat, "BD472A", "star"),
      imageAlt: `${LPO_HQ.name} location map in ${LPO_HQ.address}`,
      jsonLd: { kind: "HQ" },
      breadcrumb: {
        items: [
          { name: "Trailhead", url: null },
          { name: "HQ", url: null },
        ],
      },
    };
  }
  if (type === "bounty") {
    // Only surface non-draft bounties in previews (RLS-consistent with the
    // client — drafts aren't publicly visible).
    const row = await supabaseFetch(
      "bounties",
      `id=eq.${encodeURIComponent(id)}&status=neq.draft&select=title,description,category,difficulty,hero_img,reward_cents,reward_points,deadline_at,total_slots,claimed_slots&limit=1`
    );
    if (!row) return null;
    const rewardBits = [];
    if (row.reward_cents > 0) rewardBits.push(`$${(row.reward_cents / 100).toFixed(0)}`);
    if (row.reward_points > 0) rewardBits.push(`${row.reward_points} pts`);
    const rewardLabel = rewardBits.join(" + ");
    const description = [
      rewardLabel ? `Reward: ${rewardLabel}` : null,
      row.category ? row.category : null,
      row.description ? String(row.description).replace(/<[^>]+>/g, " ").slice(0, 160) : null,
    ].filter(Boolean).join(" · ");
    return {
      title: `${row.title || "Bounty"} · Trailhead Bounty`,
      description: description || "Earn cash credit + points completing a bounty on Trailhead.",
      image: row.hero_img || null,
      imageAlt: `${row.title || "Bounty"} — ${row.category || "Community bounty"}`,
      jsonLd: { kind: "Bounty", name: row.title, description: row.description, category: row.category, reward: rewardLabel },
      breadcrumb: {
        items: [
          { name: "Trailhead", url: null },
          { name: "Bounties", url: null },
          { name: row.title || "Bounty", url: null },
        ],
      },
    };
  }
  // Generic feed posts (and route posts which share the /post/:id URL).
  // Falls through hero_img → first non-video photo → embedded route
  // polyline if it's a ROUTES post → null.
  if (type === "post" || type === "route") {
    const row = await supabaseFetch(
      "posts",
      `id=eq.${encodeURIComponent(id)}&select=type,title,body,hero_img,photo_urls,data,user_id,created_at,updated_at&limit=1`
    );
    if (!row) return null;
    // Build the image fallback chain.
    let image = row.hero_img || null;
    if (!image && Array.isArray(row.photo_urls) && row.photo_urls.length > 0) {
      image = row.photo_urls[0];
    }
    let imageAlt = "";
    if (image && row.data && Array.isArray(row.data.photoUrls)) {
      imageAlt = findPhotoAlt(row.data.photoUrls, image);
    }
    if (!image && row.data) {
      const pts = Array.isArray(row.data.points) ? row.data.points
                : Array.isArray(row.data.pins) ? row.data.pins.map(p => [p.lng, p.lat]).filter(([a, b]) => typeof a === "number" && typeof b === "number")
                : null;
      if (pts && pts.length >= 2) {
        const sniffed = pts.map(p => {
          const a = Array.isArray(p) ? p[0] : p.lng;
          const b = Array.isArray(p) ? p[1] : p.lat;
          return Math.abs(a) <= 90 && Math.abs(b) > 90 ? [b, a] : [a, b];
        });
        image = staticMapWithPath(sniffed, "BD472A", "BD472A");
      }
    }
    const isRoute = row.type === "ROUTES";
    const cleanTitle = (row.title || (isRoute ? "Route" : "Trailhead Post")).slice(0, 80);
    const desc = (row.body || (isRoute ? "Overlanding route shared on Trailhead." : "Posted to Trailhead.")).slice(0, 200);
    // Author profile so the SSR byline can show E-E-A-T signals.
    let author = null;
    if (row.user_id) {
      const prof = await supabaseFetch(
        "profiles",
        `id=eq.${encodeURIComponent(row.user_id)}&select=full_name,handle,avatar_url&limit=1`
      );
      if (prof) author = { name: prof.full_name || prof.handle || "Author", handle: prof.handle || "", avatarUrl: prof.avatar_url || null };
    }
    return {
      title: `${cleanTitle}${isRoute ? " · Route" : ""}`,
      description: desc,
      image,
      imageAlt: imageAlt || `${cleanTitle}${isRoute ? " route" : ""} on Trailhead`,
      article: {
        title: cleanTitle,
        body: row.body || "",
        image,
        imageAlt: imageAlt || `${cleanTitle}${isRoute ? " route" : ""} on Trailhead`,
        author,
        createdAt: row.created_at,
        type: row.type,
      },
    };
  }
  // Forum threads — slug-based URLs hit type === "forum-thread" and look
  // up by slug. Legacy /forum/:id (timestamp-id from the pre-DB era) falls
  // through to the brand default since those threads no longer exist.
  if (type === "forum-thread") {
    const row = await supabaseFetch(
      "forum_threads",
      `slug=eq.${encodeURIComponent(id)}&select=id,title,body,sections,photos,category_slug,subcategory_slug,view_count,created_at,updated_at,user_id&limit=1`
    );
    if (!row) {
      return {
        title: "Forum Thread · Trailhead",
        description: "Join the conversation on the Trailhead community forum.",
        image: null,
        imageAlt: "",
      };
    }
    // Hero image — first photo if available. Body is stored as HTML; strip
    // tags + collapse whitespace for the meta description (160 chars).
    const heroPhoto = Array.isArray(row.photos) && row.photos[0] ? row.photos[0] : null;
    const heroUrl = heroPhoto ? (typeof heroPhoto === "string" ? heroPhoto : heroPhoto.url) : null;
    const heroAlt = heroPhoto && typeof heroPhoto.alt === "string" ? heroPhoto.alt : "";
    const plainBody = (row.body || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const description = (plainBody || `Discussion on the Trailhead community forum.`).slice(0, 200);
    // Fan-out: author profile + replies + reply authors + thread like
    // count, in parallel. All public-readable, none gate the others.
    const [authorRow, replyRows, likeRows] = await Promise.all([
      row.user_id
        ? supabaseFetch("profiles", `id=eq.${encodeURIComponent(row.user_id)}&select=full_name,handle,avatar_url,bio&limit=1`)
        : Promise.resolve(null),
      supabaseFetchAll("forum_replies", `thread_id=eq.${encodeURIComponent(row.id)}&select=id,user_id,body,parent_id,created_at&order=created_at.asc&limit=50`),
      supabaseFetchAll("forum_thread_likes", `thread_id=eq.${encodeURIComponent(row.id)}&select=user_id`),
    ]);
    const author = authorRow
      ? {
          name: authorRow.full_name || authorRow.handle || "Author",
          handle: authorRow.handle || "",
          avatarUrl: authorRow.avatar_url || null,
          bio: authorRow.bio || null,
        }
      : null;
    // Resolve reply authors in one shot.
    const replyAuthorIds = Array.from(new Set((replyRows || []).map(r => r.user_id).filter(Boolean)));
    const replyAuthorsById = {};
    if (replyAuthorIds.length > 0) {
      const profs = await supabaseFetchAll(
        "profiles",
        `id=in.(${replyAuthorIds.map(encodeURIComponent).join(",")})&select=id,full_name,handle,avatar_url`
      );
      profs.forEach(p => { replyAuthorsById[p.id] = p; });
    }
    // Count words across title + sections + reply bodies for SEO.
    const allText = [
      row.title || "",
      plainBody,
      ...(replyRows || []).map(r => (r.body || "").replace(/<[^>]+>/g, " ")),
    ].join(" ");
    const wordCount = (allText.match(/\S+/g) || []).length;
    return {
      title: `${row.title} · Trailhead Forum`,
      description,
      image: heroUrl,
      imageAlt: heroAlt || `${row.title} discussion on Trailhead Forum`,
      // Carry extra fields so the caller can emit JSON-LD + SSR article.
      jsonLd: {
        kind: "DiscussionForumPosting",
        title: row.title,
        body: plainBody,
        createdAt: row.created_at,
        modifiedAt: row.updated_at && row.updated_at !== row.created_at ? row.updated_at : null,
        author,
        url: null, // filled in by caller
        categorySlug: row.category_slug,
        subcategorySlug: row.subcategory_slug,
        viewCount: row.view_count || 0,
        likeCount: (likeRows || []).length,
        replyCount: (replyRows || []).length,
        wordCount,
        replies: (replyRows || []).map(r => ({
          id: r.id,
          body: (r.body || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
          parentId: r.parent_id || null,
          createdAt: r.created_at,
          author: replyAuthorsById[r.user_id]
            ? { name: replyAuthorsById[r.user_id].full_name || replyAuthorsById[r.user_id].handle || "Author", handle: replyAuthorsById[r.user_id].handle || "" }
            : null,
        })),
      },
      // SSR article payload — caller injects into the root div so crawlers
      // + initial-load humans see the actual content instead of "Loading…".
      article: {
        title: row.title,
        sections: Array.isArray(row.sections) ? row.sections : [],
        bodyFallback: row.body || "",
        createdAt: row.created_at,
        modifiedAt: row.updated_at && row.updated_at !== row.created_at ? row.updated_at : null,
        author,
        categorySlug: row.category_slug,
        subcategorySlug: row.subcategory_slug,
        viewCount: row.view_count || 0,
        likeCount: (likeRows || []).length,
        replyCount: (replyRows || []).length,
        // Reply rendering shape — author profile object inline so the
        // SSR builder doesn't need to look anything up.
        replies: (replyRows || []).map(r => ({
          id: r.id,
          body: r.body || "",
          parentId: r.parent_id || null,
          createdAt: r.created_at,
          author: replyAuthorsById[r.user_id]
            ? {
                name: replyAuthorsById[r.user_id].full_name || replyAuthorsById[r.user_id].handle || "Author",
                handle: replyAuthorsById[r.user_id].handle || "",
                avatarUrl: replyAuthorsById[r.user_id].avatar_url || null,
              }
            : null,
        })),
      },
    };
  }
  // Forum SUBCATEGORY landing page — `/forum/<sub-slug>`. Topical hub that
  // lists recent threads in that subcategory. Each subcategory is a SEO
  // keyword cluster (e.g. "suspension lift", "trip reports", "convoy
  // planning") so these pages can rank for those terms independently of
  // any single thread.
  if (type === "forum-sub") {
    const subInfo = FORUM_SUB_TO_INFO[id];
    if (!subInfo) {
      // Unknown subcategory slug — return brand default rather than 404
      // so legacy /forum/<timestamp-id> URLs degrade gracefully.
      return {
        title: "Forum · Trailhead",
        description: "Join the conversation on the Trailhead community forum.",
        image: null,
        imageAlt: "",
      };
    }
    // Pull recent threads in this subcategory (up to 50) for the SSR list.
    const threadRows = await supabaseFetchAll(
      "forum_threads",
      `subcategory_slug=eq.${encodeURIComponent(id)}&select=id,slug,title,body,sections,photos,view_count,created_at,updated_at,user_id&order=created_at.desc&limit=50`
    );
    // Pull the author profiles in one shot so the byline on each card has
    // a real name + handle.
    const authorIds = Array.from(new Set((threadRows || []).map(t => t.user_id).filter(Boolean)));
    const authorsById = {};
    if (authorIds.length > 0) {
      const profs = await supabaseFetchAll(
        "profiles",
        `id=in.(${authorIds.map(encodeURIComponent).join(",")})&select=id,full_name,handle,avatar_url`
      );
      profs.forEach(p => { authorsById[p.id] = p; });
    }
    return {
      title: `${subInfo.name} · ${subInfo.catName} · Trailhead Forum`,
      description: `${threadRows.length} thread${threadRows.length === 1 ? "" : "s"} on ${subInfo.name.toLowerCase()} in the Trailhead overlanding community forum.`,
      image: null,
      imageAlt: "",
      jsonLd: {
        kind: "CollectionPage",
        subInfo,
        threads: threadRows,
        authors: authorsById,
      },
      article: {
        kind: "forum-sub",
        subInfo,
        threads: threadRows,
        authors: authorsById,
      },
    };
  }
  // User profile (`/users/:handle`). The high-value SEO hub: a Person
  // entity that links to every piece of content this user has created —
  // builds, published trip reports/plans, forum threads, public camping
  // spots. Each link points to an already-indexable detail page, so the
  // profile becomes a dense internal-link node that flows PageRank
  // through the user's body of work. Private profiles return null (caller
  // renders default site meta).
  if (type === "user") {
    const handle = String(id || "").replace(/^@/, "");
    if (!handle) return null;
    const profile = await supabaseFetch(
      "profiles",
      `handle=eq.${encodeURIComponent(handle)}&select=id,full_name,handle,avatar_url,bio,is_public,role,created_at&limit=1`
    );
    if (!profile) return null;
    if (profile.is_public === false) return null;
    const uid = profile.id;
    const displayName = profile.full_name || handle;
    // Fan out the per-content-type queries in parallel. Each capped at 20
    // items to keep response time reasonable and URL+payload sizes sane.
    const [builds, trips, threads, spots] = await Promise.all([
      supabaseFetchAll("builds", `user_id=eq.${encodeURIComponent(uid)}&select=id,name,year,make,model,hero_img,created_at&order=created_at.desc&limit=20`),
      supabaseFetchAll("trip_reports", `user_id=eq.${encodeURIComponent(uid)}&status=eq.published&select=id,slug,name,description,kind,visibility,hero_img,distance_mi,region,state_code,published_at,created_at&order=published_at.desc&limit=20`),
      supabaseFetchAll("forum_threads", `user_id=eq.${encodeURIComponent(uid)}&select=id,slug,title,subcategory_slug,created_at,view_count&order=created_at.desc&limit=20`),
      supabaseFetchAll("camping_spots", `user_id=eq.${encodeURIComponent(uid)}&visibility=eq.public&select=id,name,description,created_at&order=created_at.desc&limit=20`),
    ]);
    const tripsPublic = (trips || []).filter(t => !t.kind || t.kind === "report" || t.visibility === "public");
    const bio = (profile.bio || "").trim();
    const description = bio
      ? bio.slice(0, 220)
      : `${displayName} on Trailhead — ${(builds || []).length} build${(builds || []).length === 1 ? "" : "s"}, ${tripsPublic.length} trip${tripsPublic.length === 1 ? "" : "s"}, ${(threads || []).length} forum thread${(threads || []).length === 1 ? "" : "s"}`;
    const titleStr = `${displayName} (@${handle}) — Trailhead`;
    return {
      title: titleStr,
      description,
      image: profile.avatar_url || null,
      imageAlt: profile.avatar_url ? `${displayName} profile photo` : "",
      jsonLd: {
        kind: "PersonProfile",
        handle,
        displayName,
        bio,
        avatarUrl: profile.avatar_url || null,
        role: profile.role || "user",
        createdAt: profile.created_at || null,
        canonicalUrl: null, // filled in by handler
        contentCounts: {
          builds: (builds || []).length,
          trips: tripsPublic.length,
          threads: (threads || []).length,
          spots: (spots || []).length,
        },
      },
      breadcrumb: {
        items: [
          { name: "Trailhead", url: null },
          { name: "Users", url: null },
          { name: `@${handle}`, url: null },
        ],
      },
      profileSSR: {
        handle,
        displayName,
        bio,
        avatarUrl: profile.avatar_url || null,
        role: profile.role || "user",
        builds: builds || [],
        trips: tripsPublic,
        threads: threads || [],
        spots: spots || [],
      },
    };
  }
  return null;
}

// Build the SSR landing page for a forum subcategory. Renders breadcrumbs +
// subcategory heading + a list of recent threads (title, body excerpt,
// author byline, date, view count). Each thread title is an anchor to its
// canonical /forum/<sub>/<slug> URL — internal link density Google uses
// to discover threads + flow PageRank to the subcategory hub.
function buildForumSubSSR(payload, origin) {
  if (!payload || payload.kind !== "forum-sub") return "";
  const sub = payload.subInfo;
  const threads = Array.isArray(payload.threads) ? payload.threads : [];
  const authors = payload.authors || {};
  const subName = escapeHtml(sub.name);
  const catName = escapeHtml(sub.catName);
  const subSlug = escapeHtml(sub.slug || "");
  const catSlug = escapeHtml(sub.catSlug || "");
  const crumbs = [
    `<a href="${origin}/" style="color:#C49A6C;text-decoration:none;">Trailhead</a>`,
    `<a href="${origin}/" style="color:#C49A6C;text-decoration:none;">Forum</a>`,
    `<span style="color:#fff;">${subName}</span>`,
  ].join(' <span style="color:#8B7D6B;">/</span> ');
  const threadsHtml = threads.length === 0
    ? `<div style="padding:32px 0;color:#8B7D6B;font-size:14px;text-align:center;">No threads yet in ${subName}. Be the first to post.</div>`
    : threads.map(t => {
        const author = authors[t.user_id] || null;
        const authorName = escapeHtml((author && author.full_name) || "Author");
        const authorHandle = author && author.handle ? `@${escapeHtml(author.handle)}` : "";
        const date = t.created_at ? new Date(t.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
        // Pull a snippet from sections or body, stripped of tags.
        let snippet = "";
        if (Array.isArray(t.sections) && t.sections.length > 0) {
          const firstBody = t.sections.find(s => s && s.body) || { body: "" };
          snippet = (firstBody.body || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        }
        if (!snippet && t.body) {
          snippet = t.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        }
        snippet = snippet.slice(0, 220);
        const url = `${origin}/forum/${subSlug}/${escapeHtml(t.slug || "")}`;
        return `
          <article style="padding:20px 0;border-bottom:1px solid #2A2A28;">
            <h2 style="margin:0 0 8px;font-size:20px;font-family:'Trebuchet MS','Gill Sans',sans-serif;font-weight:700;line-height:1.3;">
              <a href="${url}" style="color:#fff;text-decoration:none;">${escapeHtml(t.title || "Untitled")}</a>
            </h2>
            ${snippet ? `<p style="margin:0 0 10px;font-size:14px;color:#F5F2ED;line-height:1.5;">${escapeHtml(snippet)}${snippet.length >= 220 ? "…" : ""}</p>` : ""}
            <div style="font-family:'Trebuchet MS',sans-serif;font-size:11px;color:#8B7D6B;">
              <strong style="color:#fff;font-weight:600;">${authorName}</strong>
              ${authorHandle ? ` · <span style="color:#C49A6C;">${authorHandle}</span>` : ""}
              · ${escapeHtml(date)}
              ${typeof t.view_count === "number" && t.view_count > 0 ? ` · ${t.view_count} view${t.view_count === 1 ? "" : "s"}` : ""}
            </div>
          </article>
        `;
      }).join("\n");
  return `
    <main style="max-width:720px;margin:0 auto;padding:32px 20px 80px;color:#fff;background:#111111;min-height:100vh;font-family:'Source Serif 4',Georgia,serif;line-height:1.6;box-sizing:border-box;">
      <nav style="font-family:'Trebuchet MS',sans-serif;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:24px;color:#8B7D6B;">
        ${crumbs}
      </nav>
      <header style="margin-bottom:24px;">
        <span style="font-family:'Trebuchet MS',sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#C49A6C;">${catName}</span>
        <h1 style="margin:6px 0 8px;font-size:32px;font-family:'Trebuchet MS','Gill Sans',sans-serif;line-height:1.2;font-weight:700;color:#fff;">${subName}</h1>
        <p style="margin:0;font-size:14px;color:#8B7D6B;">${threads.length} thread${threads.length === 1 ? "" : "s"} from the Trailhead overlanding community.</p>
      </header>
      <section style="margin:0;">
        ${threadsHtml}
      </section>
      <footer style="margin-top:48px;padding-top:24px;border-top:1px solid #2A2A28;font-family:'Trebuchet MS',sans-serif;font-size:12px;color:#8B7D6B;">
        Browse more on the <a href="${origin}/" style="color:#C49A6C;text-decoration:none;">Trailhead Overlanding Forum</a> — the community for overlanders sharing trips, builds, and trail knowledge.
      </footer>
    </main>
  `;
}

// Shared shell for the per-entity SSR builders below. Crawlers + initial-
// load humans see this article in the SPA root div before React mounts +
// replaces it on first render. All inputs already escaped/sanitized by
// the caller; this helper just composes them.
function ssrArticleShell({ title, crumbs, byline, hero, heroAlt, body, footer, footerLabel, accent }) {
  const titleHtml = title || "";
  const crumbsHtml = crumbs || "";
  const bylineHtml = byline || "";
  const bodyHtml = body || "";
  const footerHtml = footer || "";
  const accentColor = accent || "#C49A6C";
  const heroHtml = hero
    ? `<figure style="margin:0 0 24px;border-radius:12px;overflow:hidden;"><img src="${hero}" alt="${heroAlt || ""}" loading="eager" decoding="async" style="width:100%;height:auto;display:block;border-radius:12px;" /></figure>`
    : "";
  return `
    <article style="max-width:720px;margin:0 auto;padding:32px 20px 80px;color:#fff;background:#111111;min-height:100vh;font-family:'Source Serif 4',Georgia,serif;line-height:1.7;box-sizing:border-box;">
      ${crumbsHtml ? `<nav style="font-family:'Trebuchet MS',sans-serif;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:24px;color:#8B7D6B;">${crumbsHtml}</nav>` : ""}
      <h1 style="margin:0 0 16px;font-size:32px;font-family:'Trebuchet MS','Gill Sans',sans-serif;line-height:1.2;font-weight:700;color:#fff;">${titleHtml}</h1>
      ${bylineHtml}
      ${heroHtml}
      ${bodyHtml}
      ${footerHtml || `<footer style="margin-top:48px;padding-top:24px;border-top:1px solid #2A2A28;font-family:'Trebuchet MS',sans-serif;font-size:12px;color:#8B7D6B;">${footerLabel || `Browse more on <a href="/" style="color:${accentColor};text-decoration:none;">Trailhead</a> — the overlanding community app.`}</footer>`}
    </article>
  `;
}

// Author byline block (avatar + name + linked handle + datetime).
function ssrAuthorByline({ author, date, accent }) {
  if (!author && !date) return "";
  const a = author || {};
  const accentColor = accent || "#C49A6C";
  const initial = (a.name || "A").charAt(0).toUpperCase();
  const avatarBlock = a.avatarUrl
    ? `<img src="${escapeHtml(a.avatarUrl)}" alt="${escapeHtml(a.name || "Author")}" loading="eager" decoding="async" style="width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0;" />`
    : `<div style="width:48px;height:48px;border-radius:50%;background:${accentColor};display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="font-family:'Trebuchet MS',sans-serif;font-size:18px;font-weight:700;color:#fff;">${escapeHtml(initial)}</span></div>`;
  const dateIso = date ? new Date(date).toISOString() : "";
  const dateStr = date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
  return `
    <div style="display:flex;align-items:center;gap:14px;padding:16px 0 24px;margin-bottom:24px;border-bottom:1px solid #2A2A28;">
      ${avatarBlock}
      <div style="display:flex;flex-direction:column;gap:2px;font-family:'Trebuchet MS',sans-serif;">
        ${a.name ? `<span style="font-size:15px;font-weight:700;color:#fff;">${escapeHtml(a.name)}</span>` : ""}
        <span style="font-size:12px;color:#8B7D6B;">
          ${a.handle ? `<span style="color:${accentColor};">@${escapeHtml(a.handle)}</span>${date ? " · " : ""}` : ""}
          ${dateStr ? `<time datetime="${escapeHtml(dateIso)}">${escapeHtml(dateStr)}</time>` : ""}
        </span>
      </div>
    </div>
  `;
}

function ssrCrumbs(items, origin) {
  return (items || [])
    .map((it, i, arr) => {
      const isLast = i === arr.length - 1;
      const url = it.url || (i === 0 ? `${origin}/` : null);
      if (isLast || !url) return `<span style="color:#fff;">${escapeHtml(it.name)}</span>`;
      return `<a href="${url}" style="color:#C49A6C;text-decoration:none;">${escapeHtml(it.name)}</a>`;
    })
    .join(' <span style="color:#8B7D6B;">/</span> ');
}

// Trip report / trip plan SSR. Different accent + breadcrumb label, but
// the same article shape — title, author byline with publish date, hero
// (route map static image or photo), description, stats row (distance,
// elev gain, duration, region, terrains).
function buildTripArticleSSR(article, canonicalUrl, origin) {
  if (!article || !article.title) return "";
  const isReport = article.isReport;
  const accent = isReport ? "#8B6FAF" : "#C49A6C";
  const crumbs = ssrCrumbs([
    { name: "Trailhead", url: `${origin}/` },
    { name: isReport ? "Trip Reports" : "Trip Plans" },
    { name: article.title },
  ], origin);
  const byline = ssrAuthorByline({ author: article.author, date: article.createdAt, accent });
  // Build stats row.
  const stats = [];
  if (article.distanceMi != null) stats.push(`<strong>${Number(article.distanceMi).toFixed(1)} mi</strong> distance`);
  if (article.elevGainFt != null) stats.push(`<strong>${Math.round(article.elevGainFt).toLocaleString()} ft</strong> elev gain`);
  if (article.durationMin != null) stats.push(`<strong>${Math.round(article.durationMin / 60 * 10) / 10} hr</strong> duration`);
  if (article.region) stats.push(`<strong>${escapeHtml(article.region)}${article.stateCode ? ", " + escapeHtml(article.stateCode) : ""}</strong>`);
  if (article.difficulty) stats.push(`<strong>${escapeHtml(article.difficulty)}</strong> difficulty`);
  if (!isReport && article.plannedStart) {
    const d = new Date(article.plannedStart).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    stats.push(`Planned start: <strong>${escapeHtml(d)}</strong>`);
  }
  const statsRow = stats.length > 0
    ? `<div style="display:flex;flex-wrap:wrap;gap:16px 24px;padding:16px;background:#1A1A1A;border-radius:10px;margin:0 0 24px;font-family:'Trebuchet MS',sans-serif;font-size:13px;color:#F5F2ED;">${stats.join(' <span style="color:#8B7D6B;">|</span> ')}</div>`
    : "";
  // Keywords from terrains + tags surface as visible chips for both
  // humans + crawlers parsing topical keyword density.
  const kw = [...(article.terrains || []), ...(article.tags || [])];
  const kwRow = kw.length > 0
    ? `<div style="margin:0 0 24px;font-family:'Trebuchet MS',sans-serif;">${kw.map(k => `<span style="display:inline-block;background:${accent}25;color:${accent};font-size:11px;letter-spacing:0.5px;padding:4px 10px;border-radius:14px;margin:0 6px 6px 0;">${escapeHtml(k)}</span>`).join("")}</div>`
    : "";
  const desc = article.description
    ? `<div style="font-size:16px;color:#F5F2ED;margin:0 0 24px;line-height:1.7;">${escapeHtml(article.description)}</div>`
    : "";
  const body = statsRow + kwRow + desc;
  return ssrArticleShell({
    title: escapeHtml(article.title),
    crumbs,
    byline,
    hero: article.image ? escapeHtml(article.image) : null,
    heroAlt: article.imageAlt ? escapeHtml(article.imageAlt) : escapeHtml(`${article.title} route map`),
    body,
    accent,
    footerLabel: `${isReport ? "Trip report" : "Trip plan"} on the <a href="${origin}/" style="color:${accent};text-decoration:none;">Trailhead</a> overlanding community.`,
  });
}

// Camping spot SSR — name, location, description, key attributes (type, fee).
// Gear drop SSR — sponsored event landing page. Brand chip + title hero,
// prize summary, plain-text about (rich-text stripped server-side), date
// + status row. Crawlers + people-on-slow-networks see the article before
// the SPA mounts.
function buildGearDropSSR(d, canonicalUrl, origin) {
  if (!d || !d.title) return "";
  const accent = "#4A7C59";
  const crumbs = ssrCrumbs([
    { name: "Trailhead", url: `${origin}/` },
    { name: "Gear Drops" },
    { name: d.title },
  ], origin);
  const brandChip = d.brand
    ? `<div style="display:inline-flex;align-items:center;gap:10px;padding:8px 14px;background:#1A1A1A;border:1px solid #C49A6C;border-radius:28px;margin:0 0 14px;font-family:'Trebuchet MS',sans-serif;font-size:13px;color:#C49A6C;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${d.brandLogoUrl ? `<img src="${escapeHtml(d.brandLogoUrl)}" alt="" style="width:24px;height:24px;border-radius:5px;object-fit:cover;">` : ""}<span>${escapeHtml(d.brand)}</span></div>`
    : "";
  const statusLabel =
    d.status === "live" ? "LIVE NOW" :
    d.status === "scheduled" ? "UPCOMING" :
    d.status === "ended" ? (d.winnerAnnouncedAt ? "ENDED · WINNER DECLARED" : "ENDED") :
    "";
  const statusColor =
    d.status === "live" ? "#BD472A" :
    d.status === "scheduled" ? "#C49A6C" :
    "#8B7D6B";
  const statusChip = statusLabel
    ? `<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:${statusColor};color:#fff;border-radius:8px;margin-right:10px;font-family:'Trebuchet MS',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;">${statusLabel}</div>`
    : "";
  const dateLabel = d.startsAt
    ? new Date(d.startsAt).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "";
  const dateRow = dateLabel
    ? `<div style="margin:6px 0 18px;font-family:'Trebuchet MS',sans-serif;font-size:13px;color:#F5F2ED;">${statusChip}<span>${escapeHtml(dateLabel)}</span></div>`
    : (statusChip ? `<div style="margin:6px 0 18px;">${statusChip}</div>` : "");
  const prizeTitle = d.prizeTitle
    ? `<div style="display:flex;align-items:center;gap:10px;padding:14px 16px;background:#1A1A1A;border-radius:10px;margin:0 0 18px;"><span style="font-family:'Trebuchet MS',sans-serif;font-size:10px;color:#C49A6C;font-weight:700;letter-spacing:0.8px;">PRIZE</span><strong style="font-family:'Trebuchet MS',sans-serif;font-size:15px;color:#F5F2ED;">${escapeHtml(d.prizeTitle)}</strong>${d.prizeValueUsd ? `<span style="margin-left:auto;font-family:'Trebuchet MS',sans-serif;font-size:13px;color:#8B7D6B;">$${escapeHtml(d.prizeValueUsd)}</span>` : ""}</div>`
    : "";
  const prizeBody = d.prizeDescription
    ? `<div style="font-size:15px;color:#F5F2ED;margin:0 0 22px;line-height:1.7;">${escapeHtml(d.prizeDescription)}</div>`
    : "";
  const aboutBody = d.description
    ? `<h2 style="font-family:'Trebuchet MS',sans-serif;font-size:14px;color:${accent};letter-spacing:0.8px;margin:0 0 8px;">ABOUT</h2><div style="font-size:16px;color:#F5F2ED;margin:0 0 22px;line-height:1.7;">${escapeHtml(d.description)}</div>`
    : "";
  return ssrArticleShell({
    title: escapeHtml(d.title),
    crumbs,
    byline: brandChip,
    hero: d.image ? escapeHtml(d.image) : null,
    heroAlt: escapeHtml(`${d.title} gear drop hosted by ${d.brand || "Lone Peak Overland"}`),
    body: dateRow + prizeTitle + prizeBody + aboutBody,
    accent,
    footerLabel: `Gear drop event on <a href="${origin}/" style="color:${accent};text-decoration:none;">Trailhead</a> — sponsored route + prize race hosted by Lone Peak Overland and brand partners.`,
  });
}

function buildCampingSpotSSR(spot, canonicalUrl, origin) {
  if (!spot || !spot.name) return "";
  const accent = "#5B8C5A";
  const crumbs = ssrCrumbs([
    { name: "Trailhead", url: `${origin}/` },
    { name: "Camping Spots" },
    { name: spot.name },
  ], origin);
  const attrs = [];
  if (spot.spotType && spot.spotType !== "unknown") attrs.push(`<strong>${escapeHtml(spot.spotType)}</strong>`);
  if (spot.fee) attrs.push(`<strong>${escapeHtml(spot.fee)}</strong>`);
  if (spot.lat != null && spot.lng != null) attrs.push(`<span style="font-family:Source Serif 4,Georgia,serif;">${Number(spot.lat).toFixed(5)}, ${Number(spot.lng).toFixed(5)}</span>`);
  const attrsRow = attrs.length > 0
    ? `<div style="display:flex;flex-wrap:wrap;gap:16px;padding:14px 16px;background:#1A1A1A;border-radius:10px;margin:0 0 24px;font-family:'Trebuchet MS',sans-serif;font-size:13px;color:#F5F2ED;">${attrs.join(' <span style="color:#8B7D6B;">|</span> ')}</div>`
    : "";
  const desc = spot.description
    ? `<div style="font-size:16px;color:#F5F2ED;margin:0 0 24px;line-height:1.7;">${escapeHtml(spot.description)}</div>`
    : "";
  return ssrArticleShell({
    title: escapeHtml(spot.name),
    crumbs,
    byline: "",
    hero: spot.image ? escapeHtml(spot.image) : null,
    heroAlt: escapeHtml(`${spot.name} camping spot`),
    body: attrsRow + desc,
    accent,
    footerLabel: `Camping spot on <a href="${origin}/" style="color:${accent};text-decoration:none;">Trailhead</a> — find more spots, share trip reports, and connect with the overlanding community.`,
  });
}

// Build SSR — title (e.g. "Kyle's Tundra"), year/make/model/trim row,
// author byline, description if present.
function buildBuildSSR(b, canonicalUrl, origin) {
  if (!b || !b.name && !b.make) return "";
  const accent = "#C49A6C";
  const title = b.name || [b.year, b.make, b.model].filter(Boolean).join(" ");
  const vehicle = [b.year, b.make, b.model, b.trim].filter(Boolean).join(" ");
  const crumbs = ssrCrumbs([
    { name: "Trailhead", url: `${origin}/` },
    { name: "Builds" },
    { name: title },
  ], origin);
  const byline = ssrAuthorByline({ author: b.author, date: b.createdAt, accent });
  const vehicleRow = vehicle
    ? `<div style="font-family:'Trebuchet MS',sans-serif;font-size:14px;color:#F5F2ED;margin:0 0 24px;padding:14px 16px;background:#1A1A1A;border-radius:10px;letter-spacing:0.3px;"><strong>${escapeHtml(vehicle)}</strong></div>`
    : "";
  return ssrArticleShell({
    title: escapeHtml(title),
    crumbs,
    byline,
    hero: b.image ? escapeHtml(b.image) : null,
    heroAlt: escapeHtml(`${title} overlanding build`),
    body: vehicleRow,
    accent,
    footerLabel: `Overlanding build on <a href="${origin}/" style="color:${accent};text-decoration:none;">Trailhead</a>.`,
  });
}

// HQ SSR — address, geo, branded CTAs.
function buildHQSSR(canonicalUrl, origin, image) {
  const accent = "#BD472A";
  const crumbs = ssrCrumbs([
    { name: "Trailhead", url: `${origin}/` },
    { name: "HQ" },
  ], origin);
  const addressBlock = `
    <div style="font-family:'Trebuchet MS',sans-serif;font-size:14px;color:#F5F2ED;margin:0 0 24px;padding:16px;background:#1A1A1A;border-radius:10px;">
      <strong style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${accent};display:block;margin-bottom:4px;">Headquarters</strong>
      ${escapeHtml(LPO_HQ.address)}<br>
      <span style="font-family:'Source Serif 4',Georgia,serif;color:#8B7D6B;font-size:13px;">${LPO_HQ.lat.toFixed(5)}, ${LPO_HQ.lng.toFixed(5)}</span>
    </div>
  `;
  const ctas = `
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin:0 0 24px;">
      <a href="https://www.google.com/maps/dir/?api=1&destination=${LPO_HQ.lat},${LPO_HQ.lng}" style="display:inline-block;padding:12px 20px;background:${accent};color:#fff;text-decoration:none;border-radius:8px;font-family:'Trebuchet MS',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.5px;">DIRECTIONS</a>
      <a href="https://www.lonepeakoverland.com/" style="display:inline-block;padding:12px 20px;background:transparent;border:1px solid ${accent};color:${accent};text-decoration:none;border-radius:8px;font-family:'Trebuchet MS',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.5px;">WEBSITE</a>
    </div>
  `;
  return ssrArticleShell({
    title: escapeHtml(LPO_HQ.name),
    crumbs,
    byline: "",
    hero: image ? escapeHtml(image) : null,
    heroAlt: escapeHtml(`${LPO_HQ.name} location map`),
    body: addressBlock + ctas,
    accent,
    footerLabel: `Home base of <a href="https://www.lonepeakoverland.com/" style="color:${accent};text-decoration:none;">Lone Peak Overland</a> — overlanding gear and the community behind <a href="${origin}/" style="color:${accent};text-decoration:none;">Trailhead</a>.`,
  });
}

// Generic feed post SSR (POST / PHOTOS / ROUTES / BUILDS / CONVOYS / FORUM
// share posts — anything routed through /post/:id). Renders title, byline,
// hero image, body text. Type-specific chrome (route maps, build cards,
// convoy details) is intentionally omitted — those views live in the SPA
// and crawlers get the underlying text + hero photo here.
function buildPostSSR(post, canonicalUrl, origin) {
  if (!post || (!post.title && !post.body)) return "";
  const accent = "#C49A6C";
  const crumbs = ssrCrumbs([
    { name: "Trailhead", url: `${origin}/` },
    { name: post.type === "ROUTES" ? "Routes" : post.type === "BUILDS" ? "Builds" : "Feed" },
    { name: post.title || "Post" },
  ], origin);
  const byline = ssrAuthorByline({ author: post.author, date: post.createdAt, accent });
  const body = post.body
    ? `<div style="font-size:16px;color:#F5F2ED;margin:0 0 24px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(post.body)}</div>`
    : "";
  return ssrArticleShell({
    title: escapeHtml(post.title || "Post"),
    crumbs,
    byline,
    hero: post.image ? escapeHtml(post.image) : null,
    heroAlt: post.imageAlt ? escapeHtml(post.imageAlt) : escapeHtml(post.title || "Post on Trailhead"),
    body,
    accent,
    footerLabel: `Posted on <a href="${origin}/" style="color:${accent};text-decoration:none;">Trailhead</a> — the overlanding community.`,
  });
}

const DEFAULT_META = {
  title: "Trailhead · The overlanding community app by Lone Peak Overland",
  description:
    "Discover camping spots, plan trips, share builds, and connect with the overlanding community.",
  image: null,
};

function metaTagsFor({ title, description, image, imageAlt, url, article }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const i = image ? escapeHtml(image) : "";
  const a = imageAlt ? escapeHtml(imageAlt) : "";
  const u = escapeHtml(url);
  // Article-specific OG tags — emitted when the caller passes an `article`
  // payload (currently forum threads). Provides published time, modified
  // time, section (topical category), and author name; social rich
  // previews + some search engines parse these.
  const articleTags = [];
  if (article) {
    if (article.createdAt) articleTags.push(`<meta property="article:published_time" content="${escapeHtml(new Date(article.createdAt).toISOString())}">`);
    if (article.modifiedAt) articleTags.push(`<meta property="article:modified_time" content="${escapeHtml(new Date(article.modifiedAt).toISOString())}">`);
    if (article.section) articleTags.push(`<meta property="article:section" content="${escapeHtml(article.section)}">`);
    if (article.authorName) articleTags.push(`<meta property="article:author" content="${escapeHtml(article.authorName)}">`);
  }
  return [
    `<meta property="og:type" content="article">`,
    `<meta property="og:site_name" content="Trailhead">`,
    `<meta property="og:title" content="${t}">`,
    `<meta property="og:description" content="${d}">`,
    `<meta property="og:url" content="${u}">`,
    i ? `<meta property="og:image" content="${i}">` : "",
    i && a ? `<meta property="og:image:alt" content="${a}">` : "",
    i ? `<meta property="og:image:width" content="1200">` : "",
    i ? `<meta property="og:image:height" content="630">` : "",
    ...articleTags,
    `<meta name="twitter:card" content="${i ? "summary_large_image" : "summary"}">`,
    `<meta name="twitter:title" content="${t}">`,
    `<meta name="twitter:description" content="${d}">`,
    i ? `<meta name="twitter:image" content="${i}">` : "",
    i && a ? `<meta name="twitter:image:alt" content="${a}">` : "",
    `<meta name="description" content="${d}">`,
  ]
    .filter(Boolean)
    .join("\n");
}

// User profile SSR hub. Renders bio + four sections (builds / trips /
// forum threads / camping spots) where every item is an anchor to its
// canonical detail URL. Each section is a "stop" Google can walk through
// to discover + crawl the user's entire body of work. The Person entity
// + this dense link structure is what gives forum threads + builds their
// E-E-A-T author signal — Google can resolve "who is this person" by
// following the chain backward from any of their articles.
function buildProfileSSR(payload, canonicalUrl, origin) {
  if (!payload || !payload.handle) return "";
  const handleEsc = escapeHtml(payload.handle);
  const displayName = escapeHtml(payload.displayName || payload.handle);
  const bio = escapeHtml(payload.bio || "");
  const avatar = payload.avatarUrl
    ? `<img src="${escapeHtml(payload.avatarUrl)}" alt="${displayName} profile photo" width="120" height="120" loading="eager" decoding="async" style="width:120px;height:120px;border-radius:60px;object-fit:cover;display:block;" />`
    : `<div style="width:120px;height:120px;border-radius:60px;background:#C49A6C;display:flex;align-items:center;justify-content:center;font-family:'Trebuchet MS',sans-serif;font-size:42px;font-weight:700;color:#fff;">${(displayName[0] || "U").toUpperCase()}</div>`;
  const roleBadge = payload.role === "admin"
    ? `<span style="display:inline-block;padding:3px 8px;background:#BD472A;color:#fff;border-radius:4px;font-family:'Trebuchet MS',sans-serif;font-size:10px;letter-spacing:1px;font-weight:700;margin-left:8px;">ADMIN</span>`
    : payload.role === "ambassador"
    ? `<span style="display:inline-block;padding:3px 8px;background:#C49A6C;color:#fff;border-radius:4px;font-family:'Trebuchet MS',sans-serif;font-size:10px;letter-spacing:1px;font-weight:700;margin-left:8px;">AMBASSADOR</span>`
    : "";
  const crumbs = [
    `<a href="${origin}/" style="color:#C49A6C;text-decoration:none;">Trailhead</a>`,
    `<span style="color:#fff;">@${handleEsc}</span>`,
  ].join(' <span style="color:#8B7D6B;">/</span> ');
  // Helper: section render. Empty sections still emit a skeleton with
  // explicit "no items yet" so crawlers see all four content surfaces
  // were considered (Google penalizes pages that look thin only when
  // structure suggests content was expected but missing).
  const renderSection = (heading, items, renderItem) => {
    const inner = items.length === 0
      ? `<p style="margin:0;font-size:13px;color:#8B7D6B;font-style:italic;">No ${heading.toLowerCase()} yet.</p>`
      : items.map(renderItem).join("\n");
    return `
      <section style="margin:32px 0 0;">
        <h2 style="margin:0 0 14px;font-size:20px;font-family:'Trebuchet MS','Gill Sans',sans-serif;font-weight:700;color:#fff;letter-spacing:0.5px;">${escapeHtml(heading)}</h2>
        ${inner}
      </section>
    `;
  };
  const buildsHtml = renderSection("Builds", payload.builds || [], (b) => {
    const vehicle = [b.year, b.make, b.model].filter(Boolean).join(" ");
    const url = `${origin}/builds/${escapeHtml(b.id)}`;
    return `
      <article style="padding:12px 0;border-bottom:1px solid #2A2A28;">
        <h3 style="margin:0 0 4px;font-size:16px;font-family:'Trebuchet MS','Gill Sans',sans-serif;font-weight:600;">
          <a href="${url}" style="color:#fff;text-decoration:none;">${escapeHtml(b.name || "Build")}</a>
        </h3>
        ${vehicle ? `<p style="margin:0;font-size:12px;color:#8B7D6B;">${escapeHtml(vehicle)}</p>` : ""}
      </article>
    `;
  });
  const tripsHtml = renderSection("Trip Reports", payload.trips || [], (t) => {
    const url = `${origin}/${t.kind === "plan" ? "plans" : "trips"}/${escapeHtml(t.slug || t.id)}`;
    const isPlan = t.kind === "plan";
    const meta = [
      isPlan ? "PLAN" : null,
      t.distance_mi != null ? `${Number(t.distance_mi).toFixed(1)} mi` : null,
      [t.region, t.state_code].filter(Boolean).join(", ") || null,
    ].filter(Boolean).map(escapeHtml).join(" · ");
    return `
      <article style="padding:12px 0;border-bottom:1px solid #2A2A28;">
        <h3 style="margin:0 0 4px;font-size:16px;font-family:'Trebuchet MS','Gill Sans',sans-serif;font-weight:600;">
          <a href="${url}" style="color:#fff;text-decoration:none;">${escapeHtml(t.name || "Trip")}</a>
        </h3>
        ${meta ? `<p style="margin:0 0 2px;font-size:12px;color:#8B7D6B;">${meta}</p>` : ""}
        ${t.description ? `<p style="margin:0;font-size:13px;color:#F5F2ED;line-height:1.5;">${escapeHtml(t.description.slice(0, 160))}${t.description.length > 160 ? "…" : ""}</p>` : ""}
      </article>
    `;
  });
  const threadsHtml = renderSection("Forum Threads", payload.threads || [], (t) => {
    const subSlug = escapeHtml(t.subcategory_slug || "");
    const url = `${origin}/forum/${subSlug}/${escapeHtml(t.slug || "")}`;
    return `
      <article style="padding:12px 0;border-bottom:1px solid #2A2A28;">
        <h3 style="margin:0 0 4px;font-size:16px;font-family:'Trebuchet MS','Gill Sans',sans-serif;font-weight:600;">
          <a href="${url}" style="color:#fff;text-decoration:none;">${escapeHtml(t.title || "Thread")}</a>
        </h3>
        ${t.view_count ? `<p style="margin:0;font-size:12px;color:#8B7D6B;">${t.view_count} view${t.view_count === 1 ? "" : "s"}</p>` : ""}
      </article>
    `;
  });
  const spotsHtml = renderSection("Camping Spots", payload.spots || [], (s) => {
    const url = `${origin}/spots/${escapeHtml(s.id)}`;
    return `
      <article style="padding:12px 0;border-bottom:1px solid #2A2A28;">
        <h3 style="margin:0 0 4px;font-size:16px;font-family:'Trebuchet MS','Gill Sans',sans-serif;font-weight:600;">
          <a href="${url}" style="color:#fff;text-decoration:none;">${escapeHtml(s.name || "Spot")}</a>
        </h3>
        ${s.description ? `<p style="margin:0;font-size:13px;color:#F5F2ED;line-height:1.5;">${escapeHtml(s.description.slice(0, 160))}${s.description.length > 160 ? "…" : ""}</p>` : ""}
      </article>
    `;
  });
  return `
    <main style="max-width:720px;margin:0 auto;padding:32px 20px 80px;color:#fff;background:#111111;min-height:100vh;font-family:'Source Serif 4',Georgia,serif;line-height:1.6;box-sizing:border-box;">
      <nav style="font-family:'Trebuchet MS',sans-serif;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:24px;color:#8B7D6B;">
        ${crumbs}
      </nav>
      <header style="display:flex;gap:20px;align-items:flex-start;margin-bottom:24px;">
        ${avatar}
        <div style="flex:1;min-width:0;">
          <h1 style="margin:0 0 4px;font-size:28px;font-family:'Trebuchet MS','Gill Sans',sans-serif;font-weight:700;line-height:1.2;color:#fff;">${displayName}${roleBadge}</h1>
          <p style="margin:0 0 10px;font-size:13px;color:#C49A6C;font-family:'Trebuchet MS',sans-serif;">@${handleEsc}</p>
          ${bio ? `<p style="margin:0;font-size:14px;color:#F5F2ED;line-height:1.5;">${bio}</p>` : ""}
        </div>
      </header>
      ${buildsHtml}
      ${tripsHtml}
      ${threadsHtml}
      ${spotsHtml}
      <footer style="margin-top:48px;padding-top:24px;border-top:1px solid #2A2A28;font-family:'Trebuchet MS',sans-serif;font-size:12px;color:#8B7D6B;">
        ${displayName} on <a href="${origin}/" style="color:#C49A6C;text-decoration:none;">Trailhead</a> — the overlanding community by Lone Peak Overland.
      </footer>
    </main>
  `;
}

module.exports = async function handler(req, res) {
  // Refresh the DB-backed forum subcategory map if stale. Cheap; cached
  // 60s. Means admin edits in-app propagate to OG / SSR / JSON-LD within
  // a minute without a redeploy.
  await loadForumSubs();
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const type = (req.query && req.query.type) || "";
  const id = (req.query && req.query.id) || "";
  // Forum threads are routed with sub + slug query params (see vercel.json).
  // Resolve by slug; the sub segment is used to reconstruct the canonical URL.
  const sub = (req.query && req.query.sub) || "";
  const slug = (req.query && req.query.slug) || "";
  const handle = (req.query && req.query.handle) || "";
  // Reconstruct the user-facing URL for the canonical og:url tag.
  const prettyPath =
    type === "trip" ? `/trips/${id}` :
    type === "plan" ? `/plans/${id}` :
    type === "gear-drop" ? `/drops/${id}` :
    type === "spot" ? `/spots/${id}` :
    type === "build" ? `/builds/${id}` :
    type === "bounty" ? `/bounties/${id}` :
    type === "post" || type === "route" ? `/post/${id}` :
    type === "forum-thread" ? `/forum/${sub}/${slug}` :
    type === "forum-sub" ? `/forum/${sub}` :
    type === "user" ? `/users/${handle.replace(/^@/, "")}` :
    type === "hq" ? `/hq` : "/";
  const canonicalUrl = `${proto}://${host}${prettyPath}`;

  let meta = DEFAULT_META;
  if (type) {
    // For forum threads the lookup key is the slug, not id. For forum-sub
    // it's the subcategory slug passed as `sub`.
    const lookupId = type === "forum-thread" ? slug : (type === "forum-sub" ? sub : (type === "user" ? handle : id));
    const data = await resolveEntity(type, lookupId);
    if (data) meta = data;
  }

  // Article-specific OG tags get emitted when we have an article payload
  // (currently forum threads). Section is the human-readable subcategory
  // name; author is the byline name.
  const articleMeta = (type === "forum-thread" && meta.article)
    ? {
        createdAt: meta.article.createdAt || null,
        modifiedAt: meta.article.modifiedAt || null,
        section: meta.article.subcategorySlug && FORUM_SUB_TO_INFO[meta.article.subcategorySlug]
          ? `${FORUM_SUB_TO_INFO[meta.article.subcategorySlug].catName} / ${FORUM_SUB_TO_INFO[meta.article.subcategorySlug].name}`
          : null,
        authorName: meta.article.author && meta.article.author.name ? meta.article.author.name : null,
      }
    : null;
  const tags = metaTagsFor({
    title: meta.title,
    description: meta.description,
    image: meta.image,
    imageAlt: meta.imageAlt || "",
    url: canonicalUrl,
    article: articleMeta,
  });

  // Canonical URL tag — prevents duplicate-content penalties when the same
  // page is reachable via multiple URLs (query string variations, trailing
  // slash variants, etc.). Emitted for every entity type since Google
  // strongly prefers it.
  const origin = `${proto}://${host}`;
  const canonicalTag = `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`;

  // BreadcrumbList JSON-LD — gives Google the navigation hierarchy so
  // SERPs show "Trailhead › Forum › <subcategory> › <thread title>" (or
  // the appropriate hierarchy for the entity type) instead of the raw URL.
  let breadcrumbLdTag = "";
  let breadcrumbItems = null;
  if (type === "forum-thread" && meta.article && meta.article.subcategorySlug) {
    const subInfo = FORUM_SUB_TO_INFO[meta.article.subcategorySlug];
    breadcrumbItems = [
      { name: "Trailhead", url: `${origin}/` },
      { name: "Forum", url: `${origin}/` },
    ];
    if (subInfo) breadcrumbItems.push({ name: subInfo.name, url: `${origin}/forum/${meta.article.subcategorySlug}` });
    breadcrumbItems.push({ name: meta.article.title || "Thread", url: canonicalUrl });
  } else if (type === "forum-sub" && meta.article && meta.article.subInfo) {
    const subInfo = meta.article.subInfo;
    breadcrumbItems = [
      { name: "Trailhead", url: `${origin}/` },
      { name: "Forum", url: `${origin}/` },
      { name: subInfo.name, url: canonicalUrl },
    ];
  } else if (meta.breadcrumb && Array.isArray(meta.breadcrumb.items)) {
    // Generic breadcrumb path declared by the entity resolver — fill in
    // any null URLs with sensible defaults (home for first, canonical
    // for last). Middle items keep null `url` since we don't have routes
    // for "Trip Reports" / "Builds" / etc. yet (the SPA route lists are
    // app-internal); Google still gets the name hierarchy.
    breadcrumbItems = meta.breadcrumb.items.map((it, i, arr) => ({
      name: it.name,
      url: it.url || (i === 0 ? `${origin}/` : (i === arr.length - 1 ? canonicalUrl : null)),
    }));
  }
  if (breadcrumbItems) {
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems.map((it, i) => Object.fromEntries(Object.entries({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        // Schema.org BreadcrumbList: item is required for all but the last
        // entry. We emit URLs when we have them; omit `item` for entries
        // without a target.
        item: it.url || undefined,
      }).filter(([, v]) => v !== undefined))),
    };
    breadcrumbLdTag = `<script type="application/ld+json">${JSON.stringify(breadcrumb).replace(/</g, "\\u003c")}</script>`;
  }

  // Emit JSON-LD structured data when the resolver returned it. Lets Google
  // index forum threads as DiscussionForumPosting (rich result eligible).
  // The full Person schema for author carries name + handle + url + image,
  // which is what Google's E-E-A-T rater pulls expertise/identity signals
  // from when attributing the article.
  let jsonLdTag = "";
  if (meta.jsonLd && meta.jsonLd.kind === "DiscussionForumPosting") {
    const a = meta.jsonLd.author || null;
    const authorNode = a
      ? Object.fromEntries(Object.entries({
          "@type": "Person",
          name: a.name || undefined,
          alternateName: a.handle ? `@${a.handle}` : undefined,
          identifier: a.handle || undefined,
          image: a.avatarUrl || undefined,
        }).filter(([, v]) => v !== undefined))
      : undefined;
    const subInfo = meta.jsonLd.subcategorySlug ? FORUM_SUB_TO_INFO[meta.jsonLd.subcategorySlug] : null;
    const articleSection = subInfo ? `${subInfo.catName} / ${subInfo.name}` : undefined;
    const publisher = {
      "@type": "Organization",
      name: "Trailhead",
      url: `${origin}/`,
      logo: { "@type": "ImageObject", url: `${origin}/lone-peak-flag.png` },
    };
    // Build Comment[] schema from the replies — Google indexes these and
    // shows answer/reply snippets in SERPs.
    const commentList = Array.isArray(meta.jsonLd.replies) && meta.jsonLd.replies.length > 0
      ? meta.jsonLd.replies.slice(0, 50).map(r => Object.fromEntries(Object.entries({
          "@type": "Comment",
          text: (r.body || "").slice(0, 2000),
          datePublished: r.createdAt || undefined,
          author: r.author ? Object.fromEntries(Object.entries({
            "@type": "Person",
            name: r.author.name || undefined,
            alternateName: r.author.handle ? `@${r.author.handle}` : undefined,
            identifier: r.author.handle || undefined,
          }).filter(([, v]) => v !== undefined)) : undefined,
        }).filter(([, v]) => v !== undefined)))
      : undefined;
    // interactionStatistic — surfaces engagement counts to Google as
    // social-proof signals.
    const interactionStats = [];
    if (typeof meta.jsonLd.viewCount === "number" && meta.jsonLd.viewCount > 0) {
      interactionStats.push({
        "@type": "InteractionCounter",
        interactionType: { "@type": "ViewAction" },
        userInteractionCount: meta.jsonLd.viewCount,
      });
    }
    if (typeof meta.jsonLd.likeCount === "number" && meta.jsonLd.likeCount > 0) {
      interactionStats.push({
        "@type": "InteractionCounter",
        interactionType: { "@type": "LikeAction" },
        userInteractionCount: meta.jsonLd.likeCount,
      });
    }
    if (typeof meta.jsonLd.replyCount === "number" && meta.jsonLd.replyCount > 0) {
      interactionStats.push({
        "@type": "InteractionCounter",
        interactionType: { "@type": "CommentAction" },
        userInteractionCount: meta.jsonLd.replyCount,
      });
    }
    // Detect Q&A pattern: title ends with "?" → upgrade to QAPage with
    // Question + Answer schema. Google's "People also ask" rich result
    // panel pulls from this.
    const isQuestion = /\?\s*$/.test(meta.jsonLd.title || "");
    let ld;
    if (isQuestion && commentList) {
      const topAnswer = commentList[0]; // first reply as the "accepted" answer (no upvote signal available yet)
      ld = {
        "@context": "https://schema.org",
        "@type": "QAPage",
        mainEntity: {
          "@type": "Question",
          name: meta.jsonLd.title,
          text: (meta.jsonLd.body || "").slice(0, 2000),
          dateCreated: meta.jsonLd.createdAt || undefined,
          author: authorNode,
          answerCount: meta.jsonLd.replyCount || 0,
          ...(topAnswer ? {
            acceptedAnswer: {
              "@type": "Answer",
              text: topAnswer.text,
              dateCreated: topAnswer.datePublished,
              author: topAnswer.author,
              upvoteCount: 0,
            },
            suggestedAnswer: commentList.slice(1).map(c => ({
              "@type": "Answer",
              text: c.text,
              dateCreated: c.datePublished,
              author: c.author,
            })),
          } : {}),
        },
        url: canonicalUrl,
        publisher,
      };
    } else {
      ld = {
        "@context": "https://schema.org",
        "@type": "DiscussionForumPosting",
        headline: meta.jsonLd.title,
        articleBody: (meta.jsonLd.body || "").slice(0, 5000),
        datePublished: meta.jsonLd.createdAt || undefined,
        dateModified: meta.jsonLd.modifiedAt || meta.jsonLd.createdAt || undefined,
        url: canonicalUrl,
        mainEntityOfPage: canonicalUrl,
        articleSection,
        wordCount: meta.jsonLd.wordCount || undefined,
        author: authorNode,
        publisher,
        comment: commentList,
        commentCount: typeof meta.jsonLd.replyCount === "number" ? meta.jsonLd.replyCount : undefined,
        interactionStatistic: interactionStats.length > 0 ? interactionStats : undefined,
      };
    }
    const clean = Object.fromEntries(Object.entries(ld).filter(([, v]) => v !== undefined));
    const serialized = JSON.stringify(clean).replace(/</g, "\\u003c");
    jsonLdTag = `<script type="application/ld+json">${serialized}</script>`;
  } else if (meta.jsonLd && meta.jsonLd.kind === "CollectionPage") {
    // Subcategory landing page — emit CollectionPage with an inline
    // ItemList of thread headlines + URLs so Google understands this is
    // a hub of related discussions in the topical cluster.
    const sub = meta.jsonLd.subInfo;
    const threads = Array.isArray(meta.jsonLd.threads) ? meta.jsonLd.threads : [];
    const ld = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${sub.name} · ${sub.catName} · Trailhead Forum`,
      url: canonicalUrl,
      isPartOf: { "@type": "WebSite", name: "Trailhead", url: `${origin}/` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: threads.length,
        itemListElement: threads.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${origin}/forum/${meta.article.subInfo.slug || ""}/${t.slug || ""}`.replace(/\/$/, ""),
          name: t.title || "Thread",
        })),
      },
    };
    const serialized = JSON.stringify(ld).replace(/</g, "\\u003c");
    jsonLdTag = `<script type="application/ld+json">${serialized}</script>`;
  } else if (meta.jsonLd && meta.jsonLd.kind === "TripReport") {
    // Article schema for trip reports + plans. Carries author (Person),
    // image, geo coords from start_lat/lng, and topical keywords from
    // terrains + tags. Plans add planned dates; reports add distance/elev.
    const j = meta.jsonLd;
    const authorNode = j.author ? Object.fromEntries(Object.entries({
      "@type": "Person",
      name: j.author.name || undefined,
      alternateName: j.author.handle ? `@${j.author.handle}` : undefined,
      identifier: j.author.handle || undefined,
      image: j.author.avatarUrl || undefined,
    }).filter(([, v]) => v !== undefined)) : undefined;
    const keywords = [...(j.terrains || []), ...(j.tags || []), j.region, j.stateCode].filter(Boolean).join(", ") || undefined;
    const ld = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: j.title,
      description: j.description || undefined,
      image: j.image || undefined,
      datePublished: j.createdAt || undefined,
      dateModified: j.modifiedAt || j.createdAt || undefined,
      url: canonicalUrl,
      mainEntityOfPage: canonicalUrl,
      keywords,
      author: authorNode,
      publisher: {
        "@type": "Organization",
        name: "Trailhead",
        url: `${origin}/`,
        logo: { "@type": "ImageObject", url: `${origin}/lone-peak-flag.png` },
      },
      contentLocation: (j.startLat != null && j.startLng != null)
        ? { "@type": "Place", geo: { "@type": "GeoCoordinates", latitude: j.startLat, longitude: j.startLng } }
        : undefined,
      about: j.region || j.stateCode
        ? Object.fromEntries(Object.entries({
            "@type": "Place",
            name: [j.region, j.stateCode].filter(Boolean).join(", "),
          }).filter(([, v]) => v !== undefined))
        : undefined,
    };
    const clean = Object.fromEntries(Object.entries(ld).filter(([, v]) => v !== undefined));
    jsonLdTag = `<script type="application/ld+json">${JSON.stringify(clean).replace(/</g, "\\u003c")}</script>`;
  } else if (meta.jsonLd && meta.jsonLd.kind === "CampingSpot") {
    // TouristAttraction for camping spots — geo coords + amenityFeature
    // (spot_type / fee) tell Google this is a physical place users can
    // visit; eligible for Google Maps result enrichment.
    const j = meta.jsonLd;
    const amenityFeatures = [];
    if (j.spotType && j.spotType !== "unknown") amenityFeatures.push({ "@type": "LocationFeatureSpecification", name: "Spot type", value: j.spotType });
    if (j.fee) amenityFeatures.push({ "@type": "LocationFeatureSpecification", name: "Fee", value: j.fee });
    const ld = {
      "@context": "https://schema.org",
      "@type": "TouristAttraction",
      name: j.name,
      description: j.description || undefined,
      image: j.image || undefined,
      url: canonicalUrl,
      geo: (j.lat != null && j.lng != null)
        ? { "@type": "GeoCoordinates", latitude: j.lat, longitude: j.lng }
        : undefined,
      amenityFeature: amenityFeatures.length > 0 ? amenityFeatures : undefined,
      dateCreated: j.createdAt || undefined,
      dateModified: j.modifiedAt || undefined,
    };
    const clean = Object.fromEntries(Object.entries(ld).filter(([, v]) => v !== undefined));
    jsonLdTag = `<script type="application/ld+json">${JSON.stringify(clean).replace(/</g, "\\u003c")}</script>`;
  } else if (meta.jsonLd && meta.jsonLd.kind === "Build") {
    // Article schema for vehicle builds (Vehicle schema requires VIN
    // which we don't collect). `about` carries the make/model/year as
    // a Vehicle sub-entity so Google still ties it to that topical entity.
    const j = meta.jsonLd;
    const authorNode = j.author ? Object.fromEntries(Object.entries({
      "@type": "Person",
      name: j.author.name || undefined,
      alternateName: j.author.handle ? `@${j.author.handle}` : undefined,
      identifier: j.author.handle || undefined,
      image: j.author.avatarUrl || undefined,
    }).filter(([, v]) => v !== undefined)) : undefined;
    const vehicleEntity = (j.year || j.make || j.model) ? Object.fromEntries(Object.entries({
      "@type": "Vehicle",
      name: [j.year, j.make, j.model, j.trim].filter(Boolean).join(" "),
      vehicleModelDate: j.year ? String(j.year) : undefined,
      manufacturer: j.make ? { "@type": "Organization", name: j.make } : undefined,
      model: j.model || undefined,
    }).filter(([, v]) => v !== undefined)) : undefined;
    const ld = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: j.name || [j.year, j.make, j.model].filter(Boolean).join(" "),
      image: j.image || undefined,
      datePublished: j.createdAt || undefined,
      dateModified: j.modifiedAt || j.createdAt || undefined,
      url: canonicalUrl,
      mainEntityOfPage: canonicalUrl,
      author: authorNode,
      about: vehicleEntity,
      publisher: {
        "@type": "Organization",
        name: "Trailhead",
        url: `${origin}/`,
        logo: { "@type": "ImageObject", url: `${origin}/lone-peak-flag.png` },
      },
    };
    const clean = Object.fromEntries(Object.entries(ld).filter(([, v]) => v !== undefined));
    jsonLdTag = `<script type="application/ld+json">${JSON.stringify(clean).replace(/</g, "\\u003c")}</script>`;
  } else if (meta.jsonLd && meta.jsonLd.kind === "GearDrop") {
    // Schema.org Event for sponsored gear drops. eventStatus tracks the
    // lifecycle so Google knows whether the event is upcoming, live, or
    // has finished. sponsor carries the brand partner; organizer is LPO.
    // offers covers the free entry signal Google needs to surface the
    // event in rich results.
    const j = meta.jsonLd;
    const eventStatus =
      j.status === "ended" || j.status === "archived" ? "https://schema.org/EventCompleted" :
      j.status === "live" ? "https://schema.org/EventScheduled" :
      "https://schema.org/EventScheduled";
    const locationNode = (j.startLat != null && j.startLng != null)
      ? {
          "@type": "Place",
          name: j.title || "Gear Drop Start Point",
          geo: { "@type": "GeoCoordinates", latitude: j.startLat, longitude: j.startLng },
        }
      : undefined;
    const sponsorNode = j.brand
      ? Object.fromEntries(Object.entries({
          "@type": "Organization",
          name: j.brand,
          logo: j.brandLogoUrl || undefined,
        }).filter(([, v]) => v !== undefined))
      : undefined;
    const offersNode = {
      "@type": "Offer",
      url: canonicalUrl,
      price: "0",
      priceCurrency: "USD",
      availability: j.status === "live" || j.status === "scheduled" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      validFrom: j.createdAt || undefined,
    };
    const ld = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: j.title,
      description: j.description || undefined,
      image: j.image || undefined,
      url: canonicalUrl,
      startDate: j.startsAt || undefined,
      endDate: j.endsAt || undefined,
      eventStatus,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: locationNode,
      organizer: {
        "@type": "Organization",
        name: "Lone Peak Overland",
        url: "https://www.lonepeakoverland.com/",
        logo: { "@type": "ImageObject", url: `${origin}/lone-peak-flag.png` },
      },
      sponsor: sponsorNode,
      offers: Object.fromEntries(Object.entries(offersNode).filter(([, v]) => v !== undefined)),
      dateCreated: j.createdAt || undefined,
      dateModified: j.modifiedAt || undefined,
    };
    const clean = Object.fromEntries(Object.entries(ld).filter(([, v]) => v !== undefined));
    jsonLdTag = `<script type="application/ld+json">${JSON.stringify(clean).replace(/</g, "\\u003c")}</script>`;
  } else if (meta.jsonLd && meta.jsonLd.kind === "HQ") {
    // LocalBusiness for HQ — gives Google the address, geo, contact for
    // potential Google Business Profile enrichment.
    const ld = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: LPO_HQ.name,
      description: `The home base of the Lone Peak Overland community in ${LPO_HQ.address}.`,
      address: { "@type": "PostalAddress", addressLocality: "Wenatchee", addressRegion: "WA", addressCountry: "US" },
      geo: { "@type": "GeoCoordinates", latitude: LPO_HQ.lat, longitude: LPO_HQ.lng },
      url: canonicalUrl,
      image: meta.image || undefined,
      parentOrganization: { "@type": "Organization", name: "Lone Peak Overland", url: "https://www.lonepeakoverland.com/" },
    };
    const clean = Object.fromEntries(Object.entries(ld).filter(([, v]) => v !== undefined));
    jsonLdTag = `<script type="application/ld+json">${JSON.stringify(clean).replace(/</g, "\\u003c")}</script>`;
  } else if (meta.jsonLd && meta.jsonLd.kind === "PersonProfile") {
    // ProfilePage wrapping a Person entity. Google + LinkedIn + others
    // pull author E-E-A-T signals from this schema — name, handle (as
    // alternateName + identifier), avatar, and a count of contributions.
    const j = meta.jsonLd;
    const contentCounts = j.contentCounts || {};
    const totalItems = (contentCounts.builds || 0) + (contentCounts.trips || 0) + (contentCounts.threads || 0) + (contentCounts.spots || 0);
    const personNode = Object.fromEntries(Object.entries({
      "@type": "Person",
      name: j.displayName || undefined,
      alternateName: j.handle ? `@${j.handle}` : undefined,
      identifier: j.handle || undefined,
      description: j.bio || undefined,
      image: j.avatarUrl || undefined,
      url: canonicalUrl,
    }).filter(([, v]) => v !== undefined));
    const ld = {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      url: canonicalUrl,
      dateCreated: j.createdAt || undefined,
      isPartOf: { "@type": "WebSite", name: "Trailhead", url: `${origin}/` },
      mainEntity: personNode,
      interactionStatistic: totalItems > 0 ? [{
        "@type": "InteractionCounter",
        interactionType: { "@type": "WriteAction" },
        userInteractionCount: totalItems,
      }] : undefined,
    };
    const clean = Object.fromEntries(Object.entries(ld).filter(([, v]) => v !== undefined));
    jsonLdTag = `<script type="application/ld+json">${JSON.stringify(clean).replace(/</g, "\\u003c")}</script>`;
  }

  let html = SPA_HTML;
  // Replace the existing <title> with our entity-specific one so browser
  // tabs / search results show a meaningful name even before the SPA mounts.
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);
  // Inject canonical link + BreadcrumbList + entity JSON-LD just before </head>.
  const headInjections = [canonicalTag, tags, breadcrumbLdTag, jsonLdTag].filter(Boolean).join("\n");
  html = html.replace("</head>", `${headInjections}\n</head>`);
  // SSR article: inject the article HTML into the SPA root div so crawlers
  // see real content in the initial HTML response (not "Loading Trailhead").
  // React's createRoot.render() replaces the root's children on mount, so
  // human visitors see the article paint immediately then transition to
  // the SPA's version. Currently forum threads + subcategory landing
  // pages — extend to other entities when they ship server-rendered
  // article versions.
  let ssrHtml = "";
  if (type === "forum-thread" && meta.article) {
    ssrHtml = buildForumThreadSSR(meta.article, canonicalUrl, origin);
  } else if (type === "forum-sub" && meta.article) {
    const subInfoWithSlug = { ...meta.article.subInfo, slug: sub };
    ssrHtml = buildForumSubSSR({ ...meta.article, subInfo: subInfoWithSlug }, origin);
  } else if (type === "gear-drop" && meta.jsonLd && meta.jsonLd.kind === "GearDrop") {
    ssrHtml = buildGearDropSSR(meta.jsonLd, canonicalUrl, origin);
  } else if ((type === "trip" || type === "plan") && meta.jsonLd && meta.jsonLd.kind === "TripReport") {
    ssrHtml = buildTripArticleSSR({ ...meta.jsonLd, imageAlt: meta.imageAlt }, canonicalUrl, origin);
  } else if (type === "spot" && meta.jsonLd && meta.jsonLd.kind === "CampingSpot") {
    ssrHtml = buildCampingSpotSSR(meta.jsonLd, canonicalUrl, origin);
  } else if (type === "build" && meta.jsonLd && meta.jsonLd.kind === "Build") {
    ssrHtml = buildBuildSSR(meta.jsonLd, canonicalUrl, origin);
  } else if (type === "hq") {
    ssrHtml = buildHQSSR(canonicalUrl, origin, meta.image);
  } else if ((type === "post" || type === "route") && meta.article) {
    ssrHtml = buildPostSSR(meta.article, canonicalUrl, origin);
  } else if (type === "user" && meta.profileSSR) {
    ssrHtml = buildProfileSSR(meta.profileSSR, canonicalUrl, origin);
  }
  if (ssrHtml) {
    html = html.replace(/(<div id="root"[^>]*>)([\s\S]*?)(<\/div>)/i, `$1${ssrHtml}$3`);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Short edge cache so updated entities propagate within minutes.
  // Twitter/Facebook cache aggressively on their side regardless.
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  res.status(200).send(html);
};
