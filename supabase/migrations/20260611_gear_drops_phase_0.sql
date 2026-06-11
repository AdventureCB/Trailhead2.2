-- ============================================================================
-- GEAR DROPS — Phase 0: schema, RLS, RPCs
-- ============================================================================
-- Hosts: admin + per-drop temp co-host grants via gear_drop_editors.
-- Entity model: gear_drops master row links to an auto-spawned convoy post
-- (created in Phase 1) and to per-participant trip_reports rows (kind='gear_drop_run').
-- Anti-cheat: GPS within waypoint.radius_m + photo + note, server-validated.
-- Race: server timestamp on last-waypoint submission claims winner atomically
-- via UPDATE ... WHERE winner_run_id IS NULL.
-- ============================================================================


-- 0) Beta-tester flag (gates UI surfaces pre-launch)
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_beta_tester boolean not null default false;

create or replace function public.profiles_beta_tester_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' and (new.is_beta_tester is distinct from old.is_beta_tester) then
    if not public.is_admin(auth.uid()) then
      raise exception 'only admins can change is_beta_tester';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_beta_tester_guard on public.profiles;
create trigger profiles_beta_tester_guard
  before update on public.profiles
  for each row execute function public.profiles_beta_tester_guard();


-- 1) gear_drops master table
-- ----------------------------------------------------------------------------
create table if not exists public.gear_drops (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  brand_partner_name text,
  brand_logo_url text,
  hero_img text,

  prize_title text not null,
  prize_description text,
  prize_value_cents integer,

  -- route_data shape mirrors trip_reports for editor reuse.
  -- pins[] carries per-waypoint metadata:
  --   { lat, lng, label, showSnapLineFromPrev (bool), radius_m (int, default 100),
  --     hint_text, hint_photo_url, display_mode ('pin' | 'radius_reveal') }
  route_data jsonb not null default '{"pins":[],"points":[]}'::jsonb,

  -- start_lat/lng is the ONLY public coord before the event runs.
  start_lat numeric(10,7),
  start_lng numeric(10,7),

  -- Lifecycle
  status text not null default 'draft'
    check (status in ('draft','scheduled','live','ended','archived')),
  starts_at timestamptz,
  ends_at timestamptz,              -- nullable: open-ended events allowed
  signup_open_until timestamptz,    -- nullable: derived from starts_at + late_signup_window_min
  late_signup_window_min integer not null default 30,

  -- Afterparty (revealed when winner_announced_at flips non-null)
  afterparty_lat numeric(10,7),
  afterparty_lng numeric(10,7),
  afterparty_label text,
  afterparty_address text,
  afterparty_starts_at timestamptz,

  -- Wiring
  convoy_post_id uuid references public.posts(id) on delete set null,
  host_admin_id uuid references auth.users(id) on delete set null,

  -- Race outcome
  winner_run_id uuid,               -- FK added after trip_reports column exists; see below
  winner_announced_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists gear_drops_convoy_post_id_unique
  on public.gear_drops(convoy_post_id)
  where convoy_post_id is not null;

create index if not exists gear_drops_status_starts_at_idx
  on public.gear_drops(status, starts_at desc);


-- 2) gear_drop_editors — per-drop temp co-host grants
-- ----------------------------------------------------------------------------
create table if not exists public.gear_drop_editors (
  gear_drop_id uuid not null references public.gear_drops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (gear_drop_id, user_id)
);


-- 3) Extend trip_reports for participant runs
-- ----------------------------------------------------------------------------
alter table public.trip_reports
  drop constraint if exists trip_reports_kind_check;
alter table public.trip_reports
  add constraint trip_reports_kind_check check (kind in ('plan','report','gear_drop_run'));

alter table public.trip_reports
  add column if not exists gear_drop_id uuid references public.gear_drops(id) on delete set null,
  add column if not exists progress jsonb not null default '{}'::jsonb,
  add column if not exists last_unlocked_at timestamptz,
  add column if not exists finished_at timestamptz;

-- Now wire the winner_run_id FK on gear_drops (deferred until trip_reports row exists)
do $$ begin
  alter table public.gear_drops
    add constraint gear_drops_winner_run_id_fkey
    foreign key (winner_run_id) references public.trip_reports(id) on delete set null;
exception when duplicate_object then null;
end $$;

create index if not exists trip_reports_gear_drop_idx
  on public.trip_reports(gear_drop_id)
  where gear_drop_id is not null;

create index if not exists trip_reports_gear_drop_leaderboard_idx
  on public.trip_reports(gear_drop_id, finished_at nulls last, last_unlocked_at)
  where kind = 'gear_drop_run';


-- 4) notifications: new column + widen type enum
-- ----------------------------------------------------------------------------
alter table public.notifications
  add column if not exists gear_drop_id uuid references public.gear_drops(id) on delete cascade;

