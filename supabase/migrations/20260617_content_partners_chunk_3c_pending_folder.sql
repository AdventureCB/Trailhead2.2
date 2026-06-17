-- ============================================================================
-- CONTENT PARTNERS — Chunk 3c: split the upload request from the pending view
-- ============================================================================
-- After Kyle tested chunk 3b, it turned out the Dropbox URL model needs
-- THREE links per contract, not two:
--   • dropbox_upload_folder_url   — repurposed as the FILE REQUEST URL.
--                                   The partner submits content here via
--                                   the upload modal's submit button —
--                                   Dropbox's file-request endpoints don't
--                                   let you browse the folder, only put
--                                   files in. (Column name kept for
--                                   continuity; UI label updated to
--                                   "DROPBOX UPLOAD REQUEST URL".)
--   • dropbox_pending_folder_url  — NEW. View link for the partner's
--                                   PENDING uploads (the folder Dropbox
--                                   drops file-request submissions into).
--                                   Lets them confirm what landed before
--                                   admin reviews it.
--   • dropbox_approved_folder_url — Unchanged. View link for content the
--                                   admin has moved to the approved bucket.
-- All three URLs are admin-set on the editor, all optional.
-- Idempotent — re-running is safe.
-- ============================================================================

alter table public.content_partners
  add column if not exists dropbox_pending_folder_url text;

comment on column public.content_partners.dropbox_upload_folder_url is
  'Dropbox FILE REQUEST URL (not a folder browse URL). Used by the UPLOAD CONTENT submit on the partner dashboard so the partner can actually drop files in. Cannot be used to view folder contents.';
comment on column public.content_partners.dropbox_pending_folder_url is
  'Optional Dropbox VIEW URL for the partner''s pending uploads. Surfaces on the partner dashboard so they can confirm what landed before admin reviews it. Distinct from dropbox_upload_folder_url which is the file-request URL.';

notify pgrst, 'reload schema';
