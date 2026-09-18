-- ============================================================================
-- GEAR DROPS — offline capture-and-sync + "winner decided at drop end"
-- ============================================================================
-- Racers need to run gear drops with NO signal. Two changes make that work:
--
-- 1. gear_drop_advance_run accepts a CLIENT-CAPTURED timestamp (p_submitted_at)
--    so a submission made offline carries the moment it actually happened, not
--    the (much later) moment it syncs. The timestamp is CLAMPED — never in the
--    future, never before the run's last unlock — so a bad/rogue clock can't
--    backdate a finish before an earlier waypoint or fake a future time.
--    Submissions are accepted while the drop is 'live' OR 'ended' (an offline
--    capture from during the event can still sync after the host ends it).
--
-- 2. The winner is NO LONGER claimed automatically by the first finisher.
--    Finishing just RECORDS finished_at (from the captured timestamp) and
--    publishes the memento (pending review, unchanged). The winner is computed
--    when the drop ENDS, by gear_drop_finalize_winner: the EARLIEST finished_at
--    wins. This is fair when finishers sync at different times — a racer who
--    finished first but synced last still wins.
--
-- Idempotent. Winner declaration is fair + revision-free (decided once at end).
-- ============================================================================

-- ── 1. The real implementation: 6-arg, client timestamp, no winner claim ────
create or replace function public.gear_drop_advance_run_at(
  p_run_id       uuid,
  p_photo_url    text,
  p_note         text,
  p_lat          numeric,
  p_lng          numeric,
  p_submitted_at timestamptz,
  p_waypoint_idx int default null   -- offline replay: which stop this capture was for
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_run record;
  v_drop record;
  v_pins jsonb;
  v_pin jsonb;
  v_pin_lat numeric;
  v_pin_lng numeric;
  v_radius numeric;
  v_distance numeric;
  v_now timestamptz := now();
  v_ts  timestamptz;             -- clamped capture time
  v_unlocked jsonb;
  v_unlocked_count int;
  v_next_idx int;
  v_waypoint_count int;
  v_is_start boolean;
  v_is_last boolean;
  v_submission jsonb;
  v_new_progress jsonb;
  v_actor_handle text := '';
  v_actor_name text := '';
  v_memento_name text;
  v_memento_hero text;
  v_memento_slug_base text;
  v_memento_slug text;
  v_first_photo text;
  v_attempt int;
  v_memento_err text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select * into v_run from public.trip_reports where id = p_run_id;
  if not found then raise exception 'run not found'; end if;
  if v_run.user_id <> v_uid then raise exception 'not your run'; end if;
  if v_run.kind <> 'gear_drop_run' then raise exception 'not a gear drop run'; end if;
  if v_run.finished_at is not null then raise exception 'run already finished'; end if;

  select * into v_drop from public.gear_drops where id = v_run.gear_drop_id;
  if not found then raise exception 'drop not found'; end if;
  -- Accept while live OR ended (offline captures from during the event may
  -- sync after the host ends it). Winner is decided by finished_at at end.
  if v_drop.status not in ('live','ended') then
    raise exception 'drop is not live (status=%)', v_drop.status;
  end if;

  -- Clamp the capture time: never future, never before this run's last unlock.
  v_ts := coalesce(p_submitted_at, v_now);
  if v_ts > v_now then v_ts := v_now; end if;
  if v_run.last_unlocked_at is not null and v_ts < v_run.last_unlocked_at then
    v_ts := v_run.last_unlocked_at;
  end if;

  v_pins := coalesce(v_drop.route_data->'pins', '[]'::jsonb);
  v_waypoint_count := jsonb_array_length(v_pins);
  if v_waypoint_count = 0 then raise exception 'drop has no waypoints'; end if;

  v_unlocked := coalesce(v_run.progress->'waypointsUnlocked', '[]'::jsonb);
  v_unlocked_count := jsonb_array_length(v_unlocked);
  v_next_idx := v_unlocked_count;

  -- Offline replay is FIFO + dependent: each submission advances the NEXT
  -- stop. Guard against a duplicate (already applied → no-op) or an
  -- out-of-order replay (an earlier item hasn't landed yet → tell the client
  -- to hold and retry). Only enforced when the client names the stop index.
  if p_waypoint_idx is not null then
    if p_waypoint_idx < v_next_idx then
      return jsonb_build_object('ok', true, 'duplicate', true, 'unlocked_idx', p_waypoint_idx,
                                'waypoints_remaining', v_waypoint_count - 1 - p_waypoint_idx);
    elsif p_waypoint_idx > v_next_idx then
      return jsonb_build_object('ok', false, 'error', 'out_of_order', 'expected_idx', v_next_idx);
    end if;
  end if;

  if v_next_idx >= v_waypoint_count then
    raise exception 'all waypoints already unlocked';
  end if;
  v_is_start := v_next_idx = 0;
  v_is_last := v_next_idx = v_waypoint_count - 1;

  v_pin := v_pins->v_next_idx;
  v_pin_lat := (v_pin->>'lat')::numeric;
  v_pin_lng := (v_pin->>'lng')::numeric;
  v_radius := coalesce((v_pin->>'radius_m')::numeric, case when v_is_start then 200 else 100 end);

  v_distance := public.haversine_m(v_pin_lat, v_pin_lng, p_lat, p_lng);
  if v_distance > v_radius then
    return jsonb_build_object('ok', false, 'error', 'too_far', 'distance_m', v_distance, 'radius_m', v_radius);
  end if;

  v_submission := jsonb_build_object(
    'waypointIdx', v_next_idx,
    'photoUrl', p_photo_url,
    'note', p_note,
    'lat', p_lat,
    'lng', p_lng,
    'distanceM', v_distance,
    'submittedAt', v_ts
  );
  v_new_progress := jsonb_build_object(
    'waypointsUnlocked', v_unlocked || to_jsonb(v_next_idx),
    'submissions',       coalesce(v_run.progress->'submissions', '[]'::jsonb) || v_submission
  );

  update public.trip_reports
  set progress         = v_new_progress,
      last_unlocked_at = v_ts,
      finished_at      = case when v_is_last then v_ts else finished_at end,
      updated_at       = v_now
  where id = p_run_id;

  if v_is_last then
    begin
      select coalesce(handle, ''), coalesce(full_name, handle, 'A racer')
        into v_actor_handle, v_actor_name
      from public.profiles where id = v_uid;
    exception when others then v_actor_handle := ''; v_actor_name := 'A racer'; end;
    if v_actor_name is null then v_actor_name := 'A racer'; end if;

    -- ─── Memento auto-publish (ALL finishers), pending admin review ─────
    begin
      v_memento_name := case
        when v_actor_handle <> '' then '@' || v_actor_handle || ' · ' || coalesce(v_drop.title, 'gear drop')
        else v_actor_name || ' · ' || coalesce(v_drop.title, 'gear drop')
      end;
      v_first_photo := (v_new_progress->'submissions'->0->>'photoUrl');
      v_memento_hero := coalesce(v_first_photo, v_drop.hero_img);
      v_memento_slug_base := regexp_replace(
        lower(coalesce(v_drop.slug, replace(v_drop.id::text, '-', '')) || '-' ||
              case when v_actor_handle <> '' then v_actor_handle
                   else substring(replace(v_uid::text, '-', '') from 1 for 8) end),
        '[^a-z0-9]+', '-', 'g');
      v_memento_slug_base := regexp_replace(v_memento_slug_base, '^-+|-+$', '', 'g');
      if v_memento_slug_base = '' then v_memento_slug_base := 'gear-drop-run'; end if;
      v_memento_slug := v_memento_slug_base;
      v_attempt := 0;
      while v_attempt < 5 loop
        begin
          update public.trip_reports
          set status = 'published', visibility = 'public', name = v_memento_name,
              slug = v_memento_slug, hero_img = v_memento_hero,
              gd_review_status = 'pending', published_at = v_now, updated_at = v_now
          where id = p_run_id;
          exit;
        exception when unique_violation then
          v_attempt := v_attempt + 1;
          v_memento_slug := v_memento_slug_base || '-' || (v_attempt + 1)::text;
        end;
      end loop;
      if v_attempt >= 5 then
        v_memento_slug := v_memento_slug_base || '-' || substring(md5(random()::text) from 1 for 6);
        update public.trip_reports
        set status = 'published', visibility = 'public', name = v_memento_name,
            slug = v_memento_slug, hero_img = v_memento_hero,
            gd_review_status = 'pending', published_at = v_now, updated_at = v_now
        where id = p_run_id;
      end if;
    exception when others then
      get stacked diagnostics v_memento_err = MESSAGE_TEXT;
      raise notice '[advance_run] memento publish failed: %', v_memento_err;
    end;
    -- NOTE: winner is NOT claimed here. gear_drop_finalize_winner decides it
    -- at drop end from the earliest finished_at.
  end if;

  return jsonb_build_object(
    'ok', true,
    'is_start', v_is_start,
    'is_last', v_is_last,
    'finished', v_is_last,
    'won', false,                       -- winner decided at drop end
    'winner_pending', v_is_last,
    'unlocked_idx', v_next_idx,
    'distance_m', v_distance,
    'next_waypoint', case when v_is_last then null else v_pins->(v_next_idx + 1) end,
    'waypoints_remaining', v_waypoint_count - 1 - v_next_idx
  );
end;
$$;

grant execute on function public.gear_drop_advance_run_at(uuid, text, text, numeric, numeric, timestamptz, int) to authenticated;

-- ── 2. Back-compat 5-arg wrapper — delegates with server-now timestamp so any
--       caller not yet passing a capture time keeps working (and now also gets
--       the "no auto-winner" behavior, since the winner is decided at end).
create or replace function public.gear_drop_advance_run(
  p_run_id uuid, p_photo_url text, p_note text, p_lat numeric, p_lng numeric
) returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.gear_drop_advance_run_at(p_run_id, p_photo_url, p_note, p_lat, p_lng, now());
$$;

grant execute on function public.gear_drop_advance_run(uuid, text, text, numeric, numeric) to authenticated;

-- ── 3. Decide the winner at drop end: earliest finished_at wins ──────────────
create or replace function public.gear_drop_finalize_winner(
  p_drop_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_drop record;
  v_winner record;
  v_now timestamptz := now();
  v_actor_handle text := '';
  v_actor_name text := '';
  v_finished_count int := 0;
  v_notif_err text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not public.can_edit_gear_drop(p_drop_id) then raise exception 'not authorized'; end if;

  select * into v_drop from public.gear_drops where id = p_drop_id;
  if not found then raise exception 'drop not found'; end if;

  select count(*) into v_finished_count
  from public.trip_reports
  where gear_drop_id = p_drop_id and kind = 'gear_drop_run' and finished_at is not null;

  if v_finished_count = 0 then
    return jsonb_build_object('ok', true, 'winner_run_id', null, 'finished_count', 0, 'note', 'no finishers');
  end if;

  -- Earliest finish wins; ties broken by the earliest last_unlocked_at then id
  -- so the result is deterministic.
  select * into v_winner
  from public.trip_reports
  where gear_drop_id = p_drop_id and kind = 'gear_drop_run' and finished_at is not null
  order by finished_at asc, last_unlocked_at asc, id asc
  limit 1;

  -- NO REVOCATION: once a winner is announced it's locked. A straggler who
  -- syncs an earlier finish AFTER the drop ended does NOT steal the win — this
  -- is the whole appeal of the "decide at drop end" model. Host should end the
  -- drop only after racers are back in signal so all finishes are counted.
  if v_drop.winner_run_id is not null then
    return jsonb_build_object('ok', true, 'winner_run_id', v_drop.winner_run_id, 'finished_count', v_finished_count, 'note', 'already_announced');
  end if;

  update public.gear_drops
  set winner_run_id = v_winner.id, winner_announced_at = v_now, updated_at = v_now
  where id = p_drop_id;

  begin
    select coalesce(handle, ''), coalesce(full_name, handle, 'A racer')
      into v_actor_handle, v_actor_name
    from public.profiles where id = v_winner.user_id;
  exception when others then v_actor_handle := ''; v_actor_name := 'A racer'; end;
  if v_actor_name is null then v_actor_name := 'A racer'; end if;

  begin
    insert into public.notifications (user_id, type, gear_drop_id, actor_id, actor_name, text, data)
    values (v_winner.user_id, 'gear_drop_won', p_drop_id, v_winner.user_id, v_actor_name,
            'You won ' || coalesce(v_drop.title, 'the gear drop') || '!',
            jsonb_build_object('manual', false));
  exception when others then
    get stacked diagnostics v_notif_err = MESSAGE_TEXT;
    raise notice '[finalize_winner] winner notif failed: %', v_notif_err;
  end;

  begin
    insert into public.notifications (user_id, type, gear_drop_id, actor_id, actor_name, text, data)
    select user_id, 'gear_drop_winner', p_drop_id, v_winner.user_id, v_actor_name,
           case when v_actor_handle <> '' then '@' || v_actor_handle else v_actor_name end
             || ' won ' || coalesce(v_drop.title, 'the gear drop'),
           jsonb_build_object('winner_user_id', v_winner.user_id)
    from public.trip_reports
    where gear_drop_id = p_drop_id and kind = 'gear_drop_run' and user_id <> v_winner.user_id;
  exception when others then
    get stacked diagnostics v_notif_err = MESSAGE_TEXT;
    raise notice '[finalize_winner] winner fanout failed: %', v_notif_err;
  end;

  return jsonb_build_object('ok', true, 'winner_run_id', v_winner.id, 'finished_count', v_finished_count, 'note', 'announced');
end;
$$;

grant execute on function public.gear_drop_finalize_winner(uuid) to authenticated;

notify pgrst, 'reload schema';
