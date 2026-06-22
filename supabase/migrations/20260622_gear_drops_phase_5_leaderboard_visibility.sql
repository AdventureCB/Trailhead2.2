-- ============================================================================
-- GEAR DROPS — Phase 5: live leaderboard visibility + publish all finishers
-- ============================================================================
-- Field testing surfaced two bugs that share a root cause: the Phase 4
-- trip_reports SELECT policy gates kind='gear_drop_run' rows on
-- (status='published' AND visibility='public'), which means:
--
--   Bug 1: While the race is RUNNING, every racer's row is status='draft'.
--          Non-owners can't SELECT them, so the detail page's realtime
--          sub on trip_reports never delivers INSERT/UPDATE events for
--          other racers. The leaderboard appears frozen and only refreshes
--          when the winner declaration flips the WINNER'S row to
--          published (the one row non-owners can finally see).
--
--   Bug 3: Phase 4 auto-publishes the WINNER's run only. Non-winner runs
--          stay status='draft' forever, so they never get a slug — there's
--          no way to deep-link to their recap via /trips/<slug> after the
--          race ends.
--
-- Two fixes, one migration:
--
--   1. Widen the trip_reports SELECT policy to allow public read of any
--      gear_drop_run row whose parent gear_drop is NOT a draft. That
--      makes live-race rows visible to all viewers (RLS, the realtime
--      gate, AND post-race deep links all align).
--
--   2. Modify gear_drop_advance_run so the memento auto-publish runs on
--      EVERY finisher's final submission, not just the atomic winner.
--      Each racer gets their own shareable recap with a unique slug.
--      Winner-specific notifications + winner_announced_at flip stay
--      inside the atomic claim branch (only one winner per drop).
--
-- Idempotent — re-running is safe.
-- ============================================================================

-- ── 1. Widen SELECT policy for gear_drop_run rows ──────────────────────────
-- Replaces the Phase 4 policy. Owners still see all their own rows;
-- everyone else sees gear_drop_run rows when the parent drop is past
-- 'draft' state (scheduled / live / ended / archived). report + plan
-- branches unchanged.
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
    or (
      kind = 'gear_drop_run'
      and exists (
        select 1 from public.gear_drops gd
        where gd.id = trip_reports.gear_drop_id
          and gd.status in ('scheduled','live','ended','archived')
      )
    )
  );

-- ── 2. Re-define gear_drop_advance_run with memento auto-publish for ALL
--    finishers (was winner-only). ─────────────────────────────────────────
create or replace function public.gear_drop_advance_run(
  p_run_id    uuid,
  p_photo_url text,
  p_note      text,
  p_lat       numeric,
  p_lng       numeric
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
  v_unlocked jsonb;
  v_unlocked_count int;
  v_next_idx int;
  v_waypoint_count int;
  v_is_start boolean;
  v_is_last boolean;
  v_submission jsonb;
  v_new_progress jsonb;
  v_winner_claimed uuid;
  v_actor_handle text := '';
  v_actor_name text := '';
  v_notif_text text;
  v_notif_err text;
  v_won boolean := false;
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
  if v_drop.status <> 'live' then raise exception 'drop is not live (status=%)', v_drop.status; end if;

  v_pins := coalesce(v_drop.route_data->'pins', '[]'::jsonb);
  v_waypoint_count := jsonb_array_length(v_pins);
  if v_waypoint_count = 0 then raise exception 'drop has no waypoints'; end if;

  v_unlocked := coalesce(v_run.progress->'waypointsUnlocked', '[]'::jsonb);
  v_unlocked_count := jsonb_array_length(v_unlocked);
  v_next_idx := v_unlocked_count;
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
    return jsonb_build_object(
      'ok', false,
      'error', 'too_far',
      'distance_m', v_distance,
      'radius_m', v_radius
    );
  end if;

  v_submission := jsonb_build_object(
    'waypointIdx', v_next_idx,
    'photoUrl', p_photo_url,
    'note', p_note,
    'lat', p_lat,
    'lng', p_lng,
    'distanceM', v_distance,
    'submittedAt', v_now
  );
  v_new_progress := jsonb_build_object(
    'waypointsUnlocked', v_unlocked || to_jsonb(v_next_idx),
    'submissions',       coalesce(v_run.progress->'submissions', '[]'::jsonb) || v_submission
  );

  update public.trip_reports
  set progress         = v_new_progress,
      last_unlocked_at = v_now,
      finished_at      = case when v_is_last then v_now else finished_at end,
      updated_at       = v_now
  where id = p_run_id;

  -- Actor identity for notification snapshots.
  begin
    select coalesce(handle, ''), coalesce(full_name, handle, 'A racer')
      into v_actor_handle, v_actor_name
    from public.profiles where id = v_uid;
  exception when others then v_actor_handle := ''; v_actor_name := 'A racer'; end;
  if v_actor_name is null then v_actor_name := 'A racer'; end if;

  if v_is_last then
    -- ─── Memento auto-publish (ALL finishers, not just winner) ──────────
    -- Every racer who completes the run gets a shareable recap with a
    -- unique slug. Pre-Phase 5 this was inside the winner branch, which
    -- left non-winners stuck in status='draft' with no slug — making
    -- their runs unreachable via /trips/<slug>.
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
                   else substring(replace(v_uid::text, '-', '') from 1 for 8)
              end),
        '[^a-z0-9]+', '-', 'g'
      );
      v_memento_slug_base := regexp_replace(v_memento_slug_base, '^-+|-+$', '', 'g');
      if v_memento_slug_base = '' then v_memento_slug_base := 'gear-drop-run'; end if;

      v_memento_slug := v_memento_slug_base;
      v_attempt := 0;
      while v_attempt < 5 loop
        begin
          update public.trip_reports
          set status       = 'published',
              visibility   = 'public',
              name         = v_memento_name,
              slug         = v_memento_slug,
              hero_img     = v_memento_hero,
              published_at = v_now,
              updated_at   = v_now
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
        set status       = 'published',
            visibility   = 'public',
            name         = v_memento_name,
            slug         = v_memento_slug,
            hero_img     = v_memento_hero,
            published_at = v_now,
            updated_at   = v_now
        where id = p_run_id;
      end if;
    exception when others then
      get stacked diagnostics v_memento_err = MESSAGE_TEXT;
      raise notice '[advance_run] memento publish failed: %', v_memento_err;
    end;

    -- ─── Winner claim (atomic) ─────────────────────────────────────────
    -- ONLY the first finisher claims winner. Subsequent finishers still
    -- get their memento published (above) but no winner fanout.
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
    'is_start', v_is_start,
    'is_last', v_is_last,
    'finished', v_is_last,
    'won', v_won,
    'distance_m', v_distance,
    'next_waypoint', case
      when v_is_last then null
      else v_pins->(v_next_idx + 1)
    end,
    'waypoints_remaining', v_waypoint_count - 1 - v_next_idx
  );
