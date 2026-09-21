// build-region-tiles.js — extract per-region PMTiles from the Protomaps planet
// build and upload them to R2, then (re)build + upload the region catalog the
// app reads (regions.json). Scales to all of North America — add rows to
// REGIONS and re-run with their ids.
//
// Env: R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY
// Usage: node scripts/build-region-tiles.js <planetDate> <id...|all>
//   node scripts/build-region-tiles.js 20260916 wa or id mt
//   node scripts/build-region-tiles.js 20260916 all
//
// Requires the go-pmtiles CLI at /tmp/pmtiles (downloaded earlier).

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const BUCKET = "trailhub-tiles";
const PUBLIC_BASE = "https://tiles.lonepeakoverland.com";
const MAXZOOM = 14;
const PMTILES_BIN = "/tmp/pmtiles";
const CATALOG_LOCAL = path.join(__dirname, "regions-catalog.json");

// bbox = [west, south, east, north]. group = UI grouping.
const REGIONS = [
  { id: "wa", name: "Washington", group: "Pacific Northwest", bbox: [-124.85, 45.5, -116.9, 49.05] },
  { id: "or", name: "Oregon", group: "Pacific Northwest", bbox: [-124.6, 41.9, -116.4, 46.3] },
  { id: "id", name: "Idaho", group: "Pacific Northwest", bbox: [-117.25, 41.9, -111.0, 49.05] },
  { id: "mt", name: "Montana", group: "Pacific Northwest", bbox: [-116.1, 44.3, -104.0, 49.05] },
  { id: "ca", name: "California", group: "California & Nevada", bbox: [-124.5, 32.5, -114.1, 42.05] },
  { id: "nv", name: "Nevada", group: "California & Nevada", bbox: [-120.05, 35.0, -114.0, 42.05] },
  { id: "az", name: "Arizona", group: "Southwest", bbox: [-114.85, 31.3, -109.0, 37.05] },
  { id: "nm", name: "New Mexico", group: "Southwest", bbox: [-109.1, 31.3, -103.0, 37.05] },
  { id: "ut", name: "Utah", group: "Southwest", bbox: [-114.1, 36.9, -109.0, 42.05] },
  { id: "co", name: "Colorado", group: "Rockies", bbox: [-109.1, 36.9, -102.0, 41.05] },
  { id: "wy", name: "Wyoming", group: "Rockies", bbox: [-111.1, 40.9, -104.0, 45.05] },
  // ── Lower-48 expansion (Sep 2026). Source chunks (extracted from the
  //    planet once, then cut locally): central-us covers everything up to
  //    -84.5; eastern-us covers -92.0 eastward. Each state fits entirely in
  //    the chunk it's listed under (see EXTRACT_CHUNKS).
  { id: "tx", name: "Texas", group: "Texas & Plains", bbox: [-106.7, 25.8, -93.5, 36.6] },
  { id: "ok", name: "Oklahoma", group: "Texas & Plains", bbox: [-103.1, 33.6, -94.4, 37.1] },
  { id: "ks", name: "Kansas", group: "Texas & Plains", bbox: [-102.1, 36.9, -94.5, 40.1] },
  { id: "ne", name: "Nebraska", group: "Texas & Plains", bbox: [-104.1, 39.9, -95.3, 43.1] },
  { id: "sd", name: "South Dakota", group: "Texas & Plains", bbox: [-104.1, 42.4, -96.4, 46.0] },
  { id: "nd", name: "North Dakota", group: "Texas & Plains", bbox: [-104.1, 45.9, -96.5, 49.1] },
  { id: "mn", name: "Minnesota", group: "Midwest", bbox: [-97.3, 43.4, -89.4, 49.4] },
  { id: "ia", name: "Iowa", group: "Midwest", bbox: [-96.7, 40.3, -90.1, 43.6] },
  { id: "mo", name: "Missouri", group: "Midwest", bbox: [-95.8, 35.9, -89.1, 40.7] },
  { id: "wi", name: "Wisconsin", group: "Midwest", bbox: [-92.9, 42.4, -86.7, 47.1] },
  { id: "il", name: "Illinois", group: "Midwest", bbox: [-91.6, 36.9, -87.0, 42.6] },
  { id: "in", name: "Indiana", group: "Midwest", bbox: [-88.1, 37.7, -84.7, 41.8] },
  { id: "mi", name: "Michigan", group: "Midwest", bbox: [-90.5, 41.6, -82.3, 48.3] },
  { id: "oh", name: "Ohio", group: "Midwest", bbox: [-84.9, 38.3, -80.5, 42.0] },
  { id: "ar", name: "Arkansas", group: "South", bbox: [-94.7, 32.9, -89.6, 36.6] },
  { id: "la", name: "Louisiana", group: "South", bbox: [-94.1, 28.8, -88.7, 33.1] },
  { id: "ms", name: "Mississippi", group: "South", bbox: [-91.7, 30.1, -88.0, 35.1] },
  { id: "al", name: "Alabama", group: "South", bbox: [-88.5, 30.1, -84.8, 35.1] },
  { id: "tn", name: "Tennessee", group: "South", bbox: [-90.4, 34.9, -81.6, 36.7] },
  { id: "ky", name: "Kentucky", group: "South", bbox: [-89.6, 36.4, -81.9, 39.2] },
  { id: "ga", name: "Georgia", group: "South", bbox: [-85.7, 30.3, -80.7, 35.1] },
  { id: "fl", name: "Florida", group: "South", bbox: [-87.7, 24.3, -79.9, 31.1] },
  { id: "sc", name: "South Carolina", group: "South", bbox: [-83.4, 32.0, -78.4, 35.3] },
  { id: "nc", name: "North Carolina", group: "South", bbox: [-84.4, 33.7, -75.3, 36.7] },
  { id: "va", name: "Virginia", group: "Mid-Atlantic", bbox: [-83.7, 36.5, -75.1, 39.5] },
  { id: "wv", name: "West Virginia", group: "Mid-Atlantic", bbox: [-82.7, 37.1, -77.7, 40.7] },
  { id: "md", name: "Maryland", group: "Mid-Atlantic", bbox: [-79.5, 37.8, -74.9, 39.8] },
  { id: "de", name: "Delaware", group: "Mid-Atlantic", bbox: [-75.8, 38.4, -74.9, 39.9] },
  { id: "pa", name: "Pennsylvania", group: "Mid-Atlantic", bbox: [-80.6, 39.7, -74.6, 42.3] },
  { id: "nj", name: "New Jersey", group: "Mid-Atlantic", bbox: [-75.6, 38.9, -73.8, 41.4] },
  { id: "ny", name: "New York", group: "Mid-Atlantic", bbox: [-79.8, 40.4, -71.8, 45.1] },
  { id: "vt", name: "Vermont", group: "New England", bbox: [-73.5, 42.7, -71.4, 45.1] },
  { id: "nh", name: "New Hampshire", group: "New England", bbox: [-72.6, 42.6, -70.6, 45.4] },
  { id: "me", name: "Maine", group: "New England", bbox: [-71.1, 42.9, -66.9, 47.5] },
  { id: "ma", name: "Massachusetts", group: "New England", bbox: [-73.6, 41.2, -69.8, 42.9] },
  { id: "ct", name: "Connecticut", group: "New England", bbox: [-73.8, 40.9, -71.7, 42.1] },
  { id: "ri", name: "Rhode Island", group: "New England", bbox: [-71.9, 41.1, -71.1, 42.1] },
  // ── North America expansion (Sep 2026): Alaska, Canada, Mexico. Hawaii
  //    deliberately skipped. Alaska + the three northern territories are cut
  //    straight from the remote planet (each is its own huge, sparse area —
  //    no chunk to share). Aleutians west of -180 are excluded.
  { id: "ak", name: "Alaska", group: "Alaska", bbox: [-179.9, 51.2, -129.9, 71.5] },
  { id: "bc", name: "British Columbia", group: "Canada West", bbox: [-139.1, 48.3, -114.0, 60.0] },
  { id: "ab", name: "Alberta", group: "Canada West", bbox: [-120.0, 48.99, -110.0, 60.0] },
  { id: "sk", name: "Saskatchewan", group: "Canada West", bbox: [-110.0, 48.99, -101.4, 60.0] },
  { id: "mb", name: "Manitoba", group: "Canada West", bbox: [-102.1, 48.99, -88.9, 60.0] },
  { id: "on", name: "Ontario", group: "Canada Central", bbox: [-95.2, 41.6, -74.3, 56.9] },
  { id: "qc", name: "Quebec", group: "Canada Central", bbox: [-79.8, 44.99, -57.1, 62.6] },
  { id: "nb", name: "New Brunswick", group: "Canada Atlantic", bbox: [-69.1, 44.5, -63.7, 48.1] },
  { id: "ns", name: "Nova Scotia", group: "Canada Atlantic", bbox: [-66.4, 43.3, -59.6, 47.1] },
  { id: "pe", name: "Prince Edward Island", group: "Canada Atlantic", bbox: [-64.5, 45.9, -61.9, 47.1] },
  { id: "nl", name: "Newfoundland & Labrador", group: "Canada Atlantic", bbox: [-67.9, 46.6, -52.5, 60.4] },
  { id: "yt", name: "Yukon", group: "Canada North", bbox: [-141.1, 60.0, -123.8, 69.7] },
  { id: "nt", name: "Northwest Territories", group: "Canada North", bbox: [-136.5, 60.0, -102.0, 78.8] },
  { id: "nu", name: "Nunavut", group: "Canada North", bbox: [-120.7, 51.6, -61.0, 83.2] },
  // Mexico as 7 overlanding-sized regions (32 states would be too granular).
  { id: "mx-baja", name: "Baja California (Norte & Sur)", group: "Mexico", bbox: [-118.5, 22.8, -109.4, 32.75] },
  { id: "mx-sonora-chihuahua", name: "Sonora & Chihuahua", group: "Mexico", bbox: [-115.1, 25.5, -103.3, 31.8] },
  { id: "mx-northeast", name: "Northeast (Coahuila, Nuevo León, Tamaulipas)", group: "Mexico", bbox: [-103.97, 22.2, -97.1, 29.9] },
  { id: "mx-pacific", name: "Pacific (Sinaloa → Michoacán)", group: "Mexico", bbox: [-109.5, 17.9, -100.0, 27.1] },
  { id: "mx-central", name: "Central (Bajío, CDMX, Puebla, Veracruz)", group: "Mexico", bbox: [-104.7, 17.1, -93.6, 24.9] },
  { id: "mx-south", name: "South (Guerrero, Oaxaca, Chiapas, Tabasco)", group: "Mexico", bbox: [-102.2, 14.5, -90.4, 18.7] },
  { id: "mx-yucatan", name: "Yucatán Peninsula", group: "Mexico", bbox: [-92.5, 17.8, -86.7, 21.7] },
];

