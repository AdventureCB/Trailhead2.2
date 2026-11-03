-- ============================================================================
-- LIFECYCLE MESSAGES (server-side "journeys") + default-notify forum categories
-- ============================================================================
-- OneSignal gates Journeys + frequency capping behind paid add-ons, so the
-- stickiness nudges run here instead: a nightly pg_cron job evaluates each
-- enabled rule in `lifecycle_rules` against REAL app data, respects the
-- per-user "Tips & highlights" switch (profiles.notify_tips — synced from the
-- app's notification settings), a 2-per-7-days cap across all rules, a
-- per-rule cooldown, and a quiet window after any other notification. Sends
-- are logged in `lifecycle_sends` and go out as `type='tip'` notifications →
-- existing push pipeline (web + native; send-push routes `target` as the URL).
-- Admin edits copy / delay / enabled in Admin → Push → LIFECYCLE MESSAGES.
--
-- Also here: `forum_categories.default_notify` — everyone is notified of new
-- threads in that category (Kyle: Top Secret) unless they mute it with the
-- subcategory bell (`forum_subcategory_follows.muted`).
-- Idempotent.
-- ============================================================================

alter table public.profiles add column if not exists notify_tips boolean not null default true;

create table if not exists public.lifecycle_rules (
  key            text primary key,
  label          text not null,
  description    text,
  enabled        boolean not null default false,
  delay_days     int not null default 2,          -- rule-specific "after N days" parameter
  cooldown_days  int not null default 30,         -- same rule, same user, at most once per N days
  title          text not null default 'Trailhub',
  body           text not null,
  url            text not null default '/',
  sort_order     int not null default 0,
  updated_at     timestamptz not null default now(),
  updated_by     uuid references auth.users(id) on delete set null
);
alter table public.lifecycle_rules enable row level security;
drop policy if exists lifecycle_rules_admin on public.lifecycle_rules;
create policy lifecycle_rules_admin on public.lifecycle_rules
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table if not exists public.lifecycle_sends (
  id              uuid primary key default gen_random_uuid(),
  rule_key        text not null references public.lifecycle_rules(key) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  notification_id uuid,
  sent_at         timestamptz not null default now()
);
create index if not exists lifecycle_sends_user_idx on public.lifecycle_sends (user_id, sent_at desc);
create index if not exists lifecycle_sends_rule_idx on public.lifecycle_sends (rule_key, sent_at desc);
alter table public.lifecycle_sends enable row level security;
drop policy if exists lifecycle_sends_admin on public.lifecycle_sends;
create policy lifecycle_sends_admin on public.lifecycle_sends
  for select using (public.is_admin(auth.uid()));

insert into public.lifecycle_rules (key, label, description, delay_days, title, body, url, sort_order) values
  ('no_build',        'No build yet',           'Signed up N days ago and has not added a build.',                       2,  'Add your rig',          'Add your rig to Trailhub — mods, parts, and the trail miles you put on it.',          '/builds', 1),
  ('build_no_photos', 'Build without photos',   'Has a build with no photos N days after creating it.',                 3,  'Show off the build',    'Your build is up but it has no photos yet. Add a few — builds with photos get 5x the views.', '/builds', 2),
  ('no_trip',         'No trip report yet',     'Signed up N days ago and has not published a trip report.',            5,  'Your first trip report','Your first trip report takes 2 minutes. Record a route or draw it, add a few photos, done.', '/trips', 3),
  ('inactive',        'Gone quiet',             'Was active (build/trip/post) but has not opened the app in N days.',   14, 'Since you were here',   'New trip reports, builds, and threads from the community since your last visit.',      '/', 4)
on conflict (key) do nothing;

-- ── notification type ───────────────────────────────────────────────────────
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
        'follow_post','thread_reply','sub_thread','tip'
      ])
    ) u
  ) s;
  execute 'alter table public.notifications drop constraint if exists notifications_type_check';
  execute 'alter table public.notifications add constraint notifications_type_check check (type in (' || v_list || '))';