end;
$$;

grant execute on function public.gear_drop_advance_run(uuid, text, text, numeric, numeric) to authenticated;

-- ── 3. Backfill: publish any already-finished non-winner runs from past
--    test events so their recap cards become navigable. Wrapped in a DO
--    so a slug collision on one row doesn't kill the rest.
do $$
declare
  r record;
  v_drop record;
  v_actor_handle text;
  v_actor_name text;
  v_first_photo text;
  v_memento_name text;
  v_memento_hero text;
  v_slug_base text;
  v_slug text;
  v_attempt int;
begin
  for r in
    select tr.id, tr.user_id, tr.gear_drop_id, tr.progress, tr.finished_at
    from public.trip_reports tr
    where tr.kind = 'gear_drop_run'
      and tr.finished_at is not null
      and tr.status <> 'published'
  loop
    begin
      select * into v_drop from public.gear_drops where id = r.gear_drop_id;
      if not found then continue; end if;

      select coalesce(handle, ''), coalesce(full_name, handle, 'A racer')
        into v_actor_handle, v_actor_name
      from public.profiles where id = r.user_id;
      v_actor_handle := coalesce(v_actor_handle, '');
      v_actor_name := coalesce(v_actor_name, 'A racer');

      v_first_photo := (r.progress->'submissions'->0->>'photoUrl');
      v_memento_hero := coalesce(v_first_photo, v_drop.hero_img);
      v_memento_name := case
        when v_actor_handle <> '' then '@' || v_actor_handle || ' · ' || coalesce(v_drop.title, 'gear drop')
        else v_actor_name || ' · ' || coalesce(v_drop.title, 'gear drop')
      end;
      v_slug_base := regexp_replace(
        lower(coalesce(v_drop.slug, replace(v_drop.id::text, '-', '')) || '-' ||
              case when v_actor_handle <> '' then v_actor_handle
                   else substring(replace(r.user_id::text, '-', '') from 1 for 8)
              end),
        '[^a-z0-9]+', '-', 'g'
      );
      v_slug_base := regexp_replace(v_slug_base, '^-+|-+$', '', 'g');
      if v_slug_base = '' then v_slug_base := 'gear-drop-run'; end if;

      v_slug := v_slug_base;
      v_attempt := 0;
      while v_attempt < 5 loop
        begin
          update public.trip_reports
          set status = 'published',
              visibility = 'public',
              name = v_memento_name,
              slug = v_slug,
              hero_img = v_memento_hero,
              published_at = coalesce(r.finished_at, now()),
              updated_at = now()
          where id = r.id;
          exit;
        exception when unique_violation then
          v_attempt := v_attempt + 1;
          v_slug := v_slug_base || '-' || (v_attempt + 1)::text;
        end;
      end loop;
      if v_attempt >= 5 then
        v_slug := v_slug_base || '-' || substring(md5(random()::text) from 1 for 6);
        update public.trip_reports
        set status = 'published',
            visibility = 'public',
            name = v_memento_name,
            slug = v_slug,
            hero_img = v_memento_hero,
            published_at = coalesce(r.finished_at, now()),
            updated_at = now()
        where id = r.id;
      end if;
    exception when others then
      raise notice 'backfill skip % (%)', r.id, SQLERRM;
    end;
  end loop;
end$$;

notify pgrst, 'reload schema';
