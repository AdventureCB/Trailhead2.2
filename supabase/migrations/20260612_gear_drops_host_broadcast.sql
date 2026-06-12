-- ============================================================================
-- GEAR DROPS — host broadcast announcements
-- ============================================================================
-- New gear_drop_broadcast_announcement(p_drop_id, p_body) RPC lets the
-- host (admin OR drop.host_admin_id OR a gear_drop_editors co-host —
-- gated via the existing can_edit_gear_drop function from Phase 0) push
-- a free-form announcement to every racer in one shot.
--
-- Implementation: inserts a notifications row per participant. The
-- existing notifications_send_push trigger handles fan-out to web
-- push (per-recipient subscriptions resolved server-side). Bonus: the
-- announcement also appears in each racer's bell list with the
-- standard tap-to-open routing.
--
-- The host (the actor) is excluded from the fan-out — they wrote the
-- message; no need to push it back to them. Same for admins broadcasting
-- on their own drop: filtered by user_id <> v_uid.
--
-- Notification type 'gear_drop_announcement' is added to the CHECK
-- constraint enum here. tag-shape on the push side uses gd:<id>:type
-- per the Phase 3.5 send-push update.
-- ============================================================================

-- Widen the notifications.type enum to include 'gear_drop_announcement'.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (
  type in (
    'like','comment','mention','reply','follow','rsvp','role','recovery','convoy',
    'bug_fix','bug_report','content_report',
    'gear_drop_signup','gear_drop_unlock','gear_drop_won','gear_drop_winner',
    'gear_drop_announcement'
  )
);

create or replace function public.gear_drop_broadcast_announcement(
  p_drop_id uuid,
  p_body    text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_drop record;
  v_actor_name text;
  v_count int := 0;
  v_body text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not public.can_edit_gear_drop(p_drop_id) then raise exception 'not authorized'; end if;
  if p_body is null or trim(p_body) = '' then raise exception 'message required'; end if;
  v_body := trim(p_body);
  -- Cap at 280 chars so a host can't dump a wall of text into every
  -- racer's bell list. Web push body has its own truncation but we
  -- enforce a saner ceiling here.
  if length(v_body) > 280 then v_body := substring(v_body from 1 for 280); end if;

  select * into v_drop from public.gear_drops where id = p_drop_id;
  if not found then raise exception 'drop not found'; end if;

  begin
    select coalesce(full_name, handle, 'Host') into v_actor_name
    from public.profiles where id = v_uid;
  exception when others then v_actor_name := 'Host'; end;
  if v_actor_name is null then v_actor_name := 'Host'; end if;

  -- Fan out to every participant except the actor themselves.
  begin
    insert into public.notifications (
      user_id, type, gear_drop_id, actor_id, actor_name, text, data
    )
    select user_id, 'gear_drop_announcement', p_drop_id, v_uid, v_actor_name,
           v_body,
           jsonb_build_object('drop_title', v_drop.title)
    from public.trip_reports
    where gear_drop_id = p_drop_id
      and kind = 'gear_drop_run'
      and user_id <> v_uid;
    get diagnostics v_count = row_count;
  exception when others then
    raise notice '[gear_drop_broadcast_announcement] insert failed: %', SQLERRM;
    raise;
  end;

  return jsonb_build_object('ok', true, 'sent_to', v_count);
end;
$$;

grant execute on function public.gear_drop_broadcast_announcement(uuid, text) to authenticated;

notify pgrst, 'reload schema';
