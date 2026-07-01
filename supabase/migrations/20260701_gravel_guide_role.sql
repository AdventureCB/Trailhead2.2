-- ─────────────────────────────────────────────────────────────────────────────
-- Gravel Guide role — bounty authoring + demo progress oversight
-- ─────────────────────────────────────────────────────────────────────────────
-- New user type sitting between normal user and admin. Gravel Guides can:
--   • Create + edit + delete their OWN bounties (bounties.created_by = them)
--   • See per-step progress on Demo Request bounty submissions (via
--     admin_demo_bounty_progress RPC — same view as admins)
--   • Wear a public "Gravel Guide" pill on their profile (client-side)
--
-- Everything else they do is identical to a normal user. Orthogonal to the
-- existing role enum (user/ambassador/admin) so someone can be both an
-- ambassador AND a gravel guide, or admin AND gravel guide, without any
-- role-column collisions. Follows the same boolean-flag pattern as
-- `is_moderator`, `is_beta_tester`, `is_content_partner`.
--
-- What this ships:
--   1. profiles.is_gravel_guide boolean default false
--   2. RLS widening on bounties: gravel_guide INSERT + own-only UPDATE/DELETE
--   3. admin_grant_gravel_guide(target_uid, grant) — admin-only flip RPC
--   4. admin_demo_bounty_progress() — SECURITY DEFINER view of every open
--      + recent Demo Request submission w/ step timestamps + snapshots.
--      Admins see all; gravel guides see only demos on bounties THEY created.
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists is_gravel_guide boolean not null default false;

-- Helper: matches the is_admin / is_ambassador_or_admin naming convention.
create or replace function public.is_gravel_guide(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select p.is_gravel_guide from public.profiles p where p.id = uid), false)
$$;

revoke all on function public.is_gravel_guide(uuid) from public;
grant execute on function public.is_gravel_guide(uuid) to authenticated, anon;

-- ── Widen bounties RLS to gravel_guides ──
-- Add SEPARATE policies so Postgres ORs them with the existing admin
-- policies. Admins keep unrestricted access; gravel_guides get INSERT (any
-- new bounty they author) + UPDATE / DELETE limited to bounties they own
-- (created_by = auth.uid()).

drop policy if exists bounties_gravel_guide_insert on public.bounties;
create policy bounties_gravel_guide_insert on public.bounties
  for insert to authenticated
  with check (
    public.is_gravel_guide(auth.uid())
    and (created_by is null or created_by = auth.uid())
  );

drop policy if exists bounties_gravel_guide_update on public.bounties;
create policy bounties_gravel_guide_update on public.bounties
  for update to authenticated
  using (
    public.is_gravel_guide(auth.uid())
    and created_by = auth.uid()
  );

drop policy if exists bounties_gravel_guide_delete on public.bounties;
create policy bounties_gravel_guide_delete on public.bounties
  for delete to authenticated
  using (
    public.is_gravel_guide(auth.uid())
    and created_by = auth.uid()
  );

-- ── Grant/revoke RPC (admin-only) ──
-- Mirrors the pattern used by makeModerator / makeBetaTester on the client
-- (both do a direct UPDATE guarded by profiles_moderator_guard-style logic).
-- Explicit RPC here so the client doesn't have to reason about RLS on
-- profiles for a role change.
create or replace function public.admin_grant_gravel_guide(
  p_target_uid uuid,
  p_grant boolean
) returns table(user_id uuid, is_gravel_guide boolean)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
begin
  if not public.is_admin(v_uid) then
    raise exception 'admin_grant_gravel_guide: not authorized';
  end if;
  if p_target_uid is null then
    raise exception 'admin_grant_gravel_guide: target uid required';
  end if;

  update public.profiles
     set is_gravel_guide = coalesce(p_grant, false)
   where id = p_target_uid
   returning profiles.id, profiles.is_gravel_guide into user_id, is_gravel_guide;

  if user_id is null then
    raise exception 'admin_grant_gravel_guide: profile not found';
  end if;

  return next;
