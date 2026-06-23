-- ─────────────────────────────────────────────────────────────────────────────
-- Ranks + Bounties — Phase 3: badges
-- ─────────────────────────────────────────────────────────────────────────────
-- Spec: project_ranks_bounties_spec.md
--
-- What this ships:
--   1. badge_unlocks table — one row per (user_id, category, tier_index)
--   2. recompute_badges(p_user_id) — counts signals across trip_reports,
--      forum_threads, builds, profiles.login_streak, points_breakdown buckets;
--      INSERTs any newly-earned tiers; idempotent via composite PK
--   3. award_points() wrapper — appends a PERFORM recompute_badges call so
--      every points award also walks the badge ladder. No signature change.
--   4. get_badge_progress(p_user_id) — returns per-category progress + the
--      highest earned tier so the client can render progress bars + unlocks
--      from a single call
--
-- Category slugs + tier thresholds MUST match BADGE_CATEGORIES in
-- trailhead-v1.jsx. Photo + recovery counts derive from points_breakdown
-- buckets (5pts/photo, 50pts/recovery → divide).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── badge_unlocks table ──
create table if not exists public.badge_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  tier_index int not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, category, tier_index)
);

create index if not exists badge_unlocks_user_idx on public.badge_unlocks (user_id);
create index if not exists badge_unlocks_unlocked_at_idx on public.badge_unlocks (unlocked_at desc);

alter table public.badge_unlocks enable row level security;

-- Public SELECT so badges render on other-user profiles
drop policy if exists badge_unlocks_public_select on public.badge_unlocks;
create policy badge_unlocks_public_select on public.badge_unlocks
  for select using (true);

-- No INSERT/UPDATE/DELETE policies — writes flow through recompute_badges (SECURITY DEFINER)

-- Realtime so the recipient sees the toast immediately on unlock
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'badge_unlocks'
  ) then
    alter publication supabase_realtime add table public.badge_unlocks;
  end if;
end$$;

alter table public.badge_unlocks replica identity full;

