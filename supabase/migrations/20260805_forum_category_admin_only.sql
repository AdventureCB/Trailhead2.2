-- 2026-08-05: Admin-only forum categories.
--
-- Adds forum_categories.admin_only_threads. When true, only admins may
-- create threads in any subcategory under that category. Enforced with a
-- RESTRICTIVE insert policy on forum_threads (ANDs with the existing
-- permissive owner-insert policy): a thread insert is allowed only if the
-- author is an admin OR the target category is not admin-only.
--
-- The client also hides the NEW THREAD button for non-admins in these
-- categories, but RLS is the real gate.

alter table public.forum_categories
  add column if not exists admin_only_threads boolean not null default false;

drop policy if exists forum_threads_admin_only_category_guard on public.forum_threads;
create policy forum_threads_admin_only_category_guard on public.forum_threads
  as restrictive
  for insert to authenticated
  with check (
    public.is_admin(auth.uid())
    or not exists (
      select 1 from public.forum_categories c
      where c.slug = forum_threads.category_slug
        and c.admin_only_threads = true
    )
  );

notify pgrst, 'reload schema';
