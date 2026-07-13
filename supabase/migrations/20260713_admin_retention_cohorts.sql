-- 2026-07-13: Retention cohort matrix for the admin USERS tab.
--
-- Buckets every user by signup month (cohort) and tallies how many were
-- "active" in each subsequent month. Active = wrote a `points_log` row
-- (every meaningful action awards points) OR sent a DM message (DMs are
-- engagement but not points-earning).
--
-- Returns long-form (cohort, month_offset, retained, cohort_size). The
-- client pivots into a matrix. Long-form keeps the SQL simple and lets
-- the UI decide how many cohorts × offsets to render.
--
-- p_months caps the number of cohort months (default 12). Cohort month 0
-- is always the current calendar month; older cohorts count backward
-- from there.
--
-- Cohort size (total signups in that month) is included in every row so
-- the client can compute % = retained / cohort_size without a second RPC.

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
    select pl.user_id, date_trunc('month', pl.created_at)::date as active_month
      from public.points_log pl
     where pl.created_at is not null
       and pl.created_at >= v_start
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
