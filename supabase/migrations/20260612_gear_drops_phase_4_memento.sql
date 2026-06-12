-- ============================================================================
-- GEAR DROPS — Phase 4: memento auto-publish on finish
-- ============================================================================
-- When a racer submits the final waypoint, gear_drop_advance_run now flips
-- their trip_reports row to status='published' and stamps it with a
-- human-readable name + URL-safe slug + hero_img sourced from the first
-- submission photo. The row stays at kind='gear_drop_run' so:
--
--   • The public Explore-map bbox fetcher (which filters kind='report')
--     does NOT pick it up — these are not normal trip reports.
--   • The public Trip Reports listing (allTripReports filter) does NOT
--     pick it up either — same reason.
--   • A direct URL /trips/<slug> still resolves so a racer can share
--     their recap, and the existing TripReportDetail screen renders it.
--   • The gear-drop recap page (GearDropDetailScreen post-end) queries
--     trip_reports where gear_drop_id=<drop>+status='published' and
--     surfaces each finisher's memento as a card.
--
-- Slug shape: <drop-slug>-<racer-handle>; on UNIQUE collision (rare —
-- only happens if a participant has finished the same drop twice across
-- separate runs, which the join flow doesn't allow) the slug retries
-- with -2, -3, then falls back to a random tail. Mirrors the trip
-- reports + gear drops slug retry pattern.
--
-- Name shape: '<handle>'s run of <drop title>' — keeps the racer at the
-- start so it's obvious who the memento belongs to.
--
-- Hero image: first submission photo if any; gear drop hero otherwise.
-- Falls back to NULL if neither (rare; the photo gate in advance_run
-- requires a photo URL on every submission so this should always have
-- something).
--
-- Wrapped in EXCEPTION blocks per `feedback_notifications_require_text`
-- pattern — a memento-publish failure must NOT prevent the racer from
-- finishing the race.
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
  v_is_start boolean;
  v_won boolean := false;
  v_winner_claimed uuid;
  v_now timestamptz := now();
  v_uid uuid := auth.uid();
  v_actor_name text;
  v_actor_handle text;
  v_notif_err text;
  v_notif_text text;
  v_memento_err text;
  v_memento_name text;
  v_memento_slug_base text;
  v_memento_slug text;
  v_memento_hero text;
  v_first_photo text;
  v_attempt int;
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

  v_next_idx := v_unlocked_count;
  if v_next_idx >= v_waypoint_count then
    raise exception 'all stops already submitted';
  end if;

  v_next_pin := v_pins->v_next_idx;
  v_target_lat := (v_next_pin->>'lat')::numeric;
  v_target_lng := (v_next_pin->>'lng')::numeric;
  v_radius_m := coalesce(
    (v_next_pin->>'radius_m')::int,
    case when v_next_idx = 0 then 200 else 100 end
  );

  v_distance_m := public.haversine_m(v_target_lat, v_target_lng, p_lat, p_lng);

  if v_distance_m > v_radius_m then
    return jsonb_build_object(
      'ok', false,
      'error', 'too_far',
      'distance_m', v_distance_m,
      'radius_m', v_radius_m
    );
  end if;

  v_is_start := (v_next_idx = 0);
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
    -- ─── Memento auto-publish ───────────────────────────────────────────
    -- Flip the racer's trip_reports row to a public, shareable recap.
    -- Wrapped per [[feedback_notifications_require_text]] — a memento
    -- publish failure must NEVER block the actual race finish.
    begin
      -- Build name. Capitalize handle if available.
      v_memento_name := case
        when v_actor_handle <> '' then '@' || v_actor_handle || ' · ' || coalesce(v_drop.title, 'gear drop')
        else v_actor_name || ' · ' || coalesce(v_drop.title, 'gear drop')
      end;

      -- Hero image: first submission's photoUrl.
      v_first_photo := (v_new_progress->'submissions'->0->>'photoUrl');
      v_memento_hero := coalesce(v_first_photo, v_drop.hero_img);

      -- Slug base: <drop-slug>-<handle> (or <drop-slug>-<uid-prefix>).
      -- lower() first per [[feedback_pg_slugify_lower_first]].
      v_memento_slug_base := regexp_replace(
        lower(coalesce(v_drop.slug, replace(v_drop.id::text, '-', '')) || '-' ||
              case when v_actor_handle <> '' then v_actor_handle
                   else substring(replace(v_uid::text, '-', '') from 1 for 8)
              end),
        '[^a-z0-9]+', '-', 'g'
      );
      v_memento_slug_base := regexp_replace(v_memento_slug_base, '^-+|-+$', '', 'g');
      if v_memento_slug_base = '' then v_memento_slug_base := 'gear-drop-run'; end if;

      v_memento_slug := v_memento_slug_base;
      v_attempt := 0;
      -- Retry up to 5 times on UNIQUE collision before falling back to
      -- a random tail. Mirrors createGearDrop slug retry shape.
      while v_attempt < 5 loop
        begin
          update public.trip_reports
          set status      = 'published',
              visibility  = 'public',
              name        = v_memento_name,
              slug        = v_memento_slug,
              hero_img    = v_memento_hero,
              published_at = v_now,
              updated_at  = v_now
          where id = p_run_id;
          exit;
        exception when unique_violation then
          v_attempt := v_attempt + 1;
          v_memento_slug := v_memento_slug_base || '-' || (v_attempt + 1)::text;
        end;
      end loop;
      -- Final fallback: random tail.
      if v_attempt >= 5 then
        v_memento_slug := v_memento_slug_base || '-' || substring(md5(random()::text) from 1 for 6);
        update public.trip_reports
        set status      = 'published',
            visibility  = 'public',
            name        = v_memento_name,
            slug        = v_memento_slug,
            hero_img    = v_memento_hero,
            published_at = v_now,
            updated_at  = v_now
        where id = p_run_id;
      end if;
    exception when others then
      get stacked diagnostics v_memento_err = MESSAGE_TEXT;
      raise notice '[advance_run] memento publish failed: %', v_memento_err;
    end;

    -- ─── Winner claim (atomic) ─────────────────────────────────────────
    update public.gear_drops
    set winner_run_id = p_run_id,
        winner_announced_at = v_now
    where id = v_drop.id and winner_run_id is null
    returning winner_run_id into v_winner_claimed;

    if v_winner_claimed is not null then
      v_won := true;

      begin
        insert into public.notifications (user_id, type, gear_drop_id, actor_id, actor_name, text, data)
        values (
          v_uid, 'gear_drop_won', v_drop.id, v_uid, v_actor_name,
          'You won ' || coalesce(v_drop.title, 'the gear drop') || '!',
          jsonb_build_object('manual', false)
        );
      exception when others then
        get stacked diagnostics v_notif_err = MESSAGE_TEXT;
        raise notice '[advance_run] winner notif failed: %', v_notif_err;
      end;

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
        raise notice '[advance_run] winner fanout failed: %', v_notif_err;
      end;
    end if;
  else
    if v_is_start then
      v_notif_text := 'Run started! Next stop: pin ' || (v_next_idx + 1)::text || ' of ' || (v_waypoint_count - 1)::text;
    else
      v_notif_text := 'Stop ' || (v_next_idx + 1)::text || ' of ' || v_waypoint_count::text || ' complete · '
        || (v_waypoint_count - 1 - v_next_idx)::text || ' to go';
    end if;

    begin
      insert into public.notifications (user_id, type, gear_drop_id, actor_id, actor_name, text, data)
      values (
        v_uid, 'gear_drop_unlock', v_drop.id, v_uid, v_actor_name,
        v_notif_text,
        jsonb_build_object(
          'waypointIdx', v_next_idx,
          'nextWaypointIdx', v_next_idx + 1,
          'totalStops', v_waypoint_count,
          'isStart', v_is_start
        )
      );
    exception when others then
      get stacked diagnostics v_notif_err = MESSAGE_TEXT;
      raise notice '[advance_run] unlock notif failed: %', v_notif_err;
    end;
  end if;

  return jsonb_build_object(
    'ok', true,
    'unlocked_idx', v_next_idx,
    'is_start', v_is_start,
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

-- ── Widen trip_reports SELECT policy so published gear-drop mementos are
-- publicly readable. Without this, the racer recap cards on the gear
-- drop detail page would only resolve for the racer themselves.
-- Pattern follows the existing kind='report' / kind='plan' branches.
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'trip_reports' and cmd = 'SELECT'
  loop
    execute format('drop policy %I on public.trip_reports', pol.policyname);
  end loop;
end$$;

create policy trip_reports_select on public.trip_reports
  for select to anon, authenticated
  using (
    auth.uid() = user_id
    or (status = 'published' and (
      kind = 'report'
      or (kind = 'plan' and visibility = 'public')
      or (kind = 'gear_drop_run' and visibility = 'public')
    ))
  );

notify pgrst, 'reload schema';
