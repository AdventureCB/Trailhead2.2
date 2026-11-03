-- ============================================================================
-- FOLLOW / THREAD / SUBCATEGORY NOTIFICATIONS (transactional)
-- ============================================================================
-- Three new "tell me when…" mechanisms, all fired by DB triggers into
-- public.notifications (→ existing notifications_send_push → OneSignal +
-- web push, bell deep-links via post_id / build_id / forum_thread_id):
--   1. follows.notify_posts (default TRUE — Kyle's call): a follower is told
--      when someone they follow publishes a feed post, trip report, or build.
--      Rate-limited to one notification per author per follower per 6 h.
--   2. forum_thread_subscriptions: auto-subscribed when you start or reply
--      in a thread; `muted` lets the bell toggle stick (auto-subscribe never
--      un-mutes). Notified on every new reply, except where the app already
--      notifies (thread author on top-level reply, parent author on nested).
--   3. forum_subcategory_follows: opt-in; notified on every new thread.
-- Per-user master switches live on profiles (notify_follow_posts /
-- notify_thread_replies / notify_sub_threads) so the triggers can respect
-- them server-side (the older localStorage prefs only hide the bell).
-- Idempotent.
-- ============================================================================

alter table public.follows add column if not exists notify_posts boolean not null default true;
alter table public.notifications add column if not exists trip_id uuid references public.trip_reports(id) on delete cascade;
create index if not exists notifications_trip_id_idx on public.notifications (trip_id) where trip_id is not null;
alter table public.profiles
  add column if not exists notify_follow_posts   boolean not null default true,
  add column if not exists notify_thread_replies boolean not null default true,
  add column if not exists notify_sub_threads    boolean not null default true;

create table if not exists public.forum_thread_subscriptions (
  thread_id  uuid not null references public.forum_threads(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  muted      boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);
create index if not exists forum_thread_subscriptions_user_idx on public.forum_thread_subscriptions (user_id);
alter table public.forum_thread_subscriptions enable row level security;
drop policy if exists forum_thread_subscriptions_own on public.forum_thread_subscriptions;
create policy forum_thread_subscriptions_own on public.forum_thread_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.forum_subcategory_follows (
  subcategory_slug text not null,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (subcategory_slug, user_id)
);
create index if not exists forum_subcategory_follows_user_idx on public.forum_subcategory_follows (user_id);
alter table public.forum_subcategory_follows enable row level security;
drop policy if exists forum_subcategory_follows_own on public.forum_subcategory_follows;
create policy forum_subcategory_follows_own on public.forum_subcategory_follows
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Owner UPDATE on follows (notify_posts toggle). Existing policies cover insert/delete.
drop policy if exists follows_owner_update on public.follows;
create policy follows_owner_update on public.follows
  for update using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- ── notification types ──────────────────────────────────────────────────────
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
        'points_milestone','raffle_won','interest_update','forum_bot_draft',
        'follow_post','thread_reply','sub_thread'
      ])
    ) u
  ) s;
  execute 'alter table public.notifications drop constraint if exists notifications_type_check';
  execute 'alter table public.notifications add constraint notifications_type_check check (type in (' || v_list || '))';
end $$;

