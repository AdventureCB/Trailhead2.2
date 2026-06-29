-- ─────────────────────────────────────────────────────────────────────────────
-- Ranks Phase 7 — Shopify gift card payouts (schema)
-- ─────────────────────────────────────────────────────────────────────────────
-- Spec: project_ranks_bounties_spec.md
--
-- This migration installs the SCHEMA only. Two more pieces ship separately:
--   • Edge function: shopify-bounty-payout (Shopify API + balance flip)
--   • Edge function: shopify-refresh-gift-card (cache refresh)
--
-- Schema deltas:
--   1. profiles.lpo_gift_card_*  — cached display fields (last4 + balance).
--      Source of truth is Shopify; we cache so the user's earnings card
--      doesn't have to hit Shopify on every render. Code itself NEVER
--      stored — only the last 4 for "ending in 1234" UI.
--   2. profiles.shopify_customer_id — optional link to the Shopify
--      customer record so the gift card surfaces at checkout without
--      requiring code entry.
--   3. bounty_payouts table — one row per disbursement (gift card create,
--      top-up, or manual cash/check). submission_ids is a uuid[] of every
--      approved bounty_submission rolled into this single payout, so the
--      HISTORY modal can render the link.
--
-- RLS:
--   • profiles: existing policies cover the new cols (user can SELECT own,
--     admin SELECT all). Gift-card cols only WRITTEN by service role.
--   • bounty_payouts: owner SELECT own + admin SELECT all. WRITES only via
--     service-role inside shopify-bounty-payout edge function.
--
-- Notifications:
--   • bounty_payout_received enum value already present from Phase 5/6.
--   • Bodies must NEVER include the gift card code — only "$X added to
--     your gift card · tap to view balance". Phone lock screen safety.
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. profiles columns — gift card cache + shopify customer link ──
alter table public.profiles
  add column if not exists lpo_gift_card_id text;
alter table public.profiles
  add column if not exists lpo_gift_card_last4 text;
alter table public.profiles
  add column if not exists lpo_gift_card_balance_cents bigint not null default 0;
alter table public.profiles
  add column if not exists lpo_gift_card_synced_at timestamptz;
alter table public.profiles
  add column if not exists shopify_customer_id text;

-- Unique partial index so two profiles can never point at the same gift
-- card row (data integrity — Shopify gift cards are 1:1 with people).
-- Partial (where not null) so most profiles can stay NULL without
-- conflicting against each other.
create unique index if not exists profiles_lpo_gift_card_id_unique
  on public.profiles (lpo_gift_card_id)
  where lpo_gift_card_id is not null;

-- ── 2. bounty_payouts table ──
create table if not exists public.bounty_payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_cents bigint not null check (amount_cents > 0),
  method text not null check (method in ('shopify_gift_card_new', 'shopify_gift_card_topup', 'manual')),
  -- Shopify-side references (NULL for manual payouts).
  shopify_gift_card_id text,        -- the GC row in Shopify (always set for shopify_*)
  shopify_adjustment_id text,       -- the adjustment row (only set for topup)
  -- Free-text reference for manual payouts (check #, Venmo handle, etc.)
  reference text,
  -- The set of submissions this payout cleared. Stored as uuid[] (not a
  -- join table) since payouts are immutable once recorded — array works
  -- fine for this read pattern and saves a table.
  submission_ids uuid[] not null default '{}'::uuid[],
  -- Who issued it (admin user id) + when. paid_by NULL would only happen
  -- if the admin's account got deleted, which is fine.
  paid_by uuid references auth.users(id) on delete set null,
  paid_at timestamptz not null default now(),
  notes text
);

create index if not exists bounty_payouts_user_id_paid_at_idx
  on public.bounty_payouts (user_id, paid_at desc);

create index if not exists bounty_payouts_paid_at_idx
  on public.bounty_payouts (paid_at desc);

alter table public.bounty_payouts enable row level security;

-- Owner SELECT — your payouts only.
drop policy if exists bounty_payouts_owner_select on public.bounty_payouts;
create policy bounty_payouts_owner_select on public.bounty_payouts
  for select using (auth.uid() = user_id);

-- Admin SELECT — queue + audit.
drop policy if exists bounty_payouts_admin_select on public.bounty_payouts;
create policy bounty_payouts_admin_select on public.bounty_payouts
  for select using (public.is_admin(auth.uid()));

