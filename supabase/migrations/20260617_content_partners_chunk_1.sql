-- ============================================================================
-- CONTENT PARTNERS — Chunk 1: foundation + admin assignment
-- ============================================================================
-- New subsystem for managing influencer content-creator partnerships.
-- Partner = an influencer who receives a discounted camper build in
-- exchange for delivering content (lifestyle photos, short-form reels,
-- a walkaround review video, and a "Basecamp for X" video) over a
-- 1-year term that starts on the camper delivery date.
--
-- Architecture decisions (see content-partners design discussion 2026-06-17):
--   • Partner flag is `profiles.is_content_partner` — same toggle pattern
--     as is_moderator / is_beta_tester. Independent of role + is_ambassador
--     so a user can hold any combination.
--   • One `content_partners` row per CONTRACT (not per profile). Renewals
--     create a new row; old row gets status='ended'. Keeps historical
--     contracts queryable.
--   • `content_partner_quotas` — one row per deliverable kind on the
--     contract (e.g. photo+120+term, short_video+10+quarter w/ schedule).
--     Each quota carries its own cadence + optional per-period schedule
--     jsonb + optional milestone due_at. Lets the dashboard render
--     "expected by now" vs "delivered to date" per kind.
--   • `content_partner_deliverables` — one row per kind per submission.
--     The partner reports an INVENTORY ("I uploaded 5 photos, 1 reel")
--     via a forced-flow Upload Content button; no URL plumbing — admin
--     organizes the Dropbox folder. A `submission_group_id` ties rows
--     from the same submission so the admin queue shows them as one item.
--     Admin reviews and either confirms or adjusts `quantity_accepted`
--     per kind; that's the source-of-truth count for standing.
--   • Past-due deliveries still count toward the total (Kyle's call —
--     "we want any past due content regardless of when it comes"); the
--     "expected by now" comparison is purely informational.
--   • Damages clause stays off-app — admin flags status='breached' for
--     visibility; invoicing happens elsewhere.
-- ============================================================================

-- ── Profile flag ────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_content_partner boolean not null default false;

comment on column public.profiles.is_content_partner is
  'Admin-set boolean — true when the user has at least one active content-partner contract. Mirrors is_moderator / is_beta_tester toggle pattern. Gates the partner dashboard surface and the UPLOAD CONTENT button.';

-- ── Contract table ──────────────────────────────────────────────────────
create table if not exists public.content_partners (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending_delivery' check (status in (
    'pending_delivery',  -- contract signed, camper not yet delivered
    'active',            -- camper delivered, term running
    'completed',         -- term fulfilled
    'breached',          -- partner failed to deliver — flagged for visibility
    'ended'              -- term ran out, archived
  )),
  contract_signed_at date,
  camper_delivered_at date,
  term_ends_at date,                 -- set client-side as camper_delivered_at + 1yr
  discount_pct numeric(5,2),         -- e.g. 25.00 or 50.00
  contract_url text,                 -- jotform/dropbox URL for the signed PDF
  dropbox_upload_folder_url text,    -- partner's assigned upload folder
  basecamp_activity text,            -- 'hiking' / 'fishing' / etc. — fills the "Basecamp for ___" blank
  notes text,                        -- admin notes
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_partners_profile_id_idx
  on public.content_partners (profile_id);
create index if not exists content_partners_status_open_idx
  on public.content_partners (status, camper_delivered_at desc)
  where status in ('pending_delivery', 'active');

-- ── Quotas ──────────────────────────────────────────────────────────────
create table if not exists public.content_partner_quotas (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.content_partners(id) on delete cascade,
  kind text not null check (kind in (
    'photo',           -- lifestyle photos
    'short_video',     -- 15s reels
    'long_video',      -- walkaround / review (typically a 1-shot milestone)
    'basecamp_video'   -- "Basecamp for ___" hero video (1-shot milestone)
  )),
  total_target int not null check (total_target > 0),
  cadence text not null check (cadence in ('term', 'quarter', 'month', 'milestone')),
  schedule jsonb,                    -- optional per-period breakdown e.g. {"Q1":15,"Q2":35,...}
  due_at timestamptz,                -- for milestone kinds (e.g. camper_delivered_at + 90d)
  created_at timestamptz not null default now(),
  -- One quota per kind per contract — no duplicates.
  unique (partner_id, kind)
);

create index if not exists content_partner_quotas_partner_id_idx
  on public.content_partner_quotas (partner_id);

