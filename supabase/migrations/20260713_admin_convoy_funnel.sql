-- 2026-07-13: Convoy completion funnel for the admin CONTENT tab.
--
-- Convoys are the app's "did this community moment actually happen"
-- signal. Posting a convoy is easy; getting people to show up and
-- coordinate in the group DM is what matters. This funnel measures each
-- stage so we can spot where the drop-off is.
--
-- Stages (each is a superset filter on convoys posted in the window):
--   1. Created                — posts.type='CONVOYS' in-window
--   2. Any RSVP received      — at least one convoy_rsvps row
--   3. Committed attendees    — at least 2 RSVPs going (host + 1)
--   4. Group DM had chatter   — group DM has 3+ messages
--   5. Coordinated actively   — group DM has 10+ messages
--
-- Group DM is auto-created when the first RSVP goes, so stage 4/5 don't
-- need a "DM exists" gate. p_days defaults to 90 so we're only measuring
-- convoys with time to have completed their event date.

drop function if exists public.admin_get_convoy_funnel(int);
create or replace function public.admin_get_convoy_funnel(p_days int default 90)
returns table(
  stage text,
  convoys bigint,
  pct_of_total numeric,
  drop_off_pct numeric,
  sort_order int
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
declare
  v_cutoff timestamptz := now() - make_interval(days => p_days);
  v_total bigint;
begin
  if not public.is_admin(auth.uid()) then
    return;
  end if;

  -- Precompute per-convoy signals in a single pass. Everything downstream
  -- reads booleans from this CTE so we don't hit the RSVP / DM tables N
  -- times.
  return query
  with convoys as (
    select
      p.id,
      exists (
        select 1 from public.convoy_rsvps r where r.post_id = p.id
      ) as has_rsvp,
      (
        select count(*) from public.convoy_rsvps r
         where r.post_id = p.id and r.status = 'going'
      ) >= 2 as has_two_going,
      coalesce((
        select count(*)::int from public.dm_messages dm
         where dm.conversation_id in (
           select dc.id from public.dm_conversations dc where dc.convoy_post_id = p.id
         )
      ), 0) as dm_msg_count
      from public.posts p
     where p.type = 'CONVOYS'
       and p.created_at >= v_cutoff
  ),
  totals as (
    select
      count(*)::bigint as created,
      count(*) filter (where has_rsvp)::bigint as with_rsvp,
      count(*) filter (where has_two_going)::bigint as with_commit,
      count(*) filter (where dm_msg_count >= 3)::bigint as dm_chatter,
      count(*) filter (where dm_msg_count >= 10)::bigint as dm_active
      from convoys
  ),
  stages(sort_order, stage, cnt, prev_cnt) as (
    -- prev_cnt is used for drop-off math; stage 1 (Created) has no
    -- predecessor so prev_cnt = cnt to give 0% drop-off.
    select 10, 'Created'::text,             created,      created     from totals
    union all
    select 20, 'RSVP received'::text,       with_rsvp,    created     from totals
    union all
    select 30, 'Committed attendees'::text, with_commit,  with_rsvp   from totals
    union all
    select 40, 'DM had chatter'::text,      dm_chatter,   with_commit from totals
    union all
    select 50, 'Sustained coordination'::text, dm_active, dm_chatter  from totals
  )
  select
    s.stage,
    s.cnt::bigint as convoys,
    case when (select created from totals) > 0
         then round((s.cnt::numeric / (select created from totals)::numeric) * 100, 1)
         else 0::numeric
    end as pct_of_total,
    case when s.prev_cnt > 0 and s.sort_order > 10
         then round(((s.prev_cnt - s.cnt)::numeric / s.prev_cnt::numeric) * 100, 1)
         else 0::numeric
    end as drop_off_pct,
    s.sort_order::int
    from stages s
   order by s.sort_order;
end;
$$;

grant execute on function public.admin_get_convoy_funnel(int) to authenticated;
