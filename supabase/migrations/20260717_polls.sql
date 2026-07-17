-- Polls + poll_responses — admin-created feed polls with per-user voting.
--
-- A poll is a POST-type feed post with `type='POLL'`. The parent posts row
-- carries `data.pollId` referencing the polls row where the questions live.
-- Split into two tables so admins can flip poll status / reveal results
-- without touching the immutable-ish posts row.
--
-- Question shape (in polls.questions jsonb — array):
--   [{
--     id: "q1",
--     text: "Vote for build of the week",
--     type: "multiple_choice" | "short_answer" | "dropdown_builds"
--         | "dropdown_trips" | "dropdown_spots",
--     options: ["Option A", "Option B"],   // multiple_choice only
--     allow_other: false,                   // multiple_choice — adds "Other" input
--     allow_multiple: false,                // multiple_choice — multi-select
--     required: true
--   }]
--
-- Response shape (in poll_responses.responses jsonb — object keyed by question id):
--   {
--     "q1": { choices: ["Option A"], other_text: "..." },
--     "q2": { text: "..." },
--     "q3": { selected_ids: ["<uuid>"] }
--   }

-- 1. Widen posts.type CHECK to include 'POLL' (and 'FORUM', which existing
-- rows carry — legacy forum-to-feed cross-posts that were auto-created from
-- threads before the DB-backed forum tables landed).
alter table public.posts drop constraint if exists posts_type_check;
alter table public.posts add constraint posts_type_check
  check (type in ('POST','PHOTOS','ROUTES','BUILDS','CONVOYS','RECOVERY','FORUM','POLL'));

-- 2. polls table.
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  post_id uuid unique references public.posts(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  questions jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active','closed','archived')),
  reveal_results boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists polls_post_id_idx on public.polls(post_id);
create index if not exists polls_created_by_idx on public.polls(created_by);
create index if not exists polls_status_created_idx on public.polls(status, created_at desc);

alter table public.polls enable row level security;

drop policy if exists polls_public_select on public.polls;
create policy polls_public_select on public.polls
  for select using (true);

drop policy if exists polls_admin_insert on public.polls;
create policy polls_admin_insert on public.polls
  for insert with check (public.is_admin(auth.uid()) and auth.uid() = created_by);

drop policy if exists polls_admin_update on public.polls;
create policy polls_admin_update on public.polls
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists polls_admin_delete on public.polls;
create policy polls_admin_delete on public.polls
  for delete using (public.is_admin(auth.uid()));

-- 3. poll_responses table (one row per user per poll, editable while open).
create table if not exists public.poll_responses (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  responses jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(poll_id, user_id)
);
create index if not exists poll_responses_poll_id_idx on public.poll_responses(poll_id);
create index if not exists poll_responses_user_id_idx on public.poll_responses(user_id);

alter table public.poll_responses enable row level security;

-- Owner can see + insert + update their own row until the poll closes;
-- admin can see all + delete.
drop policy if exists poll_responses_owner_select on public.poll_responses;
create policy poll_responses_owner_select on public.poll_responses
  for select using (auth.uid() = user_id);

drop policy if exists poll_responses_admin_select on public.poll_responses;
create policy poll_responses_admin_select on public.poll_responses
  for select using (public.is_admin(auth.uid()));

-- Also public SELECT once poll is closed AND admin has toggled reveal_results.
-- This is what lets non-admin users see aggregated tallies after a poll closes.
drop policy if exists poll_responses_revealed_select on public.poll_responses;
create policy poll_responses_revealed_select on public.poll_responses
  for select using (
    exists (
      select 1 from public.polls p
      where p.id = poll_responses.poll_id
        and p.status = 'closed'
        and p.reveal_results = true
    )
  );

drop policy if exists poll_responses_owner_insert on public.poll_responses;
create policy poll_responses_owner_insert on public.poll_responses
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.polls p where p.id = poll_id and p.status = 'active')
  );

drop policy if exists poll_responses_owner_update on public.poll_responses;
create policy poll_responses_owner_update on public.poll_responses
  for update using (
    auth.uid() = user_id
    and exists (select 1 from public.polls p where p.id = poll_id and p.status = 'active')
  ) with check (auth.uid() = user_id);

drop policy if exists poll_responses_admin_delete on public.poll_responses;
create policy poll_responses_admin_delete on public.poll_responses
  for delete using (public.is_admin(auth.uid()));

-- 4. Realtime + replica identity full so DELETE payloads carry user_id.
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'polls'
  ) then
    alter publication supabase_realtime add table public.polls;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'poll_responses'
  ) then
    alter publication supabase_realtime add table public.poll_responses;
  end if;
end $$;
alter table public.polls replica identity full;
alter table public.poll_responses replica identity full;

-- 5. Admin-only RPC to list polls with response counts (dashboard use).
create or replace function public.admin_get_polls_with_counts(p_limit int default 50)
returns table(
  id uuid,
  post_id uuid,
  title text,
  description text,
  status text,
  reveal_results boolean,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  question_count int,
  response_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
begin
  if not public.is_admin(v_uid) then
    raise exception 'admin_get_polls_with_counts: not authorized';
  end if;
  return query
  select
    p.id,
    p.post_id,
    p.title,
    p.description,
    p.status,
    p.reveal_results,
    p.created_by,
    p.created_at,
    p.updated_at,
    coalesce(jsonb_array_length(p.questions), 0)::int as question_count,
    (select count(*) from public.poll_responses r where r.poll_id = p.id)::bigint as response_count
  from public.polls p
  order by p.created_at desc
  limit greatest(coalesce(p_limit, 50), 1);
end;
$$;
revoke all on function public.admin_get_polls_with_counts(int) from public;
grant execute on function public.admin_get_polls_with_counts(int) to authenticated;

notify pgrst, 'reload schema';
