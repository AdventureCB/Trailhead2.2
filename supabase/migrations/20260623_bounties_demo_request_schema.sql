-- ─────────────────────────────────────────────────────────────────────────────
-- Bounties — Demo Request schema
-- ─────────────────────────────────────────────────────────────────────────────
-- Adds the location + customer fields needed for the Demo Request bounty type.
-- Client-side this is identified by `category = 'Demo Request'` AND a special
-- form_template_key that triggers DemoRequestFlow instead of BountyResponseForm.
--
-- Flow:
--   1. Admin creates the bounty: pin location + radius + assigned customer
--   2. Push fires to users (manual via admin "PUSH NEARBY" button — Phase 2)
--   3. A user claims → DM auto-opens with the customer (client-side via openDM)
--   4. User schedules meeting (writes draft.scheduled_at + draft.scheduled_location)
--   5. User uploads proof photo (writes draft.proof_photo) → submit_bounty
--   6. Admin reviews proof → admin_approve_bounty
--
-- 48hr scheduling deadline is UI-enforced for v1; server-side auto-withdraw
-- on timeout can ship as a follow-up cron.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.bounties
  add column if not exists demo_lat double precision,
  add column if not exists demo_lng double precision,
  add column if not exists demo_radius_m int default 80467,  -- ~50 miles
  add column if not exists demo_customer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists demo_location_label text;

-- Partial index for spatial range queries when we add proximity push.
create index if not exists bounties_demo_loc_idx
  on public.bounties (demo_lat, demo_lng)
  where demo_lat is not null;
