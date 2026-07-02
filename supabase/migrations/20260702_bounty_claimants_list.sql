-- ─────────────────────────────────────────────────────────────────────────────
-- Bounty claimants list — admin + gravel guide RPC
-- ─────────────────────────────────────────────────────────────────────────────
-- Returns every submission on a specific bounty with the participant's
-- profile snapshot + status timeline. Powers the "CLAIMANTS" expansion
-- on BountiesAdminScreen so admin/guide can see everyone working on the
-- bounty at a glance.
--
-- Authorization: admins can inspect ANY bounty; gravel guides can only
-- inspect bounties they created. Server checks the caller's role and the
-- bounty's created_by before returning rows.
--
-- Also widens bounty_submissions RLS so gravel guides can SELECT rows on
-- their OWN bounties directly (belt-and-suspenders — the RPC uses SECURITY
-- DEFINER so it bypasses RLS anyway, but the direct-select path is used
-- elsewhere when we build sub-filters).
-- ─────────────────────────────────────────────────────────────────────────────

-- Widen SELECT: gravel guide can read submissions on bounties they own.
drop policy if exists bounty_submissions_gravel_guide_select on public.bounty_submissions;
create policy bounty_submissions_gravel_guide_select on public.bounty_submissions
  for select to authenticated
  using (
    public.is_gravel_guide(auth.uid())
    and exists (
      select 1 from public.bounties b
      where b.id = bounty_submissions.bounty_id
        and b.created_by = auth.uid()
    )
  );

create or replace function public.admin_bounty_claimants(
  p_bounty_id uuid
) returns table(
  submission_id uuid,
  bounty_id uuid,
  participant_id uuid,
  participant_handle text,
  participant_name text,
  participant_avatar text,
  status text,
  claimed_at timestamptz,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reward_cents int,
  reward_points int,
  reviewer_notes text
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean := public.is_admin(v_uid);
  v_is_guide boolean := public.is_gravel_guide(v_uid);
  v_bounty_owner uuid;
begin
  if not (v_is_admin or v_is_guide) then
    raise exception 'admin_bounty_claimants: not authorized';
  end if;
  if p_bounty_id is null then
    raise exception 'admin_bounty_claimants: bounty id required';
  end if;

  -- Guides may only inspect their own bounties.
  if not v_is_admin then
    select b.created_by into v_bounty_owner from public.bounties b where b.id = p_bounty_id;
    if v_bounty_owner is null or v_bounty_owner <> v_uid then
      raise exception 'admin_bounty_claimants: not authorized for this bounty';
    end if;
  end if;

  return query
    select
      bs.id as submission_id,
      bs.bounty_id,
      p.id as participant_id,
      p.handle as participant_handle,
      p.full_name as participant_name,
      p.avatar_url as participant_avatar,
      bs.status,
      bs.created_at as claimed_at,
      bs.submitted_at,
      bs.reviewed_at,
      bs.reward_cents,
      bs.reward_points,
      bs.reviewer_notes
    from public.bounty_submissions bs
    left join public.profiles p on p.id = bs.user_id
    where bs.bounty_id = p_bounty_id
    order by
      -- Active first (claimed / in_progress / submitted / changes_requested),
      -- then chronologically by most-recent activity.
      case bs.status
        when 'submitted' then 0
        when 'changes_requested' then 1
        when 'in_progress' then 2
        when 'claimed' then 3
        when 'approved' then 4
        when 'rejected' then 5
        when 'withdrawn' then 6
        else 7
      end,
      coalesce(bs.updated_at, bs.created_at) desc;
end;
$$;

revoke all on function public.admin_bounty_claimants(uuid) from public;
grant execute on function public.admin_bounty_claimants(uuid) to authenticated;

notify pgrst, 'reload schema';
