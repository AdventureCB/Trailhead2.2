-- ============================================================================
-- GEAR DROPS — admin cascade delete RPC
-- ============================================================================
-- Lets admin permanently delete a gear drop AND its participant runs in
-- one transaction. Needed because trip_reports.gear_drop_id is
-- ON DELETE SET NULL — a plain delete on gear_drops leaves orphan
-- gear_drop_run rows behind, which then show up as un-parented mementos
-- at /trips/<slug> with no way to navigate back to the (now-deleted)
-- event. Test drops accumulate fast, so this is also the primary
-- cleanup mechanism for pre-launch beta testing.
--
-- Scope of what gets wiped:
--   - Every trip_reports row where gear_drop_id = p_drop_id AND
--     kind = 'gear_drop_run' (the racer's run + its memento, draft or
--     published).
--   - gear_drop_editors rows (FK CASCADE handles these for free, but
--     the explicit delete is documented here for the reader).
--   - gear_drop_comments rows (also CASCADE).
--   - The gear_drops row itself.
--   - notifications referencing the drop (gear_drop_id FK is CASCADE,
--     so this just happens).
--
-- Returns the count of runs deleted so the client can surface "Deleted
-- N participant run(s)" in its confirm flow.
--
-- Admin-only via is_admin() — anyone else gets an exception. The same
-- is_admin gate the existing delete policy uses.
-- ============================================================================

create or replace function public.admin_delete_gear_drop_cascade(
  p_drop_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_runs_deleted int := 0;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not public.is_admin(v_uid) then raise exception 'admin only'; end if;
  if p_drop_id is null then raise exception 'drop id required'; end if;

  -- Sanity check the drop exists. We don't restrict to status='ended' —
  -- admin asked for it, admin can wipe whatever state it's in. The UI
  -- gates the entry point on status so live drops with real participants
  -- won't show the cascade delete button by accident.
  if not exists (select 1 from public.gear_drops where id = p_drop_id) then
    raise exception 'drop not found';
  end if;

  -- Wipe every run row tied to this drop. RLS would normally block
  -- deleting other users' rows, but SECURITY DEFINER bypasses that.
  delete from public.trip_reports
  where gear_drop_id = p_drop_id
    and kind = 'gear_drop_run';
  get diagnostics v_runs_deleted = row_count;

  -- Drop the gear drop. FK cascades on gear_drop_editors,
  -- gear_drop_comments, notifications.gear_drop_id handle the rest.
  delete from public.gear_drops where id = p_drop_id;

  return jsonb_build_object(
    'ok', true,
    'runs_deleted', v_runs_deleted
  );
end;
$$;

grant execute on function public.admin_delete_gear_drop_cascade(uuid) to authenticated;

notify pgrst, 'reload schema';
