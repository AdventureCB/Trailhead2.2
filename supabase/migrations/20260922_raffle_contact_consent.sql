-- ============================================================================
-- RAFFLE — sales-contact consent (required to enter)
-- ============================================================================
-- The entry page used to promise "we'll only use your phone if you win".
-- Consent to sales contact (phone / text / email, win or lose) is now a
-- CONDITION of entry: the client refuses to submit until the box is ticked
-- and stamps the consent on the row.
--
-- The sales software shares this database, so nothing is pushed anywhere —
-- it reads raffle_entries (+ the consent columns) directly. Where exactly it
-- wants the data is Kyle's call (instructions pending); this migration only
-- records consent. An earlier draft of this file wired a Pipedrive sync
-- (trigger + edge fn + crm_* columns) — that's retired; the DROPs below clean
-- it up if that draft was ever applied.
--
-- Idempotent.
-- ============================================================================

-- ── 1. Consent columns ──────────────────────────────────────────────────────
alter table public.raffle_entries
  add column if not exists contact_opt_in    boolean not null default false,
  add column if not exists contact_opt_in_at timestamptz;

create index if not exists raffle_entries_consent_idx
  on public.raffle_entries (event_id, contact_opt_in_at desc)
  where contact_opt_in;

-- ── 2. Retire the Pipedrive draft, if it was applied ───────────────────────
drop trigger  if exists raffle_entries_crm_sync on public.raffle_entries;
drop function if exists public.notify_crm_on_raffle_entry();
drop function if exists public.admin_resync_raffle_crm(uuid);
drop index    if exists public.raffle_entries_optin_unsynced_idx;
alter table public.raffle_entries
  drop column if exists crm_synced_at,
  drop column if exists crm_person_id,
  drop column if exists crm_lead_id,
  drop column if exists crm_error;

notify pgrst, 'reload schema';
