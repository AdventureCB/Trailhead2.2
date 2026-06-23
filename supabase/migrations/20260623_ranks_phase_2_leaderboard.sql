-- ─────────────────────────────────────────────────────────────────────────────
-- Ranks + Bounties — Phase 2: real leaderboard RPCs
-- ─────────────────────────────────────────────────────────────────────────────
-- Spec: project_ranks_bounties_spec.md
--
-- Three SECURITY DEFINER RPCs power the three leaderboard tabs:
--   - leaderboard_global   : top N by all-time profiles.points
--   - leaderboard_following: top N among users the caller follows (+ caller)
--   - leaderboard_weekly   : top N by sum(points_log.amount) in last 7 days
--
-- All return the same row shape so the client renders them with one component.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── leaderboard_global ──
create or replace function public.leaderboard_global(
  p_limit int default 100
) returns table(
  user_id uuid,
  handle text,
  full_name text,
  avatar_url text,
  points int,
  login_streak int
)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.handle, p.full_name, p.avatar_url,
         coalesce(p.points, 0)::int as points,
         coalesce(p.login_streak, 0)::int as login_streak
    from public.profiles p
   where coalesce(p.points, 0) > 0
   order by p.points desc nulls last, p.handle asc
   limit greatest(1, least(p_limit, 500));
$$;

revoke all on function public.leaderboard_global(int) from public;
grant execute on function public.leaderboard_global(int) to authenticated, anon;

-- ── leaderboard_following ──
-- Includes the caller themselves so the "YOU" row always renders (otherwise
-- a new user who follows nobody would see an empty leaderboard).
create or replace function public.leaderboard_following(
  p_limit int default 100
) returns table(
  user_id uuid,
  handle text,
  full_name text,
  avatar_url text,
  points int,
  login_streak int
)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.handle, p.full_name, p.avatar_url,
         coalesce(p.points, 0)::int as points,
         coalesce(p.login_streak, 0)::int as login_streak
    from public.profiles p
   where p.id in (
     select f.following_id from public.follows f where f.follower_id = auth.uid()
     union
     select auth.uid()
   )
   order by p.points desc nulls last, p.handle asc
   limit greatest(1, least(p_limit, 500));
$$;

revoke all on function public.leaderboard_following(int) from public;
grant execute on function public.leaderboard_following(int) to authenticated;

-- ── leaderboard_weekly ──
-- Sums every points_log row from the last rolling 7 days. Anyone who
-- awarded zero points in the window doesn't appear (no row in points_log).
create or replace function public.leaderboard_weekly(
  p_limit int default 100
) returns table(
  user_id uuid,
  handle text,
  full_name text,
  avatar_url text,
  points int,
  login_streak int
)
language sql
security definer
set search_path = public
stable
as $$
  select pl.user_id,
         p.handle,
         p.full_name,
         p.avatar_url,
         sum(pl.amount)::int as points,
         coalesce(p.login_streak, 0)::int as login_streak
    from public.points_log pl
    join public.profiles p on p.id = pl.user_id
   where pl.awarded_at > now() - interval '7 days'
   group by pl.user_id, p.handle, p.full_name, p.avatar_url, p.login_streak
   order by sum(pl.amount) desc, p.handle asc
   limit greatest(1, least(p_limit, 500));
$$;

revoke all on function public.leaderboard_weekly(int) from public;
grant execute on function public.leaderboard_weekly(int) to authenticated, anon;
