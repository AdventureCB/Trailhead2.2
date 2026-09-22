-- 2026-07-28: Fix gravel-guide bounty authoring hitting RLS on save.
--
-- Two problems, both surfacing as "new row violates row-level security
-- policy" once the client-side isAdmin gate was relaxed to let guides author:
--
--   1. A guide creates a DRAFT bounty. The insert WITH CHECK passes, but the
--      client does `.insert(...).select("*").single()` — Postgres enforces the
--      SELECT policy on the RETURNING row, and bounties_public_select only let
--      ADMINS see drafts. So the guide's own just-inserted draft was invisible
--      to them → the representation fetch failed. Same reason a guide couldn't
--      reload their own draft in the editor.
--
--   2. Re-assert the gravel_guide INSERT/UPDATE/DELETE policies idempotently in
--      case the bounties-RLS portion of 20260701 didn't fully land on remote.
--
-- Safe to re-run: every policy is dropped-if-exists first.

-- ── SELECT: authors always see their own rows (any status / visibility) ──
drop policy if exists bounties_public_select on public.bounties;
create policy bounties_public_select on public.bounties
  for select using (
    public.is_admin(auth.uid())
    or created_by = auth.uid()
    or (
      status <> 'draft'
      and (
        visibility = 'public'
        or public.is_ambassador_or_admin(auth.uid())
      )
    )
  );

-- ── INSERT: gravel guides may author (own rows only) ──
drop policy if exists bounties_gravel_guide_insert on public.bounties;
create policy bounties_gravel_guide_insert on public.bounties
  for insert to authenticated
  with check (
    public.is_gravel_guide(auth.uid())
    and (created_by is null or created_by = auth.uid())
  );

-- ── UPDATE: gravel guides may edit their OWN bounties ──
drop policy if exists bounties_gravel_guide_update on public.bounties;
create policy bounties_gravel_guide_update on public.bounties
  for update to authenticated
  using (
    public.is_gravel_guide(auth.uid())
    and created_by = auth.uid()
  )
  with check (
    public.is_gravel_guide(auth.uid())
    and created_by = auth.uid()
  );

-- ── DELETE: gravel guides may delete their OWN bounties ──
drop policy if exists bounties_gravel_guide_delete on public.bounties;
create policy bounties_gravel_guide_delete on public.bounties
  for delete to authenticated
  using (
    public.is_gravel_guide(auth.uid())
    and created_by = auth.uid()
  );

notify pgrst, 'reload schema';
