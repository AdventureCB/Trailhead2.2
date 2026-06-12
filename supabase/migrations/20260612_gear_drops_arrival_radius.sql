-- ============================================================================
-- GEAR DROPS — arrival_radius_m column
-- ============================================================================
-- Adds the "you've arrived at the start" proximity threshold. The detail
-- page watches GPS once a participant has joined; when their distance to
-- the start point drops below this radius, an arrival popup fires that
-- either lets them START YOUR RUN (if the drop is live) or shows a live
-- countdown until starts_at. Default 100m; host can adjust per drop.
-- Idempotent: column added with IF NOT EXISTS.
-- ============================================================================

alter table public.gear_drops
  add column if not exists arrival_radius_m int not null default 100;

comment on column public.gear_drops.arrival_radius_m is
  'Distance in metres at which the detail page surfaces the "you''re at the start" arrival popup for joined participants. Defaults to 100. Separate from per-pin radius_m which gates submission.';

notify pgrst, 'reload schema';
