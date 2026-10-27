-- ============================================================================
-- INTEREST LISTS — product-launch signup pages (/interest/<slug>)
-- ============================================================================
-- Generic "keep me posted" list: admin creates a list (name, pitch, hero,
-- the forum subcategory where launch updates are posted), the public page
-- collects signups from SIGNED-IN users (account required → one row per
-- person, and every signup is reachable by push/bell), and the sales CRM —
-- a separate Supabase project — pulls the leads through a read-only view
-- using the existing `crm_reader` role (same contract as crm_raffle_leads).
--
-- Consent to sales contact is a condition of signing up (same copy as the
-- drawing). `source` / `utm` record which website placement produced the
-- lead (?src=website&utm_campaign=…).
--
-- Updates: `interest_list_updates(p_slug)` lists the threads in the list's
-- subcategory newest-first (teaser only for members-only threads when the
-- caller is a guest). `interest_list_notify(...)` pushes a bell + web push
-- to every signup pointing at a chosen update thread.
-- Idempotent.
-- ============================================================================

create table if not exists public.interest_lists (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  slug                   text not null unique,              -- public URL: /interest/<slug>
  headline               text,                              -- one-liner under the name
  description            text,                              -- plain text pitch
  hero_img               text,
  forum_subcategory_slug text,                              -- where the update threads live
  status                 text not null default 'open' check (status in ('draft','open','closed')),
  created_by             uuid references auth.users(id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists interest_lists_slug_idx on public.interest_lists (slug);

create table if not exists public.interest_signups (
  id                 uuid primary key default gen_random_uuid(),
  list_id            uuid not null references public.interest_lists(id) on delete cascade,
  user_id            uuid not null references auth.users(id) on delete cascade,
  name               text,
  email              text,
  phone              text,
  contact_opt_in     boolean not null default false,
  contact_opt_in_at  timestamptz,
  source             text,                                  -- ?src= on the landing link (e.g. 'website')
  utm                jsonb,                                 -- {utm_source, utm_medium, utm_campaign, ...}
  created_at         timestamptz not null default now(),
  unique (list_id, user_id)                                 -- one signup per account per list
);
create index if not exists interest_signups_list_idx on public.interest_signups (list_id, created_at desc);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.interest_lists   enable row level security;
alter table public.interest_signups enable row level security;

drop policy if exists interest_lists_select on public.interest_lists;
create policy interest_lists_select on public.interest_lists
  for select using (status <> 'draft' or public.is_admin(auth.uid()));
drop policy if exists interest_lists_admin_write on public.interest_lists;
create policy interest_lists_admin_write on public.interest_lists
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- A user signs up as themselves, only to an OPEN list. They can read their
-- own row; admins read all and may update/delete (moderation / removal).
drop policy if exists interest_signups_insert on public.interest_signups;
create policy interest_signups_insert on public.interest_signups
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.interest_lists l where l.id = list_id and l.status = 'open')
  );
drop policy if exists interest_signups_select on public.interest_signups;
create policy interest_signups_select on public.interest_signups
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));
drop policy if exists interest_signups_admin_update on public.interest_signups;
create policy interest_signups_admin_update on public.interest_signups
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
drop policy if exists interest_signups_admin_delete on public.interest_signups;
create policy interest_signups_admin_delete on public.interest_signups
  for delete using (public.is_admin(auth.uid()));

