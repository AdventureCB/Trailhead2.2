-- ============================================================================
-- ANALYTICS FIXES + PLATFORM BREAKDOWN (2026-11-11)
-- ============================================================================
-- 1. TRACKING WAS ADMIN-ONLY. The client inserted page_views with
--    `.select("id")` (RETURNING), which requires SELECT — admin-only — so
--    every non-admin insert was rejected; the dwell UPDATE and the
--    session→user link UPDATE failed the same way. Every page view in the
--    table was an admin's. Fix: SECURITY DEFINER tracking RPCs (no
--    read-back needed): track_view / track_dwell / link_session_source.
-- 2. "TODAY" WAS UTC. now()::date rolls over at 4–5 pm Pacific, so "New
--    Today" dropped in the evening. All day math now uses
--    America/Los_Angeles.
-- 3. ADMINS EXCLUDED from traffic analytics (page views, avg session,
--    sources, landing paths): any session that ever carried an admin's
--    user_id is dropped.
-- 4. PLATFORM: page_views / session_sources get `platform`
--    ('ios' | 'android' | 'web' | 'pwa'); profiles get last_platform +
--    last_platform_at. New admin_get_platform_breakdown().
-- Idempotent.
-- ============================================================================

alter table public.page_views      add column if not exists platform text;
alter table public.session_sources add column if not exists platform text;
alter table public.profiles        add column if not exists last_platform text;
alter table public.profiles        add column if not exists last_platform_at timestamptz;
create index if not exists page_views_platform_idx on public.page_views (platform, viewed_at desc);

-- ── Tracking RPCs (anon + authenticated) ───────────────────────────────────
-- track_view: one page view; on the first view of a session the client
-- also passes p_landing {path, referrer_domain, utm_source, utm_medium,
-- utm_campaign} and the session_sources row is created (first touch wins).
create or replace function public.track_view(p_session_id text, p_path text, p_platform text default 'web', p_landing jsonb default null)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
  v_platform text := case when p_platform in ('ios','android','web','pwa') then p_platform else 'web' end;
begin
  if coalesce(trim(p_session_id), '') = '' then return null; end if;
  insert into public.page_views (user_id, session_id, path, platform)
  values (v_uid, left(p_session_id, 80), left(coalesce(nullif(p_path, ''), '/'), 300), v_platform)
  returning id into v_id;
  if p_landing is not null then
    insert into public.session_sources (session_id, first_path, referrer_domain, utm_source, utm_medium, utm_campaign, user_id, platform)
    values (
      left(p_session_id, 80),
      left(coalesce(nullif(p_landing->>'path', ''), p_path, '/'), 300),
      nullif(left(p_landing->>'referrer_domain', 200), ''),
      nullif(left(p_landing->>'utm_source', 120), ''),
      nullif(left(p_landing->>'utm_medium', 120), ''),
      nullif(left(p_landing->>'utm_campaign', 200), ''),
      v_uid, v_platform)
    on conflict (session_id) do nothing;
  end if;
  if v_uid is not null then
    update public.session_sources set user_id = v_uid where session_id = p_session_id and user_id is null;
    update public.profiles set last_platform = v_platform, last_platform_at = now()
     where id = v_uid and (last_platform is distinct from v_platform or last_platform_at is null or last_platform_at < now() - interval '1 hour');
  end if;
  return v_id;
end;
$$;
grant execute on function public.track_view(text, text, text, jsonb) to anon, authenticated;

create or replace function public.track_dwell(p_id uuid, p_ms int)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.page_views
     set duration_ms = least(greatest(coalesce(p_ms, 0), 0), 1800000)
   where id = p_id and duration_ms is null and viewed_at > now() - interval '1 hour';
$$;
grant execute on function public.track_dwell(uuid, int) to anon, authenticated;