-- ── Deliverables ────────────────────────────────────────────────────────
create table if not exists public.content_partner_deliverables (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.content_partners(id) on delete cascade,
  submission_group_id uuid not null default gen_random_uuid(),
  kind text not null check (kind in (
    'photo', 'short_video', 'long_video', 'basecamp_video'
  )),
  quantity_reported int not null check (quantity_reported > 0),
  quantity_accepted int check (quantity_accepted is null or quantity_accepted >= 0),
  partner_notes text,
  submitted_at timestamptz not null default now(),
  status text not null default 'pending' check (status in (
    'pending', 'approved', 'rejected'
  )),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  reviewer_notes text
);

create index if not exists content_partner_deliverables_partner_id_idx
  on public.content_partner_deliverables (partner_id, submitted_at desc);
create index if not exists content_partner_deliverables_status_pending_idx
  on public.content_partner_deliverables (submitted_at asc)
  where status = 'pending';
create index if not exists content_partner_deliverables_submission_group_idx
  on public.content_partner_deliverables (submission_group_id);

-- ── updated_at trigger on the parent row ────────────────────────────────
create or replace function public.set_content_partner_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists content_partners_updated_at_trg on public.content_partners;
create trigger content_partners_updated_at_trg
  before update on public.content_partners
  for each row execute function public.set_content_partner_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────
alter table public.content_partners enable row level security;
alter table public.content_partner_quotas enable row level security;
alter table public.content_partner_deliverables enable row level security;

-- content_partners: partner reads own contract; admin reads + writes everything.
drop policy if exists content_partners_select on public.content_partners;
create policy content_partners_select on public.content_partners
  for select to authenticated
  using (auth.uid() = profile_id or public.is_admin(auth.uid()));

drop policy if exists content_partners_admin_write on public.content_partners;
create policy content_partners_admin_write on public.content_partners
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- content_partner_quotas: partner reads own (via the contract); admin all.
drop policy if exists content_partner_quotas_select on public.content_partner_quotas;
create policy content_partner_quotas_select on public.content_partner_quotas
  for select to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.content_partners cp
      where cp.id = content_partner_quotas.partner_id
        and cp.profile_id = auth.uid()
    )
  );

drop policy if exists content_partner_quotas_admin_write on public.content_partner_quotas;
create policy content_partner_quotas_admin_write on public.content_partner_quotas
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- content_partner_deliverables:
--   SELECT: partner reads own + admin
--   INSERT: partner inserts on own active contract; status MUST be 'pending'
--           and quantity_accepted/reviewed_by/reviewed_at MUST be null on insert
--   UPDATE/DELETE: admin only (approval/adjust is admin work)
drop policy if exists content_partner_deliverables_select on public.content_partner_deliverables;
create policy content_partner_deliverables_select on public.content_partner_deliverables
  for select to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.content_partners cp
      where cp.id = content_partner_deliverables.partner_id
        and cp.profile_id = auth.uid()
    )
  );

drop policy if exists content_partner_deliverables_partner_insert on public.content_partner_deliverables;
create policy content_partner_deliverables_partner_insert on public.content_partner_deliverables
  for insert to authenticated
  with check (
    exists (
      select 1 from public.content_partners cp
      where cp.id = content_partner_deliverables.partner_id
        and cp.profile_id = auth.uid()
        and cp.status = 'active'
    )
    and status = 'pending'
    and quantity_accepted is null
    and reviewed_by is null
    and reviewed_at is null
  );

drop policy if exists content_partner_deliverables_admin_write on public.content_partner_deliverables;
create policy content_partner_deliverables_admin_write on public.content_partner_deliverables
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ── Realtime ────────────────────────────────────────────────────────────
-- Add the three new tables to the supabase_realtime publication. Wrapped
-- in a DO block so re-running the migration doesn't error when the table
-- is already published.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'content_partners') then
    execute 'alter publication supabase_realtime add table public.content_partners';
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'content_partner_quotas') then
    execute 'alter publication supabase_realtime add table public.content_partner_quotas';
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'content_partner_deliverables') then
    execute 'alter publication supabase_realtime add table public.content_partner_deliverables';
  end if;
end$$;

alter table public.content_partners            replica identity full;
alter table public.content_partner_quotas      replica identity full;
alter table public.content_partner_deliverables replica identity full;

notify pgrst, 'reload schema';
