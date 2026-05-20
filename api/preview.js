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
  const dateStr = article.createdAt
    ? new Date(article.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";
  // Assemble sections HTML. Each subheading becomes <h2>; bodies are
  // inserted after sanitization. Falls back to the legacy body blob if no
  // structured sections exist.
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
  // Crumbs link the category + subcategory slugs back to canonical-style
  // URLs (the category/subcategory pages aren't routed yet, but anchors
  // give Google the topical context).
  const catSlug = article.categorySlug ? escapeHtml(article.categorySlug) : "";
  const subSlug = article.subcategorySlug ? escapeHtml(article.subcategorySlug) : "";
  const crumbs = [
    `<a href="${origin}/" style="color:#C49A6C;text-decoration:none;">Trailhead</a>`,
    `<a href="${origin}/" style="color:#C49A6C;text-decoration:none;">Forum</a>`,
    subSlug ? `<a href="${origin}/forum/${subSlug}" style="color:#C49A6C;text-decoration:none;">${subSlug.replace(/-/g, " ")}</a>` : "",
  ].filter(Boolean).join(' <span style="color:#8B7D6B;">/</span> ');
  // Avatar block: real image if available, else copper initial circle.
  const initial = (author.name || "A").charAt(0).toUpperCase();
  const avatarBlock = authorAvatar
    ? `<img src="${authorAvatar}" alt="${authorName}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0;" />`
    : `<div style="width:48px;height:48px;border-radius:50%;background:#C49A6C;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="font-family:'Trebuchet MS',sans-serif;font-size:18px;font-weight:700;color:#fff;">${escapeHtml(initial)}</span></div>`;
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
          <span style="font-size:12px;color:#8B7D6B;">${authorHandle ? `<span style="color:#C49A6C;">@${authorHandle}</span> · ` : ""}${escapeHtml(dateStr)}</span>
        </div>
      </div>
      ${sectionsHtml}
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
      `slug=eq.${encodeURIComponent(id)}&select=name,slug,description,hero_img,start_lat,start_lng,kind,distance_mi,route_geom,route_data&limit=1`
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
    // For photo heroes, lift the matching photo's alt. For map-image
    // heroes (route polylines / pin maps) describe the route itself.
    let imageAlt = "";
    if (image && image === row.hero_img) {
      const photos = row.route_data && Array.isArray(row.route_data.photos) ? row.route_data.photos : [];
      imageAlt = findPhotoAlt(photos, row.hero_img);
    }
    if (!imageAlt) {
      imageAlt = `${row.name} ${isReport ? "trip report" : "trip plan"} route map on Trailhead`;
    }
    return {
      title: `${row.name}${isReport ? " · Trip Report" : " · Trip Plan"}`,
      description:
        row.description ||
        `${isReport ? "Overlanding trip report" : "Planned overlanding trip"}${stat} on Trailhead.`,
      image,
      imageAlt,
    };
  }
  if (type === "spot") {
    const row = await supabaseFetch(
      "camping_spots",
      `id=eq.${encodeURIComponent(id)}&visibility=eq.public&select=name,description,lat,lng,spot_type,photos&limit=1`
    );
    if (!row) return null;
    // Spot OG image is currently always a Mapbox static map (no photo
    // hero). Describe the location for accessibility.
    const firstPhotoAlt = row.photos && row.photos[0] && typeof row.photos[0].alt === "string" ? row.photos[0].alt : "";
    return {
      title: `${row.name} · Camping Spot`,
      description:
        row.description ||
        `Camping spot on Trailhead${row.spot_type && row.spot_type !== "unknown" ? ` · ${row.spot_type}` : ""}.`,
      image: row.lng != null && row.lat != null ? staticMap(row.lng, row.lat, "5B8C5A", "circle") : null,
      imageAlt: firstPhotoAlt || `${row.name} camping spot location map`,
    };
  }
  if (type === "build") {
    const row = await supabaseFetch(
      "builds",
      `id=eq.${encodeURIComponent(id)}&select=name,year,make,model,hero_img,build_data&limit=1`
    );
    if (!row) return null;
    const sub = [row.year, row.make, row.model].filter(Boolean).join(" ");
    const image = row.hero_img || null;
    const mainPhotos = row.build_data && Array.isArray(row.build_data.mainPhotos) ? row.build_data.mainPhotos : [];
    const heroAlt = findPhotoAlt(mainPhotos, image);
    return {
      title: `${row.name || sub || "Build"} · Trailhead`,
      description: sub ? `${sub} · Overlanding build on Trailhead.` : "Overlanding build on Trailhead.",
      image,
      imageAlt: heroAlt || `${row.name || sub} overlanding build photo`,
    };
  }
  if (type === "hq") {
    return {
      title: LPO_HQ.name,
      description: `${LPO_HQ.address} · The home base of the Lone Peak Overland community.`,
      image: staticMap(LPO_HQ.lng, LPO_HQ.lat, "BD472A", "star"),
      imageAlt: `${LPO_HQ.name} location map in ${LPO_HQ.address}`,
    };
  }
  // Generic feed posts (and route posts which share the /post/:id URL).
  // Falls through hero_img → first non-video photo → embedded route
  // polyline if it's a ROUTES post → null.
  if (type === "post" || type === "route") {
    const row = await supabaseFetch(
      "posts",
      `id=eq.${encodeURIComponent(id)}&select=type,title,body,hero_img,photo_urls,data&limit=1`
    );
    if (!row) return null;
    // Build the image fallback chain.
    let image = row.hero_img || null;
    if (!image && Array.isArray(row.photo_urls) && row.photo_urls.length > 0) {
      // First photo URL — already filtered in feedItemToDbRow to skip videos.
      image = row.photo_urls[0];
    }
    // Lift alt text from the matching photo in data.photoUrls (newer
    // posts) or fall back to the post title.
    let imageAlt = "";
    if (image && row.data && Array.isArray(row.data.photoUrls)) {
      imageAlt = findPhotoAlt(row.data.photoUrls, image);
    }
    // ROUTES posts carry pin coords in data.pins or data.points. If we
    // don't have a hero photo, try to render the route polyline so the
    // share preview is still informative for route shares.
    if (!image && row.data) {
      const pts = Array.isArray(row.data.points) ? row.data.points
                : Array.isArray(row.data.pins) ? row.data.pins.map(p => [p.lng, p.lat]).filter(([a, b]) => typeof a === "number" && typeof b === "number")
                : null;
      if (pts && pts.length >= 2) {
        // Local data.points may store as [lat, lng] historically — normalize
        // by sniffing: if the first value's "lng" magnitude is plausible
        // for latitude we swap. Lats are -90..90; lngs are -180..180. If
        // either coord exceeds 90 it's definitely lng.
        const sniffed = pts.map(p => {
          const a = Array.isArray(p) ? p[0] : p.lng;
          const b = Array.isArray(p) ? p[1] : p.lat;
          // If a (the "lng" slot) is in -90..90 AND b is out of that range,
          // they're probably swapped. Otherwise trust [lng, lat].
          return Math.abs(a) <= 90 && Math.abs(b) > 90 ? [b, a] : [a, b];
        });
        image = staticMapWithPath(sniffed, "BD472A", "BD472A");
      }
    }
    const isRoute = row.type === "ROUTES";
    const cleanTitle = (row.title || (isRoute ? "Route" : "Trailhead Post")).slice(0, 80);
    const desc = (row.body || (isRoute ? "Overlanding route shared on Trailhead." : "Posted to Trailhead.")).slice(0, 200);
    return {
      title: `${cleanTitle}${isRoute ? " · Route" : ""}`,
      description: desc,
      image,
      imageAlt: imageAlt || `${cleanTitle}${isRoute ? " route" : ""} on Trailhead`,
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
    // Pull full author profile for E-E-A-T: name + handle + avatar all
    // feed into the byline + JSON-LD Person schema.
    let author = null;
    if (row.user_id) {
      const prof = await supabaseFetch(
        "profiles",
        `id=eq.${encodeURIComponent(row.user_id)}&select=full_name,handle,avatar_url,bio&limit=1`
      );
      if (prof) {
        author = {
          name: prof.full_name || prof.handle || "Author",
          handle: prof.handle || "",
          avatarUrl: prof.avatar_url || null,
          bio: prof.bio || null,
        };
      }
    }
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
      },
      // SSR article payload — caller injects into the root div so crawlers
      // + initial-load humans see the actual content instead of "Loading…".
      article: {
        title: row.title,
        sections: Array.isArray(row.sections) ? row.sections : [],
        bodyFallback: row.body || "",
        createdAt: row.created_at,
        author,
        categorySlug: row.category_slug,
        subcategorySlug: row.subcategory_slug,
      },
    };
  }
  // Legacy /forum/:id (timestamp ids from the in-memory era) — no DB row
  // exists. Return the brand default to keep cards from breaking.
  if (type === "forum") {
    return {
      title: "Forum Thread · Trailhead",
      description: "Join the conversation on the Trailhead community forum.",
      image: null,
      imageAlt: "",
    };
  }
  return null;
}

