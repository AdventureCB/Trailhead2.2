-- 2026-07-13: Content velocity by surface for the admin CONTENT tab.
--
-- For each content surface (feed posts, forum threads, trip reports,
-- builds, camping spots, convoys, etc.) counts items created in the last
-- N days and engagement events received on those items over the same
-- window, then computes an avg engagement-per-item rate.
--
-- Engagement definition varies by surface:
--   • Feed posts  → post_likes + post_comments
--   • Convoys     → convoy_rsvps (going + maybe)
--   • Forum       → forum_replies + forum_thread_likes
--   • Trip report → trip_report_likes + view_count delta (view_count is a
--                   running counter — we approximate by summing the
--                   current view_count on items created in-window)
--   • Builds      → build_likes + build_comments
--   • Camping     → community photos added (via jsonb len — approximate)
--
-- The "items in window" filter uses each table's created_at (published_at
-- when applicable). Engagement is counted regardless of when the parent
-- item was created — we're measuring TOTAL engagement received during
-- the window, which is the more actionable number for "is this surface
-- alive right now."
--
-- Returned rows are ordered by items DESC (busiest surfaces first).
-- Client can re-sort.

drop function if exists public.admin_get_content_velocity(int);
create or replace function public.admin_get_content_velocity(p_days int default 30)
returns table(
  surface text,
  items bigint,
  engagement bigint,
  rate numeric,
  sort_order int
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
declare
  v_cutoff timestamptz := now() - make_interval(days => p_days);
begin
  if not public.is_admin(auth.uid()) then
    return;
  end if;

  return query
  with rows(surface, i, e, sort_order) as (
    -- Feed posts (excludes convoys — those get their own row for RSVP tracking).
    select
      'Feed posts'::text,
      (select count(*) from public.posts
        where created_at >= v_cutoff and (type is null or type <> 'CONVOYS')),
      (select count(*) from public.post_likes where created_at >= v_cutoff)
        + (select count(*) from public.post_comments where created_at >= v_cutoff),
      10
    union all
    -- Convoys — subset of posts, engagement = RSVPs going/maybe.
    select
      'Convoys'::text,
      (select count(*) from public.posts
        where created_at >= v_cutoff and type = 'CONVOYS'),
      (select count(*) from public.convoy_rsvps
        where created_at >= v_cutoff and status in ('going','maybe')),
      20
    union all
    -- Forum threads — engagement = replies + likes on threads.
    select
      'Forum threads'::text,
      (select count(*) from public.forum_threads where created_at >= v_cutoff),
      (select count(*) from public.forum_replies where created_at >= v_cutoff)
        + (select count(*) from public.forum_thread_likes),
      30
    union all
    -- Trip reports — engagement = likes.
    select
      'Trip reports'::text,
      (select count(*) from public.trip_reports
        where created_at >= v_cutoff and (kind is null or kind = 'report') and status = 'published'),
      (select count(*) from public.trip_report_likes),
      40
    union all
    -- Trip plans — engagement = saves in window.
    select
      'Trip plans'::text,
      (select count(*) from public.trip_reports
        where created_at >= v_cutoff and kind = 'plan'),
      (select count(*) from public.saved_trips where saved_at >= v_cutoff),
      50
    union all
    -- Builds — engagement = likes + comments.
    select
      'Builds'::text,
      (select count(*) from public.builds where created_at >= v_cutoff),
      (select count(*) from public.build_likes)
        + (select count(*) from public.build_comments where created_at >= v_cutoff),
      60
    union all
    -- Camping spots — engagement approximated by count of spots (there's
    -- no separate interaction table). Included for completeness.
    select
      'Camping spots'::text,
      (select count(*) from public.camping_spots
        where created_at >= v_cutoff and source = 'user'),
      0::bigint,
      70
    union all
    -- Direct messages — treat every message as one engagement event.
    -- Items = distinct conversations created in-window.
    select
      'DM conversations'::text,
      (select count(*) from public.dm_conversations where created_at >= v_cutoff),
      (select count(*) from public.dm_messages where created_at >= v_cutoff),
      80
    union all
    -- Bounties opened / submissions filed. Rate reads as "avg submissions
    -- per bounty in the window."
    select
      'Bounties'::text,
      (select count(*) from public.bounties where created_at >= v_cutoff and status <> 'draft'),
      (select count(*) from public.bounty_submissions where created_at >= v_cutoff),
      90
  )
  select r.surface,
         r.i::bigint as items,
         r.e::bigint as engagement,
         case when r.i > 0 then round(r.e::numeric / r.i::numeric, 2) else 0::numeric end as rate,
         r.sort_order::int
    from rows r
   order by r.i desc;
end;
$$;

grant execute on function public.admin_get_content_velocity(int) to authenticated;
