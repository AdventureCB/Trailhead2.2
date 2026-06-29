-- ============================================================================
-- DEMO REQUEST — block the customer from claiming their own demo bounty
-- ============================================================================
-- The customer assigned to a Demo Request (bounty.demo_customer_user_id) is
-- the person REQUESTING the demo — they should never be able to claim their
-- own bounty. Currently nothing in the RPC stops them; client UI can be
-- bypassed via DevTools.
--
-- Patches claim_bounty(p_bounty_id) to raise when:
--   bounty.category = 'Demo Request' AND auth.uid() = bounty.demo_customer_user_id
--
-- Check fires BEFORE the slot/window checks since it's an identity
-- gate, not a capacity gate. Reclaim path is unaffected — a customer
-- with an existing submission (shouldn't exist, but if it did via
-- migration) would still be allowed to re-fetch it; the new gate only
-- blocks fresh claims.
--
-- Idempotent — function replaced wholesale, same shape as the
-- 20260629_bounty_slot_cap_on_submitted.sql version + the self-claim
-- gate inserted right after the reclaim-path early return.
-- ============================================================================

create or replace function public.claim_bounty(
  p_bounty_id uuid
) returns table(
  submission_id uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_bounty record;
  v_now timestamptz := now();
  v_existing uuid;
  v_existing_status text;
  v_sub_id uuid;
  v_filled int;
begin
  if v_uid is null then raise exception 'claim_bounty: not authenticated'; end if;
  if p_bounty_id is null then raise exception 'claim_bounty: bounty id required'; end if;

  -- Lock the bounty row so concurrent submits/claims serialize against the
  -- submitted-count check below. Pull category + demo_customer_user_id so
  -- the self-claim guard below has everything it needs.
  select id, status, starts_at, deadline_at, total_slots, claimed_slots,
         category, demo_customer_user_id
    into v_bounty
    from public.bounties
    where id = p_bounty_id
    for update;

  if not found then raise exception 'claim_bounty: bounty not found'; end if;

  -- ── Reclaim path FIRST ──
  -- If the caller already owns an active submission for this bounty, return
  -- it without re-validating slot/window — they're already in. (Demo
  -- self-claim guard doesn't trip here because we only block FRESH claims.)
  select id, status into v_existing, v_existing_status
    from public.bounty_submissions
    where bounty_id = p_bounty_id and user_id = v_uid
      and status not in ('rejected', 'withdrawn')
    limit 1;

  if v_existing is not null then
    return query select v_existing, v_existing_status;
    return;
  end if;

  -- ── Demo Request self-claim guard ──
  -- The customer who requested the demo can't claim their own bounty.
  -- Identity check fires before slot/window so the error message is
  -- meaningful regardless of whether the bounty is full or expired.
  if v_bounty.category = 'Demo Request'
     and v_bounty.demo_customer_user_id is not null
     and v_bounty.demo_customer_user_id = v_uid then
    raise exception 'claim_bounty: you cant claim a demo you requested';
  end if;

  -- ── New claim path ──
  if v_bounty.status <> 'open' then raise exception 'claim_bounty: bounty is not open (status=%)', v_bounty.status; end if;
  if v_bounty.starts_at is not null and v_bounty.starts_at > v_now then
    raise exception 'claim_bounty: bounty has not started yet';
  end if;
  if v_bounty.deadline_at <= v_now then
    raise exception 'claim_bounty: bounty deadline has passed';
  end if;

  -- Cap is based on SUBMITTED/APPROVED count, not on claimed_slots. This
  -- lets multiple people claim concurrently — first total_slots to actually
  -- submit win. Race-safe because the bounty row is locked above.
  select count(*) into v_filled
    from public.bounty_submissions
    where bounty_id = p_bounty_id
      and status in ('submitted', 'approved');
  if v_filled >= v_bounty.total_slots then
    raise exception 'claim_bounty: all slots are filled';
  end if;

  insert into public.bounty_submissions (bounty_id, user_id, status, draft)
  values (p_bounty_id, v_uid, 'claimed', '{}'::jsonb)
  returning id into v_sub_id;

  -- Keep the informational counter in sync. Doesn't gate anything anymore
  -- but useful for "X people working on this" UI labels.
  update public.bounties
     set claimed_slots = claimed_slots + 1
   where id = p_bounty_id;

  return query select v_sub_id, 'claimed'::text;
end;
$$;

revoke all on function public.claim_bounty(uuid) from public;
grant execute on function public.claim_bounty(uuid) to authenticated;

notify pgrst, 'reload schema';
