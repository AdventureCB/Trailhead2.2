-- The original admin_get_polls_with_counts (20260717_polls.sql) omitted
-- `questions` from the return signature. Without it, PollsAdminScreen sees
-- questions=[] and skips the entire response tally render. Re-create the
-- function with questions included so the admin dashboard can walk the
-- question list + aggregate responses per question.

-- Drop the old signature first (return-column changes can't be done with
-- CREATE OR REPLACE).
drop function if exists public.admin_get_polls_with_counts(int);

create or replace function public.admin_get_polls_with_counts(p_limit int default 50)
returns table(
  id uuid,
  post_id uuid,
  title text,
  description text,
  status text,
  reveal_results boolean,
  questions jsonb,
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
    p.questions,
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
