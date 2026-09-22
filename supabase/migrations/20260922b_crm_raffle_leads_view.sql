-- ============================================================================
-- CRM intake — stable read-only view of raffle entrants + a scoped reader role
-- ============================================================================
-- The sales CRM is a SEPARATE Supabase project that pulls leads from this one.
-- Two goals:
--   1. A stable contract (`public.crm_raffle_leads`) so Trailhub can refactor
--      raffle_entries / raffle_events / profiles without breaking the CRM.
--   2. A least-privilege way in: the `crm_reader` role can SELECT this view and
--      NOTHING else — so the CRM never needs Trailhub's service-role key
--      (which would grant full read/write on auth users, DMs, payouts, …).
--
-- The view runs with its owner's privileges (security_invoker = false), which
-- is what lets crm_reader see through the base tables' RLS. It is therefore
-- REVOKED from anon/authenticated so it is not reachable through the public
-- REST API — only via a direct Postgres connection as crm_reader (or the
-- service role, which can read anything anyway).
--
-- ▶ BEFORE RUNNING: replace CHANGE_ME_STRONG_PASSWORD below.
-- Idempotent (re-running updates the view; the role is created once).
-- ============================================================================

-- ── 1. The view ─────────────────────────────────────────────────────────────
create or replace view public.crm_raffle_leads
with (security_invoker = false)
as
select
  e.id                                          as entry_id,
  e.user_id,
  e.event_id,
  e.name,
  e.email,
  e.phone,
  e.contact_opt_in,
  e.contact_opt_in_at,
  e.is_winner,
  e.won_at,
  e.created_at                                  as entered_at,
  -- Single watermark for incremental pulls: bumps on entry, consent, and win.
  greatest(e.created_at,
           coalesce(e.contact_opt_in_at, e.created_at),
           coalesce(e.won_at, e.created_at))    as updated_at,
  ev.name                                       as event_name,
  ev.slug                                       as event_slug,
  ev.status                                     as event_status,
  ev.discount_cents                             as event_discount_cents,
  ev.min_purchase_cents                         as event_min_purchase_cents,
  p.handle,
  p.full_name,
  p.avatar_url,
  -- The prize the winner actually received (null for non-winners).
  wc.code                                       as winner_code,
  wc.expires_at                                 as winner_code_expires_at
from public.raffle_entries e
join public.raffle_events ev        on ev.id = e.event_id
left join public.profiles p         on p.id  = e.user_id
left join public.raffle_winner_codes wc on wc.entry_id = e.id
where ev.status <> 'draft';

comment on view public.crm_raffle_leads is
  'CRM intake contract: one row per raffle entrant per drawing. contact_opt_in=true ⇒ contactable (phone/text/email); false ⇒ contact only if is_winner. Poll on updated_at.';

-- ── 2. Lock it down from the public API ─────────────────────────────────────
revoke all on public.crm_raffle_leads from public;
revoke all on public.crm_raffle_leads from anon;
revoke all on public.crm_raffle_leads from authenticated;

-- ── 3. Scoped reader role for the CRM backend ───────────────────────────────
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'crm_reader') then
    create role crm_reader login password 'CHANGE_ME_STRONG_PASSWORD'
      nosuperuser nocreatedb nocreaterole noinherit;
  end if;
end $$;

-- Connection + exactly one object. No base-table access, no other schemas.
grant connect on database postgres to crm_reader;
grant usage on schema public to crm_reader;
grant select on public.crm_raffle_leads to crm_reader;

-- Service role keeps its usual access (it bypasses grants anyway); listed for
-- clarity so a future audit sees the intent.
grant select on public.crm_raffle_leads to service_role;

notify pgrst, 'reload schema';
