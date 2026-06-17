-- ============================================================================
-- CONTENT PARTNERS — Chunk 1b: custom quota kinds + per-quota notes
-- ============================================================================
-- Per Kyle's request after the first round of admin form testing:
--   • Quota `kind` was originally locked to a 4-value CHECK constraint
--     (photo / short_video / long_video / basecamp_video). Admin needs
--     to be able to add custom quota types (e.g. 'instagram_story',
--     'newsletter_feature', sponsored TikTok…) per contract. Drop the
--     CHECK on both content_partner_quotas.kind AND
--     content_partner_deliverables.kind. App-side validation enforces
--     that deliverable kinds reference an existing quota for the partner.
--   • Add optional `label` (human-readable display name for custom
--     kinds — null on built-ins so the UI keeps the canonical label
--     from CONTENT_PARTNER_KIND_LABEL) and `notes` (admin-only context
--     for the quota) columns to content_partner_quotas.
-- Idempotent — re-running is safe.
-- ============================================================================

-- Drop the CHECK enums on kind columns. Re-running is safe with IF EXISTS.
alter table public.content_partner_quotas
  drop constraint if exists content_partner_quotas_kind_check;
alter table public.content_partner_deliverables
  drop constraint if exists content_partner_deliverables_kind_check;

-- Optional fields on quotas.
alter table public.content_partner_quotas
  add column if not exists label text,
  add column if not exists notes text;

comment on column public.content_partner_quotas.label is
  'Human-readable display name. NULL on built-in kinds (photo / short_video / long_video / basecamp_video); the client falls back to the canonical CONTENT_PARTNER_KIND_LABEL map. REQUIRED for custom kinds so the partner dashboard can render them.';
comment on column public.content_partner_quotas.notes is
  'Admin-only notes about this quota line. E.g. format guidance, brief context, or a link to the campaign brief. Surfaced under the quota inputs in the editor.';

notify pgrst, 'reload schema';
