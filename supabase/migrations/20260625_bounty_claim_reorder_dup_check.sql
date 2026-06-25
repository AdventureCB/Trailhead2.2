-- ─────────────────────────────────────────────────────────────────────────────
-- claim_bounty: check for existing user submission BEFORE slot-cap check
-- ─────────────────────────────────────────────────────────────────────────────
-- Previously the slot-cap check fired before the "does this user already have
-- an active submission for this bounty?" check. That meant a user who already
-- held the only slot couldn't reclaim their own submission if their local
-- cache drifted (e.g. realtime missed the delivery, or they signed in from a
-- new device) — they'd hit "claim_bounty: all slots are claimed" even though
-- the slot was already theirs.
--
-- This reorder makes the duplicate-check authoritative: if the caller already
-- has an active submission, return it. Only check the slot cap when actually
-- inserting a new row.
-- ─────────────────────────────────────────────────────────────────────────────

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
begin
  if v_uid is null then raise exception 'claim_bounty: not authenticated'; end if;
  if p_bounty_id is null then raise exception 'claim_bounty: bounty id required'; end if;

  -- Lock the bounty row so concurrent claims serialize against the slot counter.
  select id, status, starts_at, deadline_at, total_slots, claimed_slots
    into v_bounty
    from public.bounties
    where id = p_bounty_id
    for update;

  if not found then raise exception 'claim_bounty: bounty not found'; end if;

  -- ── Reclaim path FIRST ──
  -- If the caller already owns an active submission for this bounty, return
  -- it without re-validating slot/window — the slot was already counted.
  select id, status into v_existing, v_existing_status
    from public.bounty_submissions
    where bounty_id = p_bounty_id and user_id = v_uid
      and status not in ('rejected', 'withdrawn')
    limit 1;

  if v_existing is not null then
    return query select v_existing, v_existing_status;
    return;
  end if;

  -- ── New claim path ──
  -- Validate the bounty is currently claimable.
  if v_bounty.status <> 'open' then raise exception 'claim_bounty: bounty is not open (status=%)', v_bounty.status; end if;
  if v_bounty.starts_at is not null and v_bounty.starts_at > v_now then
    raise exception 'claim_bounty: bounty has not started yet';
  end if;
  if v_bounty.deadline_at <= v_now then
    raise exception 'claim_bounty: bounty deadline has passed';
  end if;
  if v_bounty.claimed_slots >= v_bounty.total_slots then
    raise exception 'claim_bounty: all slots are claimed';
  end if;

  insert into public.bounty_submissions (bounty_id, user_id, status, draft)
  values (p_bounty_id, v_uid, 'claimed', '{}'::jsonb)
  returning id into v_sub_id;

  update public.bounties
     set claimed_slots = claimed_slots + 1
   where id = p_bounty_id;

  return query select v_sub_id, 'claimed'::text;
end;
$$;
