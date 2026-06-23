-- ─────────────────────────────────────────────────────────────────────────────
-- Ranks + Bounties — Phase 6: admin review queue + reward
-- ─────────────────────────────────────────────────────────────────────────────
-- Spec: project_ranks_bounties_spec.md
--
-- What this ships:
--   1. bounty_earnings per-user denorm (total_earned / pending / paid in cents)
--   2. recompute_bounty_earnings(p_user_id) + trigger on bounty_submissions
--   3. admin_request_changes(p_submission_id, p_reviewer_notes)
--   4. admin_reject_bounty(p_submission_id, p_reviewer_notes)
--   5. admin_approve_bounty(p_submission_id, p_reviewer_notes, p_publish_options)
--      — snapshots rewards, calls inlined points-award (mirror of award_points
--      so we don't depend on caller's auth.uid()), walks badge ladder, fires
--      bounty_approved notification. Publishing is deferred to Phase 8 — we
--      stash publish_options into the submission's draft jsonb under
--      `_publish_options` so the Phase 8 pipeline can act on it later.
--
-- Notifications enum was already extended in Phase 5 — no constraint change
-- needed here.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── bounty_earnings denorm ──
create table if not exists public.bounty_earnings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_earned_cents bigint not null default 0,
  total_pending_cents bigint not null default 0,
  total_paid_cents bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.bounty_earnings enable row level security;

-- Owner SELECT only — earnings are private (cash amounts).
drop policy if exists bounty_earnings_owner_select on public.bounty_earnings;
create policy bounty_earnings_owner_select on public.bounty_earnings
  for select using (auth.uid() = user_id);

-- Admin SELECT all for the payout queue (Phase 7).
drop policy if exists bounty_earnings_admin_select on public.bounty_earnings;
create policy bounty_earnings_admin_select on public.bounty_earnings
  for select using (public.is_admin(auth.uid()));

-- Realtime so the user's earnings card updates the moment an admin approves.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bounty_earnings'
  ) then
    alter publication supabase_realtime add table public.bounty_earnings;
  end if;
end$$;

alter table public.bounty_earnings replica identity full;

