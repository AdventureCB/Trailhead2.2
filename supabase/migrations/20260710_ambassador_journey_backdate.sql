-- 2026-07-10: Backdate a journey's confirmed_at to match its linked
-- order's order_date. `admin_add_manual_order` currently stamps
-- confirmed_at = now() regardless of the order_date passed by the admin,
-- so a backdated manual add (e.g. an April sale added in July) buckets
-- into the current month's pending payouts instead of the actual sale
-- month. This RPC lets the client fix the stamp after the insert.
--
-- Safety: only touches journeys the admin owns the audit chain for —
-- must still be unpaid (payout_id IS NULL) and in confirmed/walk_in
-- state (deposit_only can't be backdated because it has no confirmation
-- event yet).

drop function if exists public.admin_backdate_journey_confirmation(uuid, timestamptz);
create or replace function public.admin_backdate_journey_confirmation(
  p_journey_id uuid,
  p_confirmed_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_state text;
  v_payout_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Not authorized';
  end if;
  if p_journey_id is null or p_confirmed_at is null then
    raise exception 'journey_id and confirmed_at required';
  end if;
  select state, payout_id
    into v_state, v_payout_id
    from public.ambassador_journeys
    where id = p_journey_id
    for update;
  if not found then
    raise exception 'journey not found';
  end if;
  if v_payout_id is not null then
    raise exception 'journey already linked to payout — cannot backdate';
  end if;
  if v_state not in ('confirmed', 'walk_in') then
    raise exception 'journey not in confirmed/walk_in state (state=%)', v_state;
  end if;
  update public.ambassador_journeys
    set confirmed_at = p_confirmed_at,
        updated_at = now()
    where id = p_journey_id;
  return true;
end
$$;

grant execute on function public.admin_backdate_journey_confirmation(uuid, timestamptz) to authenticated;

-- Convenience wrapper: given a shopify_order_id, find its linked journey
-- and backdate confirmed_at to the order's order_date. Used by the client
-- immediately after `admin_add_manual_order` returns so backdated manual
-- adds land in the correct pending-payout bucket automatically.
drop function if exists public.admin_backdate_journey_from_order(text);
create or replace function public.admin_backdate_journey_from_order(
  p_shopify_order_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_order_date timestamptz;
  v_journey_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Not authorized';
  end if;
  if p_shopify_order_id is null or length(trim(p_shopify_order_id)) = 0 then
    raise exception 'shopify_order_id required';
  end if;
  select journey_id, order_date
    into v_journey_id, v_order_date
    from public.ambassador_orders
    where shopify_order_id = p_shopify_order_id
      and removed_at is null
    order by created_at desc
    limit 1;
  if v_journey_id is null then
    -- Order exists but no journey (e.g. eligible < confirmation_min) —
    -- nothing to backdate. Not an error.
    return false;
  end if;
  return public.admin_backdate_journey_confirmation(v_journey_id, v_order_date);
end
$$;

grant execute on function public.admin_backdate_journey_from_order(text) to authenticated;
