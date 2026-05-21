// Vercel serverless function — generates sitemap.xml on demand from the
// live Supabase data. Tells Google about every publicly-crawlable URL on
// Trailhead so the crawler can discover threads/trips/spots/builds without
// relying on internal links alone. Forum threads are the highest-value
// indexable surface so they ship in the first batch; categories +
// subcategories are derived from the hardcoded forumData (mirrored
// inline here — kept in sync with trailhead-v1.jsx's forumData.categories).
//
// Routed via vercel.json: /sitemap.xml → /api/sitemap.xml.js
//
// Sitemap protocol: https://www.sitemaps.org/protocol.html
//   - Max 50,000 URLs per sitemap file
//   - <lastmod> in W3C datetime format
//   - Optional <changefreq> + <priority>
//
// We currently fit comfortably under the 50K cap; when forum_threads grows
// past that we'll need to split into a sitemap index referencing multiple
// child sitemaps. Until then a single file is fine.

const SUPABASE_URL = "https://babbgaziiyjfaqjsaxgd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_rGrh2oIi8fuBv_9w9ZSneg_H6HdBmk-";

// Forum subcategories are now DB-backed (Phase 2). They're fetched per
// request from `public.forum_subcategories` instead of mirrored as a
// constant. Slugs are stored, so we don't need to slugify on the fly here.

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
    if (!res.ok) return [];
    const rows = await res.json();
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    return [];
  }
}

function escapeXml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc, lastmod, changefreq, priority) {
  const parts = [
    `  <url>`,
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : "",
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : "",
    priority ? `    <priority>${priority}</priority>` : "",
    `  </url>`,
  ].filter(Boolean);
  return parts.join("\n");
}

module.exports = async function handler(req, res) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "trailhead.lonepeakoverland.com";
  const origin = `${proto}://${host}`;
  const now = new Date().toISOString();

  // Fan out all the fetches in parallel — no single one blocks the others.
  const [forumSubcategories, forumThreads, tripReports, builds, campingSpots, profiles, posts] = await Promise.all([
    supabaseFetch("forum_subcategories", "select=slug,updated_at,created_at&order=sort_order.asc&limit=2000"),
    supabaseFetch("forum_threads", "select=slug,subcategory_slug,updated_at,created_at&order=updated_at.desc&limit=10000"),
    supabaseFetch("trip_reports", "status=eq.published&select=slug,updated_at,created_at,kind,visibility&order=updated_at.desc&limit=10000"),
    supabaseFetch("builds", "select=id,updated_at,created_at&order=updated_at.desc&limit=10000"),
    supabaseFetch("camping_spots", "visibility=eq.public&select=id,updated_at,created_at&order=updated_at.desc&limit=10000"),
    // Public profiles with a handle set. Each becomes a /users/<handle>
    // E-E-A-T hub page linking to all the user's content. Filter
    // is_public=true so private accounts stay out of search results.
    supabaseFetch("profiles", "is_public=eq.true&handle=not.is.null&select=handle,updated_at,created_at&order=updated_at.desc&limit=10000"),
    // Feed posts (POST / PHOTOS / ROUTES / BUILDS / CONVOYS) — every one
    // gets a /post/:id URL that api/preview.js SSRs with OG + JSON-LD.
    // Posts are public by design (no visibility column). Cap matches the
    // others; if Trailhead ever blows past 50K total URLs we'll need to
    // split into a sitemap index.
    supabaseFetch("posts", "select=id,updated_at,created_at&order=updated_at.desc&limit=10000"),
  ]);

  const urls = [];

  // Static pages — priority 1.0 for home, 0.8 for HQ.
  urls.push(urlEntry(`${origin}/`, now, "daily", "1.0"));
  urls.push(urlEntry(`${origin}/hq`, now, "monthly", "0.6"));

  // Forum subcategory landing pages — each is its own topical hub.
  forumSubcategories.forEach(sub => {
    if (!sub || !sub.slug) return;
    const lastmod = sub.updated_at || sub.created_at || now;
    urls.push(urlEntry(`${origin}/forum/${sub.slug}`, lastmod, "daily", "0.7"));
  });

  // Forum threads — the primary indexable surface. Canonical form is the
  // 2-segment URL `/forum/<sub-slug>/<thread-slug>`.
  forumThreads.forEach(row => {
    if (!row || !row.slug || !row.subcategory_slug) return;
    const lastmod = row.updated_at || row.created_at || now;
    urls.push(urlEntry(`${origin}/forum/${row.subcategory_slug}/${row.slug}`, lastmod, "weekly", "0.8"));
  });

  // Trip reports + plans — published only. Plans must also be public.
  tripReports.forEach(row => {
    if (!row || !row.slug) return;
    const isPlan = row.kind === "plan";
    if (isPlan && row.visibility !== "public") return; // private plans skipped
    const lastmod = row.updated_at || row.created_at || now;
    const path = isPlan ? `/plans/${row.slug}` : `/trips/${row.slug}`;
    urls.push(urlEntry(`${origin}${path}`, lastmod, "weekly", "0.7"));
  });

  // Vehicle builds — public.
  builds.forEach(row => {
    if (!row || !row.id) return;
    const lastmod = row.updated_at || row.created_at || now;
    urls.push(urlEntry(`${origin}/builds/${row.id}`, lastmod, "monthly", "0.6"));
  });

  // Camping spots — public visibility only.
  campingSpots.forEach(row => {
    if (!row || !row.id) return;
    const lastmod = row.updated_at || row.created_at || now;
    urls.push(urlEntry(`${origin}/spots/${row.id}`, lastmod, "monthly", "0.6"));
  });

  // User profile hubs — Person/ProfilePage for E-E-A-T anchoring across
  // every piece of content the user has authored. High priority because
  // each profile is a dense internal-link node.
  profiles.forEach(row => {
    if (!row || !row.handle) return;
    const lastmod = row.updated_at || row.created_at || now;
    urls.push(urlEntry(`${origin}/users/${row.handle}`, lastmod, "weekly", "0.7"));
  });

  // Feed posts — short-form social content. Lower priority than the
  // long-form surfaces (threads / trips) because individual posts are
  // ephemeral and topically narrow, but they still deserve indexing for
  // tail-keyword discoverability + internal link graph.
  posts.forEach(row => {
    if (!row || !row.id) return;
    const lastmod = row.updated_at || row.created_at || now;
    urls.push(urlEntry(`${origin}/post/${row.id}`, lastmod, "monthly", "0.5"));
  });

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(xml);
};