create index if not exists notifications_gear_drop_idx
  on public.notifications(gear_drop_id)
  where gear_drop_id is not null;

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'like','comment','mention','reply','follow','rsvp','role','recovery','convoy',
      'bug_fix','bug_report','content_report',
      'gear_drop_signup','gear_drop_unlock','gear_drop_won','gear_drop_winner'
    )
  );


-- 5) Helper functions
-- ----------------------------------------------------------------------------
create or replace function public.can_edit_gear_drop(p_drop_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.is_admin(auth.uid())
    or exists (
      select 1 from public.gear_drop_editors
      where gear_drop_id = p_drop_id and user_id = auth.uid()
    );
$$;

grant execute on function public.can_edit_gear_drop(uuid) to authenticated;

-- Haversine distance in meters. Used by gear_drop_advance_run.
create or replace function public.haversine_m(
  lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric
) returns numeric
language sql
immutable
as $$
  select 6371000::numeric * 2 * asin(sqrt(
    power(sin(radians((lat2 - lat1)::float8) / 2), 2) +
    cos(radians(lat1::float8)) * cos(radians(lat2::float8)) *
    power(sin(radians((lng2 - lng1)::float8) / 2), 2)
  ))::numeric;
$$;


-- 6) join_gear_drop — idempotent signup
-- ----------------------------------------------------------------------------
-- Creates participant trip_report run row (kind='gear_drop_run') if not present.
-- Returns the run_id. Also writes convoy_rsvps row if the drop has a linked convoy.
create or replace function public.join_gear_drop(p_drop_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_drop record;
  v_uid uuid := auth.uid();
  v_existing uuid;
  v_run_id uuid;
  v_late_cutoff timestamptz;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select * into v_drop from public.gear_drops where id = p_drop_id;
  if not found then raise exception 'drop not found'; end if;
  if v_drop.status not in ('scheduled','live') then
    raise exception 'drop not open for signups';
  end if;

  -- Signup window: explicit signup_open_until wins; otherwise starts_at + late_signup_window_min
  if v_drop.signup_open_until is not null then
    if now() > v_drop.signup_open_until then
      raise exception 'signups closed';
    end if;
  elsif v_drop.starts_at is not null then
    v_late_cutoff := v_drop.starts_at + (coalesce(v_drop.late_signup_window_min, 30) || ' minutes')::interval;
    if now() > v_late_cutoff then
      raise exception 'signups closed';
    end if;
  end if;

  -- Idempotent: return existing run row if already joined.
  select id into v_existing
  from public.trip_reports
  where gear_drop_id = p_drop_id
    and user_id = v_uid
    and kind = 'gear_drop_run'
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  v_run_id := gen_random_uuid();

  insert into public.trip_reports (
    id, user_id, kind, status, visibility, gear_drop_id,
    name, slug, route_data, progress, start_lat, start_lng
  ) values (
    v_run_id,
    v_uid,
    'gear_drop_run',
    'draft',
    'private',
    p_drop_id,
    coalesce(v_drop.title, 'Gear Drop Run'),
    'gd-run-' || replace(v_run_id::text, '-', ''),
    -- Only the start pin is seeded; subsequent waypoints revealed via advance RPC.
    jsonb_build_object(
      'pins', jsonb_build_array(
        jsonb_build_object(
          'lat', v_drop.start_lat,
          'lng', v_drop.start_lng,
          'label', 'Start'
        )
      ),
      'points', '[]'::jsonb
    ),
    '{}'::jsonb,
    v_drop.start_lat,
    v_drop.start_lng
  );

  -- Mirror RSVP into convoy join table so existing convoy UX works.
  if v_drop.convoy_post_id is not null then
    insert into public.convoy_rsvps (post_id, user_id, status)
    values (v_drop.convoy_post_id, v_uid, 'going')
    on conflict (post_id, user_id) do update set status = excluded.status;
  end if;

  return v_run_id;
end;
$$;

grant execute on function public.join_gear_drop(uuid) to authenticated;


-- 7) gear_drop_advance_run — server-validated waypoint progression
-- ----------------------------------------------------------------------------
-- Returns jsonb:
--   { ok, error?, unlocked_idx?, is_last?, finished?, won?, distance_m?, next_waypoint? }
-- On the last waypoint, atomically claims winner via UPDATE ... WHERE winner_run_id IS NULL.
-- Late finishers after winner is declared still complete their run (no winner reassign).
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

  -- waypoints are 0-indexed; index 0 is the start (already known on join).
  -- The "next waypoint to submit" is unlocked_count, OR 1 if zero progress
  -- (because the start pin is implicit knowledge at join time).
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

  if v_is_last then
    -- Atomic winner claim. NULL→p_run_id only happens for one caller.
    update public.gear_drops
    set winner_run_id = p_run_id,
        winner_announced_at = v_now
    where id = v_drop.id and winner_run_id is null
    returning winner_run_id into v_winner_claimed;

    if v_winner_claimed is not null then
      v_won := true;

      insert into public.notifications (user_id, type, gear_drop_id, actor_id, data)
      values (
        v_uid,
        'gear_drop_won',
        v_drop.id,
        v_uid,
        jsonb_build_object('manual', false)
      );

      insert into public.notifications (user_id, type, gear_drop_id, actor_id, data)
      select user_id, 'gear_drop_winner', v_drop.id, v_uid,
             jsonb_build_object('winner_user_id', v_uid)
      from public.trip_reports
      where gear_drop_id = v_drop.id
        and kind = 'gear_drop_run'
        and user_id <> v_uid;
    end if;
  else
    insert into public.notifications (user_id, type, gear_drop_id, actor_id, data)
    values (
      v_uid,
      'gear_drop_unlock',
      v_drop.id,
      v_uid,
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


-- 8) claim_gear_drop_winner — host manual-declare path
-- ----------------------------------------------------------------------------
-- For when ends_at passes with no auto-winner, or host wants to award
-- participation prize. Fan-out same as auto-win, plus 'manual'=true in payload.
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

  -- Mark winner's run as finished even if not all waypoints submitted.
  update public.trip_reports
  set finished_at = coalesce(finished_at, v_now)
  where id = p_run_id;

  insert into public.notifications (user_id, type, gear_drop_id, actor_id, data)
  values (
    v_run.user_id,
    'gear_drop_won',
    p_drop_id,
    auth.uid(),
    jsonb_build_object('manual', true, 'reason', p_reason)
  );

  insert into public.notifications (user_id, type, gear_drop_id, actor_id, data)
  select user_id, 'gear_drop_winner', p_drop_id, auth.uid(),
         jsonb_build_object('winner_user_id', v_run.user_id, 'manual', true)
  from public.trip_reports
  where gear_drop_id = p_drop_id
    and kind = 'gear_drop_run'
    and user_id <> v_run.user_id;
