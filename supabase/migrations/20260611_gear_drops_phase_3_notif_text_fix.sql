-- ============================================================================
-- GEAR DROPS — Phase 3 fix-up: notification.text required
-- ============================================================================
-- Both gear_drop_advance_run and claim_gear_drop_winner were inserting
-- into public.notifications without supplying `text` (and `actor_name`),
-- which are required columns. The whole RPC then errored with HTTP 400
-- on every waypoint submission. This recreates both functions with the
-- text + actor_name fields populated.
-- ============================================================================

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

  -- Look up the actor's profile once so we can populate notification
  -- text/actor_name without N+1 in the winner fan-out.
  select coalesce(full_name, handle, 'A racer'), coalesce(handle, '')
    into v_actor_name, v_actor_handle
    from public.profiles where id = v_uid;
  if v_actor_name is null then v_actor_name := 'A racer'; end if;

  if v_is_last then
    update public.gear_drops
    set winner_run_id = p_run_id,
        winner_announced_at = v_now
    where id = v_drop.id and winner_run_id is null
    returning winner_run_id into v_winner_claimed;

    if v_winner_claimed is not null then
      v_won := true;

      -- Winner's own "you won" notification.
      insert into public.notifications (user_id, type, gear_drop_id, actor_id, actor_name, text, data)
      values (
        v_uid,
        'gear_drop_won',
        v_drop.id,
        v_uid,
        v_actor_name,
        'You won ' || coalesce(v_drop.title, 'the gear drop') || '!',
        jsonb_build_object('manual', false)
      );

      -- Other participants' "winner declared" notification.
      insert into public.notifications (user_id, type, gear_drop_id, actor_id, actor_name, text, data)
      select user_id,
             'gear_drop_winner',
             v_drop.id,
             v_uid,
             v_actor_name,
             case when v_actor_handle <> '' then '@' || v_actor_handle else v_actor_name end
               || ' won ' || coalesce(v_drop.title, 'the gear drop'),
             jsonb_build_object('winner_user_id', v_uid)
      from public.trip_reports
      where gear_drop_id = v_drop.id
        and kind = 'gear_drop_run'
        and user_id <> v_uid;
    end if;
  else
    -- Intermediate waypoint — self-notify so the participant gets a push
    -- with the next-waypoint hint.
    insert into public.notifications (user_id, type, gear_drop_id, actor_id, actor_name, text, data)
    values (
      v_uid,
      'gear_drop_unlock',
      v_drop.id,
      v_uid,
      v_actor_name,
      'Waypoint ' || (v_next_idx)::text || ' complete · ' || (v_waypoint_count - 1 - v_next_idx)::text || ' to go',
      jsonb_build_object(
        'waypointIdx', v_next_idx,
        'nextWaypointIdx', v_next_idx + 1,
        'totalWaypoints', v_waypoint_count
      )
    );
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


create or replace function public.claim_gear_drop_winner(
  p_drop_id uuid,
  p_run_id uuid,
  p_reason text
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_drop record;
  v_run record;
  v_now timestamptz := now();
  v_actor_name text;
  v_winner_name text;
  v_winner_handle text;
begin
  if not public.can_edit_gear_drop(p_drop_id) then
    raise exception 'not authorized';
  end if;

  if p_reason is null or trim(p_reason) = '' then
    raise exception 'reason required';
  end if;

  select * into v_drop from public.gear_drops where id = p_drop_id;
  if not found then raise exception 'drop not found'; end if;
  if v_drop.winner_run_id is not null then
    raise exception 'winner already declared';
  end if;

  select * into v_run from public.trip_reports where id = p_run_id;
  if not found then raise exception 'run not found'; end if;
  if v_run.gear_drop_id <> p_drop_id or v_run.kind <> 'gear_drop_run' then
    raise exception 'invalid run for this drop';
  end if;

  update public.gear_drops
  set winner_run_id = p_run_id,
      winner_announced_at = v_now
  where id = p_drop_id and winner_run_id is null;

  update public.trip_reports
  set finished_at = coalesce(finished_at, v_now)
  where id = p_run_id;

  select coalesce(full_name, handle, 'An admin') into v_actor_name from public.profiles where id = auth.uid();
  if v_actor_name is null then v_actor_name := 'An admin'; end if;
  select coalesce(full_name, handle, 'A racer'), coalesce(handle, '')
    into v_winner_name, v_winner_handle from public.profiles where id = v_run.user_id;
  if v_winner_name is null then v_winner_name := 'A racer'; end if;

  insert into public.notifications (user_id, type, gear_drop_id, actor_id, actor_name, text, data)
  values (
    v_run.user_id,
    'gear_drop_won',
    p_drop_id,
    auth.uid(),
    v_actor_name,
    'You were named the winner of ' || coalesce(v_drop.title, 'the gear drop') || '!',
    jsonb_build_object('manual', true, 'reason', p_reason)
  );

  insert into public.notifications (user_id, type, gear_drop_id, actor_id, actor_name, text, data)
  select user_id, 'gear_drop_winner', p_drop_id, auth.uid(), v_actor_name,
         case when v_winner_handle <> '' then '@' || v_winner_handle else v_winner_name end
           || ' was named the winner of ' || coalesce(v_drop.title, 'the gear drop'),
         jsonb_build_object('winner_user_id', v_run.user_id, 'manual', true)
  from public.trip_reports
  where gear_drop_id = p_drop_id
    and kind = 'gear_drop_run'
    and user_id <> v_run.user_id;
end;
$$;

grant execute on function public.claim_gear_drop_winner(uuid, uuid, text) to authenticated;

-- Nudge PostgREST to refresh its schema cache so the new function
-- signatures are immediately visible.
notify pgrst, 'reload schema';
