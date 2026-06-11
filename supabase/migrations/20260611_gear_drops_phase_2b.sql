-- ============================================================================
-- GEAR DROPS — Phase 2b: drop convoy auto-spawn, add about + comments
-- ============================================================================
-- 1. Stop creating a CONVOYS post on SCHEDULE — gear drops should only
--    surface via the GEAR DROPS pill, not duplicate as a "normal convoy".
-- 2. Cleanup any leaked posts from the earlier auto-spawn pass.
-- 3. Add gear_drops.about — host-editable long-form event description.
-- 4. New gear_drop_comments table — bottom-of-detail discussion thread.
-- ============================================================================

-- 1) about column ------------------------------------------------------------
alter table public.gear_drops add column if not exists about text;

-- 2) comments table ---------------------------------------------------------
create table if not exists public.gear_drop_comments (
  id uuid primary key default gen_random_uuid(),
  gear_drop_id uuid not null references public.gear_drops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists gear_drop_comments_drop_created_idx
  on public.gear_drop_comments(gear_drop_id, created_at asc);

alter table public.gear_drop_comments enable row level security;

drop policy if exists gear_drop_comments_select on public.gear_drop_comments;
create policy gear_drop_comments_select on public.gear_drop_comments
  for select using (
    exists (
      select 1 from public.gear_drops g
      where g.id = gear_drop_comments.gear_drop_id
        and (g.status <> 'draft' or public.can_edit_gear_drop(g.id))
    )
  );

drop policy if exists gear_drop_comments_insert on public.gear_drop_comments;
create policy gear_drop_comments_insert on public.gear_drop_comments
  for insert with check (auth.uid() = user_id);

drop policy if exists gear_drop_comments_delete on public.gear_drop_comments;
create policy gear_drop_comments_delete on public.gear_drop_comments
  for delete using (auth.uid() = user_id or public.is_admin(auth.uid()));

alter table public.gear_drop_comments replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.gear_drop_comments;
exception when duplicate_object then null;
end $$;

-- 3) Revised schedule_gear_drop — status flip only, no convoy spawn ---------
create or replace function public.schedule_gear_drop(p_drop_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_drop record;
  v_actor uuid := auth.uid();
  v_now timestamptz := now();
begin
  if v_actor is null then raise exception 'not authenticated'; end if;
  if not public.can_edit_gear_drop(p_drop_id) then raise exception 'not authorized'; end if;

  select * into v_drop from public.gear_drops where id = p_drop_id;
  if not found then raise exception 'drop not found'; end if;

  update public.gear_drops
  set status = 'scheduled', updated_at = v_now
  where id = p_drop_id;

  -- Return value is kept for back-compat with the existing client — null is
  -- fine, callers only check { ok, error } and refresh afterwards.
  return v_drop.convoy_post_id;
end;
$$;

grant execute on function public.schedule_gear_drop(uuid) to authenticated;

-- 4) Cleanup leaked convoy posts from the earlier auto-spawn pass.
-- Idempotent: deletes posts that were created with isGearDrop=true OR a
-- non-null gearDropId in their data jsonb. Clears the convoy_post_id
-- references on any existing drops so the column reflects reality.
delete from public.posts
where (data->>'isGearDrop')::boolean = true
   or (data->>'gearDropId') is not null;

update public.gear_drops set convoy_post_id = null where convoy_post_id is not null;
