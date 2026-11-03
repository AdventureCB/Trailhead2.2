-- ============================================================================
-- BOUNTY PAID LEDGER — admin read model over public.bounty_payouts
-- ============================================================================
-- bounty_payouts already records every disbursement (gift-card new/top-up,
-- manual, and the no-bounty "award a user" path — same table, empty
-- submission_ids). What was missing is a way to READ it: the admin screen
-- only showed the pending queue. These two RPCs back a PAID LEDGER tab:
-- filterable rows (user / method / date / search) with the recipient,
-- the admin who paid, and the bounties each payout cleared, plus totals.
-- Admin-only (is_admin). Idempotent.
-- ============================================================================

create or replace function public.admin_bounty_paid_ledger(
  p_limit   int default 100,
  p_offset  int default 0,
  p_user_id uuid default null,
  p_method  text default null,        -- 'gift_card' | 'manual' | 'award' | null = all
  p_from    timestamptz default null,
  p_to      timestamptz default null,
  p_q       text default null         -- matches handle / name / reference / notes
) returns table(
  payout_id uuid,
  paid_at timestamptz,
  user_id uuid,
  handle text,
  full_name text,
  avatar_url text,
  amount_cents bigint,
  method text,
  is_award boolean,                   -- true = no submissions cleared (direct award)
  reference text,
  notes text,
  shopify_gift_card_id text,
  submission_count int,
  bounty_titles text[],
  paid_by uuid,
  paid_by_handle text,
  paid_by_name text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin only'; end if;
  return query
    select
      bp.id, bp.paid_at, bp.user_id,
      p.handle, p.full_name, p.avatar_url,
      bp.amount_cents, bp.method,
      coalesce(cardinality(bp.submission_ids), 0) = 0 as is_award,
      bp.reference, bp.notes, bp.shopify_gift_card_id,
      coalesce(cardinality(bp.submission_ids), 0)::int as submission_count,
      coalesce((
        select array_agg(distinct b.title order by b.title)
        from public.bounty_submissions s
        join public.bounties b on b.id = s.bounty_id
        where s.id = any(bp.submission_ids)
      ), '{}'::text[]) as bounty_titles,
      bp.paid_by, a.handle as paid_by_handle, a.full_name as paid_by_name
    from public.bounty_payouts bp
    left join public.profiles p on p.id = bp.user_id
    left join public.profiles a on a.id = bp.paid_by
    where (p_user_id is null or bp.user_id = p_user_id)
      and (p_method is null
           or (p_method = 'gift_card' and bp.method like 'shopify_gift_card%')
           or (p_method = 'manual' and bp.method = 'manual')
           or (p_method = 'award' and coalesce(cardinality(bp.submission_ids), 0) = 0))
      and (p_from is null or bp.paid_at >= p_from)
      and (p_to is null or bp.paid_at < p_to)
      and (p_q is null or trim(p_q) = ''
           or p.handle ilike '%' || trim(p_q) || '%'
           or p.full_name ilike '%' || trim(p_q) || '%'
           or bp.reference ilike '%' || trim(p_q) || '%'
           or bp.notes ilike '%' || trim(p_q) || '%')
    order by bp.paid_at desc
    limit greatest(1, least(coalesce(p_limit, 100), 500))
    offset greatest(0, coalesce(p_offset, 0));
end;
$$;
revoke all on function public.admin_bounty_paid_ledger(int, int, uuid, text, timestamptz, timestamptz, text) from public;
grant execute on function public.admin_bounty_paid_ledger(int, int, uuid, text, timestamptz, timestamptz, text) to authenticated;

-- Totals for the same filter set (so the strip matches the list).
create or replace function public.admin_bounty_paid_ledger_totals(
  p_user_id uuid default null,
  p_method  text default null,
  p_from    timestamptz default null,
  p_to      timestamptz default null,
  p_q       text default null
) returns table(
  payout_count bigint,
  total_cents bigint,
  gift_card_cents bigint,
  manual_cents bigint,
  award_cents bigint,
  users_paid bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin only'; end if;
  return query
    select
      count(*)::bigint,
      coalesce(sum(bp.amount_cents), 0)::bigint,
      coalesce(sum(bp.amount_cents) filter (where bp.method like 'shopify_gift_card%'), 0)::bigint,
      coalesce(sum(bp.amount_cents) filter (where bp.method = 'manual'), 0)::bigint,
      coalesce(sum(bp.amount_cents) filter (where coalesce(cardinality(bp.submission_ids), 0) = 0), 0)::bigint,
      count(distinct bp.user_id)::bigint
    from public.bounty_payouts bp
    left join public.profiles p on p.id = bp.user_id
    where (p_user_id is null or bp.user_id = p_user_id)
      and (p_method is null
           or (p_method = 'gift_card' and bp.method like 'shopify_gift_card%')
           or (p_method = 'manual' and bp.method = 'manual')
           or (p_method = 'award' and coalesce(cardinality(bp.submission_ids), 0) = 0))
      and (p_from is null or bp.paid_at >= p_from)
      and (p_to is null or bp.paid_at < p_to)
      and (p_q is null or trim(p_q) = ''
           or p.handle ilike '%' || trim(p_q) || '%'
           or p.full_name ilike '%' || trim(p_q) || '%'
           or bp.reference ilike '%' || trim(p_q) || '%'
           or bp.notes ilike '%' || trim(p_q) || '%');
end;
$$;
revoke all on function public.admin_bounty_paid_ledger_totals(uuid, text, timestamptz, timestamptz, text) from public;
grant execute on function public.admin_bounty_paid_ledger_totals(uuid, text, timestamptz, timestamptz, text) to authenticated;

create index if not exists bounty_payouts_paid_at_idx on public.bounty_payouts (paid_at desc);

-- Live: a payout issued from another admin's device shows up without reload.
alter table public.bounty_payouts replica identity full;
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bounty_payouts') then
    alter publication supabase_realtime add table public.bounty_payouts;
  end if;
end $$;

notify pgrst, 'reload schema';
