-- 2026-07-13: Session-level source attribution + guest→signup funnel.
--
-- The page_views table tracks per-navigation dwell time but doesn't
-- capture *where* the visitor came from. This table stamps each browser
-- session with its inbound source (referrer domain, UTM params, landing
-- path) exactly once at first arrival. When a session's owner signs up,
-- the row's user_id gets linked so we can compute signup conversion by
-- source.
--
-- Ambassador share links (/r/CODE) are NOT captured here — they 302 to
-- the Shopify sales site server-side and never touch the Trailhead SPA.
-- Traffic here is exclusively people who reached trailhead.lonepeakoverland.com.
--
-- One RPC: `admin_get_traffic_sources` — groups sessions by inbound
-- source and computes signup rate per source over a window.

create table if not exists public.session_sources (
  session_id text primary key,
  first_viewed_at timestamptz not null default now(),
  first_path text,
  referrer_domain text,   -- extracted hostname of document.referrer, minus our own domain
  utm_source text,
  utm_medium text,
  utm_campaign text,
  user_id uuid references auth.users(id) on delete set null
);

create index if not exists session_sources_first_viewed_at_idx on public.session_sources (first_viewed_at desc);
create index if not exists session_sources_user_id_idx on public.session_sources (user_id) where user_id is not null;
create index if not exists session_sources_referrer_idx on public.session_sources (referrer_domain);
create index if not exists session_sources_utm_source_idx on public.session_sources (utm_source);

alter table public.session_sources enable row level security;

-- Anyone (guest or signed-in) can INSERT their session row exactly once.
-- Duplicate session_id INSERT hits PK conflict; client uses upsert with
-- ignoreDuplicates so it silently no-ops on re-load.
drop policy if exists session_sources_public_insert on public.session_sources;
create policy session_sources_public_insert on public.session_sources
  for insert to anon, authenticated
  with check (true);

-- Signed-in users can link their user_id to a still-unlinked session
-- inserted in the last 30 days. Prevents backfilling ancient sessions or
-- stealing someone else's attribution.
drop policy if exists session_sources_link_user on public.session_sources;
create policy session_sources_link_user on public.session_sources
  for update to authenticated
  using (user_id is null and first_viewed_at > now() - interval '30 days')
  with check (user_id = auth.uid());

-- Admin-only SELECT. Attribution data is internal.
drop policy if exists session_sources_admin_select on public.session_sources;
create policy session_sources_admin_select on public.session_sources
  for select using (public.is_admin(auth.uid()));

-- ── admin_get_traffic_sources ──
-- Groups sessions by inbound source (UTM if present, else referrer
-- domain bucket, else Direct) and computes signup rate. Returns one row
-- per (source, medium) pair with counts.
drop function if exists public.admin_get_traffic_sources(int);
create or replace function public.admin_get_traffic_sources(p_days int default 30)
returns table(
  source text,
  medium text,
  sessions bigint,
  signups bigint,
  signup_rate_pct numeric
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
  with sessions_in_window as (
    select
      -- Prefer UTM source; else bucket the referrer domain by known
      -- properties; else Direct. Buckets are case-insensitive substrings
      -- so t.co/google.co.uk/etc. all fall in the right group.
      case
        when nullif(utm_source, '') is not null then utm_source
        when referrer_domain is null then 'Direct'
        when referrer_domain ilike '%google.%' then 'Google'
        when referrer_domain ilike '%bing.%' or referrer_domain ilike '%duckduckgo.%' or referrer_domain ilike '%yahoo.%' then 'Search (other)'
        when referrer_domain ilike '%twitter.%' or referrer_domain = 't.co' or referrer_domain = 'x.com' then 'Twitter/X'
        when referrer_domain ilike '%facebook.%' or referrer_domain ilike '%fb.com' then 'Facebook'
        when referrer_domain ilike '%instagram.%' or referrer_domain ilike '%l.instagram.%' then 'Instagram'
        when referrer_domain ilike '%reddit.%' then 'Reddit'
        when referrer_domain ilike '%youtube.%' or referrer_domain = 'youtu.be' then 'YouTube'
        when referrer_domain ilike '%tiktok.%' then 'TikTok'
        when referrer_domain ilike '%linkedin.%' then 'LinkedIn'
        when referrer_domain ilike '%lonepeakoverland.%' then 'Own site (lonepeakoverland.com)'
        else 'Referral (' || split_part(referrer_domain, '.', -2) || ')'
      end as source,
      coalesce(nullif(utm_medium, ''), 'direct') as medium,
      user_id is not null as signed_up
      from public.session_sources
     where first_viewed_at >= v_cutoff
  )
  select
    s.source,
    s.medium,
    count(*)::bigint as sessions,
    count(*) filter (where s.signed_up)::bigint as signups,
    case when count(*) > 0
         then round((count(*) filter (where s.signed_up)::numeric / count(*)::numeric) * 100, 1)
         else 0::numeric
    end as signup_rate_pct
    from sessions_in_window s
   group by s.source, s.medium
   order by sessions desc;
end;
$$;

grant execute on function public.admin_get_traffic_sources(int) to authenticated;
