-- ─────────────────────────────────────────────────────────────────────────────
-- Badges — wire Bounty Hunter to real approvals + add Demo Specialist
-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 3 shipped Bounty Hunter as a placeholder (`v_bounties := 0`) because
-- the bounty tables weren't live yet. Now they are — this migration counts
-- approved submissions the participant owns and unlocks the tiers.
--
-- Also adds a new category: `demo_specialist`. Tracks users who complete
-- Demo Request bounties specifically. Demo Requests are higher-effort than
-- other bounties (physical customer meeting, scheduling, follow-through)
-- so a dedicated ladder recognizes users who repeatedly deliver them.
--
-- Category slugs must match BADGE_CATEGORIES in trailhead-v1.jsx. Tier
-- thresholds:
--   • bounty_hunter:   1 / 5 / 25 / 100  (unchanged from spec)
--   • demo_specialist: 1 / 3 / 10 / 25   (lower ceilings to match the
--                                        higher-touch nature of the work)
--
-- A demo counts toward BOTH categories — completing a demo IS completing
-- a bounty, so users get progress in both ladders. Fair recognition, no
-- double-award of points (points are already awarded once per approval).
--
-- Idempotent: `create or replace` on both RPCs.
-- ─────────────────────────────────────────────────────────────────────────────

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
  v_bounties int := 0;
  v_demos int := 0;
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

  -- Bounty counts: total approved (bounty_hunter) + Demo Request subset
  -- (demo_specialist). One SELECT would be cheaper, but two named counters
  -- keep the intent obvious and the WHERE clauses trivially indexable.
  select count(*) into v_bounties
    from public.bounty_submissions
   where user_id = p_user_id and status = 'approved';

  select count(*) into v_demos
    from public.bounty_submissions bs
    join public.bounties b on b.id = bs.bounty_id
   where bs.user_id = p_user_id
     and bs.status = 'approved'
     and b.category = 'Demo Request';

  return query
    insert into public.badge_unlocks (user_id, category, tier_index)
    select p_user_id, c.category, c.tier_index
    from (
      select 'trail_mastery'::text as category, 0 as tier_index where v_trip_count >= 1 union all
      select 'trail_mastery', 1 where v_trip_count >= 5 union all
      select 'trail_mastery', 2 where v_trip_count >= 15 union all
      select 'trail_mastery', 3 where v_trip_count >= 50 union all
      select 'community', 0 where v_forum_count >= 1 union all
      select 'community', 1 where v_forum_count >= 10 union all
      select 'community', 2 where v_forum_count >= 50 union all
      select 'community', 3 where v_forum_count >= 250 union all
      select 'builder', 0 where v_build_count >= 1 union all
      select 'builder', 1 where v_build_count >= 3 union all
      select 'builder', 2 where v_build_count >= 5 union all
      select 'builder', 3 where v_build_count >= 10 union all
      select 'explorer', 0 where v_streak >= 7 union all
      select 'explorer', 1 where v_streak >= 30 union all
      select 'explorer', 2 where v_streak >= 100 union all
      select 'explorer', 3 where v_streak >= 365 union all
      select 'shutterbug', 0 where v_photos >= 5 union all
      select 'shutterbug', 1 where v_photos >= 25 union all
      select 'shutterbug', 2 where v_photos >= 100 union all
      select 'shutterbug', 3 where v_photos >= 500 union all
      select 'first_responder', 0 where v_recoveries >= 1 union all
      select 'first_responder', 1 where v_recoveries >= 5 union all
      select 'first_responder', 2 where v_recoveries >= 25 union all
      select 'first_responder', 3 where v_recoveries >= 100 union all
      -- Bounty Hunter — every approved bounty submission
      select 'bounty_hunter', 0 where v_bounties >= 1 union all
      select 'bounty_hunter', 1 where v_bounties >= 5 union all
      select 'bounty_hunter', 2 where v_bounties >= 25 union all
      select 'bounty_hunter', 3 where v_bounties >= 100 union all
      -- Demo Specialist — approved Demo Request submissions specifically
      select 'demo_specialist', 0 where v_demos >= 1 union all
      select 'demo_specialist', 1 where v_demos >= 3 union all
      select 'demo_specialist', 2 where v_demos >= 10 union all
      select 'demo_specialist', 3 where v_demos >= 25
    ) c
    on conflict (user_id, category, tier_index) do nothing
    returning badge_unlocks.category, badge_unlocks.tier_index, badge_unlocks.unlocked_at;
end;
$$;

revoke all on function public.recompute_badges(uuid) from public;
grant execute on function public.recompute_badges(uuid) to authenticated;


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
  v_demos int := 0;
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

  select count(*) into v_bounties
    from public.bounty_submissions
   where user_id = p_user_id and status = 'approved';

  select count(*) into v_demos
    from public.bounty_submissions bs
    join public.bounties b on b.id = bs.bounty_id
   where bs.user_id = p_user_id
     and bs.status = 'approved'
     and b.category = 'Demo Request';

  return query
    with counts as (
      select 'trail_mastery'::text as category, v_trip_count as progress union all
      select 'community', v_forum_count union all
      select 'builder', v_build_count union all
      select 'explorer', v_streak union all
      select 'shutterbug', v_photos union all
      select 'first_responder', v_recoveries union all
      select 'bounty_hunter', v_bounties union all
      select 'demo_specialist', v_demos
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

-- Supporting index for the counts (dominant WHERE = user_id + status).
-- Skip creating if it already exists.
create index if not exists bounty_submissions_user_status_idx
  on public.bounty_submissions (user_id, status);

-- ── Auto-recompute badges when a submission flips to 'approved' ──
-- admin_approve_bounty already calls recompute_badges inline BUT only when
-- reward_points > 0. Cash-only bounties (points = 0) would skip the walk.
-- A trigger on the status transition guarantees the badge ladder runs for
-- every approval, regardless of points payout. Wrapped in EXCEPTION so a
-- badge-side failure can never block the approval itself.
create or replace function public.recompute_badges_on_bounty_approve()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved'
     and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    begin
      perform public.recompute_badges(new.user_id);
    exception when others then
      raise notice 'recompute_badges (bounty approve trigger) failed for %: %', new.user_id, sqlerrm;
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists bounty_submissions_recompute_badges on public.bounty_submissions;
create trigger bounty_submissions_recompute_badges
  after insert or update of status on public.bounty_submissions
  for each row
  execute function public.recompute_badges_on_bounty_approve();

notify pgrst, 'reload schema';
