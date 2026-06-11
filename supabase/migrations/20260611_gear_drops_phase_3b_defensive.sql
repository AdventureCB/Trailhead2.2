-- ============================================================================
-- GEAR DROPS — Phase 3b: defensive notification handling
-- ============================================================================
-- Previous Phase 3 fix-up assumed notifications.gear_drop_id existed and
-- that the type CHECK constraint included the gear_drop_* enum values.
-- If the original Phase 0 migration didn't fully apply, those assumptions
-- are wrong and every RPC call still throws 400. This file:
--   1. Re-asserts the gear_drop_id column on notifications (idempotent)
--   2. Re-asserts the notifications.type CHECK constraint
--   3. Recreates gear_drop_advance_run with EACH notification insert
--      wrapped in its own EXCEPTION block, so a notif-side issue can't
--      kill the whole run submit. The waypoint progress + winner claim
--      still complete even if push notifications fail to enqueue.
--   4. RAISE NOTICE if a notif insert fails so we can diagnose later.
-- Safe to re-run.
-- ============================================================================

-- 1) Re-assert column ------------------------------------------------------
alter table public.notifications
  add column if not exists gear_drop_id uuid references public.gear_drops(id) on delete cascade;

create index if not exists notifications_gear_drop_idx
  on public.notifications(gear_drop_id)
  where gear_drop_id is not null;

-- 2) Re-assert type CHECK --------------------------------------------------
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'like','comment','mention','reply','follow','rsvp','role','recovery','convoy',
      'bug_fix','bug_report','content_report',
      'gear_drop_signup','gear_drop_unlock','gear_drop_won','gear_drop_winner'
    )
  );

