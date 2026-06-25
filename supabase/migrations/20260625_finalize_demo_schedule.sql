-- ─────────────────────────────────────────────────────────────────────────────
-- finalize_demo_schedule — atomic lock-in of a Demo Request's meeting
-- ─────────────────────────────────────────────────────────────────────────────
-- Called from the DM card when the bounty user accepts the customer's
-- response (select or counter) — writes scheduled_at + scheduled_location
-- + scheduled_meeting_{lat,lng} into the submission's draft jsonb.
--
-- Owner-only: caller must own the submission. The submission's status is
-- bumped to 'in_progress' if still 'claimed' (consistent with the rest of
-- the bounty draft flow).
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.finalize_demo_schedule(
  p_submission_id uuid,
  p_scheduled_at timestamptz,
  p_scheduled_location text,
  p_meeting_lat double precision default null,
  p_meeting_lng double precision default null
) returns table(
  submission_id uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_sub record;
  v_next_draft jsonb;
  v_new_status text;
begin
  if v_uid is null then raise exception 'finalize_demo_schedule: not authenticated'; end if;
  if p_submission_id is null then raise exception 'finalize_demo_schedule: submission id required'; end if;
  if p_scheduled_at is null then raise exception 'finalize_demo_schedule: scheduled_at required'; end if;
  if p_scheduled_location is null or btrim(p_scheduled_location) = '' then
    raise exception 'finalize_demo_schedule: scheduled_location required';
  end if;

  select id, user_id, status, draft from public.bounty_submissions where id = p_submission_id into v_sub;
  if not found then raise exception 'finalize_demo_schedule: submission not found'; end if;
  if v_sub.user_id <> v_uid then raise exception 'finalize_demo_schedule: not authorized'; end if;
  if v_sub.status not in ('claimed', 'in_progress', 'changes_requested') then
    raise exception 'finalize_demo_schedule: cannot finalize submission in status %', v_sub.status;
  end if;

  -- Merge new scheduling keys into the existing draft jsonb.
  v_next_draft := coalesce(v_sub.draft, '{}'::jsonb)
    || jsonb_build_object(
      'scheduled_at', to_jsonb(p_scheduled_at),
      'scheduled_location', to_jsonb(p_scheduled_location),
      'meeting_lat', case when p_meeting_lat is null then 'null'::jsonb else to_jsonb(p_meeting_lat) end,
      'meeting_lng', case when p_meeting_lng is null then 'null'::jsonb else to_jsonb(p_meeting_lng) end,
      'finalized_at', to_jsonb(now())
    );

  v_new_status := case when v_sub.status = 'claimed' then 'in_progress' else v_sub.status end;

  update public.bounty_submissions
     set draft = v_next_draft,
         status = v_new_status
   where id = p_submission_id;

  return query select p_submission_id, v_new_status;
end;
$$;

revoke all on function public.finalize_demo_schedule(uuid, timestamptz, text, double precision, double precision) from public;
grant execute on function public.finalize_demo_schedule(uuid, timestamptz, text, double precision, double precision) to authenticated;
