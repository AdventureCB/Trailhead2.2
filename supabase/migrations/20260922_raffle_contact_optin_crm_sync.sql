-- ============================================================================
-- RAFFLE — sales-contact opt-in + CRM (Pipedrive) sync
-- ============================================================================
-- The entry page used to promise "we'll only use your phone if you win".
-- It's now an explicit opt-in: entrants who tick the box may be contacted by
-- the sales team (phone / text / email) regardless of the draw. Opted-in
-- entries are pushed to the CRM automatically by a DB trigger → the
-- `raffle-crm-sync` Edge Function (same pg_net + Vault shared-secret pattern
-- as the push-notification triggers; reuses `send_push_secret`).
--
-- Idempotent.
-- ============================================================================

-- ── 1. Consent + sync bookkeeping columns ────────────────────────────────────
alter table public.raffle_entries
  add column if not exists contact_opt_in    boolean not null default false,
  add column if not exists contact_opt_in_at timestamptz,
  add column if not exists crm_synced_at     timestamptz,
  add column if not exists crm_person_id     text,
  add column if not exists crm_lead_id       text,
  add column if not exists crm_error         text;

create index if not exists raffle_entries_optin_unsynced_idx
  on public.raffle_entries (created_at)
  where contact_opt_in and crm_synced_at is null;

-- ── 2. Trigger: hand opted-in entries to the Edge Function ──────────────────
-- Fires on INSERT (box ticked at entry) and on UPDATE when the flag flips on
-- (e.g. an admin backfills consent). The function is idempotent (skips rows
-- with crm_synced_at set), so re-firing is harmless.
create or replace function public.notify_crm_on_raffle_entry()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_secret text;
begin
  if new.contact_opt_in is not true then return new; end if;
  begin
    select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'send_push_secret' limit 1;
  exception when others then v_secret := null; end;
  if v_secret is null then
    raise notice '[raffle crm] send_push_secret missing in vault — sync skipped';
    return new;
  end if;
  perform net.http_post(
    url     := 'https://babbgaziiyjfaqjsaxgd.supabase.co/functions/v1/raffle-crm-sync',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-trailhead-push-secret', v_secret),
    body    := jsonb_build_object('entry_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists raffle_entries_crm_sync on public.raffle_entries;
create trigger raffle_entries_crm_sync
  after insert or update of contact_opt_in on public.raffle_entries
  for each row
  when (new.contact_opt_in)
  execute function public.notify_crm_on_raffle_entry();

-- ── 3. Manual re-sync hook (admin) — re-fires the trigger for any opted-in
--      rows that never synced (e.g. CRM was down, token rotated). Returns the
--      number of rows re-queued.
create or replace function public.admin_resync_raffle_crm(p_event_id uuid default null)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_n int := 0;
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin only'; end if;
  -- Touching the flag (false→true in one statement is a no-op for the WHEN
  -- clause), so bump via a same-value UPDATE OF the trigger column.
  update public.raffle_entries
  set contact_opt_in = true
  where contact_opt_in
    and crm_synced_at is null
    and (p_event_id is null or event_id = p_event_id);
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

grant execute on function public.admin_resync_raffle_crm(uuid) to authenticated;

notify pgrst, 'reload schema';