-- ── Updates feed (hub → spokes) ────────────────────────────────────────────
-- Threads in the list's subcategory, newest first. SECURITY DEFINER so a
-- guest still sees the TITLES of members-only threads (as a teaser that
-- drives signups); the excerpt is withheld while the window is active and
-- the caller is anonymous. Hidden (moderated) threads never appear.
create or replace function public.interest_list_updates(p_slug text, p_limit int default 50)
returns table (
  id uuid, title text, slug text, subcategory_slug text, created_at timestamptz,
  members_only_until timestamptz, hero_url text, reply_count bigint, excerpt text
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select t.id, t.title, t.slug, t.subcategory_slug, t.created_at, t.members_only_until,
         case when jsonb_typeof(t.photos) = 'array' and jsonb_array_length(t.photos) > 0
              then coalesce(t.photos->0->>'url', t.photos->>0) end as hero_url,
         (select count(*) from public.forum_replies r where r.thread_id = t.id) as reply_count,
         case when t.members_only_until is not null and t.members_only_until > now() and auth.uid() is null
              then null
              else left(regexp_replace(coalesce(t.body, ''), '<[^>]+>', ' ', 'g'), 220) end as excerpt
  from public.interest_lists l
  join public.forum_threads t on t.subcategory_slug = l.forum_subcategory_slug
  where l.slug = p_slug
    and (l.status <> 'draft' or public.is_admin(auth.uid()))
    and l.forum_subcategory_slug is not null
    and t.hidden_at is null
  order by t.pinned desc, t.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;
grant execute on function public.interest_list_updates(text, int) to anon, authenticated;

-- ── Notify the list about an update ────────────────────────────────────────
-- Admin-only. One bell row per signup (except the sender); the existing
-- notifications_send_push trigger fans out web/native push, and the
-- forum_thread_id FK makes the tap land on the thread. `target` carries the
-- thread title so the push body reads `… : "<title>"`.
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
        'points_milestone','raffle_won','interest_update'
      ])
    ) u
  ) s;
  execute 'alter table public.notifications drop constraint if exists notifications_type_check';
  execute 'alter table public.notifications add constraint notifications_type_check check (type in (' || v_list || '))';
end $$;

create or replace function public.interest_list_notify(p_list_id uuid, p_thread_id uuid, p_body text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_actor uuid := auth.uid();
  v_actor_name text;
  v_title text;
  v_text text;
  v_sent int := 0;
  r record;
begin
  if not public.is_admin(v_actor) then raise exception 'admin only'; end if;
  select title into v_title from public.forum_threads where id = p_thread_id and hidden_at is null;
  if v_title is null then raise exception 'thread not found'; end if;
  select coalesce(full_name, handle, 'Lone Peak Overland') into v_actor_name from public.profiles where id = v_actor;
  v_text := left(coalesce(nullif(trim(p_body), ''), 'posted a new update'), 280);
  for r in select user_id from public.interest_signups where list_id = p_list_id and user_id <> v_actor loop
    begin
      insert into public.notifications (user_id, actor_id, actor_name, type, text, target, forum_thread_id)
      values (r.user_id, v_actor, coalesce(v_actor_name, 'Lone Peak Overland'), 'interest_update', v_text, v_title, p_thread_id);
      v_sent := v_sent + 1;
    exception when others then
      raise notice '[interest notify] % → %', r.user_id, sqlerrm;
    end;
  end loop;
  return jsonb_build_object('ok', true, 'sent_to', v_sent);
end;
$$;
grant execute on function public.interest_list_notify(uuid, uuid, text) to authenticated;

-- ── CRM intake view (same contract style as crm_raffle_leads) ───────────────
create or replace view public.crm_interest_leads
with (security_invoker = false)
as
select
  s.id                 as signup_id,
  s.user_id,
  s.list_id,
  s.name,
  s.email,
  s.phone,
  s.contact_opt_in,
  s.contact_opt_in_at,
  s.source,
  s.utm,
  s.created_at         as signed_up_at,
  greatest(s.created_at, coalesce(s.contact_opt_in_at, s.created_at)) as updated_at,
  l.name               as list_name,
  l.slug               as list_slug,
  l.status             as list_status,
  p.handle,
  p.full_name,
  p.avatar_url
from public.interest_signups s
join public.interest_lists l on l.id = s.list_id
left join public.profiles p on p.id = s.user_id
where l.status <> 'draft';

comment on view public.crm_interest_leads is
  'CRM intake contract: one row per product-interest signup per list. contact_opt_in is required at signup so every row is contactable (phone/text/email). Poll on updated_at; list_slug identifies the product.';

revoke all on public.crm_interest_leads from public;
revoke all on public.crm_interest_leads from anon;
revoke all on public.crm_interest_leads from authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'crm_reader') then
    grant select on public.crm_interest_leads to crm_reader;
  end if;
end $$;

-- ── Realtime — live signup counts on the admin screen ──────────────────────
alter table public.interest_signups replica identity full;
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'interest_signups') then
    alter publication supabase_realtime add table public.interest_signups;
  end if;
end $$;

notify pgrst, 'reload schema';
