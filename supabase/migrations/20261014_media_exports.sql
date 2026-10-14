-- ============================================================================
-- MEDIA EXPORTS — mirror public UGC media into Dropbox for the social flywheel
-- ============================================================================
-- Every time public content with media is created or changed, a trigger hands
-- {table, id} to the `media-export` Edge Function (pg_net + the Vault shared
-- secret, same pattern as push). The function resolves the row's media URLs,
-- names each file `<handle>_<context>_<date>_<n>.<ext>`, and asks Dropbox to
-- fetch it (save_url) into /Trailhub Media/<Builds|Feed|Trip Reports|Camp
-- Spots|Gear Drops>/… . Trip reports also get a static map PNG of the route.
--
-- Rights: Terms §1/§2 grant Lone Peak Overland ownership + marketing use of
-- all posted content. Scope: PUBLIC content only — never DMs, private spots,
-- private plans, drafts, moderation-hidden posts, or rejected gear-drop runs.
-- Deletions are NOT mirrored (Kyle's call) — the Dropbox archive is permanent.
--
-- `media_exports` is the ledger: one row per (source, url) so re-firing is
-- idempotent and the admin backfill can be re-run safely.
-- Idempotent.
-- ============================================================================

create table if not exists public.media_exports (
  id            uuid primary key default gen_random_uuid(),
  source_table  text not null,                 -- posts | builds | trip_reports | camping_spots
  source_id     uuid not null,
  user_id       uuid,
  media_key     text not null,                 -- the storage URL, or 'map:<id>' for generated maps
  dropbox_path  text,
  status        text not null default 'sent' check (status in ('sent','done','error')),
  error         text,
  created_at    timestamptz not null default now(),
  unique (source_table, source_id, media_key)
);
create index if not exists media_exports_source_idx on public.media_exports (source_table, source_id);
alter table public.media_exports enable row level security;
drop policy if exists media_exports_admin_select on public.media_exports;
create policy media_exports_admin_select on public.media_exports
  for select using (public.is_admin(auth.uid()));
-- Writes come from the Edge Function via service role only.

-- ── Trigger plumbing ────────────────────────────────────────────────────────
create or replace function public._media_export_request(p_table text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_secret text;
begin
  begin
    select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'send_push_secret' limit 1;
  exception when others then v_secret := null; end;
  if v_secret is null then
    raise notice '[media export] send_push_secret missing — skipped';
    return;
  end if;
  perform net.http_post(
    url     := 'https://babbgaziiyjfaqjsaxgd.supabase.co/functions/v1/media-export',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-trailhead-push-secret', v_secret),
    body    := jsonb_build_object('table', p_table, 'id', p_id)
  );
end;
$$;

create or replace function public.media_export_on_posts() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.hidden_at is null and jsonb_typeof(new.data->'photoUrls') = 'array' and jsonb_array_length(new.data->'photoUrls') > 0 then
    perform public._media_export_request('posts', new.id);
  end if;
  return new;
end; $$;
drop trigger if exists media_export_posts on public.posts;
create trigger media_export_posts after insert or update of data, hidden_at on public.posts
  for each row execute function public.media_export_on_posts();

create or replace function public.media_export_on_builds() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.build_data is not null then perform public._media_export_request('builds', new.id); end if;
  return new;
end; $$;
drop trigger if exists media_export_builds on public.builds;
create trigger media_export_builds after insert or update of build_data on public.builds
  for each row execute function public.media_export_on_builds();

create or replace function public.media_export_on_trips() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  -- Published reports/plans, and gear-drop runs that haven't been rejected.
  if (new.kind = 'gear_drop_run' and coalesce(new.gd_review_status, '') <> 'rejected')
     or (coalesce(new.kind, 'report') in ('report', 'plan') and new.status = 'published' and coalesce(new.visibility, 'public') = 'public') then
    perform public._media_export_request('trip_reports', new.id);
  end if;
  return new;
end; $$;
drop trigger if exists media_export_trips on public.trip_reports;
create trigger media_export_trips after insert or update of route_data, status, visibility, progress, gd_review_status on public.trip_reports
  for each row execute function public.media_export_on_trips();

create or replace function public.media_export_on_spots() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if coalesce(new.visibility, 'public') = 'public' and jsonb_typeof(new.photos) = 'array' and jsonb_array_length(new.photos) > 0 then
    perform public._media_export_request('camping_spots', new.id);
  end if;
  return new;
end; $$;
drop trigger if exists media_export_spots on public.camping_spots;
create trigger media_export_spots after insert or update of photos, visibility on public.camping_spots
  for each row execute function public.media_export_on_spots();

-- ── Admin backfill — export everything public that already exists ───────────
-- Re-runnable: the function skips media already in the ledger. Returns the
-- number of rows handed to the Edge Function. Run per table to pace Dropbox:
--   select public.admin_media_export_backfill('builds');
--   select public.admin_media_export_backfill('posts');
--   select public.admin_media_export_backfill('trip_reports');
--   select public.admin_media_export_backfill('camping_spots');
create or replace function public.admin_media_export_backfill(p_table text default null)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  r record;
  v_n int := 0;
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin only'; end if;
  if p_table is null or p_table = 'builds' then
    for r in select id from public.builds where build_data is not null loop
      perform public._media_export_request('builds', r.id); v_n := v_n + 1;
    end loop;
  end if;
  if p_table is null or p_table = 'posts' then
    for r in select id from public.posts
             where hidden_at is null and jsonb_typeof(data->'photoUrls') = 'array' and jsonb_array_length(data->'photoUrls') > 0 loop
      perform public._media_export_request('posts', r.id); v_n := v_n + 1;
    end loop;
  end if;
  if p_table is null or p_table = 'trip_reports' then
    for r in select id from public.trip_reports
             where (kind = 'gear_drop_run' and coalesce(gd_review_status, '') <> 'rejected')
                or (coalesce(kind, 'report') in ('report', 'plan') and status = 'published' and coalesce(visibility, 'public') = 'public') loop
      perform public._media_export_request('trip_reports', r.id); v_n := v_n + 1;
    end loop;
  end if;
  if p_table is null or p_table = 'camping_spots' then
    for r in select id from public.camping_spots
             where coalesce(visibility, 'public') = 'public' and jsonb_typeof(photos) = 'array' and jsonb_array_length(photos) > 0 loop
      perform public._media_export_request('camping_spots', r.id); v_n := v_n + 1;
    end loop;
  end if;
  return v_n;
end;
$$;
grant execute on function public.admin_media_export_backfill(text) to authenticated;

notify pgrst, 'reload schema';
