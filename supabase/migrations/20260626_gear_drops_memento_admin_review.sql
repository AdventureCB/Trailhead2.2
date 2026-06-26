-- ============================================================================
-- GEAR DROPS — admin review gate on auto-published mementos
-- ============================================================================
-- Field-test concern: when a racer finishes, their run row auto-publishes
-- as a public memento at /trips/<slug>. Two scenarios where that's bad:
--   1. The winner's final-pin submission is inadequate (wrong landmark,
--      blurry, off-prompt) and other racers feel cheated.
--   2. Inappropriate content sneaks past the Haiku-based AI moderation.
--
-- Fix: gate the public-open behavior behind admin review. Memento card
-- still LANDS on the event page (so admin can see + review), but the
-- /trips/<slug> deep-link is only openable by admin (or owner / racer
-- themselves) until admin flips review status to 'approved'.
--
-- 3 cols + a redefined advance_run + 2 admin RPCs. SELECT policy stays
-- as-is — the event-page recap query and admin review both still work
-- via the existing parent-drop-past-draft branch. Client gates the open
-- action + the recap card surface.
--
-- Idempotent.
-- ============================================================================

-- ── 1. Columns ──────────────────────────────────────────────────────────────
alter table public.trip_reports
  add column if not exists gd_review_status text check (gd_review_status in ('pending','approved','rejected')),
  add column if not exists gd_reviewed_at   timestamptz,
  add column if not exists gd_reviewed_by   uuid references auth.users(id) on delete set null;

create index if not exists trip_reports_gd_review_status_idx
  on public.trip_reports (gd_review_status)
  where kind = 'gear_drop_run';

-- ── 2. Backfill — existing published mementos are 'approved'. Preserves
--      historical visibility so we don't suddenly hide old recap cards.
update public.trip_reports
set gd_review_status = 'approved',
    gd_reviewed_at = coalesce(published_at, finished_at, updated_at, now())
where kind = 'gear_drop_run'
  and status = 'published'
  and gd_review_status is null;

-- ── 3. Re-define gear_drop_advance_run so memento auto-publish lands in
--      'pending' state. Everything else (memento name/slug/hero, winner
--      claim, winner fanout push, slug retry loop) unchanged from the
--      2026-06-26 per-waypoint-notif removal version.
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

  begin
    select coalesce(handle, ''), coalesce(full_name, handle, 'A racer')
      into v_actor_handle, v_actor_name
    from public.profiles where id = v_uid;
  exception when others then v_actor_handle := ''; v_actor_name := 'A racer'; end;
  if v_actor_name is null then v_actor_name := 'A racer'; end if;

  if v_is_last then
    -- ─── Memento auto-publish (ALL finishers) ──────────────────────────
    -- Now lands in PENDING review state. Admin must approve before the
    -- /trips/<slug> deep-link is publicly openable.
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
          set status           = 'published',
              visibility       = 'public',
              name             = v_memento_name,
              slug             = v_memento_slug,
              hero_img         = v_memento_hero,
              gd_review_status = 'pending',
              published_at     = v_now,
              updated_at       = v_now
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
        set status           = 'published',
            visibility       = 'public',
            name             = v_memento_name,
            slug             = v_memento_slug,
            hero_img         = v_memento_hero,
            gd_review_status = 'pending',
            published_at     = v_now,
            updated_at       = v_now
        where id = p_run_id;
      end if;
    exception when others then
      get stacked diagnostics v_memento_err = MESSAGE_TEXT;
      raise notice '[advance_run] memento publish failed: %', v_memento_err;
    end;

    -- Winner claim (atomic) — unchanged. Winner declaration is still
    -- automatic. If admin later rejects the memento, they'll need to
    -- revoke + reassign winner via a separate flow (TODO).
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

-- ── 4. Admin review RPCs ───────────────────────────────────────────────────
create or replace function public.admin_approve_gear_drop_memento(
  p_run_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_row record;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not public.is_admin(v_uid) then raise exception 'admin only'; end if;

  select id, kind, gd_review_status into v_row
  from public.trip_reports where id = p_run_id;
  if not found then raise exception 'run not found'; end if;
  if v_row.kind <> 'gear_drop_run' then raise exception 'not a gear drop run'; end if;

  update public.trip_reports
  set gd_review_status = 'approved',
      gd_reviewed_at   = now(),
      gd_reviewed_by   = v_uid,
      updated_at       = now()
  where id = p_run_id;

  return jsonb_build_object('ok', true, 'run_id', p_run_id, 'status', 'approved');
end;
$$;

grant execute on function public.admin_approve_gear_drop_memento(uuid) to authenticated;

create or replace function public.admin_reject_gear_drop_memento(
  p_run_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_row record;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not public.is_admin(v_uid) then raise exception 'admin only'; end if;

  select id, kind, gd_review_status into v_row
  from public.trip_reports where id = p_run_id;
  if not found then raise exception 'run not found'; end if;
  if v_row.kind <> 'gear_drop_run' then raise exception 'not a gear drop run'; end if;

  update public.trip_reports
  set gd_review_status = 'rejected',
      gd_reviewed_at   = now(),
      gd_reviewed_by   = v_uid,
      updated_at       = now()
  where id = p_run_id;

  return jsonb_build_object('ok', true, 'run_id', p_run_id, 'status', 'rejected');
end;
$$;

grant execute on function public.admin_reject_gear_drop_memento(uuid) to authenticated;

notify pgrst, 'reload schema';