end;
$$;

revoke all on function public.admin_grant_gravel_guide(uuid, boolean) from public;
grant execute on function public.admin_grant_gravel_guide(uuid, boolean) to authenticated;

-- ── Demo bounty progress view ──
-- Returns every Demo Request bounty submission with its step-by-step
-- progress (claim → schedule → proof → submit → review). Admins see
-- everything; gravel guides see only submissions on bounties they own.
--
-- Progress fields are derived:
--   • claimed_at    — bounty_submissions.created_at
--   • scheduled_at  — draft.scheduled_at (set by finalize_demo_schedule)
--   • proof_at      — inferred: draft.proof_photo present → the earliest
--                     of updated_at / submitted_at that covers the proof
--                     save. For simplicity we surface just proof_uploaded
--                     as a boolean + proof_photo_url so the UI can render
--                     the actual step time from updated_at.
--   • submitted_at  — bounty_submissions.submitted_at
--   • reviewed_at   — bounty_submissions.reviewed_at
--
-- Includes participant + customer snapshots so the UI doesn't need
-- follow-up joins.
create or replace function public.admin_demo_bounty_progress(
  p_limit int default 100
) returns table(
  submission_id uuid,
  bounty_id uuid,
  bounty_title text,
  bounty_created_by uuid,
  status text,
  claimed_at timestamptz,
  scheduled_at timestamptz,
  scheduled_location text,
  proof_photo_url text,
  proof_caption text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewer_notes text,
  participant_id uuid,
  participant_handle text,
  participant_name text,
  participant_avatar text,
  customer_id uuid,
  customer_handle text,
  customer_name text,
  customer_avatar text,
  demo_location_label text,
  demo_lat double precision,
  demo_lng double precision
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
begin
  if not (v_is_admin or v_is_guide) then
    raise exception 'admin_demo_bounty_progress: not authorized';
  end if;

  return query
    select
      bs.id as submission_id,
      b.id as bounty_id,
      b.title as bounty_title,
      b.created_by as bounty_created_by,
      bs.status,
      bs.created_at as claimed_at,
      nullif(bs.draft ->> 'scheduled_at', '')::timestamptz as scheduled_at,
      nullif(bs.draft ->> 'scheduled_location', '') as scheduled_location,
      case
        when jsonb_typeof(bs.draft -> 'proof_photo') = 'object' then bs.draft -> 'proof_photo' ->> 'url'
        when jsonb_typeof(bs.draft -> 'proof_photo') = 'string' then bs.draft ->> 'proof_photo'
        else null
      end as proof_photo_url,
      nullif(bs.draft ->> 'proof_caption', '') as proof_caption,
      bs.submitted_at,
      bs.reviewed_at,
      bs.reviewer_notes,
      pp.id as participant_id,
      pp.handle as participant_handle,
      pp.full_name as participant_name,
      pp.avatar_url as participant_avatar,
      cp.id as customer_id,
      cp.handle as customer_handle,
      cp.full_name as customer_name,
      cp.avatar_url as customer_avatar,
      b.demo_location_label,
      b.demo_lat,
      b.demo_lng
    from public.bounty_submissions bs
    join public.bounties b on b.id = bs.bounty_id
    left join public.profiles pp on pp.id = bs.user_id
    left join public.profiles cp on cp.id = b.demo_customer_user_id
    where b.category = 'Demo Request'
      and (v_is_admin or b.created_by = v_uid)
    order by
      -- Active first (not withdrawn/rejected), then most recent activity
      case when bs.status in ('withdrawn', 'rejected') then 1 else 0 end,
      coalesce(bs.updated_at, bs.created_at) desc
    limit p_limit;
end;
$$;

revoke all on function public.admin_demo_bounty_progress(int) from public;
grant execute on function public.admin_demo_bounty_progress(int) to authenticated;

notify pgrst, 'reload schema';