-- ── 1. Followers: new post / trip report / build ───────────────────────────
-- p_kind: 'post' | 'trip' | 'build'. Inserts one notification per follower
-- with notify_posts, skipping anyone already told about this author in the
-- last 6 hours (the push side also collapses per author).
create or replace function public._notify_followers(p_author uuid, p_kind text, p_text text, p_target text, p_post_id uuid, p_build_id uuid, p_trip_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_actor_name text;
  r record;
begin
  if p_author is null then return; end if;
  select coalesce(full_name, handle, 'Someone') into v_actor_name from public.profiles where id = p_author;
  for r in
    select f.follower_id
    from public.follows f
    join public.profiles p on p.id = f.follower_id
    where f.following_id = p_author
      and coalesce(f.notify_posts, true)
      and coalesce(p.notify_follow_posts, true)
      and f.follower_id <> p_author
      and not exists (
        select 1 from public.notifications n
        where n.user_id = f.follower_id and n.actor_id = p_author and n.type = 'follow_post'
          and n.created_at > now() - interval '6 hours'
      )
  loop
    begin
      insert into public.notifications (user_id, actor_id, actor_name, type, text, target, post_id, build_id, trip_id)
      values (r.follower_id, p_author, v_actor_name, 'follow_post', p_text, left(coalesce(p_target, ''), 120), p_post_id, p_build_id, p_trip_id);
    exception when others then
      raise notice '[follow_post] % → %', r.follower_id, sqlerrm;
    end;
  end loop;
end;
$$;

create or replace function public.notify_followers_on_post() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.hidden_at is null and coalesce(new.is_public, true) then
    perform public._notify_followers(new.user_id, 'post',
      case new.type when 'ROUTES' then 'shared a route' when 'BUILDS' then 'posted a build update' when 'CONVOYS' then 'posted a convoy' when 'RECOVERY' then 'posted a recovery request' else 'posted' end,
      coalesce(new.title, ''), new.id, null);
  end if;
  return new;
end; $$;
drop trigger if exists notify_followers_on_post on public.posts;
create trigger notify_followers_on_post after insert on public.posts
  for each row execute function public.notify_followers_on_post();

create or replace function public.notify_followers_on_trip() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  -- Fire once, when a report first becomes published (insert or draft → published).
  if new.status = 'published' and coalesce(new.kind, 'report') = 'report'
     and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    perform public._notify_followers(new.user_id, 'trip', 'published a trip report', coalesce(new.name, ''), null, null, new.id);
  end if;
  return new;
end; $$;
drop trigger if exists notify_followers_on_trip on public.trip_reports;
create trigger notify_followers_on_trip after insert or update of status on public.trip_reports
  for each row execute function public.notify_followers_on_trip();

create or replace function public.notify_followers_on_build() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._notify_followers(new.user_id, 'build', 'added a new build', coalesce(new.name, ''), null, new.id);
  return new;
end; $$;
drop trigger if exists notify_followers_on_build on public.builds;
create trigger notify_followers_on_build after insert on public.builds
  for each row execute function public.notify_followers_on_build();

-- ── 2. Thread subscriptions ────────────────────────────────────────────────
create or replace function public.auto_subscribe_thread_author() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.forum_thread_subscriptions (thread_id, user_id) values (new.id, new.user_id)
  on conflict do nothing;
  return new;
end; $$;
drop trigger if exists auto_subscribe_thread_author on public.forum_threads;
create trigger auto_subscribe_thread_author after insert on public.forum_threads
  for each row execute function public.auto_subscribe_thread_author();

create or replace function public.notify_thread_subscribers_on_reply() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
#variable_conflict use_column
declare
  v_thread record;
  v_parent_author uuid;
  v_actor_name text;
  r record;
begin
  -- Replier becomes a subscriber (muted rows stay muted).
  insert into public.forum_thread_subscriptions (thread_id, user_id) values (new.thread_id, new.user_id)
  on conflict do nothing;
  select id, user_id, title into v_thread from public.forum_threads where id = new.thread_id;
  if v_thread.id is null then return new; end if;
  if new.parent_id is not null then
    select user_id into v_parent_author from public.forum_replies where id = new.parent_id;
  end if;
  select coalesce(full_name, handle, 'Someone') into v_actor_name from public.profiles where id = new.user_id;
  for r in
    select s.user_id
    from public.forum_thread_subscriptions s
    join public.profiles p on p.id = s.user_id
    where s.thread_id = new.thread_id
      and not s.muted
      and coalesce(p.notify_thread_replies, true)
      and s.user_id <> new.user_id
      and s.user_id <> v_thread.user_id                       -- app already notifies the author
      and (v_parent_author is null or s.user_id <> v_parent_author)  -- and the parent-reply author
      and not exists (
        select 1 from public.notifications n
        where n.user_id = s.user_id and n.forum_thread_id = new.thread_id and n.type = 'thread_reply'
          and n.created_at > now() - interval '1 hour'
      )
  loop
    begin
      insert into public.notifications (user_id, actor_id, actor_name, type, text, target, forum_thread_id)
      values (r.user_id, new.user_id, v_actor_name, 'thread_reply', 'replied in a thread you follow', left(v_thread.title, 120), new.thread_id);
    exception when others then
      raise notice '[thread_reply] % → %', r.user_id, sqlerrm;
    end;
  end loop;
  return new;
end; $$;
drop trigger if exists notify_thread_subscribers_on_reply on public.forum_replies;
create trigger notify_thread_subscribers_on_reply after insert on public.forum_replies
  for each row execute function public.notify_thread_subscribers_on_reply();

-- ── 3. Subcategory follows ─────────────────────────────────────────────────
create or replace function public.notify_sub_followers_on_thread() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
#variable_conflict use_column
declare
  v_actor_name text;
  v_sub_name text;
  r record;
begin
  if new.hidden_at is not null then return new; end if;
  select coalesce(full_name, handle, 'Someone') into v_actor_name from public.profiles where id = new.user_id;
  select name into v_sub_name from public.forum_subcategories where slug = new.subcategory_slug limit 1;
  for r in
    select f.user_id
    from public.forum_subcategory_follows f
    join public.profiles p on p.id = f.user_id
    where f.subcategory_slug = new.subcategory_slug
      and coalesce(p.notify_sub_threads, true)
      and f.user_id <> new.user_id
  loop
    begin
      insert into public.notifications (user_id, actor_id, actor_name, type, text, target, forum_thread_id)
      values (r.user_id, new.user_id, v_actor_name, 'sub_thread', 'posted in ' || coalesce(v_sub_name, 'a forum you follow'), left(new.title, 120), new.id);
    exception when others then
      raise notice '[sub_thread] % → %', r.user_id, sqlerrm;
    end;
  end loop;
  return new;
end; $$;
drop trigger if exists notify_sub_followers_on_thread on public.forum_threads;
create trigger notify_sub_followers_on_thread after insert on public.forum_threads
  for each row execute function public.notify_sub_followers_on_thread();

-- Backfill: existing thread authors + repliers become subscribers (unmuted).
insert into public.forum_thread_subscriptions (thread_id, user_id)
  select id, user_id from public.forum_threads where user_id is not null
  union
  select thread_id, user_id from public.forum_replies where user_id is not null
on conflict do nothing;

notify pgrst, 'reload schema';
