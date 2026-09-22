-- 2026-09-14: Event drawings (raffles) — Phase 1 (data model + entry collection).
--
-- Reusable per-event raffle: a public /win/<slug> page collects entries from
-- SIGNED-IN users (account required → unique(event,user) prevents dupes and
-- guarantees a DM-able winner). Prize params (discount / min purchase / code
-- expiry) live on the event so the mechanism is reusable. Phase 2 adds the
-- pick-winner RPC + Shopify code + push/DM; the winner-code table is created
-- here so Phase 2 needs no migration.

-- Optional phone on profiles — populated from the entry so it can flow into
-- deals downstream (lpo-sales-engine, Phase 3). Nullable; never required.
alter table public.profiles add column if not exists phone text;

-- ── raffle_events ──
create table if not exists public.raffle_events (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               text not null unique,               -- public URL: /win/<slug>
  code_prefix        text not null,                       -- discount code stem, e.g. EXPO24 (A-Z0-9)
  status             text not null default 'collecting'
                       check (status in ('draft','collecting','drawn','closed')),
  discount_cents     int  not null default 300000,        -- $3,000 off
  min_purchase_cents int  not null default 500000,        -- on $5,000+ orders
  code_expiry_days   int  not null default 30,
  winner_entry_id    uuid,                                -- FK added after entries exists
  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists raffle_events_slug_idx on public.raffle_events (slug);

-- ── raffle_entries ──
create table if not exists public.raffle_entries (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.raffle_events(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text,
  email      text,
  phone      text,
  is_winner  boolean not null default false,
  won_at     timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)                              -- one entry per account
);
create index if not exists raffle_entries_event_idx on public.raffle_entries (event_id, created_at desc);

alter table public.raffle_events
  drop constraint if exists raffle_events_winner_fk;
alter table public.raffle_events
  add constraint raffle_events_winner_fk
  foreign key (winner_entry_id) references public.raffle_entries(id) on delete set null;

-- ── raffle_hosts ── per-event host grants (assigned by admins). A host can
-- run the draw for THAT event even if they're an ambassador/gravel guide.
create table if not exists public.raffle_hosts (
  event_id   uuid not null references public.raffle_events(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- ── raffle_winner_codes ── the Shopify code lives in its own table so RLS can
-- restrict it to ADMIN + the WINNER only (hosts can see entries but NOT codes).
-- Populated in Phase 2.
create table if not exists public.raffle_winner_codes (
  event_id            uuid not null references public.raffle_events(id) on delete cascade,
  entry_id            uuid not null references public.raffle_entries(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  code                text not null,
  shopify_price_rule_id text,
  shopify_discount_id text,
  discount_cents      int,
  min_purchase_cents  int,
  expires_at          timestamptz,
  created_at          timestamptz not null default now(),
  primary key (event_id)
);

-- Helper: is the current user a host of (or admin over) this event?
create or replace function public.is_raffle_host(p_event_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.is_admin(auth.uid())
    or exists (
      select 1 from public.raffle_hosts h
      where h.event_id = p_event_id and h.user_id = auth.uid()
    );
$$;
grant execute on function public.is_raffle_host(uuid) to authenticated;

-- ── RLS ──
alter table public.raffle_events        enable row level security;
alter table public.raffle_entries       enable row level security;
alter table public.raffle_hosts         enable row level security;
alter table public.raffle_winner_codes  enable row level security;

-- EVENTS: public read of non-draft events (the /win page needs name + params);
-- admin-only mutation.
drop policy if exists raffle_events_select on public.raffle_events;
create policy raffle_events_select on public.raffle_events
  for select using (status <> 'draft' or public.is_admin(auth.uid()));
drop policy if exists raffle_events_admin_write on public.raffle_events;
create policy raffle_events_admin_write on public.raffle_events
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ENTRIES: a user inserts their OWN entry (account required). SELECT = own
-- entry OR admin OR a host of the event (hosts manage/export the list).
drop policy if exists raffle_entries_insert on public.raffle_entries;
create policy raffle_entries_insert on public.raffle_entries
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists raffle_entries_select on public.raffle_entries;
create policy raffle_entries_select on public.raffle_entries
  for select using (
    auth.uid() = user_id
    or public.is_raffle_host(event_id)
  );
-- Admin can update/delete entries (moderation); hosts + the pick-winner RPC
-- (SECURITY DEFINER, Phase 2) handle winner flips.
drop policy if exists raffle_entries_admin_write on public.raffle_entries;
create policy raffle_entries_admin_write on public.raffle_entries
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
drop policy if exists raffle_entries_admin_delete on public.raffle_entries;
create policy raffle_entries_admin_delete on public.raffle_entries
  for delete using (public.is_admin(auth.uid()));

-- HOSTS: a user can see their own grant; admin sees all + is the only writer.
drop policy if exists raffle_hosts_select on public.raffle_hosts;
create policy raffle_hosts_select on public.raffle_hosts
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));
drop policy if exists raffle_hosts_admin_write on public.raffle_hosts;
create policy raffle_hosts_admin_write on public.raffle_hosts
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- WINNER CODES: admin OR the winner only. NOT hosts. Server (service role)
-- writes it via the Phase 2 pick-winner RPC.
drop policy if exists raffle_winner_codes_select on public.raffle_winner_codes;
create policy raffle_winner_codes_select on public.raffle_winner_codes
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- Realtime — live entry counts on the admin screen + winner flips.
alter publication supabase_realtime add table public.raffle_events;
alter publication supabase_realtime add table public.raffle_entries;
alter table public.raffle_events  replica identity full;
alter table public.raffle_entries replica identity full;

notify pgrst, 'reload schema';
