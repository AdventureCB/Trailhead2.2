-- ============================================================================
-- INTEREST LISTS — explicit thread tagging (hybrid on top of the subcategory)
-- ============================================================================
-- Layers on 20261027_interest_lists.sql. The linked subcategory stays the
-- automatic feed; this adds a per-list override so admin can
--   • INCLUDE a thread from any other subcategory,
--   • EXCLUDE a thread that lives in the linked subcategory but isn't an
--     update,
--   • PIN a thread to the top of the page.
-- `interest_list_updates` becomes: (subcategory threads minus excluded)
-- ∪ (included), pinned first, then newest. Admin-only table; the public
-- page reads through the SECURITY DEFINER RPC.
-- Idempotent.
-- ============================================================================

create table if not exists public.interest_list_threads (
  list_id   uuid not null references public.interest_lists(id) on delete cascade,
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  mode      text not null default 'include' check (mode in ('include','exclude')),
  pinned    boolean not null default false,
  added_by  uuid references auth.users(id) on delete set null,
  added_at  timestamptz not null default now(),
  primary key (list_id, thread_id)
);
create index if not exists interest_list_threads_thread_idx on public.interest_list_threads (thread_id);

alter table public.interest_list_threads enable row level security;
drop policy if exists interest_list_threads_admin_all on public.interest_list_threads;
create policy interest_list_threads_admin_all on public.interest_list_threads
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Re-define the updates feed with the overrides. Adds `source` ('sub' |
-- 'tagged') + `pinned` so the admin screen can show where each row came from.
drop function if exists public.interest_list_updates(text, int);
create or replace function public.interest_list_updates(p_slug text, p_limit int default 50)
returns table (
  id uuid, title text, slug text, subcategory_slug text, created_at timestamptz,
  members_only_until timestamptz, hero_url text, reply_count bigint, excerpt text,
  source text, pinned boolean
)
language sql
security definer
set search_path = public, pg_temp
as $$
  with l as (
    select id, forum_subcategory_slug
    from public.interest_lists
    where slug = p_slug and (status <> 'draft' or public.is_admin(auth.uid()))
    limit 1
  ),
  picked as (
    -- Automatic: everything in the linked subcategory that isn't excluded.
    select t.id as thread_id, 'sub'::text as source, coalesce(o.pinned, false) as pinned
    from l
    join public.forum_threads t on t.subcategory_slug = l.forum_subcategory_slug
    left join public.interest_list_threads o on o.list_id = l.id and o.thread_id = t.id
    where l.forum_subcategory_slug is not null
      and (o.mode is null or o.mode <> 'exclude')
    union
    -- Explicit: tagged from anywhere.
    select o.thread_id, 'tagged'::text, o.pinned
    from l
    join public.interest_list_threads o on o.list_id = l.id
    where o.mode = 'include'
  )
  select t.id, t.title, t.slug, t.subcategory_slug, t.created_at, t.members_only_until,
         case when jsonb_typeof(t.photos) = 'array' and jsonb_array_length(t.photos) > 0
              then coalesce(t.photos->0->>'url', t.photos->>0) end as hero_url,
         (select count(*) from public.forum_replies r where r.thread_id = t.id) as reply_count,
         case when t.members_only_until is not null and t.members_only_until > now() and auth.uid() is null
              then null
              else left(regexp_replace(coalesce(t.body, ''), '<[^>]+>', ' ', 'g'), 220) end as excerpt,
         -- A thread can match both branches (in the sub AND tagged); prefer 'sub'.
         min(p.source) as source,
         bool_or(p.pinned) as pinned
  from picked p
  join public.forum_threads t on t.id = p.thread_id
  where t.hidden_at is null
  group by t.id, t.title, t.slug, t.subcategory_slug, t.created_at, t.members_only_until, t.photos, t.body
  order by bool_or(p.pinned) desc, t.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;
grant execute on function public.interest_list_updates(text, int) to anon, authenticated;

notify pgrst, 'reload schema';
