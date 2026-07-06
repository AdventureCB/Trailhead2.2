-- 2026-07-06: Widen forum_subcategories INSERT to any authenticated user,
-- but keep DELETE restricted to admin OR ambassador owner. Normal users
-- can create a sub (they become owner via created_by = auth.uid()), and
-- they can rename their own via existing owner UPDATE policy, but they
-- CANNOT delete their own — deletion stays gated to admins + ambassadors.
--
-- SELECT policy is unchanged (public read via anon).
-- Admin override policies for UPDATE + DELETE remain in place, ORed by
-- Postgres with the same-op owner policies below.

-- Widen INSERT: drop any prior insert policies (names have drifted across
-- environments), then install a single "any authenticated user" policy
-- that still enforces auth.uid() = created_by so a user can't forge
-- ownership.
drop policy if exists forum_subcategories_ambassador_or_admin_insert on public.forum_subcategories;
drop policy if exists forum_subcategories_insert                       on public.forum_subcategories;
drop policy if exists forum_subcategories_auth_insert                  on public.forum_subcategories;
drop policy if exists forum_subcategories_owner_insert                 on public.forum_subcategories;

create policy forum_subcategories_auth_insert
  on public.forum_subcategories
  for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Restrict owner DELETE: only admins + ambassadors can self-delete their
-- own subcategories. Normal users are blocked. Admin override (separate
-- policy) still ORs on top so admins can delete any sub regardless of
-- who created it.
drop policy if exists forum_subcategories_owner_delete on public.forum_subcategories;
drop policy if exists forum_subcategories_delete       on public.forum_subcategories;

create policy forum_subcategories_owner_delete
  on public.forum_subcategories
  for delete
  to authenticated
  using (
    auth.uid() = created_by
    and public.is_ambassador_or_admin(auth.uid())
  );
