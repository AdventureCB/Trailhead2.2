-- 2026-07-13: Fix admin_get_retention_cohorts column reference.
--
-- Original migration referenced `points_log.created_at` which doesn't
-- exist — the ledger column is named `awarded_at` (see
-- 20260623_ranks_phase_1_points_persistence.sql). CREATE OR REPLACE
-- with the correct column.

drop function if exists public.admin_get_retention_cohorts(int);
create or replace function public.admin_get_retention_cohorts(p_months int default 12)
returns table(
  cohort_month date,
  cohort_size bigint,
  month_offset int,
  retained bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
declare
  v_start date := (date_trunc('month', now()) - make_interval(months => p_months - 1))::date;
begin
  if not public.is_admin(auth.uid()) then
    return;
  end if;

  return query
  with users as (
    select p.id,
           date_trunc('month', p.created_at)::date as cohort_month
      from public.profiles p
     where p.created_at is not null
       and p.created_at >= v_start
  ),
  activity as (
    select pl.user_id, date_trunc('month', pl.awarded_at)::date as active_month
      from public.points_log pl
     where pl.awarded_at is not null
       and pl.awarded_at >= v_start
     union
    select dm.sender_id as user_id, date_trunc('month', dm.created_at)::date as active_month
      from public.dm_messages dm
     where dm.created_at is not null
       and dm.created_at >= v_start
       and dm.sender_id is not null
  ),
  cohort_sizes as (
    select u.cohort_month, count(*)::bigint as size
      from users u
     group by u.cohort_month
  ),
  retained_counts as (
    select u.cohort_month,
           ((extract(year from a.active_month) - extract(year from u.cohort_month)) * 12
             + (extract(month from a.active_month) - extract(month from u.cohort_month)))::int as month_offset,
           count(distinct u.id)::bigint as retained
      from users u
      join activity a on a.user_id = u.id
     where a.active_month >= u.cohort_month
     group by u.cohort_month,
              ((extract(year from a.active_month) - extract(year from u.cohort_month)) * 12
                + (extract(month from a.active_month) - extract(month from u.cohort_month)))::int
  )
  select r.cohort_month,
         cs.size as cohort_size,
         r.month_offset,
         r.retained
    from retained_counts r
    join cohort_sizes cs on cs.cohort_month = r.cohort_month
   order by r.cohort_month desc, r.month_offset asc;
end;
$$;

grant execute on function public.admin_get_retention_cohorts(int) to authenticated;
