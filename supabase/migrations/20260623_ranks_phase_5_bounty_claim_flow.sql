-- ─────────────────────────────────────────────────────────────────────────────
-- Ranks + Bounties — Phase 5: user bounty claim + draft + submit + withdraw
-- ─────────────────────────────────────────────────────────────────────────────
-- Spec: project_ranks_bounties_spec.md
--
-- What this ships:
--   1. Widen bounty_submissions RLS — owner SELECT/UPDATE/DELETE on own
--      rows; INSERT still gated to the SECURITY DEFINER claim_bounty RPC
--      so the slot accounting stays atomic.
--   2. claim_bounty(p_bounty_id)   — locks row, validates open/deadline/slots,
--      INSERTs status='claimed', increments claimed_slots
--   3. save_bounty_draft(p_submission_id, p_draft) — owner patches draft jsonb;
--      auto-bumps status 'claimed' → 'in_progress' on first non-empty save
--   4. submit_bounty(p_submission_id, p_draft)     — status → 'submitted',
--      fans 'bounty_submitted' notifications to all admins
--   5. withdraw_bounty(p_submission_id)            — owner deletes row,
--      decrements claimed_slots on parent bounty
--   6. Widens notifications.type CHECK to include the full bounty set (we
--      pre-add Phase 6 + Phase 7 enum values too so we don't need a follow-up
--      patch on those phases).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Widen RLS on bounty_submissions ──
-- Owner SELECT already exists from Phase 4 (admin OR auth.uid()=user_id).
-- We add UPDATE + DELETE for owners. Owner can only UPDATE the draft +
-- when status is in the "editing" set; the submit / approve / reject paths
-- flip status via SECURITY DEFINER RPCs.

drop policy if exists bounty_submissions_owner_update on public.bounty_submissions;
create policy bounty_submissions_owner_update on public.bounty_submissions
  for update using (
    auth.uid() = user_id
    and status in ('claimed', 'in_progress', 'changes_requested')
  )
  with check (auth.uid() = user_id);

drop policy if exists bounty_submissions_owner_delete on public.bounty_submissions;
create policy bounty_submissions_owner_delete on public.bounty_submissions
  for delete using (
    auth.uid() = user_id
    and status in ('claimed', 'in_progress', 'changes_requested')
  );

-- ── claim_bounty RPC ──
-- Atomic claim: locks the bounty row with FOR UPDATE so concurrent claims
-- can't race past the slot cap. Validates open + within window + free slot
-- + no existing active submission from the same user.
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
  v_sub_id uuid;
begin
  if v_uid is null then raise exception 'claim_bounty: not authenticated'; end if;
  if p_bounty_id is null then raise exception 'claim_bounty: bounty id required'; end if;

  -- Lock the bounty row to serialize concurrent claims against its slot counter.
  select id, status, starts_at, deadline_at, total_slots, claimed_slots
    into v_bounty
    from public.bounties
    where id = p_bounty_id
    for update;

  if not found then raise exception 'claim_bounty: bounty not found'; end if;
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

  -- Block double-claim: if the user already has an active (not rejected/withdrawn)
  -- submission, reuse it rather than 4xx-ing.
  select id into v_existing
    from public.bounty_submissions
    where bounty_id = p_bounty_id and user_id = v_uid
      and status not in ('rejected', 'withdrawn')
    limit 1;

  if v_existing is not null then
    return query select v_existing, (select status from public.bounty_submissions where id = v_existing);
    return;
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

revoke all on function public.claim_bounty(uuid) from public;
grant execute on function public.claim_bounty(uuid) to authenticated;

-- ── save_bounty_draft RPC ──
-- Owner patches the draft jsonb. First non-empty save auto-bumps status from
-- 'claimed' → 'in_progress' so the UI can show RESUME instead of START.
-- Rejects writes on locked statuses (submitted/approved/rejected/withdrawn).
create or replace function public.save_bounty_draft(
  p_submission_id uuid,
  p_draft jsonb
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
  v_sub record;
  v_new_status text;
begin
  if v_uid is null then raise exception 'save_bounty_draft: not authenticated'; end if;
  if p_submission_id is null then raise exception 'save_bounty_draft: submission id required'; end if;

  select id, user_id, status from public.bounty_submissions where id = p_submission_id into v_sub;
  if not found then raise exception 'save_bounty_draft: submission not found'; end if;
  if v_sub.user_id <> v_uid then raise exception 'save_bounty_draft: not authorized'; end if;
  if v_sub.status not in ('claimed', 'in_progress', 'changes_requested') then
    raise exception 'save_bounty_draft: cannot edit submission in status %', v_sub.status;
  end if;

  -- First non-empty save promotes status (only on the 'claimed' edge).
  v_new_status := v_sub.status;
  if v_sub.status = 'claimed' and p_draft is not null and jsonb_typeof(p_draft) = 'object' and p_draft <> '{}'::jsonb then
    v_new_status := 'in_progress';
  end if;

  update public.bounty_submissions
     set draft = coalesce(p_draft, '{}'::jsonb),
         status = v_new_status
   where id = p_submission_id;

  return query select p_submission_id, v_new_status;
end;
$$;

revoke all on function public.save_bounty_draft(uuid, jsonb) from public;
grant execute on function public.save_bounty_draft(uuid, jsonb) to authenticated;

-- ── submit_bounty RPC ──
-- Status → 'submitted'. Fans a 'bounty_submitted' notification to every admin
-- so the review queue picks it up. Notification fan-out wrapped in EXCEPTION
-- per the pattern in feedback_notifications_require_text — a notif insert
-- failure can never block the submission itself.
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

  -- Apply the final draft patch in-place if provided.
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

  -- Fan-out 'bounty_submitted' notifs to all admins. Skip the submitter if they
  -- happen to be admin themselves.
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

-- ── withdraw_bounty RPC ──
-- Owner deletes their own submission + decrements claimed_slots on the parent
-- bounty. Can only withdraw pre-review (claimed / in_progress / changes_requested).
create or replace function public.withdraw_bounty(
  p_submission_id uuid
) returns table(
  withdrew boolean
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_sub record;
begin
  if v_uid is null then raise exception 'withdraw_bounty: not authenticated'; end if;
  if p_submission_id is null then raise exception 'withdraw_bounty: submission id required'; end if;

  select id, user_id, bounty_id, status from public.bounty_submissions where id = p_submission_id into v_sub;
  if not found then raise exception 'withdraw_bounty: submission not found'; end if;
  if v_sub.user_id <> v_uid then raise exception 'withdraw_bounty: not authorized'; end if;
  if v_sub.status not in ('claimed', 'in_progress', 'changes_requested') then
    raise exception 'withdraw_bounty: cannot withdraw in status %', v_sub.status;
  end if;

  delete from public.bounty_submissions where id = p_submission_id;
  update public.bounties
     set claimed_slots = greatest(claimed_slots - 1, 0)
   where id = v_sub.bounty_id;

  return query select true;
end;
$$;

revoke all on function public.withdraw_bounty(uuid) from public;
grant execute on function public.withdraw_bounty(uuid) to authenticated;

-- ── Widen notifications.type CHECK ──
-- Drop + re-add with the full set including Phase 5/6/7 bounty values.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'like','comment','mention','reply','follow','rsvp','role','recovery','convoy',
      'bug_fix','bug_report','content_report',
      'gear_drop_signup','gear_drop_unlock','gear_drop_won','gear_drop_winner','gear_drop_announcement',
      'content_partner_review',
      'bounty_published','bounty_submitted','bounty_changes_requested','bounty_approved','bounty_rejected','bounty_payout_received','points_milestone'
    )
  );
