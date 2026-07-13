-- 2026-07-13: Per-ambassador revenue trends for the AMBASSADORS analytics
-- sub-tab.
--
-- Existing analytics show `admin_top_earner_ambassadors` (commission
-- leaderboard) and `admin_commission_vs_payouts_by_month` (aggregate cash
-- flow). This RPC surfaces a different lens: TOTAL REVENUE DRIVEN per
-- ambassador (not their commission cut) with month-over-month trend.
--
-- Business value: an ambassador on 5% commission driving $100k is more
-- valuable to the brand than one on 10% driving $10k, even though the
-- commission leaderboard ranks the second one higher for personal earnings.
-- This RPC ranks by top-line contribution — the metric ops actually cares
-- about when deciding tier / retention.
--
-- Returns long-form: one row per (ambassador × month) for the top N
-- ambassadors by total revenue over the window. Ambassador metadata is
-- denormalized onto every row so the client can group by id without a
-- second lookup. Total revenue per ambassador is repeated on every row
-- so the client can sort by it without re-summing.
--
-- Excludes soft-deleted orders (removed_at IS NOT NULL) so admin's
-- attribution corrections stay accurate.

drop function if exists public.admin_get_top_ambassador_revenue(int, int);
create or replace function public.admin_get_top_ambassador_revenue(
  p_limit int default 10,
  p_months int default 6
)
returns table(
  ambassador_id uuid,
  handle text,
  full_name text,
  avatar_url text,
  base_code text,
  tier text,
  total_revenue numeric,
  total_orders bigint,
  month date,
  monthly_revenue numeric,
  monthly_orders bigint
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
  with in_window as (
    select
      ao.ambassador_id,
      coalesce(ao.subtotal, 0)::numeric as subtotal,
      date_trunc('month', ao.order_date)::date as month
      from public.ambassador_orders ao
     where ao.removed_at is null
       and ao.order_date is not null
       and ao.order_date >= v_start
  ),
  totals as (
    select
      ambassador_id,
      sum(subtotal)::numeric as total_revenue,
      count(*)::bigint as total_orders
      from in_window
     group by ambassador_id
     order by total_revenue desc
     limit p_limit
  ),
  monthly as (
    select
      w.ambassador_id,
      w.month,
      sum(w.subtotal)::numeric as monthly_revenue,
      count(*)::bigint as monthly_orders
      from in_window w
      join totals t on t.ambassador_id = w.ambassador_id
     group by w.ambassador_id, w.month
  )
  select
    a.id as ambassador_id,
    p.handle,
    p.full_name,
    p.avatar_url,
    a.base_code,
    a.tier,
    t.total_revenue,
    t.total_orders,
    m.month,
    m.monthly_revenue,
    m.monthly_orders
    from monthly m
    join totals t     on t.ambassador_id = m.ambassador_id
    join public.ambassadors a on a.id = m.ambassador_id
    left join public.profiles p on p.id = a.profile_id
   order by t.total_revenue desc, a.id, m.month;
end;
$$;

grant execute on function public.admin_get_top_ambassador_revenue(int, int) to authenticated;