// Intermediate source chunks: extract each ONCE from the remote planet to a
// local file, then cut the states above from it (local cuts take seconds;
// remote per-state cuts were slow + timeout-prone). Chunks overlap on
// -92.0..-84.5 so every state fits entirely inside one of them.
//   central-us: tx ok ks ne sd nd mn ia mo ar la wi il in
//   eastern-us: ms al tn ky ga fl sc nc va wv md de pa nj ny vt nh me ma ct ri mi oh
const EXTRACT_CHUNKS = {
  "central-us": [-107.0, 24.3, -84.5, 49.5],
  "eastern-us": [-92.0, 24.3, -66.9, 47.6],
  //   canada-west: bc ab sk mb        canada-east: on qc nb ns pe nl
  //   mexico: every mx-* region        (ak yt nt nu: cut from the remote planet)
  "canada-west": [-139.1, 48.3, -88.9, 60.0],
  "canada-east": [-95.2, 41.6, -52.5, 62.6],
  "mexico": [-118.5, 14.5, -86.7, 32.75],
};
module.exports = { REGIONS, EXTRACT_CHUNKS };

function client() {
  for (const k of ["R2_ENDPOINT", "R2_ACCESS_KEY", "R2_SECRET_KEY"]) if (!process.env[k]) { console.error("missing env " + k); process.exit(1); }
  return new S3Client({ region: "auto", endpoint: process.env.R2_ENDPOINT, credentials: { accessKeyId: process.env.R2_ACCESS_KEY, secretAccessKey: process.env.R2_SECRET_KEY } });
}
async function upload(c, localPath, key) {
  // Stream + ContentLength (single PUT) — avoids loading the whole file into
  // memory (300MB Buffers OOM-killed the process) and R2 multipart corruption.
  const size = fs.statSync(localPath).size;
  await c.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: fs.createReadStream(localPath), ContentLength: size, ContentType: key.endsWith(".json") ? "application/json" : "application/octet-stream" }));
}
function loadCatalog() { try { return JSON.parse(fs.readFileSync(CATALOG_LOCAL, "utf8")); } catch (_) { return {}; } }
function saveCatalog(cat) { fs.writeFileSync(CATALOG_LOCAL, JSON.stringify(cat, null, 2)); }

