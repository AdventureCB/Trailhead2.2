-- ============================================================================
-- FORUM — category visibility (public | ambassadors)
-- ============================================================================
-- An ambassador asked for a category only ambassadors can see. Admin sets
-- `forum_categories.visibility = 'ambassadors'` in the category modal; the
-- database then hides the category, its subcategories, threads, and replies
-- from everyone who isn't an ambassador or admin — RESTRICTIVE policies that
-- AND onto the existing public-read ones, so the app, search, SSR, OG
-- previews, sitemap, realtime, and the REST API all enforce it the same way.
-- Admins always see everything. `forum_thread_teaser` (SECURITY DEFINER,
-- used for members-only share links) gets the same gate so it can't leak a
-- restricted title. Idempotent.
-- ============================================================================

alter table public.forum_categories
  add column if not exists visibility text not null default 'public'
  check (visibility in ('public', 'ambassadors'));

-- True when the viewer may read a category with the given slug.
create or replace function public.forum_category_visible(p_category_slug text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((
    select c.visibility = 'public' or public.is_ambassador_or_admin(auth.uid())
    from public.forum_categories c
    where c.slug = p_category_slug
    limit 1
  ), true);  -- unknown slug → don't block (legacy rows)
$$;
grant execute on function public.forum_category_visible(text) to anon, authenticated;

drop policy if exists forum_categories_visibility on public.forum_categories;
create policy forum_categories_visibility on public.forum_categories
  as restrictive for select
  using (visibility = 'public' or public.is_ambassador_or_admin(auth.uid()));

drop policy if exists forum_subcategories_visibility on public.forum_subcategories;
create policy forum_subcategories_visibility on public.forum_subcategories
  as restrictive for select
  using (
    public.is_ambassador_or_admin(auth.uid())
    or not exists (
      select 1 from public.forum_categories c
      where c.id = forum_subcategories.category_id and c.visibility <> 'public'
    )
  );

drop policy if exists forum_threads_category_visibility on public.forum_threads;
create policy forum_threads_category_visibility on public.forum_threads
  as restrictive for select
  using (public.forum_category_visible(category_slug));

drop policy if exists forum_replies_category_visibility on public.forum_replies;
create policy forum_replies_category_visibility on public.forum_replies
  as restrictive for select
  using (
    public.is_ambassador_or_admin(auth.uid())
    or not exists (
      select 1
      from public.forum_threads t
      join public.forum_categories c on c.slug = t.category_slug
      where t.id = forum_replies.thread_id and c.visibility <> 'public'
    )
  );

-- Likes on restricted threads/replies: counts are harmless, but keep the
-- rows consistent with the content they belong to.
drop policy if exists forum_thread_likes_category_visibility on public.forum_thread_likes;
create policy forum_thread_likes_category_visibility on public.forum_thread_likes
  as restrictive for select
  using (
    public.is_ambassador_or_admin(auth.uid())
    or exists (select 1 from public.forum_threads t where t.id = forum_thread_likes.thread_id)
  );

-- Teaser RPC: never surface a restricted thread's title to non-ambassadors.
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
    and public.forum_category_visible(t.category_slug)
  limit 1;
$$;
grant execute on function public.forum_thread_teaser(uuid, text) to anon, authenticated;

notify pgrst, 'reload schema';