-- ── recompute_badges RPC ──
-- Counts a single canonical signal per category, then walks each tier's
-- threshold and INSERTs new unlocks. ON CONFLICT DO NOTHING is the
-- idempotency guard — re-running for the same user is a fast no-op once
-- caught up. Returns newly-inserted rows for the caller's logging.
create or replace function public.recompute_badges(
  p_user_id uuid
) returns table(
  category text,
  tier_index int,
  unlocked_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_trip_count int := 0;
  v_forum_count int := 0;
  v_build_count int := 0;
  v_streak int := 0;
  v_photos int := 0;
  v_recoveries int := 0;
  v_bounties int := 0;  -- placeholder until Phase 6 (bounties) ships
  v_pb jsonb := '{}'::jsonb;
begin
  if p_user_id is null then return; end if;

  -- Trip reports (published, kind=report)
  select count(*) into v_trip_count from public.trip_reports
   where user_id = p_user_id and status = 'published' and (kind is null or kind = 'report');

  -- Forum threads started
  select count(*) into v_forum_count from public.forum_threads where user_id = p_user_id;

  -- Builds added
  select count(*) into v_build_count from public.builds where user_id = p_user_id;

  -- Login streak + breakdown buckets
  select coalesce(login_streak, 0), coalesce(points_breakdown, '{}'::jsonb)
    into v_streak, v_pb
    from public.profiles where id = p_user_id;

  -- Photos uploaded = breakdown bucket / 5 (POINTS.photoUploaded)
  v_photos := coalesce((v_pb ->> 'photos_uploaded')::int, 0) / 5;
  -- Recovery responses = breakdown bucket / 50 (POINTS.recoveryRespond)
  v_recoveries := coalesce((v_pb ->> 'recovery_respond')::int, 0) / 50;

  return query
    insert into public.badge_unlocks (user_id, category, tier_index)
    select p_user_id, c.category, c.tier_index
    from (
      -- Trail Mastery: 1 / 5 / 15 / 50 published trips
      select 'trail_mastery'::text as category, 0 as tier_index where v_trip_count >= 1 union all
      select 'trail_mastery', 1 where v_trip_count >= 5 union all
      select 'trail_mastery', 2 where v_trip_count >= 15 union all
      select 'trail_mastery', 3 where v_trip_count >= 50 union all
      -- Community: 1 / 10 / 50 / 250 forum threads
      select 'community', 0 where v_forum_count >= 1 union all
      select 'community', 1 where v_forum_count >= 10 union all
      select 'community', 2 where v_forum_count >= 50 union all
      select 'community', 3 where v_forum_count >= 250 union all
      -- Builder: 1 / 3 / 5 / 10 builds
      select 'builder', 0 where v_build_count >= 1 union all
      select 'builder', 1 where v_build_count >= 3 union all
      select 'builder', 2 where v_build_count >= 5 union all
      select 'builder', 3 where v_build_count >= 10 union all
      -- Explorer: 7 / 30 / 100 / 365 day login streak
      select 'explorer', 0 where v_streak >= 7 union all
      select 'explorer', 1 where v_streak >= 30 union all
      select 'explorer', 2 where v_streak >= 100 union all
      select 'explorer', 3 where v_streak >= 365 union all
      -- Shutterbug: 5 / 25 / 100 / 500 photos
      select 'shutterbug', 0 where v_photos >= 5 union all
      select 'shutterbug', 1 where v_photos >= 25 union all
      select 'shutterbug', 2 where v_photos >= 100 union all
      select 'shutterbug', 3 where v_photos >= 500 union all
      -- First Responder: 1 / 5 / 25 / 100 recoveries
      select 'first_responder', 0 where v_recoveries >= 1 union all
      select 'first_responder', 1 where v_recoveries >= 5 union all
      select 'first_responder', 2 where v_recoveries >= 25 union all
      select 'first_responder', 3 where v_recoveries >= 100 union all
      -- Bounty Hunter (placeholder; v_bounties=0 until Phase 6)
      select 'bounty_hunter', 0 where v_bounties >= 1 union all
      select 'bounty_hunter', 1 where v_bounties >= 5 union all
      select 'bounty_hunter', 2 where v_bounties >= 25 union all
      select 'bounty_hunter', 3 where v_bounties >= 100
    ) c
    on conflict (user_id, category, tier_index) do nothing
    returning badge_unlocks.category, badge_unlocks.tier_index, badge_unlocks.unlocked_at;
end;
$$;

revoke all on function public.recompute_badges(uuid) from public;
grant execute on function public.recompute_badges(uuid) to authenticated;

-- ── get_badge_progress RPC ──
-- Returns per-category raw counter + the highest currently-earned tier
-- so the client can render progress bars without a second round-trip.
-- Callable for ANY user (badges are public-facing identity).
create or replace function public.get_badge_progress(
  p_user_id uuid
) returns table(
  category text,
  progress int,
  highest_tier_index int
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
declare
  v_trip_count int := 0;
  v_forum_count int := 0;
  v_build_count int := 0;
  v_streak int := 0;
  v_photos int := 0;
  v_recoveries int := 0;
  v_bounties int := 0;
  v_pb jsonb := '{}'::jsonb;
begin
  if p_user_id is null then return; end if;

  select count(*) into v_trip_count from public.trip_reports
   where user_id = p_user_id and status = 'published' and (kind is null or kind = 'report');
  select count(*) into v_forum_count from public.forum_threads where user_id = p_user_id;
  select count(*) into v_build_count from public.builds where user_id = p_user_id;
  select coalesce(login_streak, 0), coalesce(points_breakdown, '{}'::jsonb)
    into v_streak, v_pb
    from public.profiles where id = p_user_id;
  v_photos := coalesce((v_pb ->> 'photos_uploaded')::int, 0) / 5;
  v_recoveries := coalesce((v_pb ->> 'recovery_respond')::int, 0) / 50;

  return query
    with counts as (
      select 'trail_mastery'::text as category, v_trip_count as progress union all
      select 'community', v_forum_count union all
      select 'builder', v_build_count union all
      select 'explorer', v_streak union all
      select 'shutterbug', v_photos union all
      select 'first_responder', v_recoveries union all
      select 'bounty_hunter', v_bounties
    ),
    earned as (
      select bu.category, max(bu.tier_index) as highest_tier_index
        from public.badge_unlocks bu
       where bu.user_id = p_user_id
       group by bu.category
    )
    select c.category, c.progress, coalesce(e.highest_tier_index, -1) as highest_tier_index
      from counts c
      left join earned e on e.category = c.category;
end;
$$;

revoke all on function public.get_badge_progress(uuid) from public;
grant execute on function public.get_badge_progress(uuid) to authenticated, anon;

-- ── Patch award_points to recompute badges as a side effect ──
-- Same return signature as Phase 1; only the body changes. We append a
-- single recompute_badges call at the end so every award_points action
-- walks the badge ladder. The realtime sub on badge_unlocks delivers any
-- new unlocks to the client for the toast.
create or replace function public.award_points(
  p_kind text,
  p_amount int,
  p_ref_id uuid default null,
  p_ref_type text default null
) returns table(
  new_total int,
  prior_total int,
  prior_rank_index int,
  new_rank_index int,
  crossed_threshold boolean
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_prior int;
  v_new int;
  v_kind text := lower(trim(coalesce(p_kind, '')));
  v_breakdown jsonb;
  v_bucket_current int;
  v_prior_rank_index int;
  v_new_rank_index int;
begin
  if v_uid is null then
    raise exception 'award_points: not authenticated';
  end if;

  if p_amount is null or p_amount <= 0 then
    select p.points from public.profiles p where p.id = v_uid into v_prior;
    return query select v_prior, v_prior, 0, 0, false;
    return;
  end if;

  if v_kind = '' then
    raise exception 'award_points: kind required';
  end if;

  insert into public.points_log (user_id, kind, amount, ref_id, ref_type)
  values (v_uid, v_kind, p_amount, p_ref_id, p_ref_type);

  select p.points, coalesce(p.points_breakdown, '{}'::jsonb)
    from public.profiles p
    where p.id = v_uid
    into v_prior, v_breakdown;

  if v_prior is null then
    insert into public.profiles (id, points, points_breakdown)
    values (v_uid, p_amount, jsonb_build_object(v_kind, p_amount))
    on conflict (id) do update
      set points = profiles.points + excluded.points,
          points_breakdown = profiles.points_breakdown
            || jsonb_build_object(v_kind, coalesce((profiles.points_breakdown ->> v_kind)::int, 0) + excluded.points);
    v_prior := 0;
  else
    v_bucket_current := coalesce((v_breakdown ->> v_kind)::int, 0);
    update public.profiles
       set points = points + p_amount,
           points_breakdown = points_breakdown || jsonb_build_object(v_kind, v_bucket_current + p_amount)
     where id = v_uid;
  end if;

  v_new := v_prior + p_amount;

  v_prior_rank_index := case
    when v_prior >= 100000 then 6
    when v_prior >= 50000  then 5
    when v_prior >= 30000  then 4
    when v_prior >= 15000  then 3
    when v_prior >= 5000   then 2
    when v_prior >= 1000   then 1
    else 0
  end;
  v_new_rank_index := case
    when v_new >= 100000 then 6
    when v_new >= 50000  then 5
    when v_new >= 30000  then 4
    when v_new >= 15000  then 3
    when v_new >= 5000   then 2
    when v_new >= 1000   then 1
    else 0
  end;

  -- Walk the badge ladder. Wrapped in EXCEPTION so a badge-side failure
  -- can never block the points award (defensive — recompute_badges is
  -- pure, but better safe).
  begin
    perform public.recompute_badges(v_uid);
  exception when others then
    raise notice 'recompute_badges failed for %: %', v_uid, sqlerrm;
  end;

  return query
    select v_new,
           v_prior,
           v_prior_rank_index,
           v_new_rank_index,
           (v_new_rank_index > v_prior_rank_index);
end;
$$;
