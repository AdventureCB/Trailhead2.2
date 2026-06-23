-- ─────────────────────────────────────────────────────────────────────────────
-- Ranks — Backfill historical points for activity completed before Phase 1
-- ─────────────────────────────────────────────────────────────────────────────
-- One-shot retro award: walks every profile, counts historical activity that
-- the live awardPoints callsites would have rewarded, and credits whatever
-- isn't already in points_log.
--
-- DIFF-BASED (important): for each kind, we compute the expected total based
-- on the current signal count, subtract what's already in points_log for
-- that kind, and award only the difference. This makes it safe to run
-- regardless of when it runs relative to Phase 1 going live — users who
-- have already earned some Phase 1 points won't be double-credited.
--
-- Idempotent via profiles.points_backfilled_at — re-running this migration
-- is a no-op for users who've already been processed. (Forcing a re-run:
-- `update profiles set points_backfilled_at = null where id = '...'` and
-- re-execute.)
--
-- After the bump, recompute_badges walks each backfilled user so any tier
-- that should retroactively unlock fires.
--
-- Per-kind rules (mirrors live POINTS const + awardPoints call sites):
--   feed_post        — 10 × posts created
--   forum_thread     — 25 × forum_threads created
--   forum_reply      — 10 × forum_replies created
--   build_added      — 40 × builds created
--   route_logged     — 30 × published trip_reports (kind='report')
--   comment_posted   —  3 × (post_comments + build_comments authored)
--   profile_complete — 100 × 1 if (full_name + handle + avatar_url) all set
--
-- Intentionally SKIPPED:
--   daily_login      — no historical login data; let streaks start from now
--   photos_uploaded  — too fragile to backfill from jsonb walks across
--                      posts.data, builds.build_data, trip_reports.route_data,
--                      camping_spots.photos. Photos badges will catch up
--                      going forward.
--   recovery_respond — no clean signal table (lives in dm_conversations w/
--                      recovery_post_id); skip.
--   receive_like / receive_comment — POINTS const had these but no
--                      awardPoints call site ever awarded them.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles add column if not exists points_backfilled_at timestamptz;

