-- ============================================================================
-- DEMO REQUEST — 48hr scheduling auto-withdraw sweeper
-- ============================================================================
-- The Demo Request flow ships with a UI countdown (48hr from
-- draft.accepted_at) but no server-side enforcement. If the participant
-- accepts then disappears (never gets a customer to lock in a slot), the
-- bounty slot is held forever and the customer can't reopen the bounty.
--
-- This migration installs:
--   1. `bounty_expired` value added to notifications.type CHECK
--   2. `sweep_demo_request_stale_claims()` SECURITY DEFINER function that
--      walks bounty_submissions in claimed/in_progress on a Demo Request
--      bounty where draft.accepted_at is older than 48hr AND no
--      scheduled_at lock-in. Deletes each, decrements claimed_slots,
--      inserts a `bounty_expired` notification.
--   3. pg_cron schedule running every 15 minutes.
--
-- Why DELETE (not soft-status='withdrawn'): mirrors withdraw_bounty's
-- existing behavior. The bounty_submissions table has no 'withdrawn'
-- status, only an implicit delete — so an expired auto-withdraw and a
-- voluntary withdraw look identical.
--
-- Why 15min cadence: balances slot-release latency (worst case 15min
-- past the 48hr mark) vs cron load. Demo requests don't churn fast
-- enough to need anything tighter.
--
-- Idempotent.
-- ============================================================================

-- ── 1. Widen notifications.type CHECK ──
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'like','comment','mention','reply','follow','rsvp','role','recovery','convoy',
      'bug_fix','bug_report','content_report',
      'gear_drop_signup','gear_drop_unlock','gear_drop_won','gear_drop_winner','gear_drop_announcement',
      'content_partner_review',
      'bounty_published','bounty_submitted','bounty_changes_requested','bounty_approved','bounty_rejected','bounty_payout_received','points_milestone',
      'bounty_expired'
    )
  );

-- ── 2. Sweeper function ──
create or replace function public.sweep_demo_request_stale_claims()
returns int
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_row record;
  v_count int := 0;
  v_bounty record;
begin
  -- Walk every stale Demo Request claim that has hit the 48hr scheduling
  -- deadline without locking in a schedule. SKIP LOCKED keeps two
  -- concurrent sweeper invocations from racing on the same row.
  for v_row in
    select s.id, s.user_id, s.bounty_id, s.draft
      from public.bounty_submissions s
      join public.bounties b on b.id = s.bounty_id
      where b.category = 'Demo Request'
        and s.status in ('claimed', 'in_progress', 'changes_requested')
        and (s.draft->>'accepted_at') is not null
        and (s.draft->>'scheduled_at') is null
        and (s.draft->>'accepted_at')::timestamptz < now() - interval '48 hours'
      for update of s skip locked
  loop
    -- Fetch the bounty for the notification body (title for context).
    select id, title into v_bounty from public.bounties where id = v_row.bounty_id;

    -- Mirror withdraw_bounty: delete the submission + decrement counter.
    delete from public.bounty_submissions where id = v_row.id;
    update public.bounties
      set claimed_slots = greatest(claimed_slots - 1, 0)
      where id = v_row.bounty_id;

    -- Notify the participant. text + actor_name are NOT NULL — actor_id
    -- left null on purpose since this is a system action, not a user.
    -- The notifications_send_push trigger will fire web push.
    begin
      insert into public.notifications (user_id, type, actor_name, text, target)
      values (
        v_row.user_id,
        'bounty_expired',
        'Trailhead',
        'Your demo claim expired — you didn''t lock in a schedule within 48 hours. The slot is open again.',
        coalesce(v_bounty.title, 'Demo Request')
      );
    exception when others then
      raise notice 'sweep_demo_request_stale_claims: notif insert failed for sub %: %', v_row.id, sqlerrm;
    end;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.sweep_demo_request_stale_claims() from public;
-- Only the postgres role (cron job runner) should execute. No grants to
-- authenticated / anon — sweeper is a system-level action.

-- ── 3. pg_cron schedule ──
-- Supabase Pro tier has pg_cron available; create extension is a no-op
-- if already present. The job runs as the postgres role.
create extension if not exists pg_cron;

-- Unschedule any previous version of this job so this migration is
-- safe to re-run.
do $$
declare j record;
begin
  for j in select jobid from cron.job where jobname = 'sweep_demo_request_stale_claims' loop
    perform cron.unschedule(j.jobid);
  end loop;
end $$;

select cron.schedule(
  'sweep_demo_request_stale_claims',
  '*/15 * * * *',  -- every 15 minutes
  $cron$ select public.sweep_demo_request_stale_claims(); $cron$
);

notify pgrst, 'reload schema';
