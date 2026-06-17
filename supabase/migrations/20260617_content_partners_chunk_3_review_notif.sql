-- ============================================================================
-- CONTENT PARTNERS — Chunk 3: admin review notification type
-- ============================================================================
-- Widens the notifications.type CHECK enum to include
-- 'content_partner_review' — fired by the admin review action so the
-- partner gets a bell entry + push when their submission is approved /
-- adjusted / rejected. Tracks the same wrapper pattern as gear_drop_*
-- and bug_report notifications (no separate plumbing — leans on the
-- existing notifications_send_push trigger to fan to web push).
--
-- Idempotent — re-running is safe.
-- ============================================================================

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'like','comment','mention','reply','follow','rsvp','role','recovery','convoy',
      'bug_fix','bug_report','content_report',
      'gear_drop_signup','gear_drop_unlock','gear_drop_won','gear_drop_winner','gear_drop_announcement',
      'content_partner_review'
    )
  );

notify pgrst, 'reload schema';
