-- ─────────────────────────────────────────────────────────────────────────────
-- Ranks Phase 8 — Publishing pipeline
-- ─────────────────────────────────────────────────────────────────────────────
-- Approved bounty submissions land as real content artifacts (trip reports
-- or forum threads, depending on the bounty's category / admin choice).
-- The publishing fires INSIDE admin_approve_bounty so admin's single APPROVE
-- click also publishes — no separate two-step flow.
--
-- publish_options jsonb shape (all optional except destination):
--   {
--     "destination": "trip_report" | "forum_thread" | "none",
--     "publish_as": "user" | "lpo",                  -- default "user"
--     "forum_category_slug": "gear-reviews",          -- forum_thread only
--     "forum_subcategory_slug": "field-tests",        -- forum_thread only
--     "linked_build_id": "<uuid>"                     -- forum_thread, Build Feature
--   }
--
-- Field mapping (per-section by type from the bounty's form_config):
--   - First "h1" / "short" with id starting "title" → title/name
--   - First "p" section → description / body / sections[0].body
--   - First "hero_image" → hero_img / photos[0]
--   - First "photos" array → photos jsonb
--   - First "route_builder" → route_data (trip_reports only)
--   - All non-meta sections (h2/h3/p) → sections jsonb for forum_threads
--
-- Author:
--   - publish_as='user' → user_id = v_sub.user_id (the participant)
--   - publish_as='lpo'  → user_id = v_uid           (the admin approving)
--
-- Attribution back-link doesn't need new columns — the existing
-- bounty_submissions.published_trip_id / published_thread_id columns
-- already point both directions. Client joins at render time.
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Helper: slugify a string with collision-retry on a target table+column ──
-- Returns a unique slug (with -2, -3, ... suffix if the base is taken).
-- Postgres has no native generic "unique constraint check across any table"
-- so we use dynamic SQL keyed by table_name + column_name. Cap retry at 12
-- attempts then fall back to a random base36 tail for absolute uniqueness.
create or replace function public.publish_unique_slug(
  p_table text,
  p_column text,
  p_base text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_count int;
  i int;
begin
  v_slug := nullif(regexp_replace(lower(coalesce(p_base, '')), '[^a-z0-9]+', '-', 'g'), '');
  v_slug := nullif(regexp_replace(v_slug, '^-+|-+$', '', 'g'), '');
  if v_slug is null then v_slug := 'item-' || floor(extract(epoch from now()))::text; end if;
  if length(v_slug) > 60 then v_slug := substring(v_slug from 1 for 60); end if;

  for i in 1..12 loop
    execute format('select count(*) from public.%I where %I = $1', p_table, p_column)
      into v_count using (case when i = 1 then v_slug else v_slug || '-' || i::text end);
    if v_count = 0 then
      return case when i = 1 then v_slug else v_slug || '-' || i::text end;
    end if;
  end loop;

  -- Final escape hatch — astronomically unlikely to collide.
  return v_slug || '-' || to_hex((random() * 1e9)::int);
end;
$$;

revoke all on function public.publish_unique_slug(text, text, text) from public;

-- ── Re-define admin_approve_bounty with publishing wired in ──
-- Drop first because we're changing the return shape (added 3 new uuid
-- columns for the published_X_id values). `create or replace` can't change
-- the return type of an existing function — Postgres raises 42P13.
drop function if exists public.admin_approve_bounty(uuid, text, jsonb);

create or replace function public.admin_approve_bounty(
  p_submission_id uuid,
  p_reviewer_notes text default null,
  p_publish_options jsonb default null
) returns table(
  submission_id uuid,
  status text,
  reward_cents int,
  reward_points int,
  published_trip_id uuid,
  published_thread_id uuid,
  published_post_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_sub record;
  v_bounty record;
  v_actor record;
  v_reward_cents int;
  v_reward_points int;
  v_form_config jsonb;
  v_sections jsonb;
  v_section jsonb;
  v_destination text;
  v_publish_as text;
  v_author_uid uuid;
  v_title text;
  v_description text;
  v_hero_url text;
  v_route_data jsonb;
  v_photos jsonb;
  v_thread_sections jsonb := '[]'::jsonb;
  v_concat_body text := '';
  v_trip_id uuid;
  v_thread_id uuid;
  v_post_id uuid;
  v_slug text;
  v_category_slug text;
  v_subcategory_slug text;
begin
  if not public.is_admin(v_uid) then raise exception 'admin_approve_bounty: not authorized'; end if;
  if p_submission_id is null then raise exception 'admin_approve_bounty: submission id required'; end if;

  select id, user_id, bounty_id, status, draft from public.bounty_submissions where id = p_submission_id into v_sub;
  if not found then raise exception 'admin_approve_bounty: submission not found'; end if;
  if v_sub.status <> 'submitted' then
    raise exception 'admin_approve_bounty: submission is not pending review (status=%)', v_sub.status;
  end if;

  -- Snapshot the bounty's current rewards + form_config for mapping.
  select reward_cents, reward_points, title, category, form_config
    from public.bounties where id = v_sub.bounty_id into v_bounty;
  v_reward_cents := coalesce(v_bounty.reward_cents, 0);
  v_reward_points := coalesce(v_bounty.reward_points, 0);
  v_form_config := v_bounty.form_config;

  -- ── Approve the submission (existing behavior, kept identical) ──
  update public.bounty_submissions
     set status = 'approved',
         reviewed_by = v_uid,
         reviewed_at = now(),
         reviewer_notes = p_reviewer_notes,
         reward_cents = v_reward_cents,
         reward_points = v_reward_points,
         draft = case
           when p_publish_options is not null then v_sub.draft || jsonb_build_object('_publish_options', p_publish_options)
           else v_sub.draft
         end
   where id = p_submission_id;

  update public.bounties
     set approved_slots = approved_slots + 1
   where id = v_sub.bounty_id;

  -- ── Award points (existing inline mirror of award_points) ──
  if v_reward_points > 0 then
    begin
      insert into public.points_log (user_id, kind, amount, ref_id, ref_type)
      values (v_sub.user_id, 'bounty_approved', v_reward_points, p_submission_id, 'bounty_submission');

      update public.profiles
         set points = points + v_reward_points,
             points_breakdown = points_breakdown || jsonb_build_object(
               'bounty_approved',
               coalesce((points_breakdown ->> 'bounty_approved')::int, 0) + v_reward_points
             )
       where id = v_sub.user_id;

      perform public.recompute_badges(v_sub.user_id);
    exception when others then
      raise notice 'admin_approve_bounty: points award failed for %: %', v_sub.user_id, sqlerrm;
    end;
  end if;

  -- ── Phase 8: Publishing ──
  v_destination := coalesce(p_publish_options ->> 'destination', 'none');
  v_publish_as := coalesce(p_publish_options ->> 'publish_as', 'user');
  v_author_uid := case when v_publish_as = 'lpo' then v_uid else v_sub.user_id end;

  if v_destination <> 'none' and v_form_config is not null then
    v_sections := coalesce(v_form_config -> 'sections', '[]'::jsonb);

    -- ── Map draft fields → destination columns ──
    -- Walk sections, pull the first match for each target slot. Draft is
    -- keyed by section.id; section.type tells us what kind of value it
    -- holds. Fixed sections (admin-authored static text) are skipped for
    -- title/desc because they're not user-supplied content.

    -- title: first non-fixed h1/short whose draft has a value
    for v_section in select * from jsonb_array_elements(v_sections)
    loop
      if (v_section ->> 'type') in ('h1', 'short')
         and (v_section ->> 'fixed') is distinct from 'true'
         and v_sub.draft ? (v_section ->> 'id')
         and length(trim(v_sub.draft ->> (v_section ->> 'id'))) > 0 then
        v_title := v_sub.draft ->> (v_section ->> 'id');
        exit;
      end if;
    end loop;
    if v_title is null or v_title = '' then v_title := v_bounty.title; end if;

    -- description: first non-fixed p with content
    for v_section in select * from jsonb_array_elements(v_sections)
    loop
      if (v_section ->> 'type') = 'p'
         and (v_section ->> 'fixed') is distinct from 'true'
         and v_sub.draft ? (v_section ->> 'id')
         and length(trim(v_sub.draft ->> (v_section ->> 'id'))) > 0 then
        v_description := v_sub.draft ->> (v_section ->> 'id');
        exit;
      end if;
    end loop;

    -- hero: first hero_image with .url set
    for v_section in select * from jsonb_array_elements(v_sections)
    loop
      if (v_section ->> 'type') = 'hero_image' then
        v_hero_url := (v_sub.draft -> (v_section ->> 'id')) ->> 'url';
        if v_hero_url is not null and v_hero_url <> '' then exit; end if;
      end if;
    end loop;

    -- photos: first photos array with entries
    for v_section in select * from jsonb_array_elements(v_sections)
    loop
      if (v_section ->> 'type') = 'photos'
         and jsonb_typeof(v_sub.draft -> (v_section ->> 'id')) = 'array' then
        v_photos := v_sub.draft -> (v_section ->> 'id');
        if jsonb_array_length(v_photos) > 0 then exit; end if;
      end if;
    end loop;

    -- route_data: first route_builder
    for v_section in select * from jsonb_array_elements(v_sections)
    loop
      if (v_section ->> 'type') = 'route_builder' then
        v_route_data := v_sub.draft -> (v_section ->> 'id');
        if v_route_data is not null and v_route_data <> 'null'::jsonb then exit; end if;
      end if;
    end loop;

    -- ── Branch by destination ──
    if v_destination = 'trip_report' then
      -- For trip reports, splice photos into route_data.photos so the
      -- detail page renders them inline with the route.
      if v_route_data is not null then
        if v_photos is not null then
          v_route_data := v_route_data || jsonb_build_object('photos', v_photos);
        end if;
      end if;
      v_slug := public.publish_unique_slug('trip_reports', 'slug', v_title);

      insert into public.trip_reports (
        user_id, slug, name, description, status, kind, visibility,
        hero_img, route_data
      ) values (
        v_author_uid,
        v_slug,
        v_title,
        v_description,
        'published',
        'report',
        'public',
        v_hero_url,
        coalesce(v_route_data, '{}'::jsonb)
      )
      returning id into v_trip_id;

      update public.bounty_submissions
         set published_trip_id = v_trip_id
       where id = p_submission_id;

    elsif v_destination = 'forum_thread' then
      v_category_slug := p_publish_options ->> 'forum_category_slug';
      v_subcategory_slug := p_publish_options ->> 'forum_subcategory_slug';
      if v_category_slug is null or v_category_slug = '' then
        raise exception 'admin_approve_bounty: forum_category_slug required when destination=forum_thread';
      end if;
      if v_subcategory_slug is null or v_subcategory_slug = '' then
        raise exception 'admin_approve_bounty: forum_subcategory_slug required when destination=forum_thread';
      end if;

      -- Build sections jsonb: walk non-fixed h2/h3/p and pair into
      -- {subheading, body} entries. h2/h3 starts a section; following p
      -- becomes the body. Photos get appended to the last section's body
      -- as a separator marker (legacy concatenated body uses photos jsonb
      -- separately so this works).
      v_thread_sections := '[]'::jsonb;
      v_concat_body := '';
      declare
        v_current_subheading text := null;
        v_current_body text := '';
        v_st text;
      begin
        for v_section in select * from jsonb_array_elements(v_sections)
        loop
          if (v_section ->> 'fixed') is distinct from 'true' then
            v_st := v_section ->> 'type';
            if v_st in ('h2', 'h3') then
              if v_current_subheading is not null or length(v_current_body) > 0 then
                v_thread_sections := v_thread_sections || jsonb_build_array(
                  jsonb_build_object('subheading', coalesce(v_current_subheading, ''), 'body', v_current_body)
                );
              end if;
              v_current_subheading := v_sub.draft ->> (v_section ->> 'id');
              v_current_body := '';
            elsif v_st = 'p' or v_st = 'short' then
              v_current_body := v_current_body
                || case when length(v_current_body) > 0 then E'\n\n' else '' end
                || coalesce(v_sub.draft ->> (v_section ->> 'id'), '');
            end if;
          end if;
        end loop;
        if v_current_subheading is not null or length(v_current_body) > 0 then
          v_thread_sections := v_thread_sections || jsonb_build_array(
            jsonb_build_object('subheading', coalesce(v_current_subheading, ''), 'body', v_current_body)
          );
        end if;
      end;

      -- Body fallback: concat sections for legacy body field
      v_concat_body := '';
      for v_section in select * from jsonb_array_elements(v_thread_sections)
      loop
        v_concat_body := v_concat_body
          || case when length(v_concat_body) > 0 then E'\n\n' else '' end
          || case when length(coalesce(v_section ->> 'subheading', '')) > 0 then '## ' || (v_section ->> 'subheading') || E'\n\n' else '' end
          || coalesce(v_section ->> 'body', '');
      end loop;

      v_slug := public.publish_unique_slug('forum_threads', 'slug', v_title);

      insert into public.forum_threads (
        user_id, category_slug, subcategory_slug, title, slug, body,
        sections, photos, pinned, view_count
      ) values (
        v_author_uid,
        v_category_slug,
        v_subcategory_slug,
        v_title,
        v_slug,
        v_concat_body,
        v_thread_sections,
        case when v_photos is not null then v_photos
             when v_hero_url is not null then jsonb_build_array(jsonb_build_object('url', v_hero_url))
             else '[]'::jsonb end,
        false,
        0
      )
      returning id into v_thread_id;

      update public.bounty_submissions
         set published_thread_id = v_thread_id
       where id = p_submission_id;
    end if;
  end if;

  -- ── Notify the submitter (existing behavior) ──
  begin
    select full_name, handle from public.profiles where id = v_uid into v_actor;
    insert into public.notifications (user_id, type, actor_id, actor_name, text, target)
    values (
      v_sub.user_id,
      'bounty_approved',
      v_uid,
      coalesce(v_actor.full_name, v_actor.handle, 'Admin'),
      case
        when v_reward_cents > 0 and v_reward_points > 0 then 'approved your bounty for $' || (v_reward_cents / 100)::text || ' + ' || v_reward_points::text || ' pts'
        when v_reward_cents > 0 then 'approved your bounty for $' || (v_reward_cents / 100)::text
        when v_reward_points > 0 then 'approved your bounty for ' || v_reward_points::text || ' pts'
        else 'approved your bounty submission'
      end,
      coalesce(v_bounty.title, 'Bounty')
    );
  exception when others then raise notice 'approve notif failed: %', sqlerrm; end;

  return query select p_submission_id, 'approved'::text, v_reward_cents, v_reward_points,
                      v_trip_id, v_thread_id, v_post_id;
end;
$$;

revoke all on function public.admin_approve_bounty(uuid, text, jsonb) from public;
grant execute on function public.admin_approve_bounty(uuid, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