create or replace function public.link_session_source(p_session_id text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.session_sources set user_id = auth.uid()
   where auth.uid() is not null and session_id = p_session_id and user_id is null
     and first_viewed_at > now() - interval '30 days';
$$;
grant execute on function public.link_session_source(text) to authenticated;

-- ── Admin-session exclusion helper ─────────────────────────────────────────
create or replace function public._admin_session_ids()
returns setof text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select distinct pv.session_id from public.page_views pv
    join public.profiles p on p.id = pv.user_id where p.role = 'admin'
  union
  select ss.session_id from public.session_sources ss
    join public.profiles p on p.id = ss.user_id where p.role = 'admin';
$$;

-- ── Overview stats — Pacific days ──────────────────────────────────────────
create or replace function public.admin_get_overview_stats()
returns table(total_users integer, live_now integer, new_today integer, posts_today integer, posts_total integer, dau_today integer, wau integer, mau integer, stickiness_pct numeric, pending_ambassadors integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_today date := (now() at time zone 'America/Los_Angeles')::date;
begin
  if not public.is_admin(auth.uid()) then return; end if;
  return query
    with act as (
      select (last_seen_at at time zone 'America/Los_Angeles')::date d, id uid from public.profiles where last_seen_at is not null
      union select (created_at at time zone 'America/Los_Angeles')::date, user_id from public.posts
      union select (created_at at time zone 'America/Los_Angeles')::date, user_id from public.post_likes
      union select (created_at at time zone 'America/Los_Angeles')::date, user_id from public.post_comments
      union select (created_at at time zone 'America/Los_Angeles')::date, user_id from public.forum_threads
      union select (created_at at time zone 'America/Los_Angeles')::date, user_id from public.forum_replies
      union select (viewed_at at time zone 'America/Los_Angeles')::date, user_id from public.page_views where user_id is not null
    ),
    m as (select count(distinct uid)::int mau from act where d > v_today - 30),
    a as (select avg(c) avg_dau from (select count(distinct uid)::numeric c from act where d > v_today - 30 group by d) x)
    select
      (select count(*)::int from public.profiles),
      (select count(*)::int from public.profiles where last_seen_at > now() - interval '2 minutes'),
      (select count(*)::int from public.profiles where (created_at at time zone 'America/Los_Angeles')::date = v_today),
      (select count(*)::int from public.posts where (created_at at time zone 'America/Los_Angeles')::date = v_today),
      (select count(*)::int from public.posts),
      (select count(distinct uid)::int from act where d = v_today),
      (select count(distinct uid)::int from act where d > v_today - 7),
      m.mau,
      case when m.mau > 0 then round(coalesce(a.avg_dau, 0) / m.mau::numeric * 100, 1) else 0::numeric end,
      (select count(*)::int from public.profiles where requested_role = 'ambassador')
    from m, a;
end;
$$;

create or replace function public.admin_get_signups_daily(p_days integer default 30)
returns table(day date, signups integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_today date := (now() at time zone 'America/Los_Angeles')::date;
begin
  if not public.is_admin(auth.uid()) then return; end if;
  return query
    select dr.d::date,
           (select count(*)::int from public.profiles p where (p.created_at at time zone 'America/Los_Angeles')::date = dr.d::date)
    from generate_series(v_today - (p_days - 1), v_today, interval '1 day') dr(d)
    order by 1;
end;
$$;

create or replace function public.admin_get_dau_daily(p_days integer default 30)
returns table(day date, active_users integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_today date := (now() at time zone 'America/Los_Angeles')::date;
begin
  if not public.is_admin(auth.uid()) then return; end if;
  return query
    with activity as (
      select (last_seen_at at time zone 'America/Los_Angeles')::date d, id uid from public.profiles where last_seen_at is not null
      union select (created_at at time zone 'America/Los_Angeles')::date, user_id from public.posts
      union select (created_at at time zone 'America/Los_Angeles')::date, user_id from public.post_likes
      union select (created_at at time zone 'America/Los_Angeles')::date, user_id from public.post_comments
      union select (created_at at time zone 'America/Los_Angeles')::date, user_id from public.forum_threads
      union select (created_at at time zone 'America/Los_Angeles')::date, user_id from public.forum_replies
      union select (viewed_at at time zone 'America/Los_Angeles')::date, user_id from public.page_views where user_id is not null
    )
    select dr.d::date, (select count(distinct a.uid)::int from activity a where a.d = dr.d::date)
    from generate_series(v_today - (p_days - 1), v_today, interval '1 day') dr(d)
    order by 1;
end;
$$;

-- ── Traffic — admins excluded, last 30 days, Pacific "today" ───────────────
create or replace function public.admin_get_traffic_overview()
returns table(total_views bigint, views_today bigint, unique_sessions_today bigint, avg_session_duration_seconds numeric)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
#variable_conflict use_column
declare v_today date := (now() at time zone 'America/Los_Angeles')::date;
begin
  if not public.is_admin(auth.uid()) then return; end if;
  return query
    with pv as (
      select * from public.page_views
       where viewed_at > now() - interval '30 days'
         and session_id not in (select public._admin_session_ids())
    ),
    sess as (
      -- Session length = sum of measured dwell (each page capped at 30 min
      -- client-side), falling back to first→last view span.
      select session_id,
             greatest(coalesce(sum(duration_ms), 0) / 1000.0, extract(epoch from (max(viewed_at) - min(viewed_at)))) as secs
        from pv group by session_id
    )
    select
      (select count(*) from pv)::bigint,
      (select count(*) from pv where (viewed_at at time zone 'America/Los_Angeles')::date = v_today)::bigint,
      (select count(distinct session_id) from pv where (viewed_at at time zone 'America/Los_Angeles')::date = v_today)::bigint,
      coalesce((select avg(least(secs, 7200)) from sess where secs >= 3), 0)::numeric;
end;
$$;

create or replace function public.admin_get_traffic_by_path(p_limit integer default 50)
returns table(path text, views bigint, unique_sessions bigint, unique_users bigint, avg_dwell_seconds numeric)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
#variable_conflict use_column
begin
  if not public.is_admin(auth.uid()) then return; end if;
  return query
    select pv.path, count(*)::bigint, count(distinct pv.session_id)::bigint,
           count(distinct pv.user_id) filter (where pv.user_id is not null)::bigint,
           coalesce(avg(pv.duration_ms) / 1000.0, 0)::numeric
      from public.page_views pv
     where pv.viewed_at > now() - interval '30 days'
       and pv.session_id not in (select public._admin_session_ids())
     group by pv.path
     order by count(*) desc
     limit p_limit;
end;
$$;

-- Source bucketing shared by both source RPCs. Native app sessions have no
-- browser referrer, so they're "App · iOS" / "App · Android" rather than
-- piling into Direct.
create or replace function public._traffic_source_label(p_platform text, p_ref text, p_utm text)
returns text
language sql
immutable
as $$
  select case
    when nullif(p_utm, '') is not null then p_utm
    when p_platform = 'ios' then 'App · iOS'
    when p_platform = 'android' then 'App · Android'
    when p_ref is null then case when p_platform = 'pwa' then 'Home-screen web app' else 'Direct / typed' end
    when p_ref ilike '%google.%' then 'Google'
    when p_ref ilike '%bing.%' or p_ref ilike '%duckduckgo.%' or p_ref ilike '%yahoo.%' then 'Search (other)'
    when p_ref ilike '%twitter.%' or p_ref = 't.co' or p_ref = 'x.com' then 'Twitter/X'
    when p_ref ilike '%facebook.%' or p_ref ilike '%fb.com' then 'Facebook'
    when p_ref ilike '%instagram.%' then 'Instagram'
    when p_ref ilike '%reddit.%' then 'Reddit'
    when p_ref ilike '%youtube.%' or p_ref = 'youtu.be' then 'YouTube'
    when p_ref ilike '%tiktok.%' then 'TikTok'
    when p_ref ilike '%linkedin.%' then 'LinkedIn'
    when p_ref ilike '%klaviyo.%' or p_ref ilike '%mail.%' then 'Email'
    when p_ref ilike '%lonepeakoverland.%' then 'lonepeakoverland.com'
    else 'Referral (' || split_part(p_ref, '.', -2) || ')'
  end;
$$;

create or replace function public.admin_get_traffic_sources_detailed(p_days int default 30)
returns table(source text, medium text, campaign text, first_path text, sessions bigint, signups bigint, signup_rate_pct numeric)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
#variable_conflict use_column
begin
  if not public.is_admin(auth.uid()) then return; end if;
  return query
  with s as (
    select public._traffic_source_label(ss.platform, ss.referrer_domain, ss.utm_source) as source,
           coalesce(nullif(ss.utm_medium, ''), '(none)') as medium,
           coalesce(nullif(ss.utm_campaign, ''), '(none)') as campaign,
           coalesce(nullif(ss.first_path, ''), '/') as first_path,
           ss.user_id is not null as signed_up
      from public.session_sources ss
     where ss.first_viewed_at >= now() - make_interval(days => p_days)
       and ss.session_id not in (select public._admin_session_ids())
  )
  select s.source, s.medium, s.campaign, s.first_path, count(*)::bigint,
         count(*) filter (where s.signed_up)::bigint,
         case when count(*) > 0 then round((count(*) filter (where s.signed_up))::numeric / count(*) * 100, 1) else 0 end
    from s group by 1, 2, 3, 4 order by 5 desc;
end;
$$;

create or replace function public.admin_get_traffic_sources(p_days int default 30)
returns table(source text, medium text, sessions bigint, signups bigint, signup_rate_pct numeric)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
#variable_conflict use_column
begin
  if not public.is_admin(auth.uid()) then return; end if;
  return query
  select d.source, d.medium, sum(d.sessions)::bigint, sum(d.signups)::bigint,
         case when sum(d.sessions) > 0 then round(sum(d.signups) / sum(d.sessions) * 100, 1) else 0 end
    from public.admin_get_traffic_sources_detailed(p_days) d
   group by 1, 2 order by 3 desc;
end;
$$;

-- ── Platform breakdown ─────────────────────────────────────────────────────
-- Per platform: active users (30 d / today, Pacific), sessions, page views,
-- avg session length; plus all-time "last seen on" counts from profiles.
create or replace function public.admin_get_platform_breakdown(p_days int default 30)
returns table(platform text, users_today bigint, users_period bigint, sessions bigint, views bigint, avg_session_seconds numeric, members_last_seen bigint)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
#variable_conflict use_column
declare v_today date := (now() at time zone 'America/Los_Angeles')::date;
begin
  if not public.is_admin(auth.uid()) then return; end if;
  return query
  with pv as (
    select * from public.page_views
     where viewed_at > now() - make_interval(days => p_days)
       and platform is not null
       and session_id not in (select public._admin_session_ids())
  ),
  sess as (
    select platform, session_id,
           greatest(coalesce(sum(duration_ms), 0) / 1000.0, extract(epoch from (max(viewed_at) - min(viewed_at)))) secs
      from pv group by 1, 2
  ),
  plats as (select unnest(array['ios','android','web','pwa']) as platform)
  select pl.platform,
    (select count(distinct user_id) from pv where pv.platform = pl.platform and user_id is not null and (viewed_at at time zone 'America/Los_Angeles')::date = v_today)::bigint,
    (select count(distinct user_id) from pv where pv.platform = pl.platform and user_id is not null)::bigint,
    (select count(*) from sess where sess.platform = pl.platform)::bigint,
    (select count(*) from pv where pv.platform = pl.platform)::bigint,
    coalesce((select avg(least(secs, 7200)) from sess where sess.platform = pl.platform and secs >= 3), 0)::numeric,
    (select count(*) from public.profiles p where p.last_platform = pl.platform and p.role <> 'admin')::bigint
  from plats pl;
end;
$$;
grant execute on function public.admin_get_platform_breakdown(int) to authenticated;

notify pgrst, 'reload schema';
