-- ─────────────────────────────────────────────────────────────────────────────
-- Ranks + Bounties — Phase 1: points persistence
-- ─────────────────────────────────────────────────────────────────────────────
-- Spec: project_ranks_bounties_spec.md (locked 2026-06-23)
--
-- What this ships:
--   1. profiles.points / points_breakdown / last_login_at / login_streak
--   2. points_log audit ledger (one row per award_points call)
--   3. award_points(p_kind, p_amount, p_ref_id, p_ref_type) SECURITY DEFINER RPC
--      — single atomic write: ledger insert + profiles.points bump + breakdown bump
--      — returns prior/new total + rank threshold cross flag so client fires celebration
--   4. record_login() SECURITY DEFINER RPC — runs once per app boot, manages streak
--      + awards daily-login points + bumps last_login_at
--
-- After this migration runs, client awardPoints callsites can call the RPC
-- instead of touching local React state. Existing actions will start
-- persisting per-user.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── profiles columns ──
alter table public.profiles
  add column if not exists points int not null default 0,
  add column if not exists points_breakdown jsonb not null default '{}'::jsonb,
  add column if not exists last_login_at timestamptz,
  add column if not exists login_streak int not null default 0;

create index if not exists profiles_points_idx on public.profiles (points desc);

-- ── points_log ledger table ──
create table if not exists public.points_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  amount int not null,
  ref_id uuid,
  ref_type text,
  awarded_at timestamptz not null default now()
);

create index if not exists points_log_user_awarded_idx on public.points_log (user_id, awarded_at desc);
create index if not exists points_log_awarded_at_idx on public.points_log (awarded_at desc);

alter table public.points_log enable row level security;

-- Owner SELECT only. Writes happen via SECURITY DEFINER RPC; no direct INSERT policy.
drop policy if exists points_log_owner_select on public.points_log;
create policy points_log_owner_select on public.points_log
  for select using (auth.uid() = user_id);

-- Admins can SELECT all for the admin dashboard analytics.
drop policy if exists points_log_admin_select on public.points_log;
create policy points_log_admin_select on public.points_log
  for select using (public.is_admin(auth.uid()));

-- Realtime publication + replica identity for the per-user toast subscription.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'points_log'
  ) then
    alter publication supabase_realtime add table public.points_log;
  end if;
end$$;

alter table public.points_log replica identity full;

-- ── award_points RPC ──
-- Atomic: insert ledger row, bump profiles.points, bump per-kind breakdown bucket.
-- Returns enough metadata for the client to render a toast + detect rank-up.
--
-- Auth model: caller's auth.uid() is the recipient. We don't allow awarding
-- points to other users from the client. Server-side jobs that need to award
-- points to a different user must use service-role and call this directly.
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
    -- No-op; nothing to award. Return current state so caller doesn't crash.
    select p.points from public.profiles p where p.id = v_uid into v_prior;
    return query select v_prior, v_prior, 0, 0, false;
    return;
  end if;

  if v_kind = '' then
    raise exception 'award_points: kind required';
  end if;

  -- Ledger insert FIRST so realtime fans out even if profile update somehow fails.
  insert into public.points_log (user_id, kind, amount, ref_id, ref_type)
  values (v_uid, v_kind, p_amount, p_ref_id, p_ref_type);

  -- Read prior + update profiles in a single statement to minimize race window.
  -- The bucket update is jsonb-set in-place; null current value -> 0 + amount.
  select p.points, coalesce(p.points_breakdown, '{}'::jsonb)
    from public.profiles p
    where p.id = v_uid
    into v_prior, v_breakdown;

  if v_prior is null then
    -- No profile row for this auth uid (edge case — orphaned auth.users). Insert minimum.
    -- Shouldn't happen in practice (profiles created on signup) but defensive.
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

  -- Rank index lookup (mirrors RANK_TIERS in client; keep in sync).
  -- 0 Scout (0..999) · 1 Explorer (1000..4999) · 2 Pathfinder (5000..14999)
  -- 3 Trailblazer (15000..29999) · 4 Navigator (30000..49999)
  -- 5 Expedition Lead (50000..99999) · 6 Legend (100000+)
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

  return query
    select v_new,
           v_prior,
           v_prior_rank_index,
           v_new_rank_index,
           (v_new_rank_index > v_prior_rank_index);
end;
$$;

revoke all on function public.award_points(text, int, uuid, text) from public;
grant execute on function public.award_points(text, int, uuid, text) to authenticated;

-- ── record_login RPC ──
-- Called once per app boot for the authenticated user. Compares last_login_at
-- to today (UTC); awards daily-login points once per day; bumps streak if the
-- previous login was yesterday, otherwise resets to 1. No-ops on repeat calls
-- inside the same UTC day.
create or replace function public.record_login(
  p_daily_login_points int default 5
) returns table(
  awarded boolean,
  streak int,
  new_total int,
  crossed_threshold boolean
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_last timestamptz;
  v_streak int;
  v_now timestamptz := now();
  v_today date := (v_now at time zone 'utc')::date;
  v_last_day date;
  v_award_res record;
  v_new_streak int;
begin
  if v_uid is null then
    raise exception 'record_login: not authenticated';
  end if;

  select p.last_login_at, p.login_streak from public.profiles p where p.id = v_uid
    into v_last, v_streak;

  v_streak := coalesce(v_streak, 0);
  v_last_day := case when v_last is null then null else (v_last at time zone 'utc')::date end;

  if v_last_day = v_today then
    -- Already counted today; no points, no streak change.
    return query select false, v_streak, (select points from public.profiles where id = v_uid), false;
    return;
  end if;

  if v_last_day is not null and v_last_day = (v_today - 1) then
    v_new_streak := v_streak + 1;
  else
    v_new_streak := 1;
  end if;

  update public.profiles
     set last_login_at = v_now,
         login_streak = v_new_streak
   where id = v_uid;

  -- Award daily-login points via award_points so the ledger entry + breakdown
  -- + realtime toast all fire from one path.
  select * into v_award_res from public.award_points('daily_login', p_daily_login_points, null, null) limit 1;

  return query select true,
                      v_new_streak,
                      v_award_res.new_total,
                      v_award_res.crossed_threshold;
end;
$$;

revoke all on function public.record_login(int) from public;
grant execute on function public.record_login(int) to authenticated;
