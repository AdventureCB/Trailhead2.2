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
// is the recommended OG image aspect (1.91:1).
const staticMap = (lng, lat, color, marker) =>
  `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/pin-l-${marker}+${color.replace("#", "")}(${lng},${lat})/${lng},${lat},12,0/1200x630@2x?access_token=${MAPBOX_TOKEN}`;

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
      `slug=eq.${encodeURIComponent(id)}&select=name,slug,description,hero_img,start_lat,start_lng,kind,distance_mi&limit=1`
    );
    if (!row) return null;
    if (row.kind && row.kind !== want) return null;
    const isReport = row.kind !== "plan";
    const heroFromMap =
      row.start_lng != null && row.start_lat != null
        ? staticMap(row.start_lng, row.start_lat, isReport ? "8b6faf" : "BD472A", isReport ? "circle" : "marker")
        : null;
    const stat = row.distance_mi != null ? ` · ${Number(row.distance_mi).toFixed(1)} mi` : "";
    return {
      title: `${row.name}${isReport ? " · Trip Report" : " · Trip Plan"}`,
      description:
        row.description ||
        `${isReport ? "Overlanding trip report" : "Planned overlanding trip"}${stat} on Trailhead.`,
      image: row.hero_img || heroFromMap,
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
