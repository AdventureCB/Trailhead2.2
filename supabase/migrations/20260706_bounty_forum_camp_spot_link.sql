-- ─────────────────────────────────────────────────────────────────────────────
-- admin_approve_bounty (forum_thread destination) — camp_spot CTA card
-- ─────────────────────────────────────────────────────────────────────────────
-- Adds inline rendering for the `camp_spot` bounty section. Mirrors the
-- treatment already in place for `build_select`: the walker looks up the
-- linked camping_spots row at publish time and emits a semantic CTA card
-- at the exact position the block appeared in the form.
--
-- Draft shape (written by the CampSpotPickerOverlay in the client):
--   { id, name, description, lat, lng, spot_type, fee, photo_url, photos }
--
-- The walker uses `id` to re-fetch the camping_spots row so the CTA card
-- always shows the CURRENT name / photo / metadata (participant may have
-- edited the spot on the explore map after their bounty submission).
-- If the spot was deleted between claim and approval, the section is
-- silently skipped rather than producing a broken link.
--
-- Emitted HTML (styled by `.th-spot-cta*` in the client's thRbCSS):
--
--   <a href="/spots/UUID" class="th-spot-cta">
--     <img src="HERO" alt="SPOT NAME" loading="lazy" />
--     <span class="th-spot-cta-body">
--       <span class="th-spot-cta-eyebrow">VIEW ON EXPLORE MAP</span>
--       <strong>SPOT NAME</strong>
--       <span class="th-spot-cta-meta">TYPE · FEE · LAT, LNG</span>
--     </span>
--     <span class="th-spot-cta-arrow">→</span>
--   </a>
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
  v_current_subheading text;
  v_current_body text;
  v_st text;
  v_label text;
  v_val text;
  v_arr jsonb;
  v_num numeric;
  v_html text;
  v_url text;
  v_link_text text;
  v_draft_val jsonb;
  v_default_val jsonb;
  v_build_id uuid;
  v_build record;
  v_build_meta text;
  v_build_name_esc text;
  v_spot_id uuid;
  v_spot record;
  v_spot_name_esc text;
  v_spot_hero text;
  v_spot_meta text;
begin
  if not public.is_admin(v_uid) then raise exception 'admin_approve_bounty: not authorized'; end if;
  if p_submission_id is null then raise exception 'admin_approve_bounty: submission id required'; end if;

  select id, user_id, bounty_id, status, draft from public.bounty_submissions where id = p_submission_id into v_sub;
  if not found then raise exception 'admin_approve_bounty: submission not found'; end if;
  if v_sub.status not in ('submitted', 'changes_requested') then
    raise exception 'admin_approve_bounty: submission is not in a reviewable state (status=%)', v_sub.status;
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

    v_thread_sections := '[]'::jsonb;
    v_current_subheading := null;
    v_current_body := '';

    for v_section in select * from jsonb_array_elements(v_sections)
    loop
      v_st := v_section ->> 'type';

      if v_st = 'h1' or v_st = 'hero_image' or v_st = 'route_builder' then
        continue;
      end if;

      if v_st = 'h2' or v_st = 'h3' then
        if v_current_subheading is not null or length(v_current_body) > 0 then
          v_thread_sections := v_thread_sections || jsonb_build_array(
            jsonb_build_object('subheading', coalesce(v_current_subheading, ''), 'body', v_current_body)
          );
        end if;
        if (v_section ->> 'fixed') = 'true' then
          v_current_subheading := coalesce(v_section ->> 'value', v_section ->> 'label', '');
        else
          v_current_subheading := coalesce(v_sub.draft ->> (v_section ->> 'id'), '');
        end if;
        v_current_body := '';
        continue;
      end if;

      v_val := null;
      if (v_section ->> 'fixed') = 'true' then
        v_val := v_section ->> 'value';
      elsif v_sub.draft ? (v_section ->> 'id') then
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
          v_html := '<p><strong>' || v_label || ':</strong> '
                    || replace(replace(replace(v_val, '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
                    || '</p>';
        end if;

      elsif v_st = 'tag_select' then
        v_label := coalesce(v_section ->> 'label', '');
        v_arr := v_sub.draft -> (v_section ->> 'id');
        if jsonb_typeof(v_arr) = 'array' and jsonb_array_length(v_arr) > 0 then
          select string_agg(t, ', ') into v_val from jsonb_array_elements_text(v_arr) t;
          if v_val is not null and length(v_val) > 0 then
            v_html := '<p><strong>' || v_label || ':</strong> '
                      || replace(replace(replace(v_val, '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
                      || '</p>';
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
          v_html := '<p><strong>' || v_label || ':</strong> '
                    || repeat('★', floor(v_num)::int)
                    || repeat('☆', greatest(0, 5 - floor(v_num)::int))
                    || ' (' || v_num::text || '/5)</p>';
        end if;

      elsif v_st = 'photos' then
        v_arr := v_sub.draft -> (v_section ->> 'id');
        if jsonb_typeof(v_arr) = 'array' and jsonb_array_length(v_arr) > 0 then
          select string_agg(
                   '<figure>'
                   || case when coalesce(elem ->> 'type', 'image') = 'video'
                           then '<video src="' || (elem ->> 'url')
                                || '" controls preload="metadata" playsinline>'
                                || 'Sorry, your browser does not support inline video.'
                                || '</video>'
                           else '<img src="' || (elem ->> 'url')
                                || '" alt="'
                                || replace(replace(replace(
                                     coalesce(nullif(elem ->> 'alt', ''), nullif(elem ->> 'caption', ''), ''),
                                     '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
                                || '" loading="lazy" />'
                           end
                   || case when length(trim(coalesce(elem ->> 'caption', ''))) > 0
                           then '<figcaption>'
                                || replace(replace(replace(elem ->> 'caption', '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
                                || '</figcaption>'
                           else '' end
                   || '</figure>',
                   E'\n'
                 )
            into v_val
            from jsonb_array_elements(v_arr) elem
            where elem ->> 'url' is not null
              and length(elem ->> 'url') > 0
              and (elem ->> '_uploading') is distinct from 'true';
          if v_val is not null and length(v_val) > 0 then
            v_html := v_val;
          end if;
        end if;

      elsif v_st = 'url' then
        v_url := null;
        v_link_text := null;
        v_draft_val := v_sub.draft -> (v_section ->> 'id');
        v_default_val := v_section -> 'default_value';

        if jsonb_typeof(v_draft_val) = 'object' then
          v_url := v_draft_val ->> 'url';
          v_link_text := v_draft_val ->> 'text';
        elsif jsonb_typeof(v_draft_val) = 'string' then
          v_url := v_draft_val #>> '{}';
        end if;

        if v_url is null or length(trim(v_url)) = 0 then
          if (v_section ->> 'fixed') = 'true' then
            v_url := v_section ->> 'value';
          end if;
          if (v_url is null or length(trim(v_url)) = 0) and jsonb_typeof(v_default_val) = 'object' then
            v_url := v_default_val ->> 'url';
          elsif (v_url is null or length(trim(v_url)) = 0) and jsonb_typeof(v_default_val) = 'string' then
            v_url := v_default_val #>> '{}';
          end if;
        end if;

        if v_link_text is null or length(trim(v_link_text)) = 0 then
          if jsonb_typeof(v_default_val) = 'object' then
            v_link_text := v_default_val ->> 'text';
          end if;
        end if;
        if v_link_text is null or length(trim(v_link_text)) = 0 then
          v_link_text := v_url;
        end if;

        if v_url is not null and length(trim(v_url)) > 0
           and (v_url like 'http://%' or v_url like 'https://%') then
          v_html := '<p><a href="'
                    || replace(replace(v_url, '"', '&quot;'), '<', '&lt;')
                    || '" rel="noopener noreferrer nofollow" target="_blank">'
                    || replace(replace(replace(v_link_text, '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
                    || '</a></p>';
        end if;

      elsif v_st = 'build_select' then
        v_build_id := null;
        v_build := null;
        begin
          v_build_id := nullif(v_val, '')::uuid;
        exception when others then
          v_build_id := null;
        end;
        if v_build_id is not null then
          select id, name, year, make, model, trim, hero_img
            from public.builds where id = v_build_id
            into v_build;
          if v_build.id is not null then
            v_build_name_esc := replace(replace(replace(coalesce(nullif(v_build.name, ''), 'Build'), '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
            v_build_meta := trim(both ' ' from concat_ws(' ',
              nullif(v_build.year::text, '0'),
              nullif(v_build.make, ''),
              nullif(v_build.model, ''),
              nullif(v_build.trim, '')
            ));
            v_html := '<a href="/builds/' || v_build.id::text
                      || '" class="th-build-cta">';
            if v_build.hero_img is not null and length(v_build.hero_img) > 0 then
              v_html := v_html || '<img src="'
                        || replace(replace(v_build.hero_img, '"', '&quot;'), '<', '&lt;')
                        || '" alt="' || v_build_name_esc
                        || '" loading="lazy" />';
            end if;
            v_html := v_html
                      || '<span class="th-build-cta-body">'
                      || '<span class="th-build-cta-eyebrow">VIEW IN BUILD GALLERY</span>'
                      || '<strong>' || v_build_name_esc || '</strong>';
            if v_build_meta is not null and length(v_build_meta) > 0 then
              v_html := v_html
                        || '<span class="th-build-cta-meta">'
                        || replace(replace(replace(v_build_meta, '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
                        || '</span>';
            end if;
            v_html := v_html
                      || '</span>'
                      || '<span class="th-build-cta-arrow">→</span>'
                      || '</a>';
          end if;
        end if;

      elsif v_st = 'camp_spot' then
        -- Draft stores a spot snapshot {id, name, lat, lng, ...}. Look up
        -- the current row so the CTA card reflects any post-submit edits
        -- (name changes, added photos, etc.). Skip silently if the spot
        -- was deleted between claim and approval.
        v_spot_id := null;
        v_spot := null;
        v_draft_val := v_sub.draft -> (v_section ->> 'id');
        if jsonb_typeof(v_draft_val) = 'object' then
          begin
            v_spot_id := nullif(v_draft_val ->> 'id', '')::uuid;
          exception when others then
            v_spot_id := null;
          end;
        end if;
        if v_spot_id is not null then
          select id, name, lat, lng, spot_type, fee, photo_url, photos
            from public.camping_spots where id = v_spot_id
            into v_spot;
          if v_spot.id is not null then
            v_spot_name_esc := replace(replace(replace(coalesce(nullif(v_spot.name, ''), 'Camping Spot'), '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
            -- Prefer photo_url; else first url from the photos jsonb array.
            v_spot_hero := v_spot.photo_url;
            if (v_spot_hero is null or length(v_spot_hero) = 0)
               and jsonb_typeof(v_spot.photos) = 'array'
               and jsonb_array_length(v_spot.photos) > 0 then
              v_spot_hero := v_spot.photos -> 0 ->> 'url';
              if v_spot_hero is null then
                v_spot_hero := v_spot.photos ->> 0;
              end if;
            end if;
            -- Meta line: type / fee (skipping 'unknown' placeholder) + coords
            v_spot_meta := trim(both ' · ' from concat_ws(' · ',
              case when v_spot.spot_type is not null and v_spot.spot_type <> 'unknown'
                   then initcap(replace(v_spot.spot_type, '_', ' ')) end,
              case when v_spot.fee is not null and v_spot.fee <> 'unknown'
                   then initcap(replace(v_spot.fee, '_', ' ')) end,
              case when v_spot.lat is not null and v_spot.lng is not null
                   then round(v_spot.lat::numeric, 4)::text || ', ' || round(v_spot.lng::numeric, 4)::text end
            ));
            v_html := '<a href="/spots/' || v_spot.id::text
                      || '" class="th-spot-cta">';
            if v_spot_hero is not null and length(v_spot_hero) > 0 then
              v_html := v_html || '<img src="'
                        || replace(replace(v_spot_hero, '"', '&quot;'), '<', '&lt;')
                        || '" alt="' || v_spot_name_esc
                        || '" loading="lazy" />';
            end if;
            v_html := v_html
                      || '<span class="th-spot-cta-body">'
                      || '<span class="th-spot-cta-eyebrow">VIEW ON EXPLORE MAP</span>'
                      || '<strong>' || v_spot_name_esc || '</strong>';
            if v_spot_meta is not null and length(v_spot_meta) > 0 then
              v_html := v_html
                        || '<span class="th-spot-cta-meta">'
                        || replace(replace(replace(v_spot_meta, '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
                        || '</span>';
            end if;
            v_html := v_html
                      || '</span>'
                      || '<span class="th-spot-cta-arrow">→</span>'
                      || '</a>';
          end if;
        end if;
      end if;

      if v_html is not null and length(v_html) > 0 then
        v_current_body := v_current_body
          || case when length(v_current_body) > 0 then E'\n' else '' end
          || v_html;
      end if;
    end loop;

    if v_current_subheading is not null or length(v_current_body) > 0 then
      v_thread_sections := v_thread_sections || jsonb_build_array(
        jsonb_build_object('subheading', coalesce(v_current_subheading, ''), 'body', v_current_body)
      );
    end if;

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
      case when v_hero_url is not null and v_hero_url <> ''
           then jsonb_build_array(jsonb_build_object('url', v_hero_url))
           when v_photos is not null then v_photos
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