-- No INSERT/UPDATE/DELETE policies — writes go through service role
-- inside the shopify-bounty-payout edge function ONLY. Service role
-- bypasses RLS by definition.

-- Realtime so the user's earnings card flips the moment admin issues
-- a payout — same realtime pattern as bounty_earnings.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bounty_payouts'
  ) then
    alter publication supabase_realtime add table public.bounty_payouts;
  end if;
end$$;

alter table public.bounty_payouts replica identity full;

-- ── 3. Add FK from bounty_submissions.payout_id → bounty_payouts ──
-- The column was provisioned in Phase 4 as a placeholder UUID without
-- a FK target. Now that the parent table exists, wire the FK so a
-- deleted payout SET NULL on the submission (preserves history).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bounty_submissions_payout_id_fkey'
  ) then
    alter table public.bounty_submissions
      add constraint bounty_submissions_payout_id_fkey
      foreign key (payout_id) references public.bounty_payouts(id) on delete set null;
  end if;
end$$;

-- ── 4. Admin payout queue RPC ──
-- Returns users with pending_cents >= p_min_cents (default $25 = 2500c).
-- Joined with profiles so the admin queue can render handle / name /
-- avatar without a second round-trip. Sorted by pending desc so the
-- biggest payouts surface first.
create or replace function public.admin_bounty_payout_queue(
  p_min_cents bigint default 2500
) returns table(
  user_id uuid,
  handle text,
  full_name text,
  avatar_url text,
  pending_cents bigint,
  paid_cents bigint,
  earned_cents bigint,
  lpo_gift_card_id text,
  lpo_gift_card_last4 text,
  lpo_gift_card_balance_cents bigint,
  oldest_pending_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin_bounty_payout_queue: admin only';
  end if;

  return query
    select
      be.user_id,
      p.handle,
      p.full_name,
      p.avatar_url,
      be.total_pending_cents as pending_cents,
      be.total_paid_cents as paid_cents,
      be.total_earned_cents as earned_cents,
      p.lpo_gift_card_id,
      p.lpo_gift_card_last4,
      p.lpo_gift_card_balance_cents,
      (select min(s.reviewed_at)
         from public.bounty_submissions s
         where s.user_id = be.user_id
           and s.status = 'approved'
           and s.payout_status = 'pending') as oldest_pending_at
    from public.bounty_earnings be
    join public.profiles p on p.id = be.user_id
    where be.total_pending_cents >= p_min_cents
    order by be.total_pending_cents desc;
end;
$$;

revoke all on function public.admin_bounty_payout_queue(bigint) from public;
grant execute on function public.admin_bounty_payout_queue(bigint) to authenticated;

-- ── 4. User payout history RPC ──
-- Combines approved bounty_submissions + bounty_payouts into a single
-- chronological stream. The UI HISTORY modal renders this as a list of
-- "+$X for bounty Y" (approved sub) and "↓ Disbursed $X to gift card"
-- (payout) entries.
create or replace function public.user_bounty_history(
  p_limit int default 100
) returns table(
  kind text,                 -- 'submission_approved' | 'payout'
  ts timestamptz,
  amount_cents bigint,
  bounty_id uuid,
  bounty_title text,
  submission_id uuid,
  payout_id uuid,
  payout_method text,
  payout_reference text
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then return; end if;

  return query
    -- Approved submissions
    (select
      'submission_approved'::text as kind,
      coalesce(s.reviewed_at, s.submitted_at, s.updated_at) as ts,
      coalesce(s.reward_cents, 0)::bigint as amount_cents,
      s.bounty_id,
      b.title as bounty_title,
      s.id as submission_id,
      null::uuid as payout_id,
      null::text as payout_method,
      null::text as payout_reference
    from public.bounty_submissions s
    join public.bounties b on b.id = s.bounty_id
    where s.user_id = v_uid
      and s.status = 'approved')
    union all
    -- Payouts
    (select
      'payout'::text as kind,
      bp.paid_at as ts,
      bp.amount_cents,
      null::uuid as bounty_id,
      null::text as bounty_title,
      null::uuid as submission_id,
      bp.id as payout_id,
      bp.method as payout_method,
      bp.reference as payout_reference
    from public.bounty_payouts bp
    where bp.user_id = v_uid)
    order by ts desc nulls last
    limit p_limit;
end;
$$;

revoke all on function public.user_bounty_history(int) from public;
grant execute on function public.user_bounty_history(int) to authenticated;

notify pgrst, 'reload schema';
