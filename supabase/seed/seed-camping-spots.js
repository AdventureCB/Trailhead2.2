// One-time seed for public.camping_spots.
//
// Pulls from two free public datasets and upserts into Supabase:
//   1. OpenStreetMap — `tourism=camp_site` nodes via the Overpass API.
//      License: ODbL. Attribution: "© OpenStreetMap contributors".
//   2. Recreation.gov RIDB — official US federal campgrounds (NF/NPS/BLM/ACE).
//      License: public domain. Requires a free API key from
//      https://ridb.recreation.gov/  (Account → API Key).
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... RIDB_API_KEY=... \
//     node supabase/seed/seed-camping-spots.js
//
// Re-running is safe — `unique(source, source_id)` makes inserts idempotent
// via UPSERT. Re-runs will refresh names/coords if the source updates.
//
// Default OSM bbox is the contiguous US + a slice of southern Canada, since
// that's where most Trailhead users live. Adjust BBOX if you want broader
// coverage (Overpass requests get heavier as bbox grows).

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RIDB_API_KEY = process.env.RIDB_API_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing env: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!RIDB_API_KEY) {
  console.warn("RIDB_API_KEY not set — Recreation.gov import will be skipped.");
}

// North-American-ish bounding box: south, west, north, east.
// Roughly Mexico border → southern Canada, full US width.
const BBOX = [24.0, -125.0, 50.0, -65.0];

// ─── HTTP helpers ───────────────────────────────────────────────────────────

async function postJson(url, body, headers = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${url} → ${res.status} ${await res.text().catch(() => "")}`);
  return res.json();
}

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${await res.text().catch(() => "")}`);
  return res.json();
}

// Bulk upsert into public.camping_spots via PostgREST. Resolution order
// (source, source_id) ensures re-runs replace by external id.
async function upsertSpots(rows) {
  if (rows.length === 0) return 0;
  const url = `${SUPABASE_URL}/rest/v1/camping_spots?on_conflict=source,source_id`;
  // PostgREST upsert: use Prefer: resolution=merge-duplicates header.
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Prefer": "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`upsert → ${res.status} ${await res.text().catch(() => "")}`);
  return rows.length;
}

// ─── OSM via Overpass ───────────────────────────────────────────────────────

async function fetchOsmCampSites() {
  const [s, w, n, e] = BBOX;
  // Single Overpass query for camp sites (also caravan_site for RV-friendly
  // overlapping data). Long timeout because the response is hefty.
  const ql = `[out:json][timeout:600];(node["tourism"="camp_site"](${s},${w},${n},${e});node["tourism"="caravan_site"](${s},${w},${n},${e}););out body;`;
  // Try Overpass main, then a community mirror if rate-limited / down.
  // Each instance sometimes returns 406/429/504 under load — the mirror is
  // structurally identical, so any one of them succeeding is fine.
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
  ];
  let elements = null;
  let lastErr = null;
  for (const url of endpoints) {
    try {
      console.log(`[osm] querying ${url}…`);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "User-Agent": "Trailhead-camping-seed/1.0 (kyle@lonepeakoverland.com)",
        },
        body: `data=${encodeURIComponent(ql)}`,
      });
      if (!res.ok) { lastErr = new Error(`${url} → ${res.status}`); continue; }
      const j = await res.json();
      elements = j.elements || [];
      console.log(`[osm] got ${elements.length} raw elements from ${url}`);
      break;
    } catch (e) { lastErr = e; }
  }
  if (!elements) throw new Error(`all overpass endpoints failed: ${lastErr && lastErr.message}`);

  const rows = [];
  for (const el of elements) {
    if (el.type !== "node" || el.lat == null || el.lon == null) continue;
    const tags = el.tags || {};
    const name = tags.name || tags.operator || "Unnamed campsite";
    // Heuristic spot_type from OSM tags.
    let spot_type = "unknown";
    if (tags.tourism === "caravan_site") spot_type = "rv";
    else if (tags.access === "private") spot_type = "established";
    else if (tags.dispersed === "yes" || tags.backcountry === "yes") spot_type = "dispersed";
    else if (tags.tents === "yes") spot_type = "tent";
    else if (tags.tourism === "camp_site") spot_type = "established";
    const fee = tags.fee === "yes" ? "paid" : (tags.fee === "no" ? "free" : "unknown");
    const amenities = {};
    if (tags.toilets === "yes") amenities.toilets = true;
    if (tags.shower === "yes") amenities.shower = true;
    if (tags.drinking_water === "yes") amenities.water = true;
    if (tags.electricity === "yes") amenities.power = true;
    if (tags.fireplace === "yes" || tags.fire_pit === "yes") amenities.fire = true;

    rows.push({
      name: name.slice(0, 200),
      lat: el.lat,
      lng: el.lon,
      description: tags.description || tags.note || null,
      spot_type,
      fee,
      source: "osm",
      source_id: String(el.id),
      amenities: Object.keys(amenities).length > 0 ? amenities : null,
      photo_url: null,
    });
  }
  console.log(`[osm] parsed ${rows.length} sites`);
  return rows;
}