end $$;

-- ── The job ────────────────────────────────────────────────────────────────
-- Candidate sets per rule; every candidate then passes the shared guards:
--   notify_tips on · < 2 lifecycle sends in 7 d · no send of THIS rule within
--   cooldown · no notification of any kind in the last 3 h · account older
--   than delay_days · account younger than 90 d for the signup-based rules.
-- Returns {rule: sent_count}.
create or replace function public.run_lifecycle_messages(p_dry_run boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  rule record;
  u record;
  v_out jsonb := '{}'::jsonb;
  v_n int;
  v_nid uuid;
begin
  for rule in select * from public.lifecycle_rules where enabled order by sort_order loop
    v_n := 0;
    for u in
      with cand as (
        select p.id
        from public.profiles p
        join auth.users au on au.id = p.id
        where coalesce(p.notify_tips, true)
          and (
            (rule.key = 'no_build'
              and au.created_at <= now() - (rule.delay_days || ' days')::interval
              and au.created_at >  now() - interval '90 days'
              and not exists (select 1 from public.builds b where b.user_id = p.id))
            or
            (rule.key = 'build_no_photos'
              and exists (
                select 1 from public.builds b
                where b.user_id = p.id
                  and b.created_at <= now() - (rule.delay_days || ' days')::interval
                  and b.created_at >  now() - interval '90 days'
                  and b.hero_img is null
                  and coalesce(jsonb_array_length(case when jsonb_typeof(b.build_data->'mainPhotos') = 'array' then b.build_data->'mainPhotos' else '[]'::jsonb end), 0) = 0))
            or
            (rule.key = 'no_trip'
              and au.created_at <= now() - (rule.delay_days || ' days')::interval
              and au.created_at >  now() - interval '90 days'
              and not exists (select 1 from public.trip_reports t where t.user_id = p.id and t.status = 'published'))
            or
            (rule.key = 'inactive'
              and p.last_seen_at is not null
              and p.last_seen_at <= now() - (rule.delay_days || ' days')::interval
              and p.last_seen_at >  now() - interval '90 days'
              and (exists (select 1 from public.builds b where b.user_id = p.id)
                   or exists (select 1 from public.trip_reports t where t.user_id = p.id and t.status = 'published')
                   or exists (select 1 from public.posts po where po.user_id = p.id)))
          )
      )
      select c.id from cand c
      where (select count(*) from public.lifecycle_sends s where s.user_id = c.id and s.sent_at > now() - interval '7 days') < 2
        and not exists (select 1 from public.lifecycle_sends s where s.user_id = c.id and s.rule_key = rule.key and s.sent_at > now() - (rule.cooldown_days || ' days')::interval)
        and not exists (select 1 from public.notifications n where n.user_id = c.id and n.created_at > now() - interval '3 hours')
      limit 500
    loop
      v_n := v_n + 1;
      if not p_dry_run then
        begin
          insert into public.notifications (user_id, actor_id, actor_name, type, text, target)
          values (u.id, null, rule.title, 'tip', rule.body, rule.url)
          returning id into v_nid;
          insert into public.lifecycle_sends (rule_key, user_id, notification_id) values (rule.key, u.id, v_nid);
        exception when others then
          raise notice '[lifecycle %] % → %', rule.key, u.id, sqlerrm;
        end;
      end if;
    end loop;
    v_out := v_out || jsonb_build_object(rule.key, v_n);
  end loop;
  return v_out;
end;
$$;
revoke all on function public.run_lifecycle_messages(boolean) from public;

-- Admin wrapper (JWT callers): dry run = "how many would go out right now".
create or replace function public.admin_run_lifecycle_messages(p_dry_run boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin only'; end if;
  return public.run_lifecycle_messages(p_dry_run);
end;
$$;
grant execute on function public.admin_run_lifecycle_messages(boolean) to authenticated;

-- Per-rule stats for the admin panel: sends + taps (push_clicks joins on notification id).
create or replace function public.admin_lifecycle_stats()
returns table (rule_key text, sent_7d bigint, sent_30d bigint, clicked_30d bigint, last_sent_at timestamptz)
language sql
security definer
set search_path = public, pg_temp
as $$
  select r.key,
    (select count(*) from public.lifecycle_sends s where s.rule_key = r.key and s.sent_at > now() - interval '7 days'),
    (select count(*) from public.lifecycle_sends s where s.rule_key = r.key and s.sent_at > now() - interval '30 days'),
    (select count(*) from public.lifecycle_sends s join public.push_clicks c on c.notification_id = s.notification_id
      where s.rule_key = r.key and s.sent_at > now() - interval '30 days'),
    (select max(s.sent_at) from public.lifecycle_sends s where s.rule_key = r.key)
  from public.lifecycle_rules r
  where public.is_admin(auth.uid())
  order by r.sort_order;
$$;
grant execute on function public.admin_lifecycle_stats() to authenticated;

-- Send one rule's message to the calling admin (preview on their own phone).
create or replace function public.admin_lifecycle_preview(p_rule_key text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare r record;
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin only'; end if;
  select * into r from public.lifecycle_rules where key = p_rule_key;
  if r.key is null then raise exception 'rule not found'; end if;
  insert into public.notifications (user_id, actor_id, actor_name, type, text, target)
  values (auth.uid(), null, r.title, 'tip', r.body, r.url);
end;
$$;
grant execute on function public.admin_lifecycle_preview(text) to authenticated;

-- ── pg_cron: daily at 17:00 UTC (≈ 9–10 am Pacific) ───────────────────────
create extension if not exists pg_cron;
do $$
declare j record;
begin
  for j in select jobid from cron.job where jobname = 'lifecycle_messages' loop
    perform cron.unschedule(j.jobid);
  end loop;
end $$;
select cron.schedule('lifecycle_messages', '0 17 * * *', $cron$ select public.run_lifecycle_messages(false); $cron$);

-- ── Default-notify forum categories (Top Secret) ───────────────────────────
alter table public.forum_categories add column if not exists default_notify boolean not null default false;
alter table public.forum_subcategory_follows add column if not exists muted boolean not null default false;

-- Everyone (who hasn't muted that subcategory) is notified for default_notify
-- categories; explicit follows cover the rest. Muted rows never notify.
create or replace function public.notify_sub_followers_on_thread() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
#variable_conflict use_column
declare
  v_actor_name text;
  v_sub_name text;
  v_default boolean := false;
  v_restricted boolean := false;
  r record;
begin
  if new.hidden_at is not null then return new; end if;
  select coalesce(full_name, handle, 'Someone') into v_actor_name from public.profiles where id = new.user_id;
  select s.name, coalesce(c.default_notify, false), coalesce(c.visibility, 'public') <> 'public'
    into v_sub_name, v_default, v_restricted
  from public.forum_subcategories s join public.forum_categories c on c.id = s.category_id
  where s.slug = new.subcategory_slug limit 1;
  for r in
    select p.id as user_id
    from public.profiles p
    where coalesce(p.notify_sub_threads, true)
      and p.id <> new.user_id
      and (
        exists (select 1 from public.forum_subcategory_follows f where f.user_id = p.id and f.subcategory_slug = new.subcategory_slug and not f.muted)
        or (v_default and not exists (select 1 from public.forum_subcategory_follows f where f.user_id = p.id and f.subcategory_slug = new.subcategory_slug and f.muted))
      )
      -- restricted (ambassadors-only) categories: only people who can read them
      and (not v_restricted or public.is_ambassador_or_admin(p.id))
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

-- Which subcategories are default-notify (for the bell's initial state).
create or replace function public.forum_default_notify_subs()
returns setof text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select s.slug from public.forum_subcategories s
  join public.forum_categories c on c.id = s.category_id
  where c.default_notify;
$$;
grant execute on function public.forum_default_notify_subs() to anon, authenticated;

notify pgrst, 'reload schema';
