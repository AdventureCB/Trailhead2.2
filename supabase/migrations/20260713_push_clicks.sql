-- 2026-07-13: Push notification click tracking + CTR-by-type analytics.
--
-- Every notification insert triggers a push_send via the send-push Edge
-- Function. This table logs the CLICK side of the round trip so we can
-- measure open rate per notification type. Together with the existing
-- notifications table (sends) it yields CTR per type — the primary
-- signal for "is this notification worth sending."
--
-- Cold-boot flow: SW notificationclick → openWindow with URL that has
-- ?ntf=<id>&nt=<type> appended → SPA on mount parses the query and
-- INSERTs a row, then strips the params from the URL bar.
--
-- Warm-tab flow: SW postMessage({type:'navigate', url, notifId, notifType})
-- → SPA listener INSERTs a row directly (no URL round trip).

create table if not exists public.push_clicks (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid,
  notif_type text,
  user_id uuid references auth.users(id) on delete set null,
  clicked_at timestamptz not null default now(),
  path text
);

create index if not exists push_clicks_notif_type_idx  on public.push_clicks (notif_type);
create index if not exists push_clicks_clicked_at_idx on public.push_clicks (clicked_at desc);
create index if not exists push_clicks_user_id_idx    on public.push_clicks (user_id) where user_id is not null;
create index if not exists push_clicks_notif_id_idx   on public.push_clicks (notification_id) where notification_id is not null;

alter table public.push_clicks enable row level security;

-- Anyone can insert (in practice only signed-in users see notifications,
-- but leaving the door open for guests avoids friction if we ever push
-- to anonymized broadcast subscribers).
drop policy if exists push_clicks_public_insert on public.push_clicks;
create policy push_clicks_public_insert on public.push_clicks
  for insert to anon, authenticated
  with check (true);

-- Admin-only SELECT.
drop policy if exists push_clicks_admin_select on public.push_clicks;
create policy push_clicks_admin_select on public.push_clicks
  for select using (public.is_admin(auth.uid()));

-- ── admin_get_push_ctr ──
-- Per notification type: sends (from notifications), clicks (from
-- push_clicks), CTR percentage. FULL OUTER JOIN so types with sends but
-- no clicks (or vice-versa — shouldn't happen) both appear.
drop function if exists public.admin_get_push_ctr(int);
create or replace function public.admin_get_push_ctr(p_days int default 30)
returns table(
  notif_type text,
  sends bigint,
  clicks bigint,
  ctr_pct numeric
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
declare
  v_cutoff timestamptz := now() - make_interval(days => p_days);
begin
  if not public.is_admin(auth.uid()) then
    return;
  end if;

  return query
  with sends as (
    select type as t, count(*)::bigint as n
      from public.notifications
     where created_at >= v_cutoff and type is not null
     group by type
  ),
  clicks as (
    select notif_type as t, count(*)::bigint as n
      from public.push_clicks
     where clicked_at >= v_cutoff and notif_type is not null
     group by notif_type
  )
  select
    coalesce(s.t, c.t) as notif_type,
    coalesce(s.n, 0)::bigint as sends,
    coalesce(c.n, 0)::bigint as clicks,
    case when coalesce(s.n, 0) > 0
         then round((coalesce(c.n, 0)::numeric / s.n::numeric) * 100, 1)
         else 0::numeric
    end as ctr_pct
    from sends s
    full outer join clicks c on c.t = s.t
   order by coalesce(s.n, 0) desc;
end;
$$;

grant execute on function public.admin_get_push_ctr(int) to authenticated;
