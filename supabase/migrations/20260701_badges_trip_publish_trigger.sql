-- ─────────────────────────────────────────────────────────────────────────────
-- Badges — auto-recompute on trip_reports.status → 'published'
-- ─────────────────────────────────────────────────────────────────────────────
-- Gap found during badge audit (2026-07-01):
--   • Trail Mastery counts published trip_reports (kind='report').
--   • The client's publishTripDraft flips the row's status to 'published'
--     but does NOT call awardPoints, so the award_points → recompute_badges
--     chain never fires.
--   • admin_approve_bounty's Route Report path also just UPDATEs the linked
--     trip to 'published' (no reward_points, no explicit recompute call
--     for the trip owner beyond the bounty-approve trigger which already
--     runs but only covers bounty_hunter / demo_specialist categories).
--
-- Both paths converge on a SQL UPDATE, so a status-transition trigger on
-- trip_reports covers every publish route — client edit, bounty approval,
-- future admin-side backfills — without any client changes.
--
-- Fires only when status transitions INTO 'published' (INSERT with that
-- status, or UPDATE crossing over). No-op on re-saves that keep status
-- at 'published'. Wrapped in EXCEPTION so a badge-side failure can never
-- block the publish itself.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.recompute_badges_on_trip_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published'
     and coalesce(new.kind, 'report') = 'report'
     and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    begin
      perform public.recompute_badges(new.user_id);
    exception when others then
      raise notice 'recompute_badges (trip publish trigger) failed for %: %', new.user_id, sqlerrm;
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists trip_reports_recompute_badges on public.trip_reports;
create trigger trip_reports_recompute_badges
  after insert or update of status on public.trip_reports
  for each row
  execute function public.recompute_badges_on_trip_publish();

notify pgrst, 'reload schema';
