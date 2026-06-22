-- ============================================================================
-- GEAR DROPS — Phase 6: brand partner external link
-- ============================================================================
-- Hosts asked for a link to the brand partner alongside the existing
-- brand_partner_name + brand_logo_url. Adds the column; UI surfaces it
-- as a clickable wrapper around the brand row on the detail page +
-- memento recap. Optional — null behaves like before (label only).
--
-- Waypoint submission prompts (photo_prompt + note_prompt per pin) live
-- entirely inside gear_drops.route_data.pins jsonb — no schema change
-- needed, see the JS-side editor + run-screen wiring.
--
-- Idempotent — re-running is safe.
-- ============================================================================

alter table public.gear_drops
  add column if not exists brand_partner_url text;

comment on column public.gear_drops.brand_partner_url is
  'Optional external URL for the brand partner (e.g. their site). When set, the brand row on the public detail page + memento recap becomes a clickable link. Null = label-only (existing behavior).';

notify pgrst, 'reload schema';
