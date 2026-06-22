-- ============================================================================
-- NOTIFICATIONS — add the missing `data` jsonb column
-- ============================================================================
-- Multiple RPCs (gear_drop_advance_run, claim_gear_drop_winner,
-- gear_drop_broadcast_announcement, etc.) write to `notifications.data`
-- via `jsonb_build_object(...)` — but no prior migration ever created
-- the column. Every advance-run unlock/winner/winner-fanout notification
-- has been silently failing inside its `EXCEPTION when others` wrapper;
-- the race itself succeeded so it went unnoticed. The broadcast RPC
-- re-raises the insert exception, which surfaced as a client-side 400
-- when Kyle tested SEND ANNOUNCEMENT.
--
-- This adds the column unconditionally and reloads the PostgREST
-- schema cache. The column is nullable so existing rows are unaffected.
-- Server-side writes (PL/pgSQL) now persist their structured metadata
-- as originally intended; client-side inserts that still target this
-- column would resolve via PostgREST (no longer PGRST204) — but our
-- client code already omits `data` per the earlier feedback memory,
-- so there's no client behavior change either way.
--
-- Idempotent — re-running is safe.
-- ============================================================================

alter table public.notifications
  add column if not exists data jsonb;

comment on column public.notifications.data is
  'Optional structured metadata for the notification. Written by server-side PL/pgSQL RPCs (gear_drop_*, etc.) for richer push payloads and future bell-rendering hooks. Client-side inserts may omit it; existing UI does not depend on it.';

notify pgrst, 'reload schema';
