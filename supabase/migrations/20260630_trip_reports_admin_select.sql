-- ─────────────────────────────────────────────────────────────────────────────
-- trip_reports — admin SELECT override
-- ─────────────────────────────────────────────────────────────────────────────
-- Admin needs to read participant-owned DRAFT trip_reports rows when
-- reviewing Route Report bounty submissions (the submission's draft jsonb
-- carries trip_report_id, and BountySubmissionReviewScreen fetches that
-- row to render the linked trip inline).
--
-- The existing SELECT policy is owner-only for drafts (and public-by-status
-- for everything else), so the admin's fetch silently returns 0 rows and the
-- UI surfaces a misleading "may have been deleted" error.
--
-- Pattern mirrors the admin UPDATE/DELETE overrides already in place — a
-- SEPARATE policy that Postgres ORs with the existing one.
--
-- Idempotent: drop-if-exists then create.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists trip_reports_admin_select on public.trip_reports;

create policy trip_reports_admin_select on public.trip_reports
  for select to authenticated
  using (public.is_admin(auth.uid()));

notify pgrst, 'reload schema';
