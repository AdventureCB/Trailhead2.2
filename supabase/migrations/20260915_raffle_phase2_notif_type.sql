-- 2026-09-15: Event drawings Phase 2 — allow the 'raffle_won' notification.
--
-- Widen notifications.type to include 'raffle_won'. Rather than hardcode the
-- full whitelist (fragile — a missed in-use value makes the recreate fail
-- with a check-constraint violation), derive the allowed set dynamically:
-- every DISTINCT type already present in the table, UNION the known set,
-- UNION 'raffle_won'. This can never be violated by an existing row.
-- Insert is still gated by the actor_id = auth.uid() RLS policy.

do $$
declare
  v_list text;
begin
  select string_agg(quote_literal(t), ', ') into v_list
  from (
    select distinct t from (
      select type as t from public.notifications where type is not null
      union
      select unnest(array[
        'like','comment','mention','reply','follow','rsvp','role','recovery','convoy','convoy_invite',
        'bug_fix','bug_report','content_report','content_partner_review',
        'gear_drop_signup','gear_drop_unlock','gear_drop_won','gear_drop_winner','gear_drop_announcement',
        'payout_approved','payout_paid','bounty_payout_received','bounty_submitted','bounty_approved',
        'bounty_rejected','bounty_changes_requested','bounty_published','forum_reply','trip_report','bounty',
        'points_milestone','raffle_won'
      ])
    ) u
  ) s;

  execute 'alter table public.notifications drop constraint if exists notifications_type_check';
  execute 'alter table public.notifications add constraint notifications_type_check check (type in (' || v_list || '))';
end $$;

notify pgrst, 'reload schema';
