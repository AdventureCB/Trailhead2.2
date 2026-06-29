// Trailhead — Edge Function: cleanup-orphan-media
//
// Nightly GC sweeper. Walks bounty_submissions rows that have been
// 'rejected' for at least 30 days and have not yet had their media
// cleaned (media_cleaned_at IS NULL). For each, recursively extracts
// every storage URL from the draft jsonb and deletes the underlying
// file from the matching bucket. Marks media_cleaned_at on success
// so the row isn't reprocessed.
//
// Why 30 days: rejected submissions can be un-rejected by an admin
// (status → changes_requested) and reused. 30 days is enough
// breathing room for an admin to walk that back if needed.
//
// Why only rejected (not withdrawn): withdraw_bounty hard-deletes
// the row, so there's no draft to walk. Withdrawal-time URL
// cleanup would need a separate flow (callsite GC inside the RPC
// itself, or a server trigger before delete). Not in scope for this
// sweeper.
//
// Deploy: `supabase functions deploy cleanup-orphan-media --no-verify-jwt`.
//   No JWT verification — pg_cron calls this on a schedule without an
//   authenticated user. Defense: a shared-secret header timing-safe-
//   compared to GC_SECRET env var, with the secret stored in vault so
//   the cron job can read it without exposing it in committed SQL.
//
// Environment:
//   SUPABASE_URL              — auto-populated
//   SUPABASE_SERVICE_ROLE_KEY — auto-populated
//   GC_SECRET                 — shared with vault.cleanup_gc_secret

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GC_SECRET = Deno.env.get("GC_SECRET") ?? "";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Storage URL shape we care about. Public-read URLs look like:
//   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
// Render/transform URLs:
//   https://<project>.supabase.co/storage/v1/render/image/public/<bucket>/<path>?...
// Both forms appear in our jsonb (txImg rewrites object→render lazily).
// We normalize both to {bucket, path}.
function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  if (typeof url !== "string") return null;
  const m = url.match(/\/storage\/v1\/(?:object|render\/image)\/public\/([^/]+)\/([^?#]+)/);
  if (!m) return null;
  // Decode percent-escaped paths (filenames with spaces, etc.).
  try { return { bucket: m[1], path: decodeURIComponent(m[2]) }; }
  catch { return { bucket: m[1], path: m[2] }; }
}

// Recursively walk a jsonb value and collect every string field that
// looks like a storage URL. Arrays + objects descend; strings get
// tested. Numbers/booleans/null skipped. Caps depth at 12 as a sanity
// check — our drafts never nest that deep.
function collectStorageUrls(node: unknown, out: Set<string>, depth = 0): void {
  if (depth > 12 || node == null) return;
  if (typeof node === "string") {
    if (parseStorageUrl(node)) out.add(node);
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) collectStorageUrls(item, out, depth + 1);
    return;
  }
  if (typeof node === "object") {
    for (const v of Object.values(node)) collectStorageUrls(v, out, depth + 1);
  }
}

// Timing-safe compare to keep the secret check out of side-channel
// reach. Both buffers must be same length or the comparison short-
// circuits — caller ensures length match.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: { "content-type": "application/json" } });
  }
  // Shared-secret gate.
  const provided = req.headers.get("x-trailhead-gc-secret") ?? "";
  if (!GC_SECRET || !timingSafeEqual(provided, GC_SECRET)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
  }

  // Bounty submissions: rejected at least 30 days ago, never cleaned.
  // Order by id so the per-row debug log is stable across runs.
  const cutoffIso = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const { data: rows, error: fetchErr } = await sb
    .from("bounty_submissions")
    .select("id, draft, updated_at, media_cleaned_at")
    .eq("status", "rejected")
    .is("media_cleaned_at", null)
    .lt("updated_at", cutoffIso)
    .limit(500); // cap per run — next run picks up the tail

  if (fetchErr) {
    console.error("[cleanup-orphan-media] fetch failed", fetchErr);
    return new Response(JSON.stringify({ error: fetchErr.message }), { status: 500, headers: { "content-type": "application/json" } });
  }

  let rowsProcessed = 0;
  let filesDeleted = 0;
  let filesFailed = 0;

  for (const row of rows ?? []) {
    const urls = new Set<string>();
    collectStorageUrls(row.draft, urls);

    // Group by bucket so storage.remove can take a single batch per bucket.
    const byBucket = new Map<string, string[]>();
    for (const u of urls) {
      const parsed = parseStorageUrl(u);
      if (!parsed) continue;
      if (!byBucket.has(parsed.bucket)) byBucket.set(parsed.bucket, []);
      byBucket.get(parsed.bucket)!.push(parsed.path);
    }

    for (const [bucket, paths] of byBucket.entries()) {
      try {
        const { error: delErr } = await sb.storage.from(bucket).remove(paths);
        if (delErr) {
          console.warn("[cleanup-orphan-media] storage.remove failed", bucket, paths.length, delErr.message);
          filesFailed += paths.length;
        } else {
          filesDeleted += paths.length;
        }
      } catch (e) {
        console.warn("[cleanup-orphan-media] storage.remove threw", bucket, e);
        filesFailed += paths.length;
      }
    }

    // Mark cleaned even if some files failed — they're likely already
    // gone or unreachable (e.g. URL with no actual storage row). Don't
    // want to retry forever on the same dead URLs.
    const { error: markErr } = await sb
      .from("bounty_submissions")
      .update({ media_cleaned_at: new Date().toISOString() })
      .eq("id", row.id);
    if (markErr) {
      console.error("[cleanup-orphan-media] mark cleaned failed", row.id, markErr);
    } else {
      rowsProcessed += 1;
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    rows_scanned: rows?.length ?? 0,
    rows_processed: rowsProcessed,
    files_deleted: filesDeleted,
    files_failed: filesFailed,
  }), { status: 200, headers: { "content-type": "application/json" } });
});
