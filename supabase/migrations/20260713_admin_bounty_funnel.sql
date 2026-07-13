-- 2026-07-13: Bounty completion funnel by category for the admin CONTENT tab.
--
-- Bounties have two independent status fields — the submission workflow
-- (submitted → approved → paid) and payout_status (pending → paid).
-- Real completion = status='approved' AND payout_status='paid'.
--
-- Stages, per bounty CATEGORY:
--   1. Claimed    — any bounty_submissions row (draft, claimed, submitted,
--                   approved, etc.)
--   2. Submitted  — status IN ('submitted','approved','changes_requested')
--   3. Approved   — status='approved'
--   4. Paid       — status='approved' AND payout_status='paid'
--
-- Returns long-form (category, stage, submissions, pct_of_total,
-- drop_off_pct) so the client can render one mini-funnel per category.
-- p_days defaults to 180 — bounties take longer to close than convoys,
-- especially for high-effort categories (Demo Request).

drop function if exists public.admin_get_bounty_funnel(int);
create or replace function public.admin_get_bounty_funnel(p_days int default 180)
returns table(
  category text,
  stage text,
  submissions bigint,
  pct_of_total numeric,
  drop_off_pct numeric,
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
  with subs as (
    select
      bs.id,
      bs.status,
      bs.payout_status,
      coalesce(b.category, 'Content Creation') as category
      from public.bounty_submissions bs
      join public.bounties b on b.id = bs.bounty_id
     where bs.created_at >= v_cutoff
  ),
  per_cat as (
    select
      category,
      count(*)::bigint as claimed,
      count(*) filter (where status in ('submitted','approved','changes_requested'))::bigint as submitted,
      count(*) filter (where status = 'approved')::bigint as approved,
      count(*) filter (where status = 'approved' and payout_status = 'paid')::bigint as paid
      from subs
     group by category
  ),
  stages(category, sort_order, stage, cnt, prev_cnt) as (
    select category, 10, 'Claimed'::text,   claimed,   claimed   from per_cat
    union all
    select category, 20, 'Submitted'::text, submitted, claimed   from per_cat
    union all
    select category, 30, 'Approved'::text,  approved,  submitted from per_cat
    union all
    select category, 40, 'Paid'::text,      paid,      approved  from per_cat
  )
  select
    s.category,
    s.stage,
    s.cnt::bigint as submissions,
    case when pc.claimed > 0
         then round((s.cnt::numeric / pc.claimed::numeric) * 100, 1)
         else 0::numeric
    end as pct_of_total,
    case when s.prev_cnt > 0 and s.sort_order > 10
         then round(((s.prev_cnt - s.cnt)::numeric / s.prev_cnt::numeric) * 100, 1)
         else 0::numeric
    end as drop_off_pct,
    s.sort_order::int
    from stages s
    join per_cat pc on pc.category = s.category
   order by pc.claimed desc, s.category, s.sort_order;
end;
$$;

grant execute on function public.admin_get_bounty_funnel(int) to authenticated;
