-- LINK TO JOURNEY admin action.
-- Solves the partial-refund confirmation case: a confirmation_part order
-- ends up unlinked (or attached to the wrong journey) because the order
-- was paid + partially refunded around the same time, or because backfill
-- skipped it (Shopify GraphQL `financial_status:partially_refunded` orders
-- are filtered out). Admin attaches the order to the customer's open
-- deposit_only journey, optionally overrides commission_eligible_subtotal
-- (e.g. the post-refund amount), and the RPC recomputes + auto-promotes
-- deposit_only → confirmed if the cumulative `confirmation_subtotal`
-- passes the confirmation threshold.
--
-- IMPORTANT semantic detail: `confirmation_subtotal` accumulates ONLY
-- confirmation-part orders. The $500 deposit lives in a separate column
-- (`deposit_subtotal`) and does NOT count toward the threshold — matches
-- the webhook's promotion check exactly (handleOrderPaid:
-- `if (wasDepositOnly && newConfirmation >= confirmationMin)`).

-- 1) Extend the audit-action enum.
alter table public.admin_order_corrections
  drop constraint if exists admin_order_corrections_action_check;
alter table public.admin_order_corrections
  add constraint admin_order_corrections_action_check
  check (action in ('remove','reassign','edit_eligible','manual_add','link_to_journey'));

-- 2) RPC: admin_link_order_to_journey
create or replace function public.admin_link_order_to_journey(
  p_order_id uuid,
  p_journey_id uuid,
  p_new_eligible numeric,  -- nullable; pass null to keep the existing eligible
  p_reason text
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_order record;
  v_journey record;
  v_old_journey_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_confirm_subtotal numeric;
  v_min numeric;
  v_new_state text;
  v_actor_handle text;
  v_eligible_to_store numeric;
  v_new_classification text;
begin
  if not is_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;

  if p_reason is null or trim(p_reason) = '' then
    raise exception 'reason required';
  end if;

  select * into v_order from ambassador_orders where id = p_order_id;
  if not found then raise exception 'order not found'; end if;
  if v_order.removed_at is not null then raise exception 'order is removed; restore it first'; end if;

  select * into v_journey from ambassador_journeys where id = p_journey_id;
  if not found then raise exception 'journey not found'; end if;

  if v_order.ambassador_id <> v_journey.ambassador_id then
    raise exception 'order and journey belong to different ambassadors — reassign the order first';
  end if;

  v_old_journey_id := v_order.journey_id;
  v_eligible_to_store := coalesce(p_new_eligible, v_order.commission_eligible_subtotal);
  v_new_classification := case
    when v_journey.state = 'deposit_only' then 'confirmation_part'
    when v_journey.state = 'walk_in' then 'walk_in_part'
    when v_journey.state = 'confirmed' then 'confirmation_part'
    else v_order.classification
  end;

  v_before := jsonb_build_object(
    'journey_id', v_order.journey_id,
    'commission_eligible_subtotal', v_order.commission_eligible_subtotal,
    'classification', v_order.classification,
    'journey_state', v_journey.state,
    'journey_confirmation_subtotal_before', v_journey.confirmation_subtotal,
    'journey_commission_eligible_total_before', v_journey.commission_eligible_total
  );

  -- Link the order + apply the override + re-classify.
  update ambassador_orders
  set journey_id = p_journey_id,
      commission_eligible_subtotal = v_eligible_to_store,
      classification = v_new_classification
  where id = p_order_id;

  -- Recompute confirmation_subtotal — sums NON-deposit orders' subtotals.
  -- The deposit lives in a separate column (deposit_subtotal); including
  -- it here would diverge from the webhook's semantics and break the
  -- threshold check (which only cares about confirmation parts).
  update ambassador_journeys
  set confirmation_subtotal = (
    select coalesce(sum(subtotal), 0)
    from ambassador_orders
    where journey_id = p_journey_id
      and removed_at is null
      and classification <> 'deposit'
  )
  where id = p_journey_id;

  -- Recompute commission_eligible_total + commission_amount.
  perform recompute_journey(p_journey_id);

  -- State promotion: deposit_only → confirmed when cumulative
  -- confirmation_subtotal passes the configured confirmation_min
  -- (default $5,000). Matches the webhook's promotion logic exactly.
  select coalesce((select confirmation_min from commission_config limit 1), 5000) into v_min;
  select confirmation_subtotal, state into v_confirm_subtotal, v_new_state
    from ambassador_journeys where id = p_journey_id;

  if v_new_state = 'deposit_only' and v_confirm_subtotal >= v_min then
    update ambassador_journeys
    set state = 'confirmed',
        confirmed_at = coalesce(confirmed_at, now())
    where id = p_journey_id;
    v_new_state := 'confirmed';
  end if;

  -- Recompute the old journey too (it loses this order's contribution).
  if v_old_journey_id is not null and v_old_journey_id <> p_journey_id then
    update ambassador_journeys
    set confirmation_subtotal = (
      select coalesce(sum(subtotal), 0)
      from ambassador_orders
      where journey_id = v_old_journey_id
        and removed_at is null
        and classification <> 'deposit'
    )
    where id = v_old_journey_id;
    perform recompute_journey(v_old_journey_id);
  end if;

  v_after := jsonb_build_object(
    'journey_id', p_journey_id,
    'commission_eligible_subtotal', v_eligible_to_store,
    'classification', v_new_classification,
    'journey_state', v_new_state,
    'journey_confirmation_subtotal_after', v_confirm_subtotal
  );

  select handle into v_actor_handle from profiles where id = auth.uid();

  insert into admin_order_corrections(
    actor_id, actor_handle, action, target_order_id,
    from_ambassador_id, to_ambassador_id,
    before_state, after_state, reason
  ) values (
    auth.uid(), v_actor_handle, 'link_to_journey', p_order_id,
    v_order.ambassador_id, v_journey.ambassador_id,
    v_before, v_after, p_reason
  );
end;
$$;

grant execute on function public.admin_link_order_to_journey(uuid, uuid, numeric, text) to authenticated;
