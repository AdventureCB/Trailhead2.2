-- ============================================================================
-- GEAR DROPS — Phase 2c: SEO slug + prize photos
-- ============================================================================
-- 1. gear_drops.slug — unique, URL-safe identifier used for /drops/<slug>
--    deep links. Auto-generated client-side on create with -2/-3 suffix
--    retry on collision (mirrors trip_reports.slug behavior).
-- 2. gear_drops.prize_photos jsonb — array of {url, alt} objects rendered
--    as a carousel in the public detail page.
-- 3. Backfill: generate a slug for every existing gear_drops row so
--    upgrade is non-breaking. NOT NULL constraint added after the backfill
--    so old rows don't fail the migration.
-- ============================================================================

alter table public.gear_drops add column if not exists slug text;
alter table public.gear_drops add column if not exists prize_photos jsonb not null default '[]'::jsonb;

-- Backfill slugs for rows that don't have one.
do $$
declare
  r record;
  base text;
  s text;
  n int;
begin
  for r in select id, title from public.gear_drops where slug is null loop
    base := lower(regexp_replace(coalesce(r.title, 'gear-drop'), '[^a-z0-9]+', '-', 'g'));
    base := regexp_replace(base, '^-+|-+$', '', 'g');
    if base = '' or base is null then base := 'gear-drop'; end if;
    s := base;
    n := 2;
    while exists (select 1 from public.gear_drops where slug = s and id <> r.id) loop
      s := base || '-' || n;
      n := n + 1;
    end loop;
    update public.gear_drops set slug = s where id = r.id;
  end loop;
end;
$$;

-- Add UNIQUE constraint once every row has a value.
do $$ begin
  alter table public.gear_drops add constraint gear_drops_slug_key unique (slug);
exception when duplicate_object then null;
end $$;

create index if not exists gear_drops_slug_idx on public.gear_drops(slug) where slug is not null;