-- 3) Recreate gear_drop_advance_run with defensive notif inserts ----------
create or replace function public.gear_drop_advance_run(
  p_run_id uuid,
  p_photo_url text,
  p_note text,
  p_lat numeric,
  p_lng numeric
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_run record;
  v_drop record;
  v_pins jsonb;
  v_waypoint_count int;
  v_unlocked jsonb;
  v_unlocked_count int;
  v_next_idx int;
  v_next_pin jsonb;
  v_target_lat numeric;
  v_target_lng numeric;
  v_radius_m int;
  v_distance_m numeric;
  v_submissions jsonb;
  v_new_progress jsonb;
  v_is_last boolean;
  v_won boolean := false;
  v_winner_claimed uuid;
  v_now timestamptz := now();
  v_uid uuid := auth.uid();
  v_actor_name text;
  v_actor_handle text;
  v_notif_err text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select * into v_run from public.trip_reports where id = p_run_id;
  if not found then raise exception 'run not found'; end if;
  if v_run.user_id <> v_uid then raise exception 'not your run'; end if;
  if v_run.kind <> 'gear_drop_run' then raise exception 'not a gear drop run'; end if;
  if v_run.finished_at is not null then raise exception 'run already finished'; end if;

  select * into v_drop from public.gear_drops where id = v_run.gear_drop_id;
  if not found then raise exception 'drop not found'; end if;
  if v_drop.status <> 'live' then raise exception 'drop not live (status=%)', v_drop.status; end if;

  if p_photo_url is null or trim(p_photo_url) = '' then raise exception 'photo required'; end if;
  if p_note is null or trim(p_note) = '' then raise exception 'note required'; end if;
  if p_lat is null or p_lng is null then raise exception 'gps required'; end if;

  v_pins := coalesce(v_drop.route_data->'pins', '[]'::jsonb);
  v_waypoint_count := jsonb_array_length(v_pins);
  if v_waypoint_count = 0 then raise exception 'drop has no waypoints'; end if;

  v_unlocked := coalesce(v_run.progress->'waypointsUnlocked', '[]'::jsonb);
  v_unlocked_count := jsonb_array_length(v_unlocked);

  v_next_idx := greatest(v_unlocked_count, 1);
  if v_next_idx >= v_waypoint_count then
    raise exception 'all waypoints already unlocked';
  end if;

  v_next_pin := v_pins->v_next_idx;
  v_target_lat := (v_next_pin->>'lat')::numeric;
  v_target_lng := (v_next_pin->>'lng')::numeric;
  v_radius_m := coalesce((v_next_pin->>'radius_m')::int, 100);

  v_distance_m := public.haversine_m(v_target_lat, v_target_lng, p_lat, p_lng);

  if v_distance_m > v_radius_m then
    return jsonb_build_object(
      'ok', false,
      'error', 'too_far',
      'distance_m', v_distance_m,
      'radius_m', v_radius_m
    );
  end if;

  v_is_last := (v_next_idx = v_waypoint_count - 1);

  v_submissions := coalesce(v_run.progress->'submissions', '[]'::jsonb);
  v_new_progress := jsonb_build_object(
    'waypointsUnlocked', v_unlocked || to_jsonb(v_next_idx),
    'submissions', v_submissions || jsonb_build_array(
      jsonb_build_object(
        'waypointIdx', v_next_idx,
        'photoUrl', p_photo_url,
        'note', p_note,
        'lat', p_lat,
        'lng', p_lng,
        'distanceM', v_distance_m,
        'submittedAt', v_now
      )
    )
  );

  update public.trip_reports
  set progress = v_new_progress,
      last_unlocked_at = v_now,
      finished_at = case when v_is_last then v_now else finished_at end
  where id = p_run_id;

  begin
    select coalesce(full_name, handle, 'A racer'), coalesce(handle, '')
      into v_actor_name, v_actor_handle
      from public.profiles where id = v_uid;
  exception when others then v_actor_name := 'A racer'; v_actor_handle := ''; end;
  if v_actor_name is null then v_actor_name := 'A racer'; end if;

  if v_is_last then
    update public.gear_drops
    set winner_run_id = p_run_id,
        winner_announced_at = v_now
    where id = v_drop.id and winner_run_id is null
    returning winner_run_id into v_winner_claimed;

    if v_winner_claimed is not null then
      v_won := true;

      -- Winner self-notif — defensive. A notif-side failure (missing
      -- column, CHECK constraint mismatch, etc.) MUST NOT kill the win.
      begin
        insert into public.notifications (user_id, type, gear_drop_id, actor_id, actor_name, text, data)
        values (
          v_uid, 'gear_drop_won', v_drop.id, v_uid, v_actor_name,
          'You won ' || coalesce(v_drop.title, 'the gear drop') || '!',
          jsonb_build_object('manual', false)
        );
      exception when others then
        get stacked diagnostics v_notif_err = MESSAGE_TEXT;
        raise notice '[gear_drop_advance_run] winner notif failed: %', v_notif_err;
      end;

      -- Other participants — same defensive guard.
      begin
        insert into public.notifications (user_id, type, gear_drop_id, actor_id, actor_name, text, data)
        select user_id, 'gear_drop_winner', v_drop.id, v_uid, v_actor_name,
               case when v_actor_handle <> '' then '@' || v_actor_handle else v_actor_name end
                 || ' won ' || coalesce(v_drop.title, 'the gear drop'),
               jsonb_build_object('winner_user_id', v_uid)
        from public.trip_reports
        where gear_drop_id = v_drop.id
          and kind = 'gear_drop_run'
          and user_id <> v_uid;
      exception when others then
        get stacked diagnostics v_notif_err = MESSAGE_TEXT;
        raise notice '[gear_drop_advance_run] winner fanout failed: %', v_notif_err;
      end;
    end if;
  else
    begin
      insert into public.notifications (user_id, type, gear_drop_id, actor_id, actor_name, text, data)
      values (
        v_uid, 'gear_drop_unlock', v_drop.id, v_uid, v_actor_name,
        'Waypoint ' || (v_next_idx)::text || ' complete · ' || (v_waypoint_count - 1 - v_next_idx)::text || ' to go',
        jsonb_build_object(
          'waypointIdx', v_next_idx,
          'nextWaypointIdx', v_next_idx + 1,
          'totalWaypoints', v_waypoint_count
        )
      );
    exception when others then
      get stacked diagnostics v_notif_err = MESSAGE_TEXT;
      raise notice '[gear_drop_advance_run] unlock notif failed: %', v_notif_err;
    end;
  end if;

  return jsonb_build_object(
    'ok', true,
    'unlocked_idx', v_next_idx,
    'is_last', v_is_last,
    'finished', v_is_last,
    'won', v_won,
    'distance_m', v_distance_m,
    'next_waypoint', case
      when v_is_last then null
      else v_pins->(v_next_idx + 1)
    end,
    'waypoints_remaining', v_waypoint_count - 1 - v_next_idx
  );
end;
$$;

grant execute on function public.gear_drop_advance_run(uuid, text, text, numeric, numeric) to authenticated;

notify pgrst, 'reload schema';
