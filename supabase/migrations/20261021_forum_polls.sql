-- ============================================================================
-- FORUM — admin polls embedded in thread sections
-- ============================================================================
-- A poll is a `{type:'poll'}` entry in `forum_threads.sections` jsonb:
--   { type:'poll', pollId, question, options:[{id,label}], multi, closesAt }
-- Only the VOTES live here. One row per (thread, poll, user, option) so a
-- multi-choice poll is several rows and a single-choice poll is exactly one
-- (the client deletes the user's prior rows before inserting the new pick).
--
-- The INSERT policy validates against the thread's section definition: the
-- poll must exist on that thread, the option id must be one of its options,
-- and the poll must still be open — so a poked API can't stuff a closed poll
-- or invent options. Counts are public; the thread's own read policies (incl.
-- the members-only window) still gate whether a guest can see the thread the
-- poll sits in.
-- Idempotent.
-- ============================================================================

create table if not exists public.forum_poll_votes (
  thread_id  uuid not null references public.forum_threads(id) on delete cascade,
  poll_id    text not null,
  user_id    uuid not null references auth.users(id) on delete cascade,
  option_id  text not null,
  created_at timestamptz not null default now(),
  primary key (thread_id, poll_id, user_id, option_id)
);
create index if not exists forum_poll_votes_poll_idx on public.forum_poll_votes (thread_id, poll_id);

alter table public.forum_poll_votes enable row level security;

drop policy if exists forum_poll_votes_select on public.forum_poll_votes;
create policy forum_poll_votes_select on public.forum_poll_votes
  for select using (true);

drop policy if exists forum_poll_votes_insert on public.forum_poll_votes;
create policy forum_poll_votes_insert on public.forum_poll_votes
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.forum_threads t
      cross join lateral jsonb_array_elements(coalesce(t.sections, '[]'::jsonb)) s
      where t.id = forum_poll_votes.thread_id
        and t.hidden_at is null
        and s->>'type' = 'poll'
        and s->>'pollId' = forum_poll_votes.poll_id
        and (s->>'closesAt' is null or (s->>'closesAt')::timestamptz > now())
        and s->'options' @> jsonb_build_array(jsonb_build_object('id', forum_poll_votes.option_id))
    )
  );

drop policy if exists forum_poll_votes_delete on public.forum_poll_votes;
create policy forum_poll_votes_delete on public.forum_poll_votes
  for delete to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.forum_threads t
      cross join lateral jsonb_array_elements(coalesce(t.sections, '[]'::jsonb)) s
      where t.id = forum_poll_votes.thread_id
        and s->>'type' = 'poll'
        and s->>'pollId' = forum_poll_votes.poll_id
        and (s->>'closesAt' is null or (s->>'closesAt')::timestamptz > now())
    )
  );

-- Live tallies.
alter table public.forum_poll_votes replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'forum_poll_votes'
  ) then
    alter publication supabase_realtime add table public.forum_poll_votes;
  end if;
end $$;

notify pgrst, 'reload schema';