create or replace function public._ranks_backfill_one_user(p_uid uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_prof record;
  v_total_pts int := 0;
  v_breakdown jsonb := '{}'::jsonb;

  -- Helper closure inlined via locals: for each kind, compute expected,
  -- diff against ledger, award the gap.
  v_expected int;
  v_already int;
  v_gap int;
begin
  select id, full_name, handle, avatar_url, points_backfilled_at
    into v_prof
    from public.profiles where id = p_uid;
  if not found or v_prof.points_backfilled_at is not null then return 0; end if;

  -- ── feed_post ──
  select count(*) * 10 into v_expected from public.posts where user_id = p_uid;
  select coalesce(sum(amount), 0)::int into v_already from public.points_log where user_id = p_uid and kind = 'feed_post';
  v_gap := v_expected - v_already;
  if v_gap > 0 then
    insert into public.points_log (user_id, kind, amount, ref_type) values (p_uid, 'feed_post', v_gap, 'backfill_2026-06-23');
    v_total_pts := v_total_pts + v_gap;
    v_breakdown := v_breakdown || jsonb_build_object('feed_post', v_gap);
  end if;

  -- ── forum_thread ──
  select count(*) * 25 into v_expected from public.forum_threads where user_id = p_uid;
  select coalesce(sum(amount), 0)::int into v_already from public.points_log where user_id = p_uid and kind = 'forum_thread';
  v_gap := v_expected - v_already;
  if v_gap > 0 then
    insert into public.points_log (user_id, kind, amount, ref_type) values (p_uid, 'forum_thread', v_gap, 'backfill_2026-06-23');
    v_total_pts := v_total_pts + v_gap;
    v_breakdown := v_breakdown || jsonb_build_object('forum_thread', v_gap);
  end if;

  -- ── forum_reply ──
  select count(*) * 10 into v_expected from public.forum_replies where user_id = p_uid;
  select coalesce(sum(amount), 0)::int into v_already from public.points_log where user_id = p_uid and kind = 'forum_reply';
  v_gap := v_expected - v_already;
  if v_gap > 0 then
    insert into public.points_log (user_id, kind, amount, ref_type) values (p_uid, 'forum_reply', v_gap, 'backfill_2026-06-23');
    v_total_pts := v_total_pts + v_gap;
    v_breakdown := v_breakdown || jsonb_build_object('forum_reply', v_gap);
  end if;

  -- ── build_added ──
  select count(*) * 40 into v_expected from public.builds where user_id = p_uid;
  select coalesce(sum(amount), 0)::int into v_already from public.points_log where user_id = p_uid and kind = 'build_added';
  v_gap := v_expected - v_already;
  if v_gap > 0 then
    insert into public.points_log (user_id, kind, amount, ref_type) values (p_uid, 'build_added', v_gap, 'backfill_2026-06-23');
    v_total_pts := v_total_pts + v_gap;
    v_breakdown := v_breakdown || jsonb_build_object('build_added', v_gap);
  end if;

  -- ── route_logged ──
  select count(*) * 30 into v_expected
    from public.trip_reports
   where user_id = p_uid
     and status = 'published'
     and (kind is null or kind = 'report');
  select coalesce(sum(amount), 0)::int into v_already from public.points_log where user_id = p_uid and kind = 'route_logged';
  v_gap := v_expected - v_already;
  if v_gap > 0 then
    insert into public.points_log (user_id, kind, amount, ref_type) values (p_uid, 'route_logged', v_gap, 'backfill_2026-06-23');
    v_total_pts := v_total_pts + v_gap;
    v_breakdown := v_breakdown || jsonb_build_object('route_logged', v_gap);
  end if;

  -- ── comment_posted ── (3 × (post_comments + build_comments))
  select
    coalesce((select count(*) from public.post_comments where user_id = p_uid), 0) * 3
    + coalesce((select count(*) from public.build_comments where user_id = p_uid), 0) * 3
    into v_expected;
  select coalesce(sum(amount), 0)::int into v_already from public.points_log where user_id = p_uid and kind = 'comment_posted';
  v_gap := v_expected - v_already;
  if v_gap > 0 then
    insert into public.points_log (user_id, kind, amount, ref_type) values (p_uid, 'comment_posted', v_gap, 'backfill_2026-06-23');
    v_total_pts := v_total_pts + v_gap;
    v_breakdown := v_breakdown || jsonb_build_object('comment_posted', v_gap);
  end if;

  -- ── profile_complete ── (flat 100 once, only if all three fields populated)
  if v_prof.full_name is not null and v_prof.handle is not null and v_prof.avatar_url is not null then
    select coalesce(sum(amount), 0)::int into v_already from public.points_log where user_id = p_uid and kind = 'profile_complete';
    v_gap := 100 - v_already;
    if v_gap > 0 then
      insert into public.points_log (user_id, kind, amount, ref_type) values (p_uid, 'profile_complete', v_gap, 'backfill_2026-06-23');
      v_total_pts := v_total_pts + v_gap;
      v_breakdown := v_breakdown || jsonb_build_object('profile_complete', v_gap);
    end if;
  end if;

  -- Apply to profile. Additive merge into the existing breakdown buckets.
  update public.profiles p
     set points = p.points + v_total_pts,
         points_breakdown = (
           select coalesce(jsonb_object_agg(k, total), '{}'::jsonb)
             from (
               select k,
                      coalesce((p.points_breakdown ->> k)::int, 0)
                        + coalesce((v_breakdown ->> k)::int, 0) as total
                 from jsonb_object_keys(coalesce(p.points_breakdown, '{}'::jsonb) || v_breakdown) k
             ) merged
         ),
         points_backfilled_at = now()
   where p.id = p_uid;

  return v_total_pts;
end;
$$;

revoke all on function public._ranks_backfill_one_user(uuid) from public;
-- Helper is admin-only; we run it via the DO block below as the migration runner.
-- No grant to anyone — only the migration + future manual SQL ops can invoke it.

-- ── Driver: backfill every user that hasn't been processed ──
do $$
declare
  rec record;
  total_users int := 0;
  total_pts bigint := 0;
  awarded int;
begin
  for rec in select id from public.profiles where points_backfilled_at is null loop
    awarded := public._ranks_backfill_one_user(rec.id);
    total_users := total_users + 1;
    total_pts := total_pts + awarded;
  end loop;
  raise notice 'Backfilled % users (% total points awarded)', total_users, total_pts;
end$$;

-- ── Walk the badge ladder for everyone who was backfilled ──
-- recompute_badges counts source-of-truth signals (trip_reports.count,
-- forum_threads.count, builds.count, login_streak, photos_uploaded /
-- recovery_respond from points_breakdown) so it'll catch any tier that
-- should retroactively unlock — including badges whose progress doesn't
-- depend on the points award at all.
do $$
declare
  rec record;
begin
  for rec in select id from public.profiles where points_backfilled_at is not null loop
    perform public.recompute_badges(rec.id);
  end loop;
end$$;
