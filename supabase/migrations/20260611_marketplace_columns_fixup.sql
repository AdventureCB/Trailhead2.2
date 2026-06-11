-- ============================================================================
-- MARKETPLACE LISTING COLUMNS — fix-up
-- ============================================================================
-- Reproduces the 2026-05-20 marketplace columns idempotently. PostgREST
-- threw PGRST204 ("could not find the 'listing_currency' column in the
-- schema cache") when posting in the marketplace forum category, which
-- means either:
--   (a) the original migration was never applied to this database, or
--   (b) PostgREST's in-memory schema cache is stale.
-- This file fixes both. The NOTIFY at the bottom tells PostgREST to
-- reload its schema cache so the columns become visible to the API.
-- Safe to re-run.
-- ============================================================================

alter table public.forum_threads
  add column if not exists listing_price numeric,
  add column if not exists listing_currency text default 'USD',
  add column if not exists listing_status text default 'active',
  add column if not exists listing_details jsonb not null default '{}'::jsonb;

do $$ begin
  alter table public.forum_threads
    add constraint forum_threads_listing_status_check
    check (listing_status in ('active','sold','withdrawn'));
exception when duplicate_object then null;
end $$;

create index if not exists forum_threads_marketplace_idx
  on public.forum_threads (subcategory_slug, listing_status, created_at desc)
  where category_slug = 'marketplace';

-- Tell PostgREST to reload its schema cache so the new columns are
-- visible to the REST API immediately. Without this, PGRST204 can
-- linger for several minutes after a DDL change.
notify pgrst, 'reload schema';
