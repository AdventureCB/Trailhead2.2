-- ============================================================================
-- BOUNTIES — switch slot cap from "claimed" to "submitted"
-- ============================================================================
-- Previously the slot counter capped at the moment of CLAIM, which meant a
-- claimer who never followed through occupied a slot forever (or until they
-- manually withdrew). That tanked completion rates — a single hesitant
-- claimer could block the bounty for everyone.
--
-- New model: anyone can claim while there are still unfilled SUBMISSION
-- slots. The bounty only becomes "full" once total_slots submissions land
-- (status IN 'submitted'/'approved'). That maximizes the chance the bounty
-- actually gets done.
--
-- Per-user OPEN/MINE filtering (client-side) still hides claimed bounties
-- from the user's OPEN pill so one person can't double-claim — see the
-- bounties.filter() change in trailhead-v1.jsx.
--
-- `bounties.claimed_slots` stays in the schema for back-compat + as an
-- informational counter (admin dashboard "X people working on this"), but
-- it no longer drives the cap. Both claim_bounty and submit_bounty now
-- count active submissions live before deciding.
--
-- Idempotent.
-- ============================================================================

-- ── claim_bounty: count SUBMITTED+APPROVED instead of claimed_slots ────────
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
  -- submitted-count check below.
  select id, status, starts_at, deadline_at, total_slots, claimed_slots
    into v_bounty
    from public.bounties
    where id = p_bounty_id
    for update;

  if not found then raise exception 'claim_bounty: bounty not found'; end if;

  -- ── Reclaim path FIRST ──
  -- If the caller already owns an active submission for this bounty, return
  -- it without re-validating slot/window — they're already in.
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

-- ── submit_bounty: enforce the same submitted-count cap on the write side
--    so a race between two concurrent submits can't blow past total_slots.
create or replace function public.submit_bounty(
  p_submission_id uuid,
  p_draft jsonb default null
) returns table(
  submission_id uuid,
  status text,
  submitted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_sub record;
  v_bounty record;
  v_now timestamptz := now();
  v_actor record;
  v_filled int;
  admin_row record;
begin
  if v_uid is null then raise exception 'submit_bounty: not authenticated'; end if;
  if p_submission_id is null then raise exception 'submit_bounty: submission id required'; end if;

  select id, user_id, bounty_id, status, draft from public.bounty_submissions where id = p_submission_id into v_sub;
  if not found then raise exception 'submit_bounty: submission not found'; end if;
  if v_sub.user_id <> v_uid then raise exception 'submit_bounty: not authorized'; end if;
  if v_sub.status not in ('claimed', 'in_progress', 'changes_requested') then
    raise exception 'submit_bounty: cannot submit in status %', v_sub.status;
  end if;

  -- Lock the parent bounty so the cap check below sees a stable count
  -- against concurrent submits from other users on the same bounty.
  select id, total_slots from public.bounties where id = v_sub.bounty_id for update into v_bounty;
  if not found then raise exception 'submit_bounty: parent bounty not found'; end if;

  -- Cap check: counting CURRENTLY-submitted+approved rows excluding this
  -- one (which is still 'claimed'/'in_progress'/'changes_requested' until
  -- the update below). If the cap is already met, refuse — this submission
  -- arrived after the bounty was effectively closed by other finishers.
  select count(*) into v_filled
    from public.bounty_submissions
    where bounty_id = v_sub.bounty_id
      and status in ('submitted', 'approved')
      and id <> p_submission_id;
  if v_filled >= v_bounty.total_slots then
    raise exception 'submit_bounty: all slots are filled — beaten to the punch';
  end if;

  if p_draft is not null and jsonb_typeof(p_draft) = 'object' then
    v_sub.draft := p_draft;
  end if;
  if v_sub.draft is null or v_sub.draft = '{}'::jsonb then
    raise exception 'submit_bounty: draft is empty';
  end if;

  update public.bounty_submissions
     set draft = v_sub.draft,
         status = 'submitted',
         submitted_at = v_now
   where id = p_submission_id;

  -- Notif fan-out (admins). Best-effort.
  begin
    select id, full_name, handle, title from public.bounties where id = v_sub.bounty_id into v_bounty;
    select handle, full_name from public.profiles where id = v_uid into v_actor;
    for admin_row in
      select id from public.profiles where role = 'admin' and id <> v_uid
    loop
      insert into public.notifications (user_id, type, actor_id, actor_name, text, target)
      values (
        admin_row.id,
        'bounty_submitted',
        v_uid,
        coalesce(v_actor.full_name, v_actor.handle, 'A user'),
        'submitted a bounty for review',
        coalesce(v_bounty.title, 'Bounty')
      );
    end loop;
  exception when others then
    raise notice 'submit_bounty: notif fan-out failed: %', sqlerrm;
  end;

  return query select p_submission_id, 'submitted'::text, v_now;
end;
$$;

revoke all on function public.submit_bounty(uuid, jsonb) from public;
grant execute on function public.submit_bounty(uuid, jsonb) to authenticated;

notify pgrst, 'reload schema';
