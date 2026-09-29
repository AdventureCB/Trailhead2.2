-- ============================================================================
-- USER BLOCKS — App Review Guideline 1.2 (user-generated content)
-- ============================================================================
-- Apps with UGC must let a user BLOCK another user. This adds the block
-- graph + one server-side teeth: a blocked user cannot send a DM into any
-- conversation that includes the person who blocked them. Everything else
-- (hiding their posts, comments, forum threads, map pins, search hits,
-- notifications) is enforced client-side from the viewer's block list —
-- content stays public for everyone else, as it should.
--
-- Idempotent.
-- ============================================================================

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists user_blocks_blocked_idx on public.user_blocks (blocked_id);

alter table public.user_blocks enable row level security;

-- Only the blocker can see or change their own block list. The blocked
-- person is never told.
drop policy if exists user_blocks_select on public.user_blocks;
create policy user_blocks_select on public.user_blocks
  for select using (auth.uid() = blocker_id);
drop policy if exists user_blocks_insert on public.user_blocks;
create policy user_blocks_insert on public.user_blocks
  for insert to authenticated with check (auth.uid() = blocker_id);
drop policy if exists user_blocks_delete on public.user_blocks;
create policy user_blocks_delete on public.user_blocks
  for delete using (auth.uid() = blocker_id);

-- Cross-device sync of the viewer's own list.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_blocks'
  ) then
    alter publication supabase_realtime add table public.user_blocks;
  end if;
end $$;
alter table public.user_blocks replica identity full;

-- ── Server-side teeth: a blocked user can't message the blocker ─────────
-- SECURITY DEFINER so it can read blocks the sender isn't allowed to see.
create or replace function public.is_blocked_in_conversation(p_conv_id uuid, p_sender uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.dm_participants p
    join public.user_blocks b on b.blocker_id = p.user_id and b.blocked_id = p_sender
    where p.conversation_id = p_conv_id
      and p.user_id <> p_sender
  );
$$;
grant execute on function public.is_blocked_in_conversation(uuid, uuid) to authenticated;

create or replace function public.dm_messages_block_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.is_blocked_in_conversation(new.conversation_id, new.sender_id) then
    raise exception 'You can''t message this user.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists dm_messages_block_guard on public.dm_messages;
create trigger dm_messages_block_guard
  before insert on public.dm_messages
  for each row execute function public.dm_messages_block_guard();

notify pgrst, 'reload schema';