(async () => {
  const [, , planetDate, ...ids] = process.argv;
  if (!planetDate) { console.error("Usage: node scripts/build-region-tiles.js <planetDate> <id...|all>"); process.exit(1); }
  // A local file path (starts with /) is used directly as the source — much
  // faster than range-reading the remote planet (and avoids background timeouts).
  const planet = planetDate.startsWith("/") ? planetDate : `https://build.protomaps.com/${planetDate}.pmtiles`;
  const targets = (ids.length === 1 && ids[0] === "all") ? REGIONS : REGIONS.filter((r) => ids.includes(r.id));
  if (targets.length === 0) { console.error("no matching region ids"); process.exit(1); }
  const c = client();
  const catalog = loadCatalog();

  for (const r of targets) {
    const out = `/tmp/region-${r.id}.pmtiles`;
    console.log(`\n=== ${r.name} (${r.id}) ===`);
    console.log("extracting...");
    execFileSync(PMTILES_BIN, ["extract", planet, out, `--bbox=${r.bbox.join(",")}`, `--maxzoom=${MAXZOOM}`], { stdio: "inherit" });
    const sizeMB = Math.round(fs.statSync(out).size / 1e6);
    const key = `regions/${r.id}.pmtiles`;
    console.log(`uploading ${sizeMB}MB → ${key} ...`);
    await upload(c, out, key);
    fs.unlinkSync(out);
    catalog[r.id] = { id: r.id, name: r.name, group: r.group, bbox: r.bbox, url: `${PUBLIC_BASE}/${key}`, sizeMB, maxZoom: MAXZOOM };
    saveCatalog(catalog);
    console.log(`✅ ${r.name} done (${sizeMB}MB)`);
  }

  // Build grouped catalog for the app + upload as regions.json.
  const groups = {};
  for (const id of Object.keys(catalog)) { const r = catalog[id]; (groups[r.group] = groups[r.group] || []).push(r); }
  const appCatalog = { version: 1, updated: new Date().toISOString(), groups: Object.keys(groups).map((g) => ({ name: g, regions: groups[g].sort((a, b) => a.name.localeCompare(b.name)) })) };
  fs.writeFileSync("/tmp/regions.json", JSON.stringify(appCatalog));
  await upload(c, "/tmp/regions.json", "regions.json");
  console.log(`\n✅✅ catalog uploaded: ${PUBLIC_BASE}/regions.json (${Object.keys(catalog).length} regions)`);
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
