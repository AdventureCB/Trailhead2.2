-- 2026-07-13: Geographic activity by state for the admin OVERVIEW tab.
--
-- MVP scope: trip_reports.state_code + region. These are the only
-- entities with a reliably populated state column — trip_reports gets
-- state_code stamped via Mapbox reverse-geocode on publish/edit.
--
-- Aggregates:
--   • trip_count       — total published trip_reports in that state in-window
--   • distinct_users   — unique authors who published there
--   • region           — trip_reports.region (Pacific NW, Southwest, etc.)
--
-- Future iterations can extend with camping_spots + gear_drops (both
-- have lat/lng but need a lat/lng→state mapping to aggregate cheaply).
-- Signups by state is not possible without adding a location field to
-- profiles (or IP geolocation).

drop function if exists public.admin_get_activity_by_state(int);
create or replace function public.admin_get_activity_by_state(p_days int default 90)
returns table(
  state_code text,
  region text,
  trip_count bigint,
  distinct_users bigint
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
  select
    upper(trim(tr.state_code)) as state_code,
    -- Region can vary per trip within a state (Utah = Southwest for
    -- most, could be Rockies for others) so pick the most common
    -- region label for the state via a mode() aggregate.
    mode() within group (order by tr.region) as region,
    count(*)::bigint as trip_count,
    count(distinct tr.user_id)::bigint as distinct_users
    from public.trip_reports tr
   where tr.status = 'published'
     and (tr.kind is null or tr.kind = 'report')
     and tr.created_at >= v_cutoff
     and tr.state_code is not null
     and length(trim(tr.state_code)) > 0
   group by upper(trim(tr.state_code))
   order by trip_count desc;
end;
$$;

grant execute on function public.admin_get_activity_by_state(int) to authenticated;
