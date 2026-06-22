-- ============================================================================
-- GEAR DROPS — Phase 7: multi-item prize pack
-- ============================================================================
-- Hosts want to assemble a PRIZE PACK out of multiple items instead of a
-- single prize. Adds `prize_items jsonb` to gear_drops with an array
-- shape of:
--   [{
--     id:          text (uuid-ish; generated client-side or by backfill),
--     title:       text,
--     description: text (rich HTML — sanitized on render),
--     value_cents: integer | null,
--     photos:      text[] (carousel; same shape the editor already uses)
--   }, ...]
--
-- Legacy fields (prize_title, prize_description, prize_value_cents,
-- prize_photos) are NOT dropped — they stay as a fallback for any code
-- path that hasn't been migrated yet (api/preview.js, sitemap, etc.).
-- Existing drops with legacy prize data are auto-migrated into a
-- single-item prize_items entry so the new UI renders them correctly.
--
-- Idempotent — re-running is safe.
-- ============================================================================

alter table public.gear_drops
  add column if not exists prize_items jsonb default '[]'::jsonb;

comment on column public.gear_drops.prize_items is
  'Array of prize items in the pack: [{id, title, description, value_cents, photos[]}]. Source of truth for the editor + detail-page prize render. Legacy prize_title / prize_description / prize_value_cents / prize_photos columns stay populated for back-compat (SSR / OG cards) but new code should read prize_items.';

-- Backfill: any drop with legacy prize data gets a single-item pack so
-- the new list-based UI renders existing drops without re-entry.
update public.gear_drops
set prize_items = jsonb_build_array(
  jsonb_build_object(
    'id',          gen_random_uuid()::text,
    'title',       coalesce(prize_title, 'Prize'),
    'description', prize_description,
    'value_cents', prize_value_cents,
    'photos',      coalesce(prize_photos, '[]'::jsonb)
  )
)
where (prize_items is null or jsonb_array_length(prize_items) = 0)
  and (
    prize_title is not null
    or prize_description is not null
    or prize_value_cents is not null
    or jsonb_array_length(coalesce(prize_photos, '[]'::jsonb)) > 0
  );

notify pgrst, 'reload schema';
