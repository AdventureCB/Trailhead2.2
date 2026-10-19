-- ============================================================================
-- FORUM — members-only reading window + admin link buttons
-- ============================================================================
-- 1. `forum_threads.members_only_until`: while in the future, the thread (and
--    its replies) are readable ONLY by signed-in users; once it passes, the
--    thread opens to guests (and search engines) automatically. Enforced with
--    RESTRICTIVE policies so the existing public-read policies stay untouched
--    (restrictive ANDs with permissive). Admins set it from the composer or
--    the thread page (24h / 3d / 7d / 14d / 30d / off).
-- 2. `forum_thread_teaser(...)`: SECURITY DEFINER lookup of a gated thread's
--    title/category only, so a guest who opens a share link sees "Members
--    only — sign in to read" instead of a dead page, and the link preview
--    (api/preview.js) still renders an OG card.
-- Admin link buttons need no schema — they're a `{type:'url'}` entry in the
-- existing `sections` jsonb.
-- Idempotent.
-- ============================================================================

alter table public.forum_threads
  add column if not exists members_only_until timestamptz;

create index if not exists forum_threads_members_only_idx
  on public.forum_threads (members_only_until)
  where members_only_until is not null;

-- Guests (no auth.uid()) can't read a thread while its window is active.
drop policy if exists forum_threads_members_only_window on public.forum_threads;
create policy forum_threads_members_only_window on public.forum_threads
  as restrictive for select
  using (members_only_until is null or members_only_until <= now() or auth.uid() is not null);

-- …nor its replies.
drop policy if exists forum_replies_members_only_window on public.forum_replies;
create policy forum_replies_members_only_window on public.forum_replies
  as restrictive for select
  using (
    auth.uid() is not null
    or not exists (
      select 1 from public.forum_threads t
      where t.id = forum_replies.thread_id
        and t.members_only_until is not null
        and t.members_only_until > now()
    )
  );

-- Teaser for gated threads: title + where it lives, never the body.
create or replace function public.forum_thread_teaser(p_id uuid default null, p_slug text default null)
returns table (
  id uuid, title text, slug text, category_slug text, subcategory_slug text,
  created_at timestamptz, members_only_until timestamptz, hero_url text
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select t.id, t.title, t.slug, t.category_slug, t.subcategory_slug, t.created_at, t.members_only_until,
         case when jsonb_typeof(t.photos) = 'array' and jsonb_array_length(t.photos) > 0
              then coalesce(t.photos->0->>'url', t.photos->>0) end as hero_url
  from public.forum_threads t
  where t.hidden_at is null
    and ((p_id is not null and t.id = p_id) or (p_slug is not null and t.slug = p_slug))
  limit 1;
$$;
grant execute on function public.forum_thread_teaser(uuid, text) to anon, authenticated;

notify pgrst, 'reload schema';
