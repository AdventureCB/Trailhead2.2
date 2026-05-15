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

async function resolveEntity(type, id) {
  if (!type) return null;
  if (type === "trip" || type === "plan") {
    const want = type === "plan" ? "plan" : "report";
    const row = await supabaseFetch(
      "trip_reports",
      `slug=eq.${encodeURIComponent(id)}&select=name,slug,description,hero_img,start_lat,start_lng,kind,distance_mi,route_geom&limit=1`
    );
    if (!row) return null;
    if (row.kind && row.kind !== want) return null;
    const isReport = row.kind !== "plan";
    const accent = isReport ? "8b6faf" : "BD472A";
    // Prefer the full-route polyline preview when route_geom is present
    // (almost always — backfilled on every published row). Fall back to
    // a single zoomed-in start pin if not.
    const routeMap = Array.isArray(row.route_geom) && row.route_geom.length >= 2
      ? staticMapWithPath(row.route_geom, accent, accent)
      : null;
    const pinMap = row.start_lng != null && row.start_lat != null
      ? staticMap(row.start_lng, row.start_lat, accent, isReport ? "circle" : "marker", 14)
      : null;
    const stat = row.distance_mi != null ? ` · ${Number(row.distance_mi).toFixed(1)} mi` : "";
    return {
      title: `${row.name}${isReport ? " · Trip Report" : " · Trip Plan"}`,
      description:
        row.description ||
        `${isReport ? "Overlanding trip report" : "Planned overlanding trip"}${stat} on Trailhead.`,
      // Route polyline first — it's what makes Trailhead distinctive
      // and matches the user's intent ("show the entire route"). Hero
      // photo is a fallback for trips where route_geom is missing.
      image: routeMap || row.hero_img || pinMap,
    };
  }
  if (type === "spot") {
    const row = await supabaseFetch(
      "camping_spots",
      `id=eq.${encodeURIComponent(id)}&visibility=eq.public&select=name,description,lat,lng,spot_type&limit=1`
    );
    if (!row) return null;
    return {
      title: `${row.name} · Camping Spot`,
      description:
        row.description ||
        `Camping spot on Trailhead${row.spot_type && row.spot_type !== "unknown" ? ` · ${row.spot_type}` : ""}.`,
      image: row.lng != null && row.lat != null ? staticMap(row.lng, row.lat, "5B8C5A", "circle") : null,
    };
  }
  if (type === "build") {
    const row = await supabaseFetch(
      "builds",
      `id=eq.${encodeURIComponent(id)}&select=name,year,make,model,image&limit=1`
    );
    if (!row) return null;
    const sub = [row.year, row.make, row.model].filter(Boolean).join(" ");
    return {
      title: `${row.name || sub || "Build"} · Trailhead`,
      description: sub ? `${sub} · Overlanding build on Trailhead.` : "Overlanding build on Trailhead.",
      image: row.image || null,
    };
  }
  if (type === "hq") {
    return {
      title: LPO_HQ.name,
      description: `${LPO_HQ.address} · The home base of the Lone Peak Overland community.`,
      image: staticMap(LPO_HQ.lng, LPO_HQ.lat, "BD472A", "star"),
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
    };
  }
  // Forum threads aren't persisted server-side (per the architecture
  // overview — ForumScreen state is local). Without a DB lookup we
  // can't enrich the preview, so return the brand default which still
  // gets a Trailhead-tagged card instead of a bare URL.
  if (type === "forum") {
    return {
      title: "Forum Thread · Trailhead",
      description: "Join the conversation on the Trailhead community forum.",
      image: null,
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

function metaTagsFor({ title, description, image, url }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const i = image ? escapeHtml(image) : "";
  const u = escapeHtml(url);
  return [
    `<meta property="og:type" content="article">`,
    `<meta property="og:site_name" content="Trailhead">`,
    `<meta property="og:title" content="${t}">`,
    `<meta property="og:description" content="${d}">`,
    `<meta property="og:url" content="${u}">`,
    i ? `<meta property="og:image" content="${i}">` : "",
    i ? `<meta property="og:image:width" content="1200">` : "",
    i ? `<meta property="og:image:height" content="630">` : "",
    `<meta name="twitter:card" content="${i ? "summary_large_image" : "summary"}">`,
    `<meta name="twitter:title" content="${t}">`,
    `<meta name="twitter:description" content="${d}">`,
    i ? `<meta name="twitter:image" content="${i}">` : "",
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
  // Reconstruct the user-facing URL for the canonical og:url tag.
  const prettyPath =
    type === "trip" ? `/trips/${id}` :
    type === "plan" ? `/plans/${id}` :
    type === "spot" ? `/spots/${id}` :
    type === "build" ? `/builds/${id}` :
    type === "post" || type === "route" ? `/post/${id}` :
    type === "forum" ? `/forum/${id}` :
    type === "hq" ? `/hq` : "/";
  const canonicalUrl = `${proto}://${host}${prettyPath}`;

  let meta = DEFAULT_META;
  if (type) {
    const data = await resolveEntity(type, id);
    if (data) meta = data;
  }

  const tags = metaTagsFor({
    title: meta.title,
    description: meta.description,
    image: meta.image,
    url: canonicalUrl,
  });

  let html = SPA_HTML;
  // Replace the existing <title> with our entity-specific one so browser
  // tabs / search results show a meaningful name even before the SPA mounts.
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);
  html = html.replace("</head>", `${tags}\n</head>`);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Short edge cache so updated entities propagate within minutes.
  // Twitter/Facebook cache aggressively on their side regardless.
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  res.status(200).send(html);
};
