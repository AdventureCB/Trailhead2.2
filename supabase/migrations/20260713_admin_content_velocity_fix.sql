-- 2026-07-13: Re-installs admin_get_content_velocity.
--
-- The original migration used `WITH rows AS (…)` — `rows` is a reserved
-- word in some Postgres versions and the CREATE FUNCTION appears to have
-- failed silently (user hit PGRST202 "function not found" on call).
-- This rewrite renames the CTE to `surfaces` and force-reloads the
-- PostgREST schema cache at the end.

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
  with surfaces(surface, i, e, sort_order) as (
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
    select
      'Camping spots'::text,
      (select count(*) from public.camping_spots
        where created_at >= v_cutoff and source = 'user'),
      0::bigint,
      70
    union all
    select
      'DM conversations'::text,
      (select count(*) from public.dm_conversations where created_at >= v_cutoff),
      (select count(*) from public.dm_messages where created_at >= v_cutoff),
      80
    union all
    select
      'Bounties'::text,
      (select count(*) from public.bounties where created_at >= v_cutoff and status <> 'draft'),
      (select count(*) from public.bounty_submissions where created_at >= v_cutoff),
      90
  )
  select s.surface,
         s.i::bigint as items,
         s.e::bigint as engagement,
         case when s.i > 0 then round(s.e::numeric / s.i::numeric, 2) else 0::numeric end as rate,
         s.sort_order::int
    from surfaces s
   order by s.i desc;
end;
$$;

grant execute on function public.admin_get_content_velocity(int) to authenticated;

notify pgrst, 'reload schema';