const DEFAULT_META = {
  title: "Trailhead · The overlanding community app by Lone Peak Overland",
  description:
    "Discover camping spots, plan trips, share builds, and connect with the overlanding community.",
  image: null,
};

function metaTagsFor({ title, description, image, imageAlt, url }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const i = image ? escapeHtml(image) : "";
  const a = imageAlt ? escapeHtml(imageAlt) : "";
  const u = escapeHtml(url);
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

module.exports = async function handler(req, res) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const type = (req.query && req.query.type) || "";
  const id = (req.query && req.query.id) || "";
  // Forum threads are routed with sub + slug query params (see vercel.json).
  // Resolve by slug; the sub segment is used to reconstruct the canonical URL.
  const sub = (req.query && req.query.sub) || "";
  const slug = (req.query && req.query.slug) || "";
  // Reconstruct the user-facing URL for the canonical og:url tag.
  const prettyPath =
    type === "trip" ? `/trips/${id}` :
    type === "plan" ? `/plans/${id}` :
    type === "spot" ? `/spots/${id}` :
    type === "build" ? `/builds/${id}` :
    type === "post" || type === "route" ? `/post/${id}` :
    type === "forum-thread" ? `/forum/${sub}/${slug}` :
    type === "forum" ? `/forum/${id}` :
    type === "hq" ? `/hq` : "/";
  const canonicalUrl = `${proto}://${host}${prettyPath}`;

  let meta = DEFAULT_META;
  if (type) {
    // For forum threads the lookup key is the slug, not id.
    const lookupId = type === "forum-thread" ? slug : id;
    const data = await resolveEntity(type, lookupId);
    if (data) meta = data;
  }

  const tags = metaTagsFor({
    title: meta.title,
    description: meta.description,
    image: meta.image,
    imageAlt: meta.imageAlt || "",
    url: canonicalUrl,
  });

  // Emit JSON-LD structured data when the resolver returned it. Lets Google
  // index forum threads as DiscussionForumPosting (rich result eligible).
  // The full Person schema for author carries name + handle + url + image,
  // which is what Google's E-E-A-T rater pulls expertise/identity signals
  // from when attributing the article.
  let jsonLdTag = "";
  if (meta.jsonLd && meta.jsonLd.kind === "DiscussionForumPosting") {
    const a = meta.jsonLd.author || null;
    const origin = `${proto}://${host}`;
    const authorNode = a
      ? Object.fromEntries(Object.entries({
          "@type": "Person",
          name: a.name || undefined,
          alternateName: a.handle ? `@${a.handle}` : undefined,
          identifier: a.handle || undefined,
          image: a.avatarUrl || undefined,
          // Author "url" should resolve to a profile page. We don't have a
          // public /users/<handle> route yet, so we omit it and add it back
          // when that ships (see project_seo_blocked_on_domain).
        }).filter(([, v]) => v !== undefined))
      : undefined;
    const ld = {
      "@context": "https://schema.org",
      "@type": "DiscussionForumPosting",
      headline: meta.jsonLd.title,
      articleBody: (meta.jsonLd.body || "").slice(0, 5000),
      datePublished: meta.jsonLd.createdAt || undefined,
      dateModified: meta.jsonLd.modifiedAt || meta.jsonLd.createdAt || undefined,
      url: canonicalUrl,
      mainEntityOfPage: canonicalUrl,
      author: authorNode,
      publisher: {
        "@type": "Organization",
        name: "Trailhead",
        url: `${origin}/`,
        logo: { "@type": "ImageObject", url: `${origin}/lone-peak-flag.png` },
      },
    };
    // Strip undefined values so the JSON serializes cleanly.
    const clean = Object.fromEntries(Object.entries(ld).filter(([, v]) => v !== undefined));
    // Closing-script-tag escape per Google's recommendation for inline JSON-LD.
    const serialized = JSON.stringify(clean).replace(/</g, "\\u003c");
    jsonLdTag = `<script type="application/ld+json">${serialized}</script>`;
  }

  let html = SPA_HTML;
  // Replace the existing <title> with our entity-specific one so browser
  // tabs / search results show a meaningful name even before the SPA mounts.
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);
  html = html.replace("</head>", `${tags}${jsonLdTag ? "\n" + jsonLdTag : ""}\n</head>`);
  // SSR article: inject the article HTML into the SPA root div so crawlers
  // see real content in the initial HTML response (not "Loading Trailhead").
  // React's createRoot.render() replaces the root's children on mount, so
  // human visitors see the article paint immediately then transition to
  // the SPA's version. Currently only forum threads — extend to other
  // entities when they ship server-rendered article versions.
  if (type === "forum-thread" && meta.article) {
    const ssr = buildForumThreadSSR(meta.article, canonicalUrl, `${proto}://${host}`);
    if (ssr) {
      html = html.replace(/(<div id="root"[^>]*>)([\s\S]*?)(<\/div>)/i, `$1${ssr}$3`);
    }
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Short edge cache so updated entities propagate within minutes.
  // Twitter/Facebook cache aggressively on their side regardless.
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  res.status(200).send(html);
};
