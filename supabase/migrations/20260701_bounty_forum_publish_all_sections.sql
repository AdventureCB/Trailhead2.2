-- ─────────────────────────────────────────────────────────────────────────────
-- admin_approve_bounty (forum_thread destination) — full section walk
-- ─────────────────────────────────────────────────────────────────────────────
-- The previous walker had two bugs when publishing a bounty submission as a
-- forum thread:
--
--   1. It SKIPPED fixed sections entirely (`if fixed is distinct from true`),
--      but Gear Review / Route Report / Build Feature / Content Creation
--      templates all use `fixed: true` on their h2 subheadings so the
--      participant sees a canonical structure. Result: every h2 (Testing
--      & Field Use, Performance Comparison, Pros & Cons, Final Verdict,
--      etc.) was dropped from the published thread — every paragraph got
--      concatenated under an empty subheading.
--
--   2. It only handled `p` / `short` — every other content type (`bullet_list`,
--      `rating`, `select`, `tag_select`) was dropped silently, so the Pros
--      list, Cons list, and rating from a Gear Review never made it into
--      the forum post.
--
-- This rewrites the walker to:
--   • Emit fixed h2/h3 subheadings using `section.value` (the label admin
--     hard-coded in the template).
--   • Emit non-fixed h2/h3 subheadings from the draft value (participant
--     may edit — e.g. Content Creation's dynamic subheadings).
--   • Wrap paragraph content as `<p>...</p>` HTML.
--   • Turn `bullet_list` (jsonb array of strings) into `<ul><li>...</li></ul>`.
--   • Turn `rating` (numeric 0-5) into `⭐ N / 5` line.
--   • Turn `select` / `tag_select` into `<p><strong>label:</strong> value</p>`.
--   • Preserve prior behavior for title (v_title), hero_image (v_hero_url),
--     and photos (v_photos handed to forum_threads.photos jsonb).
--
-- Idempotent: drop + recreate.
-- ─────────────────────────────────────────────────────────────────────────────

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
  v_linked_trip_id uuid;
  -- Section-walker scratch state
  v_current_subheading text;
  v_current_body text;
  v_st text;
  v_label text;
  v_val text;
  v_arr jsonb;
  v_num numeric;
  v_html text;
begin
  if not public.is_admin(v_uid) then raise exception 'admin_approve_bounty: not authorized'; end if;
  if p_submission_id is null then raise exception 'admin_approve_bounty: submission id required'; end if;

  select id, user_id, bounty_id, status, draft from public.bounty_submissions where id = p_submission_id into v_sub;
  if not found then raise exception 'admin_approve_bounty: submission not found'; end if;
  if v_sub.status <> 'submitted' then
    raise exception 'admin_approve_bounty: submission is not pending review (status=%)', v_sub.status;
  end if;

  select reward_cents, reward_points, title, category, form_config
    from public.bounties where id = v_sub.bounty_id into v_bounty;
  v_reward_cents := coalesce(v_bounty.reward_cents, 0);
  v_reward_points := coalesce(v_bounty.reward_points, 0);
  v_form_config := v_bounty.form_config;

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

  v_destination := coalesce(p_publish_options ->> 'destination', 'none');
  v_publish_as := coalesce(p_publish_options ->> 'publish_as', 'user');
  v_author_uid := case when v_publish_as = 'lpo' then v_uid else v_sub.user_id end;

  if v_destination = 'trip_report' then
    -- Route Report via TripReportEditor path (unchanged from prior migration).
    v_linked_trip_id := nullif(v_sub.draft ->> 'trip_report_id', '')::uuid;
    if v_linked_trip_id is not null then
      update public.trip_reports
         set status = 'published',
             visibility = 'public',
             user_id = v_author_uid,
             bounty_submission_id = p_submission_id,
             updated_at = now()
       where id = v_linked_trip_id
       returning id into v_trip_id;
    end if;

    if v_trip_id is null and v_form_config is not null then
      -- Legacy field-mapping INSERT fallback. Unchanged.
      v_sections := coalesce(v_form_config -> 'sections', '[]'::jsonb);
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

      for v_section in select * from jsonb_array_elements(v_sections)
      loop
        if (v_section ->> 'type') = 'hero_image' then
          v_hero_url := (v_sub.draft -> (v_section ->> 'id')) ->> 'url';
          if v_hero_url is not null and v_hero_url <> '' then exit; end if;
        end if;
      end loop;

      for v_section in select * from jsonb_array_elements(v_sections)
      loop
        if (v_section ->> 'type') = 'photos'
           and jsonb_typeof(v_sub.draft -> (v_section ->> 'id')) = 'array' then
          v_photos := v_sub.draft -> (v_section ->> 'id');
          if jsonb_array_length(v_photos) > 0 then exit; end if;
        end if;
      end loop;

      for v_section in select * from jsonb_array_elements(v_sections)
      loop
        if (v_section ->> 'type') = 'route_builder' then
          v_route_data := v_sub.draft -> (v_section ->> 'id');
          if v_route_data is not null and v_route_data <> 'null'::jsonb then exit; end if;
        end if;
      end loop;

      if v_route_data is not null and v_photos is not null then
        v_route_data := v_route_data || jsonb_build_object('photos', v_photos);
      end if;
      v_slug := public.publish_unique_slug('trip_reports', 'slug', v_title);
      insert into public.trip_reports (
        user_id, slug, name, description, status, kind, visibility,
        hero_img, route_data, bounty_submission_id
      ) values (
        v_author_uid, v_slug, v_title, v_description,
        'published', 'report', 'public',
        v_hero_url, coalesce(v_route_data, '{}'::jsonb), p_submission_id
      )
      returning id into v_trip_id;
    end if;

    if v_trip_id is not null then
      update public.bounty_submissions
         set published_trip_id = v_trip_id
       where id = p_submission_id;
    end if;

  elsif v_destination = 'forum_thread' then
    if v_form_config is null then
      raise exception 'admin_approve_bounty: bounty form_config is null; cannot map fields for forum_thread';
    end if;
    v_sections := coalesce(v_form_config -> 'sections', '[]'::jsonb);
    v_category_slug := p_publish_options ->> 'forum_category_slug';
    v_subcategory_slug := p_publish_options ->> 'forum_subcategory_slug';
    if v_category_slug is null or v_category_slug = '' then
      raise exception 'admin_approve_bounty: forum_category_slug required when destination=forum_thread';
    end if;
    if v_subcategory_slug is null or v_subcategory_slug = '' then
      raise exception 'admin_approve_bounty: forum_subcategory_slug required when destination=forum_thread';
    end if;

    -- Title = first h1 or short. Falls back to bounty title.
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

    -- Hero image URL for forum row's photos jsonb fallback.
    for v_section in select * from jsonb_array_elements(v_sections)
    loop
      if (v_section ->> 'type') = 'hero_image' then
        v_hero_url := (v_sub.draft -> (v_section ->> 'id')) ->> 'url';
        if v_hero_url is not null and v_hero_url <> '' then exit; end if;
      end if;
    end loop;

    -- Photos array (goes to forum_threads.photos).
    for v_section in select * from jsonb_array_elements(v_sections)
    loop
      if (v_section ->> 'type') = 'photos'
         and jsonb_typeof(v_sub.draft -> (v_section ->> 'id')) = 'array' then
        v_photos := v_sub.draft -> (v_section ->> 'id');
        if jsonb_array_length(v_photos) > 0 then exit; end if;
      end if;
    end loop;

    -- ── Section walk (rewritten): every content type is handled and
    --    fixed h2s emit their `value` as the subheading. ──
    v_thread_sections := '[]'::jsonb;
    v_current_subheading := null;
    v_current_body := '';

    for v_section in select * from jsonb_array_elements(v_sections)
    loop
      v_st := v_section ->> 'type';

      -- Skip content already surfaced through dedicated columns.
      if v_st = 'h1' or v_st = 'hero_image' or v_st = 'photos' or v_st = 'route_builder' then
        continue;
      end if;

      -- Section boundary: h2 / h3 flush current, start new.
      if v_st = 'h2' or v_st = 'h3' then
        if v_current_subheading is not null or length(v_current_body) > 0 then
          v_thread_sections := v_thread_sections || jsonb_build_array(
            jsonb_build_object('subheading', coalesce(v_current_subheading, ''), 'body', v_current_body)
          );
        end if;
        -- Fixed h2s use the template's canonical `value`; non-fixed pull from draft.
        if (v_section ->> 'fixed') = 'true' then
          v_current_subheading := coalesce(v_section ->> 'value', v_section ->> 'label', '');
        else
          v_current_subheading := coalesce(v_sub.draft ->> (v_section ->> 'id'), '');
        end if;
        v_current_body := '';
        continue;
      end if;

      -- Non-header content: append to current body. Fixed sections here are
      -- unusual (a fixed paragraph would be admin boilerplate) but we still
      -- honor them via `value` for consistency.
      v_val := null;
      if (v_section ->> 'fixed') = 'true' then
        v_val := v_section ->> 'value';
      elsif v_sub.draft ? (v_section ->> 'id') then
        -- pulled below per-type since some are non-text
        v_val := v_sub.draft ->> (v_section ->> 'id');
      end if;

      v_html := null;

      if v_st = 'p' then
        if v_val is not null and length(trim(v_val)) > 0 then
          v_html := '<p>' || replace(replace(replace(v_val, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</p>';
        end if;

      elsif v_st = 'short' then
        v_label := coalesce(v_section ->> 'label', '');
        if v_val is not null and length(trim(v_val)) > 0 then
          if length(v_label) > 0 then
            v_html := '<p><strong>' || v_label || ':</strong> '
                      || replace(replace(replace(v_val, '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
                      || '</p>';
          else
            v_html := '<p>' || replace(replace(replace(v_val, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</p>';
          end if;
        end if;

      elsif v_st = 'select' then
        v_label := coalesce(v_section ->> 'label', '');
        if v_val is not null and length(trim(v_val)) > 0 then
          v_html := '<p><strong>' || v_label || ':</strong> ' || v_val || '</p>';
        end if;

      elsif v_st = 'tag_select' then
        v_label := coalesce(v_section ->> 'label', '');
        v_arr := v_sub.draft -> (v_section ->> 'id');
        if jsonb_typeof(v_arr) = 'array' and jsonb_array_length(v_arr) > 0 then
          select string_agg(t, ', ') into v_val from jsonb_array_elements_text(v_arr) t;
          if v_val is not null and length(v_val) > 0 then
            v_html := '<p><strong>' || v_label || ':</strong> ' || v_val || '</p>';
          end if;
        end if;

      elsif v_st = 'bullet_list' then
        v_label := coalesce(v_section ->> 'label', '');
        v_arr := v_sub.draft -> (v_section ->> 'id');
        if jsonb_typeof(v_arr) = 'array' and jsonb_array_length(v_arr) > 0 then
          select string_agg(
                   '<li>' || replace(replace(replace(t, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</li>',
                   ''
                 )
            into v_val
            from jsonb_array_elements_text(v_arr) t
            where length(trim(t)) > 0;
          if v_val is not null and length(v_val) > 0 then
            v_html := '';
            if length(v_label) > 0 then
              v_html := '<p><strong>' || v_label || ':</strong></p>';
            end if;
            v_html := v_html || '<ul>' || v_val || '</ul>';
          end if;
        end if;

      elsif v_st = 'rating' then
        v_label := coalesce(v_section ->> 'label', 'Rating');
        v_num := nullif(v_sub.draft ->> (v_section ->> 'id'), '')::numeric;
        if v_num is not null then
          v_html := '<p><strong>' || v_label || ':</strong> ' || repeat('★', floor(v_num)::int)
                    || repeat('☆', greatest(0, 5 - floor(v_num)::int))
                    || ' (' || v_num::text || '/5)</p>';
        end if;
      end if;

      if v_html is not null and length(v_html) > 0 then
        v_current_body := v_current_body
          || case when length(v_current_body) > 0 then E'\n' else '' end
          || v_html;
      end if;
    end loop;

    -- Flush final accumulated section.
    if v_current_subheading is not null or length(v_current_body) > 0 then
      v_thread_sections := v_thread_sections || jsonb_build_array(
        jsonb_build_object('subheading', coalesce(v_current_subheading, ''), 'body', v_current_body)
      );
    end if;

    -- Legacy body: mirror of sections in one HTML blob for pre-sections
    -- render paths + text search.
    v_concat_body := '';
    for v_section in select * from jsonb_array_elements(v_thread_sections)
    loop
      v_concat_body := v_concat_body
        || case when length(v_concat_body) > 0 then E'\n' else '' end
        || case when length(coalesce(v_section ->> 'subheading', '')) > 0
                then '<h2>' || (v_section ->> 'subheading') || '</h2>'
                else '' end
        || coalesce(v_section ->> 'body', '');
    end loop;

    v_slug := public.publish_unique_slug('forum_threads', 'slug', v_title);

    insert into public.forum_threads (
      user_id, category_slug, subcategory_slug, title, slug, body,
      sections, photos, pinned, view_count
    ) values (
      v_author_uid, v_category_slug, v_subcategory_slug, v_title, v_slug, v_concat_body,
      v_thread_sections,
      case when v_photos is not null then v_photos
           when v_hero_url is not null then jsonb_build_array(jsonb_build_object('url', v_hero_url))
           else '[]'::jsonb end,
      false, 0
    )
    returning id into v_thread_id;

    update public.bounty_submissions
       set published_thread_id = v_thread_id
     where id = p_submission_id;
  end if;

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
