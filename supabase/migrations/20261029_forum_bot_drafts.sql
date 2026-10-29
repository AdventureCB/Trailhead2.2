-- ============================================================================
-- FORUM BOT DRAFTS — AI-authored threads that an admin reviews before publish
-- ============================================================================
-- Kyle's Grok bot posts via the `forum-bot-draft` Edge Function (API-key
-- auth, service role writes). Nothing lands in `forum_threads` until an admin
-- opens the draft in Admin → BOT DRAFTS, edits it, and taps APPROVE & PUBLISH
-- → `publish_forum_bot_draft` inserts the real thread as that admin (or any
-- admin account they pick) and links it back here. Drafts are a SEPARATE
-- table on purpose: every forum reader (hydrate, SSR, sitemap, search,
-- interest lists) assumes a forum_threads row is public, so an unpublished
-- row there would leak.
-- Idempotent.
-- ============================================================================

create table if not exists public.forum_bot_drafts (
  id                 uuid primary key default gen_random_uuid(),
  source             text not null default 'grok',               -- which bot
  title              text not null,
  subcategory_slug   text,                                        -- validated at publish
  sections           jsonb not null default '[]'::jsonb,          -- [{subheading, body}] (body = HTML)
  photos             jsonb not null default '[]'::jsonb,          -- [{url, alt}] — already in our storage
  members_only_hours int  not null default 0,
  bot_notes          text,                                        -- the bot's note to the reviewer
  status             text not null default 'pending' check (status in ('pending','rejected','published')),
  review_notes       text,
  reviewed_by        uuid references auth.users(id) on delete set null,
  reviewed_at        timestamptz,
  thread_id          uuid references public.forum_threads(id) on delete set null,
  raw                jsonb,                                       -- original request payload (debug)
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists forum_bot_drafts_status_idx on public.forum_bot_drafts (status, created_at desc);

alter table public.forum_bot_drafts enable row level security;
-- Admin-only read/edit/delete. No INSERT policy: only the Edge Function
-- (service role) creates drafts.
drop policy if exists forum_bot_drafts_admin_select on public.forum_bot_drafts;
create policy forum_bot_drafts_admin_select on public.forum_bot_drafts
  for select using (public.is_admin(auth.uid()));
drop policy if exists forum_bot_drafts_admin_update on public.forum_bot_drafts;
create policy forum_bot_drafts_admin_update on public.forum_bot_drafts
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
drop policy if exists forum_bot_drafts_admin_delete on public.forum_bot_drafts;
create policy forum_bot_drafts_admin_delete on public.forum_bot_drafts
  for delete using (public.is_admin(auth.uid()));

-- ── Notify admins on every new draft (bell + push) ─────────────────────────
do $$
declare v_list text;
begin
  select string_agg(quote_literal(t), ', ') into v_list
  from (
    select distinct t from (
      select type as t from public.notifications where type is not null
      union
      select unnest(array[
        'like','comment','mention','reply','follow','rsvp','role','recovery','convoy','convoy_invite',
        'bug_fix','bug_report','content_report','content_partner_review',
        'gear_drop_signup','gear_drop_unlock','gear_drop_won','gear_drop_winner','gear_drop_announcement',
        'payout_approved','payout_paid','bounty_payout_received','bounty_submitted','bounty_approved',
        'bounty_rejected','bounty_changes_requested','bounty_published','forum_reply','trip_report','bounty',
        'points_milestone','raffle_won','interest_update','forum_bot_draft'
      ])
    ) u
  ) s;
  execute 'alter table public.notifications drop constraint if exists notifications_type_check';
  execute 'alter table public.notifications add constraint notifications_type_check check (type in (' || v_list || '))';
end $$;

create or replace function public.notify_admins_of_forum_bot_draft()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare r record;
begin
  for r in select id from public.profiles where role = 'admin' loop
    begin
      insert into public.notifications (user_id, actor_id, actor_name, type, text, target)
      values (r.id, null, coalesce(initcap(new.source), 'Bot'), 'forum_bot_draft', 'drafted a forum post for your review', left(new.title, 120));
    exception when others then
      raise notice '[bot draft notify] % → %', r.id, sqlerrm;
    end;
  end loop;
  return new;
end;
$$;
drop trigger if exists forum_bot_drafts_notify_admins on public.forum_bot_drafts;
create trigger forum_bot_drafts_notify_admins
  after insert on public.forum_bot_drafts
  for each row execute function public.notify_admins_of_forum_bot_draft();

-- ── Publish: draft → real forum thread, authored by an admin ───────────────
-- Admin-only. Author defaults to the approving admin; may be any admin
-- account (e.g. a shared "Lone Peak Overland" login). Uses the draft's
-- CURRENT title/sections/photos, so edits made in the review screen are what
-- ships. Slug = lower() BEFORE the regex (uppercase would be stripped).
create or replace function public.publish_forum_bot_draft(p_draft_id uuid, p_author_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  d        public.forum_bot_drafts%rowtype;
  v_author uuid := coalesce(p_author_id, auth.uid());
  v_cat    text;
  v_base   text;
  v_slug   text;
  v_body   text := '';
  v_sec    jsonb;
  v_id     uuid;
  i        int := 0;
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin only'; end if;
  if not public.is_admin(v_author) then raise exception 'author must be an admin account'; end if;
  select * into d from public.forum_bot_drafts where id = p_draft_id for update;
  if d.id is null then raise exception 'draft not found'; end if;
  if d.status = 'published' then raise exception 'already published'; end if;
  if coalesce(trim(d.title), '') = '' then raise exception 'title required'; end if;
  select c.slug into v_cat
  from public.forum_subcategories s join public.forum_categories c on c.id = s.category_id
  where s.slug = d.subcategory_slug limit 1;
  if v_cat is null then raise exception 'pick a valid subcategory before publishing'; end if;

  -- Legacy body column = concatenated section HTML (what search/OG excerpts read).
  for v_sec in select * from jsonb_array_elements(coalesce(d.sections, '[]'::jsonb)) loop
    if coalesce(v_sec->>'type', '') = 'url' then
      v_body := v_body || '<p><a href="' || replace(coalesce(v_sec->>'url',''), '"', '&quot;') || '" target="_blank" rel="noopener">' || coalesce(v_sec->>'label', v_sec->>'url') || '</a></p>' || E'\n';
    else
      if coalesce(trim(v_sec->>'subheading'), '') <> '' then
        v_body := v_body || '<h2>' || replace(replace(v_sec->>'subheading', '<', '&lt;'), '>', '&gt;') || '</h2>' || E'\n';
      end if;
      if coalesce(trim(v_sec->>'body'), '') <> '' then v_body := v_body || (v_sec->>'body') || E'\n'; end if;
    end if;
  end loop;

  v_base := left(regexp_replace(regexp_replace(lower(d.title), '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'), 80);
  if v_base = '' then v_base := 'thread'; end if;
  loop
    v_slug := case when i = 0 then v_base else v_base || '-' || (i + 1) end;
    exit when not exists (select 1 from public.forum_threads t where t.slug = v_slug);
    i := i + 1;
    if i > 20 then v_slug := v_base || '-' || substr(gen_random_uuid()::text, 1, 6); exit; end if;
  end loop;

  insert into public.forum_threads (user_id, category_slug, subcategory_slug, title, slug, body, sections, photos, members_only_until)
  values (v_author, v_cat, d.subcategory_slug, trim(d.title), v_slug, nullif(v_body, ''), coalesce(d.sections, '[]'::jsonb), coalesce(d.photos, '[]'::jsonb),
          case when coalesce(d.members_only_hours, 0) > 0 then now() + (d.members_only_hours || ' hours')::interval end)
  returning id into v_id;

  update public.forum_bot_drafts
     set status = 'published', thread_id = v_id, reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
   where id = p_draft_id;

  return jsonb_build_object('ok', true, 'thread_id', v_id, 'slug', v_slug, 'subcategory_slug', d.subcategory_slug, 'category_slug', v_cat);
end;
$$;
grant execute on function public.publish_forum_bot_draft(uuid, uuid) to authenticated;

-- Realtime so the admin list updates as the bot submits.
alter table public.forum_bot_drafts replica identity full;
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'forum_bot_drafts') then
    alter publication supabase_realtime add table public.forum_bot_drafts;
  end if;
end $$;

notify pgrst, 'reload schema';
