-- ============================================================================
-- BOUNTY SUBMISSIONS — nightly orphan media GC
-- ============================================================================
-- Rejected bounty submissions accumulate orphaned storage uploads —
-- proof photos, hero images, photo galleries — that the rejection
-- flow never deletes. Over time this bloats the post-photos bucket
-- and runs up storage cost.
--
-- This migration installs:
--   1. `bounty_submissions.media_cleaned_at` column so the sweeper
--      doesn't re-process the same row night after night.
--   2. pg_cron schedule that nightly POSTs the cleanup-orphan-media
--      Edge Function, which walks the draft jsonb, lifts every
--      storage URL, and calls storage.remove per bucket.
--
-- Why an Edge Function (not pure SQL): Supabase storage.objects can
-- be deleted via SQL on the `storage.objects` table, but the storage
-- API also handles CDN/cache invalidation + counts correctly toward
-- the dashboard's storage metric. Cleaner to delegate.
--
-- The sweeper only targets `status = 'rejected'` rows older than 30
-- days. Withdrawn submissions hard-delete the row (via withdraw_bounty
-- RPC), so there's no draft jsonb left to walk — withdrawal-time
-- cleanup needs a different mechanism (trigger before delete, or
-- inline cleanup inside the RPC). Out of scope for this migration.
--
-- Setup steps (manual, one-time):
--   1. Set the secret: in Supabase SQL Editor run
--      select vault.create_secret('<random-base64-string>', 'cleanup_gc_secret');
--      Use a freshly-generated random value, NOT a placeholder.
--   2. Set the same value as the Edge Function's GC_SECRET env var:
--      `supabase secrets set GC_SECRET=<same-value>`
--   3. Deploy the function:
--      `supabase functions deploy cleanup-orphan-media --no-verify-jwt`
--
-- Idempotent.
-- ============================================================================

-- ── 1. Add tracking column ──
alter table public.bounty_submissions
  add column if not exists media_cleaned_at timestamptz;

-- Partial index — supports the sweeper's primary filter (rejected +
-- no clean yet). Tiny by design since we only ever hold a handful of
-- such rows at once.
create index if not exists bounty_submissions_orphan_gc_idx
  on public.bounty_submissions (updated_at)
  where status = 'rejected' and media_cleaned_at is null;

-- ── 2. Wrapper that posts to the Edge Function ──
-- pg_net's net.http_post is async — it queues the request and returns
-- an id immediately. Errors land in net._http_response (admin can
-- inspect there). We call it through a SECURITY DEFINER wrapper that
-- reads the secret out of vault so the secret isn't hardcoded in the
-- cron entry.
create or replace function public.trigger_cleanup_orphan_media()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
  v_project_ref text := 'babbgaziiyjfaqjsaxgd';  -- match supabase-client.js project
  v_url text;
begin
  -- Pull the shared secret from vault. If not configured yet, log a
  -- notice and skip the call rather than failing the cron job.
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
    where name = 'cleanup_gc_secret'
    limit 1;
  if v_secret is null then
    raise notice 'trigger_cleanup_orphan_media: cleanup_gc_secret not configured in vault — skipping';
    return;
  end if;

  v_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/cleanup-orphan-media';

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-trailhead-gc-secret', v_secret
    ),
    body := '{}'::jsonb
  );
end;
$$;

revoke all on function public.trigger_cleanup_orphan_media() from public;

-- ── 3. pg_cron schedule — 4am UTC daily ──
create extension if not exists pg_cron;

do $$
declare j record;
begin
  for j in select jobid from cron.job where jobname = 'cleanup_orphan_bounty_media' loop
    perform cron.unschedule(j.jobid);
  end loop;
end $$;

select cron.schedule(
  'cleanup_orphan_bounty_media',
  '0 4 * * *',  -- 4am UTC daily — low-traffic window
  $cron$ select public.trigger_cleanup_orphan_media(); $cron$
);

notify pgrst, 'reload schema';
