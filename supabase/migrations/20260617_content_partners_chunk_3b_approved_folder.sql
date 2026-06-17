-- ============================================================================
-- CONTENT PARTNERS — Chunk 3b: separate Dropbox approved-content folder
-- ============================================================================
-- Per Kyle's feedback after the first round of partner-side testing:
-- the partner needs visibility into TWO Dropbox folders, not one.
--   • dropbox_upload_folder_url       — where the partner uploads pending
--                                       content; visible on their dashboard
--                                       behind the DROPBOX FOLDER button +
--                                       opened automatically when they
--                                       submit an inventory report.
--   • dropbox_approved_folder_url     — NEW. Where admin moves content
--                                       after it's been approved. Visible
--                                       on the partner dashboard so they
--                                       can see what's been credited.
-- Both URLs are admin-set on the contract editor; both are optional.
-- Idempotent — re-running is safe.
-- ============================================================================

alter table public.content_partners
  add column if not exists dropbox_approved_folder_url text;

comment on column public.content_partners.dropbox_approved_folder_url is
  'Optional Dropbox URL pointing at the folder where admin moves approved content. Surfaces on the partner dashboard alongside the upload folder so the partner can see what made it through review.';

notify pgrst, 'reload schema';