end;
$$;

grant execute on function public.claim_gear_drop_winner(uuid, uuid, text) to authenticated;


-- 9) RLS
-- ----------------------------------------------------------------------------
alter table public.gear_drops enable row level security;
alter table public.gear_drop_editors enable row level security;

drop policy if exists gear_drops_select on public.gear_drops;
create policy gear_drops_select on public.gear_drops
  for select using (
    status <> 'draft' or public.can_edit_gear_drop(id)
  );

drop policy if exists gear_drops_insert on public.gear_drops;
create policy gear_drops_insert on public.gear_drops
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists gear_drops_update on public.gear_drops;
create policy gear_drops_update on public.gear_drops
  for update using (public.can_edit_gear_drop(id))
  with check (public.can_edit_gear_drop(id));

drop policy if exists gear_drops_delete on public.gear_drops;
create policy gear_drops_delete on public.gear_drops
  for delete using (public.is_admin(auth.uid()));

drop policy if exists gear_drop_editors_select on public.gear_drop_editors;
create policy gear_drop_editors_select on public.gear_drop_editors
  for select using (
    public.is_admin(auth.uid()) or user_id = auth.uid()
  );

drop policy if exists gear_drop_editors_insert on public.gear_drop_editors;
create policy gear_drop_editors_insert on public.gear_drop_editors
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists gear_drop_editors_delete on public.gear_drop_editors;
create policy gear_drop_editors_delete on public.gear_drop_editors
  for delete using (public.is_admin(auth.uid()));

-- trip_reports SELECT extension: allow public read of gear_drop_run rows for
-- live/ended events so the leaderboard is visible to everyone. Postgres ORs
-- this with the existing SELECT policy so owner / published-trip access is preserved.
drop policy if exists trip_reports_select_gear_drop_run on public.trip_reports;
create policy trip_reports_select_gear_drop_run on public.trip_reports
  for select using (
    kind = 'gear_drop_run'
    and exists (
      select 1 from public.gear_drops
      where id = trip_reports.gear_drop_id
        and status in ('live','ended')
    )
  );


-- 10) Realtime
-- ----------------------------------------------------------------------------
alter table public.gear_drops replica identity full;
alter table public.gear_drop_editors replica identity full;

do $$ begin
  alter publication supabase_realtime add table public.gear_drops;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.gear_drop_editors;
exception when duplicate_object then null;
end $$;


-- 11) updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.gear_drops_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists gear_drops_touch_updated_at on public.gear_drops;
create trigger gear_drops_touch_updated_at
  before update on public.gear_drops
  for each row execute function public.gear_drops_touch_updated_at();
