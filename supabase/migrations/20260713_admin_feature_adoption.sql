-- 2026-07-13: Feature adoption funnel for the admin USERS tab.
--
-- For every "meaningful" action surface (post, build, trip report,
-- forum thread, camping spot, convoy RSVP, bounty submission, DM, etc.)
-- counts the distinct users who have ever performed it, and expresses
-- that as a percentage of the total profiles table. Sorted client-side
-- by adoption %.
--
-- Consumption-level actions (like, follow) are included at the bottom so
-- we can spot the "signed up + logged in + never engaged" cohort.
--
-- Denominator is `count(*) from profiles` — every registered user is a
-- candidate for every feature. Excludes admins/ambassadors isn't
-- necessary at this scale (privileged accounts are noise-level).

drop function if exists public.admin_get_feature_adoption();
create or replace function public.admin_get_feature_adoption()
returns table(
  feature text,
  users_count bigint,
  total_users bigint,
  pct numeric,
  sort_order int
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
declare
  v_total bigint;
begin
  if not public.is_admin(auth.uid()) then
    return;
  end if;

  select count(*) into v_total from public.profiles;
  if v_total is null or v_total = 0 then
    v_total := 1;
  end if;

  return query
  with counts(feature, c, sort_order) as (
    select 'Posted to feed'::text,
           (select count(distinct user_id) from public.posts where user_id is not null),
           10
    union all
    select 'Wrote forum thread',
           (select count(distinct user_id) from public.forum_threads where user_id is not null),
           20
    union all
    select 'Wrote forum reply',
           (select count(distinct user_id) from public.forum_replies where user_id is not null),
           30
    union all
    select 'Added a build',
           (select count(distinct user_id) from public.builds where user_id is not null),
           40
    union all
    select 'Published trip report',
           (select count(distinct user_id) from public.trip_reports
             where user_id is not null and (kind is null or kind = 'report') and status = 'published'),
           50
    union all
    select 'Saved a trip',
           (select count(distinct user_id) from public.saved_trips),
           55
    union all
    select 'Created a trip plan',
           (select count(distinct user_id) from public.trip_reports
             where user_id is not null and kind = 'plan'),
           60
    union all
    select 'Added camping spot',
           (select count(distinct user_id) from public.camping_spots
             where user_id is not null and source = 'user'),
           70
    union all
    select 'RSVP''d a convoy',
           (select count(distinct user_id) from public.convoy_rsvps
             where user_id is not null and status in ('going','maybe')),
           80
    union all
    select 'Sent a DM',
           (select count(distinct sender_id) from public.dm_messages where sender_id is not null),
           90
    union all
    select 'Claimed a bounty',
           (select count(distinct user_id) from public.bounty_submissions where user_id is not null),
           100
    union all
    select 'Followed someone',
           (select count(distinct follower_id) from public.follows),
           110
    union all
    select 'Liked something',
           (select count(distinct user_id) from public.post_likes where user_id is not null),
           120
    union all
    select 'Commented on a post',
           (select count(distinct user_id) from public.post_comments where user_id is not null),
           130
  )
  select c.feature,
         c.c::bigint as users_count,
         v_total::bigint as total_users,
         round((c.c::numeric / v_total::numeric) * 100, 1) as pct,
         c.sort_order::int
    from counts c
   order by c.sort_order;
end;
$$;

grant execute on function public.admin_get_feature_adoption() to authenticated;
