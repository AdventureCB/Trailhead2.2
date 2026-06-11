-- ============================================================================
-- GEAR DROPS — Phase 2: convoy auto-spawn on SCHEDULE
-- ============================================================================
-- When admin (or a granted co-host) transitions a draft drop to scheduled,
-- a CONVOYS-type post is created and linked via gear_drops.convoy_post_id.
-- The post is owned by host_admin_id so the convoy reads as authored by the
-- gear drop host even when a co-host triggered the schedule. SECURITY DEFINER
-- so the function can bypass the posts INSERT RLS (which requires
-- auth.uid() = user_id) when host_admin_id is someone other than the actor.
-- ============================================================================


create or replace function public.schedule_gear_drop(p_drop_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_drop record;
  v_post_id uuid;
  v_actor uuid := auth.uid();
  v_owner uuid;
  v_now timestamptz := now();
begin
  if v_actor is null then raise exception 'not authenticated'; end if;
  if not can_edit_gear_drop(p_drop_id) then raise exception 'not authorized'; end if;

  select * into v_drop from public.gear_drops where id = p_drop_id;
  if not found then raise exception 'drop not found'; end if;

  -- Idempotent: scheduling an already-scheduled drop is a no-op that still
  -- returns the existing convoy_post_id so the client can refresh from it.
  if v_drop.status = 'scheduled' and v_drop.convoy_post_id is not null then
    return v_drop.convoy_post_id;
  end if;

  v_owner := coalesce(v_drop.host_admin_id, v_actor);

  -- Create the convoy post if there isn't one linked yet. If a prior
  -- SCHEDULED → DRAFT → SCHEDULED cycle already wrote convoy_post_id, reuse
  -- the same post so the existing RSVPs / comments aren't orphaned.
  if v_drop.convoy_post_id is null then
    v_post_id := gen_random_uuid();
    insert into public.posts (
      id, user_id, type, title, data, hero_img, created_at, updated_at
    ) values (
      v_post_id,
      v_owner,
      'CONVOYS',
      coalesce(v_drop.title, 'Gear Drop'),
      jsonb_build_object(
        'gearDropId', p_drop_id,
        'isGearDrop', true,
        'brand', v_drop.brand_partner_name,
        'prizeTitle', v_drop.prize_title,
        'prizeValueCents', v_drop.prize_value_cents,
        'convoyDate', v_drop.starts_at,
        'convoyMeetLat', v_drop.start_lat,
        'convoyMeetLng', v_drop.start_lng,
        'convoyMeetLabel', 'Gear Drop start',
        'subtitle', case
          when v_drop.brand_partner_name is not null
            then v_drop.brand_partner_name || ' × LPO Gear Drop'
          else 'Lone Peak Overland Gear Drop'
        end,
        'body', coalesce(v_drop.prize_description, v_drop.prize_title)
      ),
      v_drop.hero_img,
      v_now,
      v_now
    );
  else
    v_post_id := v_drop.convoy_post_id;
  end if;

  update public.gear_drops
  set status = 'scheduled',
      convoy_post_id = v_post_id,
      updated_at = v_now
  where id = p_drop_id;

  return v_post_id;
end;
$$;

grant execute on function public.schedule_gear_drop(uuid) to authenticated;