// ─── Recreation.gov RIDB API ────────────────────────────────────────────────
// /api/v1/facilities?activity=CAMPING&limit=50&offset=N
// Returns FacilityName, FacilityLatitude, FacilityLongitude, FacilityID, etc.

async function fetchRecGovCampgrounds() {
  if (!RIDB_API_KEY) return [];
  const headers = { "apikey": RIDB_API_KEY };
  const limit = 50;
  let offset = 0;
  const rows = [];
  console.log("[recgov] fetching campgrounds…");
  while (true) {
    const url = `https://ridb.recreation.gov/api/v1/facilities?activity=CAMPING&limit=${limit}&offset=${offset}&full=false`;
    const data = await getJson(url, headers);
    const items = data.RECDATA || [];
    if (items.length === 0) break;
    for (const f of items) {
      const lat = parseFloat(f.FacilityLatitude);
      const lng = parseFloat(f.FacilityLongitude);
      if (!isFinite(lat) || !isFinite(lng) || (lat === 0 && lng === 0)) continue;
      // Match the OSM row shape *exactly* — PostgREST bulk insert (PGRST102)
      // requires every row in a batch to have the same set of keys.
      rows.push({
        name: (f.FacilityName || "Unnamed campground").slice(0, 200),
        lat, lng,
        description: (f.FacilityDescription || "").replace(/<[^>]+>/g, "").slice(0, 600) || null,
        spot_type: "established",
        fee: "unknown",
        source: "recgov",
        source_id: String(f.FacilityID),
        amenities: null,
        photo_url: null,
      });
    }
    offset += items.length;
    if (offset % 500 === 0) console.log(`[recgov] ${offset} fetched…`);
    // Be polite — rate-limit ~5/s.
    await new Promise(r => setTimeout(r, 200));
    if (items.length < limit) break;
  }
  console.log(`[recgov] parsed ${rows.length} sites`);
  return rows;
}

// ─── Bulk upsert in chunks ──────────────────────────────────────────────────

async function upsertInBatches(rows, batchSize = 500) {
  let total = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    await upsertSpots(chunk);
    total += chunk.length;
    if (total % 2000 === 0 || total === rows.length) console.log(`  … upserted ${total}/${rows.length}`);
  }
  return total;
}

// ─── Main ───────────────────────────────────────────────────────────────────

(async () => {
  try {
    const [osm, recgov] = await Promise.all([
      fetchOsmCampSites(),
      fetchRecGovCampgrounds(),
    ]);
    console.log(`[seed] inserting ${osm.length} OSM + ${recgov.length} Recreation.gov rows…`);
    const total = await upsertInBatches([...osm, ...recgov]);
    console.log(`[seed] done. ${total} rows upserted.`);
  } catch (e) {
    console.error("[seed] failed:", e);
    process.exit(1);
  }
})();
