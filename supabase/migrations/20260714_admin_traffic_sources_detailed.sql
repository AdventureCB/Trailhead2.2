-- 2026-07-14: More granular traffic-source analytics for the OVERVIEW tab.
--
-- The original admin_get_traffic_sources rolled sessions up to just
-- (source, medium). This variant returns four dimensions — source,
-- medium, campaign, first_path — so admin can drill from "Google →
-- organic search sessions" into "which specific landing pages / UTM
-- campaigns brought them in." The client pivots however it wants;
-- server just returns long-form rows.
--
-- Also fixes NULL utm_medium so it shows as "(none)" rather than
-- collapsing every no-UTM referrer into a single unlabeled bucket.

drop function if exists public.admin_get_traffic_sources_detailed(int);
create or replace function public.admin_get_traffic_sources_detailed(p_days int default 30)
returns table(
  source text,
  medium text,
  campaign text,
  first_path text,
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
      coalesce(nullif(utm_medium, ''), '(none)') as medium,
      coalesce(nullif(utm_campaign, ''), '(none)') as campaign,
      coalesce(nullif(first_path, ''), '/') as first_path,
      user_id is not null as signed_up
      from public.session_sources
     where first_viewed_at >= v_cutoff
  )
  select
    s.source,
    s.medium,
    s.campaign,
    s.first_path,
    count(*)::bigint as sessions,
    count(*) filter (where s.signed_up)::bigint as signups,
    case when count(*) > 0
         then round((count(*) filter (where s.signed_up)::numeric / count(*)::numeric) * 100, 1)
         else 0::numeric
    end as signup_rate_pct
    from sessions_in_window s
   group by s.source, s.medium, s.campaign, s.first_path
   order by sessions desc;
end;
$$;

grant execute on function public.admin_get_traffic_sources_detailed(int) to authenticated;
