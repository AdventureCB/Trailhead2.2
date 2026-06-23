-- ─────────────────────────────────────────────────────────────────────────────
-- Ranks + Bounties — Phase 4: bounty schema + admin authoring
-- ─────────────────────────────────────────────────────────────────────────────
-- Spec: project_ranks_bounties_spec.md
--
-- What this ships:
--   1. bounties table — admin-authored quests + rewards + form_config
--   2. bounty_submissions table (shell; RLS + RPCs flesh out in Phase 5)
--   3. RLS: bounties non-draft are public-read; admin INSERT/UPDATE/DELETE
--   4. Realtime + REPLICA IDENTITY FULL on bounties so admin edits propagate
--      live to the user-facing bounty board.
--
-- bounty_submissions ships as a SHELL only — the table exists so the FK
-- targets for Phase 5 + Phase 6 RPCs are in place, but the claim/submit
-- RPCs themselves are deferred. RLS on bounty_submissions is "admin only"
-- for now (no client-side INSERT path until Phase 5 ships claim_bounty).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── bounties table ──
create table if not exists public.bounties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,                                  -- rich html, sanitized client-side before insert
  category text not null,                            -- "Gear Review" | "Route Report" | "Build Feature" | "Content Creation" | custom
  difficulty text not null default 'Medium' check (difficulty in ('Easy', 'Medium', 'Hard')),
  hero_img text,
  reward_cents int not null default 0 check (reward_cents >= 0),
  reward_points int not null default 0 check (reward_points >= 0),
  multiple_winners boolean not null default false,
  total_slots int not null default 1 check (total_slots >= 1),
  claimed_slots int not null default 0 check (claimed_slots >= 0),
  approved_slots int not null default 0 check (approved_slots >= 0),
  starts_at timestamptz,
  deadline_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed', 'archived')),
  form_template_key text,                            -- references BOUNTY_FORM_TEMPLATES key on client; null = use category default
  form_config jsonb,                                 -- admin override; null = client uses template default
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bounties_status_deadline_idx on public.bounties (status, deadline_at desc);
create index if not exists bounties_created_at_idx on public.bounties (created_at desc);
create index if not exists bounties_category_idx on public.bounties (category);

-- Auto-bump updated_at on UPDATE.
create or replace function public._bounties_set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists bounties_set_updated_at on public.bounties;
create trigger bounties_set_updated_at before update on public.bounties
  for each row execute function public._bounties_set_updated_at();

alter table public.bounties enable row level security;

-- Public SELECT for non-draft bounties; admin sees everything.
drop policy if exists bounties_public_select on public.bounties;
create policy bounties_public_select on public.bounties
  for select using (status <> 'draft' or public.is_admin(auth.uid()));

drop policy if exists bounties_admin_insert on public.bounties;
create policy bounties_admin_insert on public.bounties
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists bounties_admin_update on public.bounties;
create policy bounties_admin_update on public.bounties
  for update using (public.is_admin(auth.uid()));

drop policy if exists bounties_admin_delete on public.bounties;
create policy bounties_admin_delete on public.bounties
  for delete using (public.is_admin(auth.uid()));

-- Realtime publication + replica identity so admin edits propagate live.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bounties'
  ) then
    alter publication supabase_realtime add table public.bounties;
  end if;
end$$;

alter table public.bounties replica identity full;

-- ── bounty_submissions table (Phase 4 shell — Phase 5 wires claim/submit RPCs) ──
create table if not exists public.bounty_submissions (
  id uuid primary key default gen_random_uuid(),
  bounty_id uuid not null references public.bounties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'claimed'
    check (status in ('claimed', 'in_progress', 'submitted', 'changes_requested', 'approved', 'rejected', 'withdrawn')),
  draft jsonb not null default '{}'::jsonb,         -- form field values; auto-saved
  submitted_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  reviewer_notes text,
  -- Snapshot rewards at approval (so reward changes after-the-fact don't
  -- silently change historical payouts). NULL until approved.
  reward_cents int,
  reward_points int,
  payout_status text not null default 'pending'
    check (payout_status in ('pending', 'paid', 'failed', 'voided')),
  payout_id uuid,                                    -- FK targets bounty_payouts in Phase 7
  -- Publication targets — set when admin chooses to publish the approved
  -- submission as a feed post / forum thread / trip report.
  published_post_id uuid,
  published_thread_id uuid references public.forum_threads(id) on delete set null,
  published_trip_id uuid references public.trip_reports(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One active submission per (bounty, user). 'rejected' and 'withdrawn'
-- excluded so a rejected user can re-claim once a slot reopens.
create unique index if not exists bounty_submissions_one_active_idx
  on public.bounty_submissions (bounty_id, user_id)
  where status not in ('rejected', 'withdrawn');

create index if not exists bounty_submissions_bounty_idx on public.bounty_submissions (bounty_id);
create index if not exists bounty_submissions_user_idx on public.bounty_submissions (user_id);
create index if not exists bounty_submissions_status_idx on public.bounty_submissions (status, submitted_at desc);

drop trigger if exists bounty_submissions_set_updated_at on public.bounty_submissions;
create trigger bounty_submissions_set_updated_at before update on public.bounty_submissions
  for each row execute function public._bounties_set_updated_at();

alter table public.bounty_submissions enable row level security;

-- Phase 4: admin-only access; Phase 5 widens for owners.
drop policy if exists bounty_submissions_admin_select on public.bounty_submissions;
create policy bounty_submissions_admin_select on public.bounty_submissions
  for select using (public.is_admin(auth.uid()) or auth.uid() = user_id);

drop policy if exists bounty_submissions_admin_update on public.bounty_submissions;
create policy bounty_submissions_admin_update on public.bounty_submissions
  for update using (public.is_admin(auth.uid()));

drop policy if exists bounty_submissions_admin_delete on public.bounty_submissions;
create policy bounty_submissions_admin_delete on public.bounty_submissions
  for delete using (public.is_admin(auth.uid()));

-- No INSERT policy yet (Phase 5 ships claim_bounty RPC w/ SECURITY DEFINER).

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bounty_submissions'
  ) then
    alter publication supabase_realtime add table public.bounty_submissions;
  end if;
end$$;

alter table public.bounty_submissions replica identity full;