-- ── recompute_bounty_earnings helper ──
-- Re-sums the user's bounty_submissions in three buckets:
--   total_earned  = sum(reward_cents) where status='approved'           (lifetime ever-approved)
--   total_pending = approved + payout_status='pending'                  (admin owes this)
--   total_paid    = payout_status='paid'                                (already disbursed)
create or replace function public.recompute_bounty_earnings(
  p_user_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if p_user_id is null then return; end if;
  insert into public.bounty_earnings (user_id, total_earned_cents, total_pending_cents, total_paid_cents, updated_at)
  select
    p_user_id,
    coalesce(sum(coalesce(reward_cents, 0)) filter (where status = 'approved'), 0)::bigint,
    coalesce(sum(coalesce(reward_cents, 0)) filter (where status = 'approved' and payout_status = 'pending'), 0)::bigint,
    coalesce(sum(coalesce(reward_cents, 0)) filter (where payout_status = 'paid'), 0)::bigint,
    now()
  from public.bounty_submissions
  where user_id = p_user_id
  on conflict (user_id) do update set
    total_earned_cents = excluded.total_earned_cents,
    total_pending_cents = excluded.total_pending_cents,
    total_paid_cents = excluded.total_paid_cents,
    updated_at = now();
end;
$$;

revoke all on function public.recompute_bounty_earnings(uuid) from public;
grant execute on function public.recompute_bounty_earnings(uuid) to authenticated;

-- ── Trigger: refresh bounty_earnings on every submission status change ──
create or replace function public._bounty_submissions_earnings_trigger() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recompute_bounty_earnings(coalesce(new.user_id, old.user_id));
  return null;
end;
$$;

drop trigger if exists bounty_submissions_earnings_sync on public.bounty_submissions;
create trigger bounty_submissions_earnings_sync
  after insert or update or delete on public.bounty_submissions
  for each row execute function public._bounty_submissions_earnings_trigger();

-- ── admin_request_changes RPC ──
create or replace function public.admin_request_changes(
  p_submission_id uuid,
  p_reviewer_notes text
) returns table(submission_id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_sub record;
  v_bounty record;
  v_actor record;
begin
  if not public.is_admin(v_uid) then raise exception 'admin_request_changes: not authorized'; end if;
  if p_submission_id is null then raise exception 'admin_request_changes: submission id required'; end if;
  if p_reviewer_notes is null or btrim(p_reviewer_notes) = '' then
    raise exception 'admin_request_changes: reviewer notes are required';
  end if;

  select id, user_id, bounty_id, status from public.bounty_submissions where id = p_submission_id into v_sub;
  if not found then raise exception 'admin_request_changes: submission not found'; end if;
  if v_sub.status <> 'submitted' then
    raise exception 'admin_request_changes: submission is not pending review (status=%)', v_sub.status;
  end if;

  update public.bounty_submissions
     set status = 'changes_requested',
         reviewed_by = v_uid,
         reviewed_at = now(),
         reviewer_notes = p_reviewer_notes
   where id = p_submission_id;

  -- Notify the submitter.
  begin
    select title from public.bounties where id = v_sub.bounty_id into v_bounty;
    select full_name, handle from public.profiles where id = v_uid into v_actor;
    insert into public.notifications (user_id, type, actor_id, actor_name, text, target)
    values (
      v_sub.user_id,
      'bounty_changes_requested',
      v_uid,
      coalesce(v_actor.full_name, v_actor.handle, 'Admin'),
      'requested changes on your bounty submission',
      coalesce(v_bounty.title, 'Bounty')
    );
  exception when others then raise notice 'request_changes notif failed: %', sqlerrm; end;

  return query select p_submission_id, 'changes_requested'::text;
end;
$$;

revoke all on function public.admin_request_changes(uuid, text) from public;
grant execute on function public.admin_request_changes(uuid, text) to authenticated;

-- ── admin_reject_bounty RPC ──
create or replace function public.admin_reject_bounty(
  p_submission_id uuid,
  p_reviewer_notes text
) returns table(submission_id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_sub record;
  v_bounty record;
  v_actor record;
begin
  if not public.is_admin(v_uid) then raise exception 'admin_reject_bounty: not authorized'; end if;
  if p_submission_id is null then raise exception 'admin_reject_bounty: submission id required'; end if;
  if p_reviewer_notes is null or btrim(p_reviewer_notes) = '' then
    raise exception 'admin_reject_bounty: reviewer notes are required';
  end if;

  select id, user_id, bounty_id, status from public.bounty_submissions where id = p_submission_id into v_sub;
  if not found then raise exception 'admin_reject_bounty: submission not found'; end if;
  if v_sub.status <> 'submitted' then
    raise exception 'admin_reject_bounty: submission is not pending review (status=%)', v_sub.status;
  end if;

  update public.bounty_submissions
     set status = 'rejected',
         reviewed_by = v_uid,
         reviewed_at = now(),
         reviewer_notes = p_reviewer_notes
   where id = p_submission_id;

  -- Release the slot so another user can claim it.
  update public.bounties
     set claimed_slots = greatest(claimed_slots - 1, 0)
   where id = v_sub.bounty_id;

  -- Notify the submitter.
  begin
    select title from public.bounties where id = v_sub.bounty_id into v_bounty;
    select full_name, handle from public.profiles where id = v_uid into v_actor;
    insert into public.notifications (user_id, type, actor_id, actor_name, text, target)
    values (
      v_sub.user_id,
      'bounty_rejected',
      v_uid,
      coalesce(v_actor.full_name, v_actor.handle, 'Admin'),
      'rejected your bounty submission',
      coalesce(v_bounty.title, 'Bounty')
    );
  exception when others then raise notice 'reject notif failed: %', sqlerrm; end;

  return query select p_submission_id, 'rejected'::text;
end;
$$;

revoke all on function public.admin_reject_bounty(uuid, text) from public;
grant execute on function public.admin_reject_bounty(uuid, text) to authenticated;

-- ── admin_approve_bounty RPC ──
-- Snapshots reward_cents + reward_points at approval, flips status, awards
-- points server-side (inline mirror of award_points since we're awarding on
-- behalf of another user), walks the badge ladder, fires bounty_approved
-- notification, stashes publish_options in the draft for Phase 8 to act on.
--
-- Why inline award instead of `perform award_points(...)`: award_points reads
-- auth.uid() as the recipient. Calling it from admin_approve_bounty would
-- credit the admin instead of the submitter. So we replicate the ledger
-- + profile bump + badge recompute here, scoped to the submitter's uid.
create or replace function public.admin_approve_bounty(
  p_submission_id uuid,
  p_reviewer_notes text default null,
  p_publish_options jsonb default null
) returns table(
  submission_id uuid,
  status text,
  reward_cents int,
  reward_points int
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
  v_actor record;
  v_reward_cents int;
  v_reward_points int;
begin
  if not public.is_admin(v_uid) then raise exception 'admin_approve_bounty: not authorized'; end if;
  if p_submission_id is null then raise exception 'admin_approve_bounty: submission id required'; end if;

  select id, user_id, bounty_id, status, draft from public.bounty_submissions where id = p_submission_id into v_sub;
  if not found then raise exception 'admin_approve_bounty: submission not found'; end if;
  if v_sub.status <> 'submitted' then
    raise exception 'admin_approve_bounty: submission is not pending review (status=%)', v_sub.status;
  end if;

  -- Snapshot the bounty's current rewards.
  select reward_cents, reward_points, title from public.bounties where id = v_sub.bounty_id into v_bounty;
  v_reward_cents := coalesce(v_bounty.reward_cents, 0);
  v_reward_points := coalesce(v_bounty.reward_points, 0);

  update public.bounty_submissions
     set status = 'approved',
         reviewed_by = v_uid,
         reviewed_at = now(),
         reviewer_notes = p_reviewer_notes,
         reward_cents = v_reward_cents,
         reward_points = v_reward_points,
         draft = case
           when p_publish_options is not null then v_sub.draft || jsonb_build_object('_publish_options', p_publish_options)
           else v_sub.draft
         end
   where id = p_submission_id;

  -- Increment approved_slots on the bounty (admin can choose to close the
  -- bounty when approved_slots >= total_slots; we don't auto-close so admin
  -- can still publish a runner-up if they want — preserves Phase 7 payout
  -- flexibility).
  update public.bounties
     set approved_slots = approved_slots + 1
   where id = v_sub.bounty_id;

  -- Award points — inline mirror of award_points, scoped to submitter's uid.
  if v_reward_points > 0 then
    begin
      insert into public.points_log (user_id, kind, amount, ref_id, ref_type)
      values (v_sub.user_id, 'bounty_approved', v_reward_points, p_submission_id, 'bounty_submission');

      update public.profiles
         set points = points + v_reward_points,
             points_breakdown = points_breakdown || jsonb_build_object(
               'bounty_approved',
               coalesce((points_breakdown ->> 'bounty_approved')::int, 0) + v_reward_points
             )
       where id = v_sub.user_id;

      perform public.recompute_badges(v_sub.user_id);
    exception when others then
      raise notice 'admin_approve_bounty: points award failed for %: %', v_sub.user_id, sqlerrm;
    end;
  end if;

  -- Notify the submitter. Body wraps the actual reward amounts so the toast
  -- + push fan-out carry the punch line ("approved your bounty for $50 + 100 pts").
  begin
    select full_name, handle from public.profiles where id = v_uid into v_actor;
    insert into public.notifications (user_id, type, actor_id, actor_name, text, target)
    values (
      v_sub.user_id,
      'bounty_approved',
      v_uid,
      coalesce(v_actor.full_name, v_actor.handle, 'Admin'),
      case
        when v_reward_cents > 0 and v_reward_points > 0 then 'approved your bounty for $' || (v_reward_cents / 100)::text || ' + ' || v_reward_points::text || ' pts'
        when v_reward_cents > 0 then 'approved your bounty for $' || (v_reward_cents / 100)::text
        when v_reward_points > 0 then 'approved your bounty for ' || v_reward_points::text || ' pts'
        else 'approved your bounty submission'
      end,
      coalesce(v_bounty.title, 'Bounty')
    );
  exception when others then raise notice 'approve notif failed: %', sqlerrm; end;

  return query select p_submission_id, 'approved'::text, v_reward_cents, v_reward_points;
end;
$$;

revoke all on function public.admin_approve_bounty(uuid, text, jsonb) from public;
grant execute on function public.admin_approve_bounty(uuid, text, jsonb) to authenticated;
