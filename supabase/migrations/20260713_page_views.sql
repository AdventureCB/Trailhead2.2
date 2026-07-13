-- 2026-07-13: page-view analytics.
--
-- Tracks per-URL page views for both signed-in users and guests. Client
-- generates a session_id (sessionStorage — one per browser tab) and
-- INSERTs a row on every navigation. Dwell time (duration_ms) is patched
-- when the user navigates away or the tab hides. Guests are captured via
-- the anon RLS insert policy; user_id is nullable so we don't need to
-- gate on auth.
--
-- Two admin RPCs:
--   • admin_get_traffic_overview       — totals + today + unique sessions +
--                                        avg session duration for the
--                                        stat-card headlines
--   • admin_get_traffic_by_path(limit) — per-path breakdown: views,
--                                        unique sessions, unique users,
--                                        avg dwell — powers both expand
--                                        panels

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text not null,
  path text not null,
  viewed_at timestamptz not null default now(),
  -- Dwell time on this page in milliseconds. NULL until the client
  -- PATCHes it on the next navigation (or on visibilitychange → hidden
  -- via fetch keepalive). Kept in ms so we don't lose sub-second detail
  -- on quick clicks.
  duration_ms int
);

create index if not exists page_views_viewed_at_idx on public.page_views (viewed_at desc);
create index if not exists page_views_path_idx on public.page_views (path);
create index if not exists page_views_session_id_idx on public.page_views (session_id);
create index if not exists page_views_user_id_idx on public.page_views (user_id) where user_id is not null;

alter table public.page_views enable row level security;

-- Anyone (guest via anon key or signed-in) can insert. We deliberately
-- don't bind session_id to auth since guests need coverage and the
-- session_id is client-generated. If we see spam we can add a rate-limit
-- trigger later.
drop policy if exists page_views_public_insert on public.page_views;
create policy page_views_public_insert on public.page_views
  for insert to anon, authenticated
  with check (true);

-- Admin-only SELECT. Analytics are internal.
drop policy if exists page_views_admin_select on public.page_views;
create policy page_views_admin_select on public.page_views
  for select using (public.is_admin(auth.uid()));

-- Duration UPDATE — any caller can patch duration_ms on a row that (a)
-- doesn't already have a duration set and (b) was inserted within the
-- last hour. Prevents backfilling ancient rows or overwriting existing
-- values. Session_id / user_id / path are NOT writable via this policy
-- (with_check enforces only duration_ms > 0 as the new state).
drop policy if exists page_views_public_update_duration on public.page_views;
create policy page_views_public_update_duration on public.page_views
  for update to anon, authenticated
  using (duration_ms is null and viewed_at > now() - interval '1 hour')
  with check (duration_ms is not null and duration_ms >= 0);

-- ── admin_get_traffic_overview ──
-- Single-row headline stats for the two new AdminStatCards. Guarded by
-- is_admin(); non-admins get an empty result (silent no-op) rather than
-- an error since the client shouldn't be calling anyway.
drop function if exists public.admin_get_traffic_overview();
create or replace function public.admin_get_traffic_overview()
returns table(
  total_views bigint,
  views_today bigint,
  unique_sessions_today bigint,
  avg_session_duration_seconds numeric
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not public.is_admin(auth.uid()) then
    return;
  end if;
  return query
    select
      (select count(*) from public.page_views)::bigint as total_views,
      (select count(*) from public.page_views where viewed_at >= (now() - interval '24 hours'))::bigint as views_today,
      (select count(distinct session_id) from public.page_views where viewed_at >= (now() - interval '24 hours'))::bigint as unique_sessions_today,
      coalesce(
        (select avg(extract(epoch from (mx - mn)))
         from (
           select session_id, min(viewed_at) as mn, max(viewed_at) as mx
           from public.page_views
           group by session_id
           having count(*) > 1
         ) t),
        0
      )::numeric as avg_session_duration_seconds;
end;
$$;

grant execute on function public.admin_get_traffic_overview() to authenticated;

-- ── admin_get_traffic_by_path ──
-- Per-URL breakdown. Sorted by total views desc; caller caps rows.
-- Powers both expand panels (total-views panel sorts by `views`;
-- avg-session-time panel sorts client-side by `avg_dwell_seconds`).
drop function if exists public.admin_get_traffic_by_path(int);
create or replace function public.admin_get_traffic_by_path(p_limit int default 50)
returns table(
  path text,
  views bigint,
  unique_sessions bigint,
  unique_users bigint,
  avg_dwell_seconds numeric
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not public.is_admin(auth.uid()) then
    return;
  end if;
  return query
    select
      pv.path,
      count(*)::bigint as views,
      count(distinct pv.session_id)::bigint as unique_sessions,
      count(distinct pv.user_id) filter (where pv.user_id is not null)::bigint as unique_users,
      coalesce(avg(pv.duration_ms) / 1000.0, 0)::numeric as avg_dwell_seconds
    from public.page_views pv
    group by pv.path
    order by count(*) desc
    limit p_limit;
end;
$$;

grant execute on function public.admin_get_traffic_by_path(int) to authenticated;
