-- 2026-07-13: Time-to-first-value analytics for the admin USERS tab.
--
-- Median time from signup → first meaningful action across all users
-- who signed up more than 7 days ago (grace window so we don't include
-- users who haven't had time to activate). "Meaningful action" = the
-- same surface list as feature adoption:
--   posts, builds, forum threads/replies, published trip reports,
--   camping spots (user-added), follows, bounty submissions, convoy
--   RSVPs (going/maybe), DMs sent, saved trips
--
-- Distribution buckets (activated within):
--   1h  — immediate wow-moment users
--   1d  — same-day converters
--   7d  — weekly converters
--   30d — slow builders
-- Anything past 30d rolls into "activated (long-tail)".
--
-- Predicts retention better than any single metric — the shorter the
-- median TTFV, the more likely the user comes back.

drop function if exists public.admin_get_time_to_first_value();
create or replace function public.admin_get_time_to_first_value()
returns table(
  total_candidates bigint,
  activated bigint,
  activation_rate_pct numeric,
  median_seconds numeric,
  p25_seconds numeric,
  p75_seconds numeric,
  under_1h_pct numeric,
  under_1d_pct numeric,
  under_7d_pct numeric,
  under_30d_pct numeric
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
declare
  v_grace_cutoff timestamptz := now() - interval '7 days';
begin
  if not public.is_admin(auth.uid()) then
    return;
  end if;

  return query
  with candidates as (
    select p.id, p.created_at
      from public.profiles p
     where p.created_at is not null
       and p.created_at <= v_grace_cutoff
  ),
  first_actions as (
    select
      c.id,
      c.created_at,
      least(
        (select min(created_at) from public.posts where user_id = c.id),
        (select min(created_at) from public.builds where user_id = c.id),
        (select min(created_at) from public.forum_threads where user_id = c.id),
        (select min(created_at) from public.forum_replies where user_id = c.id),
        (select min(created_at) from public.trip_reports
          where user_id = c.id and (kind is null or kind = 'report') and status = 'published'),
        (select min(created_at) from public.camping_spots
          where user_id = c.id and source = 'user'),
        (select min(created_at) from public.follows where follower_id = c.id),
        (select min(created_at) from public.bounty_submissions where user_id = c.id),
        (select min(created_at) from public.convoy_rsvps
          where user_id = c.id and status in ('going','maybe')),
        (select min(created_at) from public.dm_messages where sender_id = c.id),
        (select min(saved_at) from public.saved_trips where user_id = c.id)
      ) as first_at
      from candidates c
  ),
  ttfv as (
    select
      id,
      extract(epoch from (first_at - created_at))::numeric as secs
      from first_actions
     where first_at is not null
       and first_at >= created_at
  ),
  agg as (
    select
      (select count(*) from candidates)::bigint as total_candidates,
      (select count(*) from ttfv)::bigint as activated,
      percentile_cont(0.5) within group (order by secs) as median_seconds,
      percentile_cont(0.25) within group (order by secs) as p25_seconds,
      percentile_cont(0.75) within group (order by secs) as p75_seconds,
      count(*) filter (where secs <= 3600)::numeric as under_1h,
      count(*) filter (where secs <= 86400)::numeric as under_1d,
      count(*) filter (where secs <= 604800)::numeric as under_7d,
      count(*) filter (where secs <= 2592000)::numeric as under_30d,
      count(*)::numeric as activated_num
      from ttfv
  )
  select
    a.total_candidates,
    a.activated,
    case when a.total_candidates > 0
         then round((a.activated::numeric / a.total_candidates::numeric) * 100, 1)
         else 0::numeric
    end as activation_rate_pct,
    coalesce(a.median_seconds, 0)::numeric,
    coalesce(a.p25_seconds, 0)::numeric,
    coalesce(a.p75_seconds, 0)::numeric,
    case when a.activated_num > 0 then round((a.under_1h  / a.activated_num) * 100, 1) else 0::numeric end,
    case when a.activated_num > 0 then round((a.under_1d  / a.activated_num) * 100, 1) else 0::numeric end,
    case when a.activated_num > 0 then round((a.under_7d  / a.activated_num) * 100, 1) else 0::numeric end,
    case when a.activated_num > 0 then round((a.under_30d / a.activated_num) * 100, 1) else 0::numeric end
    from agg a;
end;
$$;

grant execute on function public.admin_get_time_to_first_value() to authenticated;
