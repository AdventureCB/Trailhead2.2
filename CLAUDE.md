# Trailhead — Claude Code Handoff

## What This Project Is

Trailhead is a mobile-first social web app for the overlanding community, built by Lone Peak Overland (Kyle, kyle@lonepeakoverland.com). Think Instagram meets AllTrails for overlanders — social feed, route library, vehicle builds, forum, convoy coordination, recovery assist, leaderboard/loyalty points, and DMs.

Live at: **https://trailhead.lonepeakoverland.com** (Vercel, deployed via GitHub at https://github.com/AdventureCB/Trailhead2.2.git). Old `trailhead2-2.vercel.app` still resolves and 301s to the primary.

## Architecture

**Single-file React app** — the entire UI is one JSX file (`trailhead-v1.jsx`, ~13,700 lines). No component library, no router, no state management library. All state lives in the root `Trailhead` component and is passed down via props. Screen switching is done via a `screen` state variable.

**Entry point:** `entry.jsx` imports `Trailhead` from `trailhead-v1.jsx`, calls `createRoot` and `render`. The main JSX file does NOT mount itself — the comment at the bottom explains why (double-mount race condition).

**No package.json / no node_modules in the repo.** Dependencies (React, Supabase, Lucide) are resolved by esbuild at bundle time from wherever they're installed globally or via npx. If setting up locally, you'll need: `react`, `react-dom`, `@supabase/supabase-js`, `lucide-react`.

## Backend — Supabase

**Project URL:** `https://babbgaziiyjfaqjsaxgd.supabase.co` (legacy, still works)
**Custom auth domain:** `https://auth.lonepeakoverland.com` (set up 2026-05-29 so the Google OAuth sign-in screen shows our domain instead of the raw supabase.co URL). Both URLs work in parallel; supabase-client.js still targets the project URL but auth flows route through the custom domain. Any NEW OAuth provider added to Supabase (Apple/Facebook/GitHub/etc.) should use `https://auth.lonepeakoverland.com/auth/v1/callback` as the canonical redirect URI. See `project_supabase_custom_auth_domain`.
**Client file:** `supabase-client.js` (exports `supabase` instance + constants)
**Auth flow:** Email/password + Google OAuth, implicit flow. Session persisted in localStorage.

### Database Tables (all in `public` schema)

| Table | Purpose | Key FKs |
|---|---|---|
| `profiles` | User profiles (full_name, handle, avatar_url, bio, role, requested_role, etc.). **`is_moderator boolean default false`** (added 2026-05-28) — admin can flip to grant content-delete privileges to non-admin users; guarded by `profiles_moderator_guard` trigger. Also `posts.hidden_at`/`hidden_by`, `forum_threads.hidden_at`/`hidden_by`, `forum_replies.hidden_at`/`hidden_by` (added 2026-05-28) for moderator soft-hide-pending-review flow. See `project_moderator_privileges` | `id` → `auth.users(id)` ON DELETE CASCADE |
| `posts` | Feed posts (type: POST, PHOTOS, ROUTES, BUILDS, CONVOYS) | `user_id` → `auth.users(id)` ON DELETE CASCADE |
| `post_likes` | Like join table | `post_id` → `posts(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE |
| `post_comments` | Comments on posts | `post_id` → `posts(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE |
| `post_comment_likes` | Likes on comments | `comment_id` → `post_comments(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE |
| `notifications` | Bell notifications (like, comment, mention, reply, follow, rsvp) | `user_id` → `auth.users(id)` CASCADE, `actor_id` → `auth.users(id)` SET NULL |
| `builds` | Vehicle builds | `user_id` → `auth.users(id)` CASCADE |
| `follows` | Follow graph (composite PK on follower_id+following_id) | `follower_id`, `following_id` → `auth.users(id)` CASCADE |
| `convoy_rsvps` | RSVPs to CONVOYS posts (status: going/maybe/declined) | `post_id` → `posts(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE; composite PK |
| `dm_conversations` | Direct + group DMs. `type ∈ {direct, group}`. `convoy_post_id` links a group to a convoy post (auto-created when first RSVPs going). `recovery_post_id` links a group to a recovery alert post (auto-created when first responder taps RESPOND — same pattern). See `project_recovery_group_dm` | `created_by` → `auth.users(id)` SET NULL; `convoy_post_id` → `posts(id)` SET NULL; `recovery_post_id` → `posts(id)` SET NULL; UNIQUE(convoy_post_id) for group; UNIQUE(recovery_post_id) for group |
| `dm_participants` | Membership join. `last_read_at` for unread counts; `hidden_at` for soft-delete (direct convos reappear on next inbound message) | composite PK on conv_id+user_id |
| `dm_messages` | DM messages. `body` text + `payload` jsonb (photos, sharedPost, convoy_invite) | `conversation_id` CASCADE, `sender_id` CASCADE |
| `push_subscriptions` | Web Push endpoints, one row per device. PK is the endpoint URL | `user_id` → `auth.users(id)` CASCADE |
| `build_likes` | Likes on builds (heart in builds gallery / detail) | `build_id` → `builds(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE; composite PK |
| `dm_message_likes` | iMessage-style emoji reactions on DM messages. `emoji` column holds the picked emoji | `message_id` → `dm_messages(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE; composite PK |
| `camping_spots` | Public dataset of camping locations rendered on routes maps. Seeded with OSM + Recreation.gov via `supabase/seed/seed-camping-spots.js`; users can also add their own (`source = 'user'`). `unique(source, source_id)` makes seed re-runs idempotent. Admin override policies (added 2026-05-22) let admins edit/delete any user-created spot. `photos` jsonb supports community contributions via `add_camping_spot_photo` RPC — each entry carries `added_by` + `added_at` so per-photo delete is gated to admin/adder/owner. See `project_camping_spots_community` | `user_id` → `auth.users(id)` SET NULL |
| `build_comments` | Comments on builds (rendered on build detail page). Same shape as `post_comments` (id/body/created_at) plus `parent_id` (self-FK) for forum-style threading (one level deep). RLS allows public SELECT, INSERT/DELETE on own rows. Realtime publication; replica identity full. Composite index on `(build_id, created_at ASC)` for lazy fetch on detail-page open | `build_id` → `builds(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE, `parent_id` → `build_comments(id)` CASCADE |
| `build_comment_likes` | Likes on build comments. Heart toggle next to each comment. RLS allows public SELECT, INSERT/DELETE on own rows. Realtime publication; replica identity full | `comment_id` → `build_comments(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE; composite PK |
| `trip_reports` | Community trip-report posts with `status ∈ {draft, published}`. Drafts are owner-only; published reports are publicly readable (RLS). `slug` is unique + URL-safe (auto-generated from `name`, `-2`/`-3` suffix on collision). `route_data` jsonb holds pins/points/photos with per-pin notes; top-level `start_lat/lng/label`, `distance_mi`, `duration_min`, `elev_gain_ft`, `max_elev_ft`, `region`, `state_code`, `terrains[]`, `tags[]` are surfaced as queryable columns for cards + SEO + filtering. **`build_id uuid` (added 2026-06-03)** — optional FK to `builds`; when set, the trip's `distance_mi` + `elev_gain_ft` aggregate onto that build's profile stats (TOTAL TRAIL MILES + ELEVATION GAIN + TRIPS COMPLETED, computed client-side via `SUM` over `allTripReports.filter(build_id=this AND status='published')`). Vehicle picker lives in TripReportEditor (legacy) + TripReportDetail's inline edit mode (modern; tap EDIT button on detail page). Realtime publication; replica identity full. See `project_trip_build_link` | `user_id` → `auth.users(id)` CASCADE, `build_id` → `builds(id)` SET NULL |
| `saved_trips` | User bookmarks of community trips + plans (both kinds live in `trip_reports`). Composite PK `(user_id, trip_id)` + `saved_at timestamptz`. RLS: owner-only SELECT/INSERT/DELETE via `auth.uid() = user_id`. Realtime + replica identity full for cross-device sync. SAVE button rendered on ExploreMap trip/plan popups + TripReportDetail action row; bookmarks listed in Profile → Trips → Saved. Personal pointer — does NOT duplicate the trip. See `project_saved_trips` | `user_id` → `auth.users(id)` CASCADE, `trip_id` → `trip_reports(id)` CASCADE |
| `forum_threads` | DB-persisted forum threads. `title`, unique `slug` (auto-gen from title with `-2`/`-3` collision retry), `body text` (legacy concatenated HTML for OG/search), `sections jsonb` (structured `[{subheading, body}]` from the multi-section editor — title = h1, subheading = h2, body = paragraph-only), `photos jsonb`, `pinned bool`, `view_count int` (bumped via `bump_forum_thread_view` RPC), `category_slug` + `subcategory_slug` (text — decoupled from display name so admin can rename without orphaning threads). **Marketplace-only columns:** `listing_price numeric`, `listing_currency text default 'USD'`, `listing_status text check in ('active','sold','withdrawn')`, `listing_details jsonb` ({condition, brand, modelYear, location, priceFree, priceOBO, descriptionPlain}). Public SELECT; owner INSERT/UPDATE/DELETE + admin override. Realtime + replica identity full. See `project_forums_db_persistence` + `project_marketplace_listings` | `user_id` → `auth.users(id)` CASCADE |
| `forum_categories` | Phase 2 DB-backed categories (replaces the old hardcoded `forumData.categories` constant). `id, slug unique, name, color, icon (lucide name), sort_order, created_by, created_at, updated_at`. RLS: public SELECT; admin-only INSERT/UPDATE/DELETE via `is_admin(auth.uid())`. Realtime publication + replica identity full so admin edits propagate live. App-side delete blocks when subcategories still exist; FK on `forum_subcategories.category_id` is `ON DELETE RESTRICT` as a belt-and-suspenders DB-side block | `created_by` → `auth.users(id)` SET NULL |
| `forum_subcategories` | Phase 2 DB-backed subcategories. `id, category_id FK, slug, name, sort_order, created_by, created_at, updated_at` with `UNIQUE(category_id, slug)`. RLS: public SELECT; INSERT via `is_ambassador_or_admin(auth.uid()) AND auth.uid() = created_by` (ambassadors become owners); own UPDATE/DELETE for `created_by` + admin-override UPDATE/DELETE policies. App-side delete blocks when threads under the slug still exist. Realtime + replica identity full | `category_id` → `forum_categories(id)` RESTRICT, `created_by` → `auth.users(id)` SET NULL |
| `forum_replies` | Threaded forum replies (depth-1 via `parent_id` self-FK). `body text`, `photos jsonb`. Public SELECT; owner INSERT/DELETE + admin override | `thread_id` → `forum_threads(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE, `parent_id` → `forum_replies(id)` CASCADE |
| `forum_thread_likes` | Composite-PK like table mirroring `build_likes` pattern. Public SELECT | `thread_id` → `forum_threads(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE; PK `(thread_id, user_id)` |
| `forum_reply_likes` | Composite-PK like table for reply likes. Public SELECT | `reply_id` → `forum_replies(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE; PK `(reply_id, user_id)` |
| `content_reports` | User-submitted moderation flags on posts + forum threads + forum replies. Polymorphic `target_type` + `target_id`. Status `pending/dismissed/actioned`. Reporter snapshot (handle/name) + target snapshot (snippet) + target_url for admin deep-link. RLS: any auth user can INSERT as self; reporter SELECT own + admin SELECT all; admin-only UPDATE/DELETE. Realtime + replica identity full. DB trigger `notify_admins_of_content_report` fans new rows to every admin via notifications. See `project_content_moderation` | `reporter_id` → `auth.users(id)` SET NULL, `target_owner_id` → `auth.users(id)` SET NULL |
| `ambassadors` | One row per approved ambassador. `tier ∈ {ambassador, installer}`, `commission_rate_pct` (default 5), **`base_code`** (e.g. KYLELPO — seed for auto-derived code names on initial provision; admin can edit individual codes to anything, attribution lookup is code-row-based not prefix-based). Legacy Shopify columns (`shopify_discount_code`, `shopify_price_rule_id`, `shopify_discount_id`, `shopify_discount_pct`) mirror the primary code for back-compat but real source of truth lives in `ambassador_discount_codes`. Stripe columns for Phase 2 (`stripe_account_id`, `stripe_onboarded`). RLS: own row SELECT + admin SELECT/INSERT/UPDATE/DELETE. Realtime + replica identity full | `profile_id` → `profiles(id)` CASCADE |
| `ambassador_discount_codes` | One row per LOGICAL discount per ambassador. `role ∈ {primary, bulk_promo, legacy}`. Each row stores up to TWO Shopify discount code references: `code` + `shopify_price_rule_id` + `shopify_discount_id` (public, customer-facing, scoped to do $0 effective discount for attribution) AND `internal_code` + `internal_shopify_*` (staff-only with the actual discount value, manually applied on qualifying orders). `kind ∈ {fixed_amount, percentage, free_shipping}`, `value`, `min_purchase_amount`, `applies_to`, `template_id` (FK), `label`. `status ∈ {active, paused, deleted}` — soft-delete preserves attribution lookup; partial unique indexes on `code` and `internal_code` (`WHERE status != 'deleted'`) allow reuse after soft-delete. `visibility ∈ {visible, hidden}` — legacy imports default to hidden so they never surface on the ambassador's own dashboard. RLS: own ambassador SELECT + admin all. Realtime + replica identity full. See `project_ambassador_program` | `ambassador_id` → `ambassadors(id)` CASCADE, `template_id` → `ambassador_discount_templates(id)` SET NULL |
| `ambassador_discount_templates` | Admin-defined reusable bulk-add discount specs. `label`, `code_suffix` (e.g. "HOLIDAY" → produces KYLELPO-HOLIDAY etc.), `kind` + `value` + `min_purchase_amount` + `applies_to`, optional `starts_at`/`ends_at` active window (Shopify enforces), `status ∈ {active, archived}`. Bulk-apply walks all active ambassadors and invokes `shopify-create-discount-code` with role=`bulk_promo` + template_id (creating one public+internal pair per ambassador). Bulk-delete loops + soft-deletes all rows from the template. Admin-only RLS. Realtime + replica identity full | `created_by` → `auth.users(id)` SET NULL |
| `ambassador_orders` | Raw Shopify orders that used an ambassador's discount code, ingested via Phase 1B webhook. `subtotal`, `commission_eligible_subtotal` (subtotal minus excluded product_types), `classification ∈ {unclassified, deposit, confirmation_part, walk_in_part, excluded}`. Stores `raw_webhook` jsonb for debugging. `discount_code_id` (added 2026-05-27) records which ambassador_discount_code attributed the order — enables per-code breakdown without parsing raw_webhook. **Admin attribution cols (added 2026-05-29)**: `removed_at timestamptz` + `removed_by uuid` (soft-delete via `admin_remove_order` RPC; dashboard queries filter `removed_at IS NULL`), `is_manual boolean default false` (true when row was inserted via `admin_add_manual_order`; admin AMBASSADORS dashboard shows MANUAL chip), `admin_notes text`. Partial index `ambassador_orders_active_idx (ambassador_id, order_date desc) WHERE removed_at IS NULL`. RLS: own ambassador SELECT + admin SELECT. Writes via service role only OR the four admin SECURITY DEFINER RPCs. See `project_admin_order_actions` | `ambassador_id` → `ambassadors(id)` CASCADE, `journey_id` → `ambassador_journeys(id)` SET NULL, `discount_code_id` → `ambassador_discount_codes(id)` SET NULL, `removed_by` → `auth.users(id)` SET NULL |
| `admin_order_corrections` | Audit log of every admin attribution action (REMOVE / REASSIGN / EDIT-ELIGIBLE / MANUAL ADD). Each row carries `action`, `target_order_id`, `from_ambassador_id`, `to_ambassador_id`, `before_state jsonb`, `after_state jsonb`, required `reason text`, + actor snapshot (`actor_id`, `actor_handle`). Inserted only by the 4 SECURITY DEFINER RPCs. RLS: admin SELECT only. Realtime + REPLICA IDENTITY FULL. Future enhancement: read-side admin "Corrections Log" tab — data is collected but UI not yet built. See `project_admin_order_actions` | `actor_id`/`target_order_id`/`from_ambassador_id`/`to_ambassador_id` → respective tables SET NULL |
| `ambassador_journeys` | THE commission unit — a per-customer journey (deposit→confirmation OR walk-in). `state ∈ {deposit_only, confirmed, walk_in, paid, clawed_back, expired}`. `is_conflict` flag for admin queue when same customer touches multiple ambassadors. `expires_at = deposit_started_at + 180 days` for orphan deposits | `ambassador_id` → `ambassadors(id)` CASCADE, `payout_id` → `ambassador_payouts(id)` SET NULL |
| `ambassador_payouts` | One row per payout. `period_start/end`, `gross_amount`, `clawback_amount`, `net_amount`, `scheduled_for` (last biz day of next month). **Status lifecycle** (added 2026-05-27): `status ∈ {approved, paid, cancelled, failed}` + `approved_at` + `approved_by` + `paid_at` + `paid_by` + `notes`. Phase 2B Stripe cols: `stripe_transfer_id`, `transfer_failed_at`, `transfer_failure_message`. RLS: own ambassador SELECT + admin SELECT/INSERT/UPDATE. Realtime + REPLICA IDENTITY FULL | `ambassador_id` → `ambassadors(id)` RESTRICT, `approved_by`/`paid_by` → `auth.users(id)` SET NULL |
| `ambassador_discount_codes` | (existing schema doc above also covers this) — adds `click_count int default 0` + `last_clicked_at timestamptz` (2026-05-28) for the /r/CODE redirect tracking | — |
| `moderation_log` | Audit trail of every admin/moderator content delete (and the hide-for-review lifecycle). `actor_id`/`actor_handle`/`actor_role`, `action ∈ {delete_post, delete_post_comment, delete_forum_thread, delete_forum_reply, delete_build_comment, delete_camping_spot, delete_trip_report, hide_post, hide_forum_thread, hide_forum_reply}`, `target_type/id/owner_id/owner_handle/snapshot/url`, `reason`, `status ∈ {confirmed, pending_review, reverted}` + `reviewed_at`/`reviewed_by`. Pending-review rows require non-empty reason (CHECK constraint). RLS: admin SELECT only. Realtime + REPLICA IDENTITY FULL. See `project_moderator_privileges` | `actor_id`/`target_owner_id`/`reviewed_by` → `auth.users(id)` SET NULL |
| `commission_config` | Single-row config table for global commission settings — `excluded_product_types text[]` (default `['Merch']`), `default_ambassador_pct (5)`, `default_installer_pct (15)`, `default_discount_pct (10)`, `deposit_amount (500)`, `confirmation_min (5000)`, `pairing_window_days (180)`. Admin-editable | n/a |
| `gear_drops` | **Sponsored event subsystem (2026-06-11 → 2026-06-22).** Master row per gear drop = a poker-run-style race with a brand partner. `title`, `slug unique` (URL = `/drops/<slug>`), `brand_partner_name`, **`brand_partner_url`** (Phase 6 — clickable brand row + VISIT chip on memento), `brand_logo_url`, `hero_img`, `about text` (rich HTML), `prize_title`, `prize_description`, `prize_value_cents`, `prize_photos jsonb` (legacy single-prize fields — kept for SSR back-compat), **`prize_items jsonb default '[]'`** (Phase 7 multi-item pack — `[{id, title, description, value_cents, photos[]}]`, source of truth for editor + detail render), `route_data jsonb` (pins[] with `lat/lng/label/radius_m/showSnapLineFromPrev/hint_text/hint_photo_url/display_mode` + Phase 6 additions **`photo_prompt/note_prompt`** (per-waypoint host prompts) + **`loop_marker_mode text`** on last pin (split S/E vs separate pins — Phase 6 host toggle)), `start_lat/lng`, `arrival_radius_m int default 100`, `status check ('draft','scheduled','live','ended','archived')`, `starts_at/ends_at/signup_open_until/late_signup_window_min`, `afterparty_lat/lng/label/address/starts_at`, `winner_run_id FK trip_reports SET NULL`, `winner_announced_at`, `host_admin_id`. RLS: status<>'draft' public-read OR can_edit_gear_drop; INSERT/DELETE admin-only; UPDATE = can_edit_gear_drop. Realtime + REPLICA IDENTITY FULL. Gated by `GEAR_DROPS_ENABLED` (kill switch) + `profiles.is_beta_tester` pre-launch. See `project_gear_drops` for the full picture | `host_admin_id` → `auth.users(id)` SET NULL, `winner_run_id` → `trip_reports(id)` SET NULL |
| `gear_drop_editors` | Per-drop co-host grants (admin's "temp editor toggle" for brand partners). Composite PK `(gear_drop_id, user_id)`. Admin-only INSERT/DELETE. Powers the co-host search + grant panel in GearDropEditor | `gear_drop_id` → `gear_drops(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE, `granted_by` → `auth.users(id)` SET NULL |
| `gear_drop_comments` | Public discussion thread on the gear drop detail page. RLS: public SELECT for non-draft drops; owner INSERT; owner-or-admin DELETE. Realtime + REPLICA IDENTITY FULL | `gear_drop_id` → `gear_drops(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE |
| `trip_reports` extension | `kind` widened to include `'gear_drop_run'` (per-participant race row). Added cols `gear_drop_id FK gear_drops SET NULL`, `progress jsonb` ({waypointsUnlocked:[idx...], submissions:[{waypointIdx, photoUrl, note, lat, lng, distanceM, submittedAt}]}), `last_unlocked_at`, `finished_at`. One row per participant per drop. Owner-DELETE RLS lets them CANCEL ATTENDANCE. **Memento auto-publish on race finish (2026-06-12)**: gear_drop_advance_run flips the finisher's row to `status='published'` + `visibility='public'` + generated `name='@handle · <drop title>'` + `slug='<drop-slug>-<handle>'` + `hero_img=<first submission photo>` so the run becomes a permanent shareable recap. SELECT policy widened to include `kind='gear_drop_run' AND visibility='public'` so the public can read mementos. Direct URL `/trips/<slug>` resolves; the row is NOT surfaced on the public Trip Reports listing OR the Explore-map bbox (both filter `kind='report'`) — mementos live only on their parent drop's recap page + as a tappable card | (existing trip_reports FKs) |
| `notifications` extension | `gear_drop_id FK gear_drops CASCADE` + type enum widened to `'gear_drop_signup','gear_drop_unlock','gear_drop_won','gear_drop_winner','gear_drop_announcement','content_partner_review'` (2026-06-17 added content_partner_review for the content-partner welcome/review/breach notifications). **Insert MUST include `text` + `actor_name` (both NOT NULL) — see `feedback_notifications_require_text`. ALSO: DO NOT pass a `data` jsonb field from client-side inserts — PostgREST's schema cache doesn't expose it (PGRST204 + 400). The column exists at DB level for server PL/pgSQL writes only. See `feedback_notifications_no_client_data_column`** | (existing notifications FKs) |
| `content_partners` | **Influencer creator contract subsystem (chunks 1-6 shipped 2026-06-17).** One row per CONTRACT. `profile_id FK profiles CASCADE`, `status` enum `('pending_delivery','active','at_risk','completed','breached','ended')` (**`at_risk`** added 2026-06-17 chunk 6 — auto-flipped from 'active' on cumulative content delivery deficit, self-restores when partner catches up; **`breached`** is now MANUAL ONLY — admin flag for off-app issues that require invoicing), **`breach_source text check ('manual','auto')`** (chunk 4 — distinguishes the auto-flip path; auto-restore only fires when source='auto'), `contract_signed_at`, `camper_delivered_at`, `term_ends_at`, `discount_pct numeric(5,2)`, `contract_url text`, **three Dropbox URLs**: `dropbox_upload_folder_url` = FILE REQUEST URL (write-only), `dropbox_pending_folder_url` = partner-visible read, `dropbox_approved_folder_url` = ADMIN-ONLY (never shown to partner). `notes text` (breach flag appends `[YYYY-MM-DD] BREACHED — <reason>`; auto-flip appends `AUTO-BREACH` / `AUTO-RESTORE` entries), `created_by FK auth.users SET NULL`, timestamps. RLS: partner SELECT own + admin full. Realtime + REPLICA IDENTITY FULL. Gated by `profiles.is_content_partner`. See `project_content_partners` | `profile_id` → `profiles(id)` CASCADE, `created_by` → `auth.users(id)` SET NULL |
| `content_partner_quotas` | One row per deliverable kind per contract. `kind text` (built-ins `photo / short_video / long_video / basecamp_video`; admin can add `custom_<slug>` kinds — original CHECK constraint dropped 2026-06-17 chunk_1b), `label text` (NULL for built-ins; REQUIRED for customs), `notes text` (admin-only quota notes), `total_target int not null check > 0`, `cadence text` enum `('term','quarter','month','milestone')`, `schedule jsonb` (`{q1..q4}` or `{m1..m12}` for per-period breakdown; NULL = even distribution), `due_at timestamptz` (milestone kinds). UNIQUE `(partner_id, kind)`. RLS: partner SELECT own (via the contract) + admin full | `partner_id` → `content_partners(id)` CASCADE |
| `content_partner_deliverables` | One row per kind per submission. `submission_group_id uuid default gen_random_uuid()` batches rows from one inventory report. `kind text` (matches an existing quota — app-side check, no FK), `quantity_reported int > 0`, `quantity_accepted int` (NULL until reviewed; admin sets per row on approval — 0 = rejected, > 0 = approved), `partner_notes text` (partner attaches to submission), `submitted_at timestamptz`, `status text` enum `('pending','approved','rejected')`, `reviewed_by FK auth.users SET NULL`, `reviewed_at`, `reviewer_notes`. RLS: partner SELECT own + admin SELECT all. **Partner self-INSERT** only when contract `status='active' AND row.status='pending' AND quantity_accepted IS NULL AND reviewed_by/at IS NULL`. Admin full UPDATE/DELETE. Realtime + REPLICA IDENTITY FULL | `partner_id` → `content_partners(id)` CASCADE, `reviewed_by` → `auth.users(id)` SET NULL |
| `profiles.is_content_partner` | Admin-set boolean (admin toggles on OtherProfileScreen, same pattern as `is_moderator` / `is_beta_tester`). Independent of role / `is_ambassador` so a single user can hold any combination. Gates the partner-facing dashboard + UPLOAD CONTENT button. Admin does NOT auto-inherit (the dashboard would render nothing without a contract row) | n/a |

**Row Level Security (RLS):** Enabled on all tables. Public posts readable by anyone, mutations restricted to authenticated owner.

**`is_dm_participant(conv_id, uid)` SECURITY DEFINER function** — used by all `dm_*` policies to avoid recursion when a participant policy needs to self-reference dm_participants. Required because Postgres RLS would infinitely recurse otherwise.

**Realtime:** Publication includes `posts`, `post_likes`, `post_comments`, `post_comment_likes`, `notifications`, `profiles`, `follows`, `convoy_rsvps`, `dm_conversations`, `dm_participants`, `dm_messages`. REPLICA IDENTITY FULL on `posts`, `post_comments`, `post_likes`, `post_comment_likes`, `follows`, `convoy_rsvps`, `dm_*` (so DELETE payloads carry user_id for self-echo skipping). The app subscribes to two channels:
- `notifs_{uid}` — filtered INSERT on notifications for the current user
- `feed_realtime_{uid}` — broad listener for posts (INSERT/UPDATE/DELETE), post_comments (INSERT/DELETE), post_likes (INSERT/DELETE), post_comment_likes (INSERT/DELETE), profiles (UPDATE — propagates name/avatar changes to existing posts/comments), follows (INSERT/DELETE — own follower count), convoy_rsvps (INSERT/UPDATE/DELETE), dm_messages (INSERT — recipient un-hides hidden direct convos), dm_participants (INSERT/DELETE — keeps participant lists live)

**Storage buckets:** `avatars` (profile pics), `post-photos` (feed photos), `dm-attachments` (DM photo messages). All public-read; URLs are unguessable uuids and the message body containing them is RLS-protected. As of 2026-05-20: bucket-level `allowed_mime_types` lock down each bucket to images-only (avatars) or images+video (post-photos, dm-attachments), plus `file_size_limit`. Client-side helpers also validate MIME — defense in depth against direct-API attacks. **2026-05-26 video bump**: `MAX_UPLOAD_BYTES` raised from 45 MB → 200 MB (Pro tier; was a margin below the old free-tier 50 MB cap). post-photos + dm-attachments `file_size_limit` should be raised to 200 MB (209715200) to match. Per-surface video duration caps live in module-level `VIDEO_MAX_SEC = { feed: 60, trip: 90, dm: 30 }`, probed by `validateVideoDuration(file, maxSec)` (uses a temp `<video>` element). Rejections fire a `trailhead:upload_rejected` window CustomEvent so a global toast surfaces them. See `project_pre_launch_hardening` + `project_video_upload_limits`.

**DB triggers (push notifications):**
- `notifications_send_push` AFTER INSERT on `notifications` → calls `notify_push_on_notification_insert()` → delegates to `public._send_push_request('notifications', to_jsonb(NEW))` which reads `send_push_secret` from Vault and uses `net.http_post` (pg_net extension) to POST to the `send-push` Edge Function with `x-trailhead-push-secret` header
- `dm_messages_send_push` AFTER INSERT on `dm_messages` → same pattern via `notify_push_on_dm_message_insert()`; Edge Function looks up convo participants and pushes to all but the sender
- `dm_messages_bump_conv` AFTER INSERT on `dm_messages` → updates `dm_conversations.updated_at` for inbox sort
- `bug_reports_notify_admins` AFTER INSERT on `bug_reports` → SECURITY DEFINER `notify_admins_of_bug_report()` fans out a `bug_report`-type notification to every admin profile (excluding the reporter if they are themselves an admin). The downstream `notifications_send_push` trigger then delivers push to each admin's devices. See `project_bug_reports`.
- `content_reports_notify_admins` AFTER INSERT on `content_reports` → SECURITY DEFINER `notify_admins_of_content_report()` fans out a `content_report`-type notification to every admin (excluding the reporter if they happen to be admin). Same chain → push. See `project_content_moderation`.

**Web Push:**
- VAPID public key embedded in `trailhead-v1.jsx` (`VAPID_PUBLIC_KEY` const at top); private key stored ONLY as Supabase secret (`VAPID_PRIVATE_KEY`)
- Service worker at `deploy-v2.2/sw.js` handles `push` + `notificationclick` events; sends `{ type: "navigate", url }` postMessages back to the SPA for deep-linking
- Edge Function source: `supabase/functions/send-push/index.ts` (Deno, uses `npm:web-push@3.6.7`). Deploy via `supabase functions deploy send-push --no-verify-jwt`
- iOS push only works for installed PWAs — manifest at `deploy-v2.2/manifest.json` + iOS meta tags in build.sh's index.html template; banner hint in app prompts iOS Safari users to "Add to Home Screen"

### Cascade Deletion

When a user is deleted from `auth.users`, all their data cascades: profile, posts, likes, comments, notifications. When a post is deleted, its likes, comments, and related notifications cascade. The `notifications.actor_id` uses SET NULL (not CASCADE) so recipients keep "Someone liked your post" even if the actor deletes their account.

## File Structure

```
Trailhead/
├── entry.jsx                    # Mount point — createRoot + render
├── trailhead-v1.jsx             # Entire app (~15,000 lines)
├── supabase-client.js           # Supabase client init
├── build.sh                     # Build script (cleans old bundles, builds, updates index.html)
├── vercel.json                  # Vercel config — outputDirectory: deploy-v2.2, SPA rewrites
├── package.json                 # React/Supabase/Lucide deps for esbuild (untracked is fine)
├── deploy-v2.2/                 # Production deploy directory (Vercel serves this)
│   ├── index.html               # Shell HTML (regenerated by build.sh — has PWA + iOS meta)
│   ├── manifest.json            # PWA manifest (required for iOS web push)
│   ├── sw.js                    # Service worker for web push + click routing
│   ├── lone-peak-flag.png       # Logo / PWA icon / push icon
│   └── trailhead-bundle.*.js    # Single hashed esbuild bundle (one at a time after cleanup)
├── supabase/
│   ├── functions/send-push/     # Edge Function (Deno) for sending web push
│   │   └── index.ts             # Reads from notifications + dm_messages triggers
│   └── seed/
│       └── seed-camping-spots.js  # One-time camping_spots seed (OSM + Recreation.gov)
└── Trailhead Concept.pen        # Pencil design file with brand system
```

## Build & Deploy

**Build command:**
```bash
bash build.sh
```
Or manually:
```bash
npx esbuild entry.jsx --bundle --format=iife --global-name=TrailheadApp --target=es2020 --minify --outfile=deploy-v2.2/trailhead-bundle.HASH.js
```
Then update the `<script src>` in `deploy-v2.2/index.html` to point to the new hash.

**IMPORTANT:** Always build from `entry.jsx`, NOT from `trailhead-v1.jsx`. The main file has no render call — building it directly produces a bundle that loads but never mounts (app stuck on "Loading Trailhead...").

**Deploy (git push format Kyle uses):**
```bash
cd /Users/cainen/Documents/Claude/Projects/Trailhead && git add -A deploy-v2.2/ && git commit -m "short message" && git push
```
- Use `git add -A deploy-v2.2/` so the new bundle is added AND the previous one's deletion is recorded — this prevents stale bundles accumulating in git history. (The `-A` is scoped to deploy-v2.2/ so it can't pull in unrelated files.)
- Short one-line commit message
- No co-author tags
- `git push` (not `git push origin main`)
- Include the `cd` path prefix

Vercel auto-deploys from main branch. The `vercel.json` serves `deploy-v2.2/` as the output directory with SPA rewrites.

## Maps (Mapbox GL JS)

Trailhead's map surface migrated from Google Maps → Mapbox GL JS in May 2026. The lazy CDN loader lives in `loadMapbox()` and runs on first map use. Style: `mapbox://styles/mapbox/outdoors-v12`.

- **Token:** public `pk.*` token defined inline as `MAPBOX_TOKEN`. URL-restricted in the Mapbox dashboard to `trailhead.lonepeakoverland.com` + `trailhead2-2.vercel.app` + `localhost`. Tokens are designed to ship in the bundle; URL restrictions handle the security model.
- **API helpers:** `mapboxGeocode`, `mapboxGeocodeSearch` (multi-result), `mapboxReverseGeocode`, `mapboxDirections(from, to, { steps, waypoints })`.
- **Marker DOM:** Mapbox markers are HTML elements (no Symbol icons). Use `buildCircleMarkerEl(color, size)` and `buildEmojiMarkerEl(color, emoji, size)`.
- **Polylines:** GeoJSON line layers, not a `Polyline` class. Pattern: `map.addSource(id, { type: 'geojson', data: ... })` + `map.addLayer({ type: 'line', source: id, paint: {...} })`. Update with `source.setData(geom)`.
- **Elevation:** No native ElevationService. We use the free Open-Elevation API via `fetchElevationsAlongPath(coords)` for manual route entry. Falls back to `elevGain=0` if Open-Elevation times out.
- **External deep links** still use `https://www.google.com/maps/dir/?...` — the user's installed maps app handles them; that's not an API call.

### Map overlays

Two togglable overlay layers wired into RouteRecorder + RouteNavigation. Toggle UI is a top-left floating panel (`<MapLayerToggle>`); choices persist to `localStorage` (`th_show_camping`, `th_show_publands`).

- **Camping spots layer** — `useCampingSpotsLayer(mapInst, mapReady, rows, visible, onSelect)`. Clustered GeoJSON source (`clusterMaxZoom: 15`) with copper cluster bubbles + count, and forest-green circles for individual spots. Symbol-with-emoji rendering was tried first but the basemap font lacks emoji glyphs, so circles are used for reliability. Backed by `public.camping_spots`. Tap → `onSelect` callback. Camping layers are always lifted to the top of the stack via `moveLayer` so polygon overlays can't intercept clicks.
- **Public lands layer** — `usePublicLandsLayer(mapInst, mapReady, visible, onSelect)`. Backed by Mapbox vector tileset `lonepeakoverland.padus` (PAD-US 4.1, FED + STAT manager types only, clipped to CONUS — see PAD-US workflow below). Color-coded by `Mang_Name` via a Mapbox `match` expression: BLM yellow, USFS green, NPS purple, FWS periwinkle, USACE/USBR/TVA blue family, DOD muted red, SLB ochre, state recreation lands grass-green family. Palette is the `PUBLIC_LANDS_COLORS` map; agency-name lookup is `PUBLIC_LANDS_NAMES`. `Pub_Access` decoded via `PUBLIC_ACCESS_NAMES`. Inserts BELOW any existing camping layers via `beforeId` so click-priority stays correct.
- **Layer toggle:** collapsible top-left chip (`<MapLayerToggle>`); both layers default OFF. Choices persist to `localStorage` (`th_show_camping`, `th_show_publands`).
- **External camping deep links:** `campingSpotExternalLink(spot)` returns `{ url, label }` for `recgov` (`https://www.recreation.gov/camping/campgrounds/{source_id}`) and `osm` (`https://openstreetmap.org/node/{source_id}`) sources. User-added spots have no external page.
- **User-contributed spots:** `addCampingSpot({ name, lat, lng, description, ... })` at the root inserts with `source: 'user'`. The "+ ADD SPOT" button on RouteRecorder enters add-mode → next map tap stages a name/notes form.

### PAD-US tileset (public lands data)

Tileset `lonepeakoverland.padus` was uploaded via **Mapbox Tiling Service (MTS)** because the file exceeds the Studio web-UI 315 MB upload cap. Workflow if it ever needs to be regenerated (e.g. PAD-US 4.2 release):

```bash
# 1. Download PAD-US GDB from https://www.usgs.gov/programs/gap-analysis-project/science/pad-us-data-download
unzip PADUS4_X_Geodatabase.zip

# 2. Convert + filter (FED + STAT only) + clip to CONUS bbox + reproject to WGS84
ogr2ogr -f "GeoJSONSeq" -t_srs EPSG:4326 -nln padus \
  -spat -125 24 -65 50 -spat_srs EPSG:4326 \
  -select "Mang_Type,Mang_Name,Des_Tp,Unit_Nm,Loc_Nm,State_Nm,Pub_Access" \
  -where "Mang_Type IN ('FED', 'STAT')" \
  -lco RS=NO \
  padus.ldgeojson PADUS4_X_Geodatabase.gdb PADUS4_XFee

# 3. Install + auth tilesets CLI (needs a sk.* token with tilesets:write + uploads:write scopes)
pipx install mapbox-tilesets
export MAPBOX_ACCESS_TOKEN=sk.…

# 4. Upload source → create tileset from recipe → publish
tilesets upload-source lonepeakoverland padus-source padus.ldgeojson --replace
tilesets create lonepeakoverland.padus --recipe supabase/seed/padus-recipe.json --name "PAD-US Federal and State"
tilesets publish lonepeakoverland.padus
# Wait 15-60 min for tile generation. Status: https://studio.mapbox.com/tilesets/lonepeakoverland.padus
```

Recipe is at `supabase/seed/padus-recipe.json` (layer name `padus`, zoom 4-12, exposes 7 attributes). The `sk.*` token used for upload was created ad-hoc and revoked — create a fresh one if regenerating.

### Camping-spots seed

One-time data import script at `supabase/seed/seed-camping-spots.js`. Usage:
```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... RIDB_API_KEY=... node supabase/seed/seed-camping-spots.js
```
Fetches `tourism=camp_site` + `tourism=caravan_site` from OpenStreetMap (Overpass API; tries main + two mirrors) and federal campgrounds from Recreation.gov RIDB API. Upserts to `public.camping_spots` using `unique (source, source_id)` so re-runs are idempotent. RIDB key is free from https://ridb.recreation.gov/. Default bbox = continental US + southern Canada.

## Maps screen architecture (formerly "Routes")

Bottom-nav label is **"MAPS"** (key stays `routes`). After the late-May 2026 restructure, the Maps screen is a **full-bleed `<ExploreMap>`** — no tab bar, no chrome. Search bar overlays the top edge, layers chip lives bottom-left and opens upward, plus FAB sits bottom-right with **Add Spot / New Trip Report / Plan a Trip** (placeholder).

- **Trip Reports listing moved to the Feed** — the `ROUTES` filter pill was renamed `TRIP REPORTS`. Tapping it renders the trip-reports list (search, NEW button, YOUR DRAFTS, COMMUNITY TRIP REPORTS) instead of the post stream. Underlying ROUTES-type feed posts (route shares) still appear under `ALL`.
- **Saved bookmarks + Planner placeholder moved to Profile → Trips** as sub-tabs (CONVOYS | SAVED | PLANNER, default CONVOYS). Convoys filter pills (ALL / ORGANIZED / ATTENDING) live under CONVOYS.
- **Trip overlays hoisted to root**: `<TripReportDetail>`, `<TripReportCreator>`, slug-resolution + URL pushState + popstate effects all live on the `Trailhead` root component. `detailTripId` and `showTripCreator` state live at root too. Trip-nav effects MUST be declared *after* `allTripReports = useMemo(...)` to avoid TDZ on first render.

`RoutesScreen` itself is now ~30 lines — it just renders `<ExploreMap fillParent>` inside a `flex: 1, display: flex, flex-direction: column, height: 100%` wrapper that fills the space between TopBar and BottomNav.

### Trip Reports (Phases 1-4 shipped)

Five components handle the create → edit → publish → engage flow:

- **`<TripReportCreator>`** — three-step modal: disclaimer (real-trip checkbox) → name + brief description (creates the draft via `createTripDraft`) → choose route method (Live recording / Manual / Skip). Mobile fullscreen via `width:100%; max-width:430`.
- **`<TripPinFullscreen>`** — lightweight manual route editor used inside the trip-report flow. Strips the `RouteDetailsForm` chrome since trip metadata lives in the editor. Wraps `<RoutePinMap fillParent>` (new `fillParent` prop renders bare-map mode). Tapping a pin opens a bottom sheet for adding photos / removing the pin (uses new `onPinSelect` prop on RoutePinMap to override default tap-to-remove). Newly-placed pins auto-select so the photo sheet opens immediately. Uploads pin photos to `post-photos` via `uploadPostPhotoList(photos, currentUserId)` BEFORE handing them to the parent.
- **`<TripReportEditor>`** — full-screen draft editor. Sections (top to bottom): title, description, route preview (or ADD ROUTE buttons) with EDIT ROUTE button overlay, trailhead label, trip stats (distance/elev gain/max elev — auto-populated, editable), per-pin notes, trip metadata (difficulty/region/state/terrain/tags for SEO), photos, publish/delete. `handleSave` uploads any data:/blob: photos via `uploadPostPhotoList` first, then assembles route_data + auto-derives `hero_img` from the first uploaded photo (only adopts `https?://` URLs).
- **`<TripReportCard>`** — compact preview shown on the Trip Reports tab (hero image with gradient fallback, title, description, stats row, author chip + location).
- **`<TripReportDetail>`** — full-screen detail page. Header has BACK + (Heart with count) + SHARE-to-feed + (owner-only) EDIT. Body: hero, title, difficulty/location/date/view-count, terrains/tags, description, stats, trailhead+directions, route map, per-pin notes, photo grid, author footer. `useEffect`s call `onLoadRouteData` (lazy-fetch route_data jsonb the hydrate query omits) and `onBumpView` (RPC-backed view counter, ref-deduped).

Auto-fill behaviors in the editor:
- **Trailhead label + region + state** auto-populate from the first pin's coords via `mapboxReverseGeocodeRich(lng, lat)` once the route is attached. Only fills server-side-empty fields; persists immediately so it sticks across re-opens.
- **Distance + elevation gain + max elevation** auto-populate from route data: manual entry uses Mapbox Directions distance + Open-Elevation along the path; live recording uses the GPS track distance + altitude deltas (max via `computeMaxElevFtFromPoints`).
- **Slug** auto-generated from name on first save with `-2`, `-3` suffix retry on UNIQUE collisions (up to 5 attempts).

**Photo persistence (Phase 4 fix):** All four save paths that can write into `route_data.photos` (TripReportEditor, TripPinFullscreen, RouteRecorder→draft, manual-form→draft) now call `uploadPostPhotoList(photos, uid)` before persisting. Without this, photos were written as `data:image/jpeg;base64,...` strings into JSONB, blowing past Postgres row size limits and making `hero_img` un-renderable for other users. `publishTripDraft` defensively rejects data: hero candidates as a safety net.

**Engagement (Phase 4):**
- **Likes** via `trip_report_likes` (mirror of build_likes pattern): root state `likedTripIds` + `tripLikeCounts`, `toggleTripLike` optimistic update + notification insert + realtime echo skip, hydrated alongside trip_reports fetch.
- **View counter** via `bump_trip_view(p_trip_id)` SECURITY DEFINER RPC + `bumpedTripViewIds` ref for per-session dedup. Owner self-views excluded. Displays as `<Eye />` + count next to the date in the detail header.
- **Share-to-feed** via `shareTripToFeed(trip)` — creates a ROUTES-type feed post via `addPost` with `tripId`, `tripSlug`, `sharedFromOwnerHandle`/`sharedFromOwnerName` (when reshared). Hero comes from `trip.hero_img` (already a storage URL) or first photo.
- **Slug-based deep links**: `/trips/<slug>` parsed at module load (`__INITIAL_SHARED_LINK`) → root sets `pendingTripNav` → root effect resolves slug → `detailTripId` → `<TripReportDetail>` overlay renders. PushState `/trips/<slug>` on open, popstate handles browser back — all at the root since the detail is a global overlay (used to live inside RoutesScreen).
- **Feed ROUTES cards** show author header above the map (mirrors BUILDS pattern). Reshares show "Shared from @owner's trip report" line. Tapping the map or title routes to `/trips/<slug>` via `onOpenTripDetail` when `tripId`+`tripSlug` are set; legacy posts without those fields keep the old fullscreen-map / expand-in-place behavior.

Root state: `tripReports` array, `tripAuthors` (uid → profile snapshot for cross-user trips), `editingTripId` (current draft in the editor), `pendingTripDraftId` (when set, recorder/manual save routes into the draft instead of `userRoutes`), `showTripPinFullscreen` (manual entry overlay), `pendingTripNav` (slug awaiting resolution after deep-link / feed-card tap), `likedTripIds` + `tripLikeCounts`. Helpers: `slugifyTripName`, `createTripDraft`, `updateTripDraft`, `publishTripDraft` (auto-derives summary fields from `route_data` + rejects data: heroes), `deleteTripDraft`, `loadTripRouteData` (ref-deduped lazy fetch), `bumpTripView` (RPC + ref-deduped), `toggleTripLike`, `shareTripToFeed`.

The legacy `RouteDetailsForm` + `setShowManualRoute` flow is still mounted but unreached from trip-report flow — kept for the existing build-route-link form. Live recorder skips its own post-recording details form via `skipDetailsForm={!!pendingTripDraftId}` to avoid the same metadata-form redundancy.

**Phase 5 (partially shipped, May 2026):**
- ✅ **OG-tag injection** via `api/preview.js` Vercel serverless function — generates og:* + twitter:* meta tags for `/trips/:slug`, `/plans/:slug`, `/spots/:id`, `/builds/:id`, `/hq` URLs so social media scrapers (iMessage, Twitter, Slack, etc.) render rich preview cards. Function reads `deploy-v2.2/index.html` at module load (made available via `includeFiles` in `vercel.json`), looks up the entity in Supabase, injects meta tags + replaces `<title>`, returns the SPA bundle. Image is the entity hero or a 1200×630 Mapbox Static Image with a kind-tinted pin.
- ⏳ **sitemap.xml** + **JSON-LD** structured data + **comments on trip reports** still pending. See `memory/project_seo_blocked_on_domain.md` for status.

To add a new shareable entity type to OG previews: (1) add a rewrite to `vercel.json`, (2) add a branch to `resolveEntity` in `api/preview.js`, (3) add the entity to the `prettyPath` switch.

## Map overlays — viewport-driven framework

Late-May 2026 introduced a generic viewport-fetch pattern for any spatial data.

- **`useMapViewport(mapRef, ready, onChange, opts)`** — module-level hook that subscribes to a Mapbox map's `moveend` event, debounces 350ms, calls back with `{south, west, north, east}`. Reusable for any spatial layer.
- **`fetchCampingSpotsInBbox(bbox)`** + **`fetchTripReportsInBbox(bbox)`** — bbox SELECTs that filter via `gte/lte` on the lat column (and either lng range or an `or()` for antimeridian crossing). Both already wired into ExploreMap, RouteRecorder, RouteNavigation via the unified `onMapViewportChange` handler at root.
- **State pattern**: each viewport-driven feature has TWO state slices — `userX` (fetched once per session, contains everything the user owns) and `viewportX` (replaced on every settled pan). A `useMemo` union dedupes by id, with the user slice winning so local mutations stick. Camping uses this directly; trip reports also use it via `allTripReports = useMemo(merge(tripReports, viewportTripReports))`. **The trip-nav useEffects depend on `allTripReports`, so they must be declared after the useMemo to avoid TDZ.**
- Indexes added to support bbox queries: `camping_spots_lat_idx` (B-tree on lat), `trip_reports_start_lat_published_idx` (partial index where status='published').

## Camping spots — full feature set

User-added spots persist to `public.camping_spots` with: `name, lat, lng, description, spot_type, fee, source='user', user_id, visibility, photos jsonb, photo_url`.

- **Visibility**: `public` (everyone sees, RLS allows) vs `private` (only owner sees, RLS gates). Toggle in the new-spot + edit-spot forms; segmented control with `Globe / Lock` icons.
- **Color palette on map** (case expression on `circle-color`): green seeded (`#5B8C5A`) · red community-public (`T.red`) · copper private (`T.copper`).
- **Owner CRUD**: `addCampingSpot`, `updateCampingSpot`, `deleteCampingSpot` at root. Edit/delete buttons appear on the popup only when `currentUserId === spot.user_id`. Deletion strips from both userCampingSpots and viewportCampingSpots slices.
- **Photos** stored as jsonb array of `{url}` objects. Bbox/hydrate queries deliberately omit the `photos` column to keep list rendering light. `loadCampingSpotPhotos(id)` lazy-fetches per-spot via ref-deduped fetch when the popup opens. New photos uploaded to `post-photos` bucket via `uploadPostPhotoList` BEFORE persisting (same trap as trip reports). Popup renders horizontal photo strip; tap a thumbnail opens a full-screen lightbox with prev/next navigation.

## Trip reports on the map

Viewport-driven layer rendered by `useTripReportsLayer` with three sub-layers: line (purple polyline of `route_geom`) + start dot (purple-fill, white-stroke) + end dot (white-fill, purple-stroke — inverted). Layer toggle in `MapLayerToggle` (third row, default OFF, persisted to `th_show_trip_reports` localStorage).

- `route_geom jsonb` column stores ~80 simplified `[lng, lat]` tuples — derived by `deriveTripGeom(rd)` on publish + edit, never null after the backfill.
- `end_lat`, `end_lng` columns added alongside `start_lat`/`start_lng` so the layer can render endpoints without pulling the heavy `route_data` jsonb.
- **Selection focus**: when a trip is selected, all OTHER trips' line + end pins hide so the selected route reads cleanly. Start pins stay live for every trip so users can switch selection by tapping another.
- Popup includes inline marker key (Start / End swatches) + OPEN TRIP button (only in ExploreMap; recorder/navigation render info-only popups).

## Lone Peak Overland HQ pin

Permanent star marker at **47.405197703380196, -120.2072479120492** rendered on every map via `useLonePeakHQMarker(mapRef, ready, onSelect)`. Brand-red 36px disc with inline white SVG star. Popup card has side-by-side **DIRECTIONS** (Google Maps deep link) + **WEBSITE** (lonepeakoverland.com) buttons.

## Plan a Trip — map-first builder

The plan creation flow is map-first (no upfront modal asking for name/route method). State at root: `planBuilderActive`, `planBuilderPoints`, `planBuilderEndAnchorId`, `planBuilderEditingId`. Surfaced via a `planBuilder` prop object passed into ExploreMap.

- **Entry points**: FAB → "Plan a Trip" or any popup (spot/trip/HQ) → "PLAN A TRIP" / "ADD TO PLAN".
- **Position picker**: when adding from a popup, user picks START / MIDDLE / END. END tags the point as anchor — subsequent map taps insert BEFORE it so the destination stays last.
- **Per-segment routing**: each consecutive pin pair fires `mapboxDirections` on its own. Two-color line — copper dashed for road-following, RED dashed (`[1, 1.4]`) for off-road. Off-road = snapped Mapbox waypoint > 50m from user pin (`OFFROAD_THRESHOLD_M`). Caches per segment so notes/edits don't refetch.
- **Pin placement (unified)**: long-press anywhere (500ms hold) — or single-tap when armed via FAB Add Spot, or single-tap any time in plan mode — drops a **draggable** staged pin (`planTapPos`) at that spot. The pin is a Mapbox marker with `draggable: true`; drag it to fine-tune position before picking a type. The bottom type-picker shows context-appropriate buttons:
  - planActive: WAYPOINT / CAMP / CANCEL → adds the point and auto-opens the per-point notes panel via `setSelectedPlanPointId(addedId)`
  - otherwise: CAMP SITE / TRIP PLAN / CANCEL → CAMP SITE transitions to a compact name+notes form (`spotNotesPending`); TRIP PLAN hands off to `planBuilder.enter(seed)`
- **Compact spot-notes form**: replaces the prior giant inline form. Fields are name + notes only; visibility defaults to `public`, photos default to `[]`. Both are editable later via the spot popup's Edit button. The staged marker stays draggable while the notes form is open (drag updates `spotNotesPending` via `stagedDragTargetRef`). The marker recolors copper→green when the user picks CAMP SITE.
- **No magnifier**: removed in May 2026. Long-press just drops the draggable pin — the marker itself is the user's repositioning affordance, no zoom-loupe needed.
- **Save flow**: Save in the planning banner opens a `{name, description}` prompt (skipped when `editingId` is set — EDIT ROUTE re-entry). `commitPlanToDraft` densifies the route via parallel per-segment Directions calls, writes `route_data.points` as `{lat, lng}` objects, and tracks `route_data.offroadRanges` (`[[startIdx, endIdx], ...]`). After save, opens the page-style detail view with inline editing (NOT the form editor).
- **Detail page = inline editing for owner** when `trip.kind === 'plan'`. Title, description, visibility toggle, planned dates, party size, per-pin notes are all editable in place; auto-saves on blur. EDIT ROUTE button re-enters the builder with `planBuilderEditingId` set so save UPDATES the existing row.
- **TripReportCard** has plan badges (PLAN / PRIVATE / DRAFT / planned date chip). Profile → Trips → PLANNER tab lists user's plans. OtherProfileScreen TRIPS tab lists the viewed user's published+public plans only.

## Generic share-compose flow

Every share-to-feed and share-via-DM in the app routes through a generic compose modal at root. User adds caption + sees a card preview before posting/sending.

- **State**: `shareComposeTarget` is a generic shape `{ action, accent, IconComponent, cardLabel, cardCta, cardTitle, cardBody, cardImage, captionPlaceholder?, onSubmit }`. The modal is pure chrome (caption + preview + Post/Send button).
- **Helper**: `openShareCompose({ kind, action, data })` at root constructs the target. Kinds: `spot`, `trip`, `plan`, `hq`, `build`, `forum`, `route`, `post`. (Recovery RESPOND is direct `openDM` — known recipient, intent-specific message, not a "share".)
- **Static map previews**: `spotStaticMapUrl`, `tripStaticMapUrl`, `hqStaticMapUrl` use Mapbox Static Images API (`outdoors-v12` style + a kind-tinted built-in pin). Reuses existing `MAPBOX_TOKEN`. `spotStaticMapUrl(lat, lng)` is the camping-spot card hero on feed + DM.
- **Caption persistence**: share helpers (`shareCampingSpotToFeed`, `shareTripToFeed`, `shareTripPlanToFeed`, `shareHQToFeed`) accept `captionRaw` and write it to a dedicated `caption` field on the post — NOT into `title`. The feed renderer (POST + ROUTES branches) renders `item.caption` as a paragraph above any inline card. **Don't overload `title`** — the feed render hides title when the inline-card branches show, so caption-as-title silently disappears.
- Inline card branches in the POST renderer key off `item.spotId`, `item.planId && item.planSlug`, `item.hqShare`. ROUTES branch (trip-report shares) has its own card.
- Triggered from: ExploreMap share sheet (every popup), trip detail page SHARE button, Builds detail Share menu, Forum thread share buttons, Feed post share menu (DM), Feed route post share menu (DM).

## Map-layer init quirk (load-bearing toggle stagger)

On fresh ExploreMap mount with multiple layers ON (per localStorage), Mapbox sometimes renders layers as empty until the user manually toggles them off then on. Affects `useTripReportsLayer`, `useTripPlansLayer`, `usePublicLandsLayer` (camping-spots cluster source happens to dodge it).

**The fix is fragile** — there's a useEffect tied to `[mapReady]` in ExploreMap that:
1. Bumps a `layerRefreshTick` after 250ms (re-runs every layer hook's `ensureLayers`)
2. Walks each ON layer and programmatically toggles its setter `false` → `true` (~140ms gap for GeoJSON, **1200ms for public-lands** — vector tiles need time to fetch)
3. Staggers the toggles 300ms apart (batching multiple in the same render makes Mapbox drop all but one)
4. Does a final extra trip-reports re-toggle when public-lands is also ON (public-lands' presence breaks trip-reports without it)

Inside each `ensureLayers` we ALSO force-toggle visibility (set to `"none"` first then to the target). Both layers of defense are needed — DON'T remove either without testing fresh-mount with all 4 layers ON. See `feedback_mapbox_layer_init_quirk.md` for the full diagnosis trail.

### External APIs in use (besides Mapbox + Supabase)

- **Open-Elevation** (`https://api.open-elevation.com`) — free, no key, used by `fetchElevationsAlongPath(coords)` to sample elevation along a manual route. Caps at 256 sample points per request. Falls back to `elevGain=0` if the API times out (it's been flaky historically).
- **Overpass API** (OSM camping seed) — `overpass-api.de` + 2 community mirrors as fallbacks. Form-encoded POST.
- **Recreation.gov RIDB** (federal campgrounds seed) — needs an `apikey` header.

## Edge Function Deploy

The `send-push` Edge Function lives at `supabase/functions/send-push/index.ts`. To redeploy after editing it:

```bash
cd /Users/cainen/Documents/Claude/Projects/Trailhead && supabase functions deploy send-push --no-verify-jwt
```

`--no-verify-jwt` is required because the Postgres triggers call the function without an auth header. Secrets (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SEND_PUSH_SECRET`) are already set in Supabase — only re-set them if rotated. `SEND_PUSH_SECRET` is the shared-secret bearer token the DB triggers send via the `x-trailhead-push-secret` header; the function timing-safe-compares and rejects 401 if missing/wrong. Same value is mirrored in Supabase Vault under name `send_push_secret` so the triggers can read it via `vault.decrypted_secrets`. See `project_pre_launch_hardening` for the rotation recipe. **2026-06-12 update**: `buildNotifPayload` now branches on `notif.type.startsWith("gear_drop_")` — when set, it looks up `gear_drops.slug` + `hero_img` via `resolveGearDropPreview(notif.gear_drop_id)` and sets `data.url = /drops/<slug>` + `image = drop.hero_img`. Tag becomes `gd:<id>:<type>` for dedupe. The SPA's SW message handler in `trailhead-v1.jsx` has a matching `/drops/<slug>` branch (warm-tab tap → `setPendingGearDropSlug`); cold-boot taps already work via `__INITIAL_SHARED_LINK`. **CLI gotcha**: run `supabase functions deploy` from the project root — the CLI resolves `supabase/functions/<name>/index.ts` relative to CWD, NOT the linked project, so running from any other directory uploads an empty function payload with `Entrypoint path does not exist` errors.

### Admin push broadcast — `broadcast-push`

`supabase/functions/broadcast-push/index.ts`. Called from the AdminDashboardScreen Push tab. Deploy WITHOUT `--no-verify-jwt`:
```bash
cd /Users/cainen/Documents/Claude/Projects/Trailhead && supabase functions deploy broadcast-push
```
Supabase gateway validates the caller's JWT; the function then re-asserts admin role server-side via service-role lookup of `profiles.role` (defense in depth). Resolves recipients per segment ('all' / 'admin' / 'ambassador' / 'user'), fans out web push using the same VAPID config as send-push, inserts a `push_broadcasts` audit row, returns `{ok, recipient_count, failed, status}`. See `project_admin_dashboard`.

### Auto-generated image alt text + AI moderation — `generate-alt-text`

The `generate-alt-text` Edge Function lives at `supabase/functions/generate-alt-text/index.ts`. Called by the client from `attachAltTextToPhotos` (sibling of `uploadPostPhotoList`) right after the photo upload resolves a public storage URL. Single Claude Haiku 4.5 vision call returns BOTH a descriptive alt text AND a moderation flag — same cost, single round trip:

```json
{ "alt": "Red 4Runner at sunset", "moderation": { "adult": false, "reason": "" } }
```

Conservative adult-content threshold — explicit nudity / sexual acts only; swimwear and shirtless camping shots are NOT flagged (outdoors community). Fail-open if Claude returns malformed JSON (alt becomes the raw text, moderation defaults `adult:false`) so legitimate uploads don't get false-positive blocked.

`uploadPostPhotoList` enforces the flag: blocked entries are deleted from storage (`supabase.storage.from("post-photos").remove([path])`), a `trailhead:moderation_blocked` CustomEvent is dispatched on window so the root toast fires, and the function throws an `Error` with `code: "moderation_blocked"` + `blocked: [...]` so callers that catch can handle gracefully. See `project_content_moderation` for the full surface. Avatar + DM-attachment paths NOT yet moderated (follow-up).

Photos persist as `{url, alt}` jsonb objects in `posts.data.photoUrls`, `builds.build_data.mainPhotos[]` / per-mod `.photo[]`, `trip_reports.route_data.photos[]` / per-pin `.photo[]`, and `camping_spots.photos[]`. Legacy uploads (before May 2026) stay as bare URL strings; the `imgAlt(p)` helper returns "" for those so renders don't blow up. `uploadPostPhotoList` upgrades string entries to `{url, alt}` objects on the fly when alt text comes back.

OG preview cards (`api/preview.js`) lift photo alt out of the matching photo object by URL (`findPhotoAlt(photos, url)`) and emit it as `og:image:alt` + `twitter:image:alt`. Falls back to a descriptive default keyed off entity name when no per-photo alt exists.

Secrets: `ANTHROPIC_API_KEY` (set via `supabase secrets set ANTHROPIC_API_KEY=sk-ant-…`). Optional `MODEL_OVERRIDE` to swap to a different Claude model. Deploy via:
```bash
cd /Users/cainen/Documents/Claude/Projects/Trailhead && supabase functions deploy generate-alt-text
```
(NOT `--no-verify-jwt` — JWT auth is required so the function can extract user id for rate limiting.)

Cost at current scale: ~$0.0001–0.0003 per image (Claude Haiku 4.5 vision). 1k uploads/month ≈ $0.10–0.30; revisit if it ever scales past 50k/month.

### Shopify ambassador integration — `shopify-create-discount-code` / `shopify-webhook` / `shopify-backfill-orders` / `shopify-register-webhooks` / `shopify-lookup-order`

Native ambassador program (replaces Collabs Shopify app). Phase 1A = code provisioning. Phase 1B = order ingestion + commission engine. See `project_ambassador_program` for the full picture.

- **`shopify-create-discount-code`** (WITH JWT, admin-only) — multi-action function. Default `action=create` provisions a primary or bulk_promo discount: creates BOTH public + internal Shopify price_rules/codes + inserts one `ambassador_discount_codes` row. Also handles `replace_existing` (used by REBUILD PRIMARY + EDIT CODE — soft-deletes existing row + creates new), `custom_public_code` (EDIT CODE rename), `action=delete` (soft-delete DB + hard-delete Shopify), `action=import_legacy` (link pre-existing Shopify codes to an ambassador, hidden from their dashboard). Primary public code is scoped to the DEPOSIT product specifically (`SHOPIFY_DEPOSIT_PRODUCT_ID`) at `percentage value="-0.0"` so it's 0% off the deposit only — prevents customers from using codes to score free shipping on accessories or merch.
- **`shopify-webhook`** (deployed `--no-verify-jwt` — auth via HMAC SHA-256 keyed by `SHOPIFY_CLIENT_SECRET`) — dispatches by `topic` header to `handleOrderPaid(order)` or `handleOrderRefunded(order)`. **orders/paid**: Looks up `discount_codes` against `ambassador_discount_codes.code OR internal_code` (regardless of status — soft-deleted rows still attribute historical orders), inserts `ambassador_orders` idempotently via `shopify_order_id` UNIQUE + `Prefer: resolution=ignore-duplicates`, then runs the classification + journey state machine (deposit_only → confirmed when cumulative ≥ $5000; new walk_in if ≥ $5000 with no prior deposit). Customer matching: any of email / shopify_customer_id / normalized name within the 180-day window. **Commission base = order subtotal (post-all-discounts) minus post-discount value of merch line items** — uses `subtotal_price` directly, NOT `line_items[].discountedTotalSet` (that misses order-level discount allocations). **orders/refunded** (Phase 1B.6, 2026-05-27): recomputes from scratch each delivery (Shopify includes ALL refunds in the order payload each time — idempotent). Walks `order.refunds[]`, sums `transactions[].amount where kind='refund'` for cumulative `refunded_amount`, sums `refund_line_items[].subtotal_set.shop_money.amount` for non-merch parents (looked up via `line_items[].product_type`). Updates `ambassador_orders.{refunded_amount, commission_eligible_subtotal, raw_webhook}` then re-sums journey orders' post-refund eligibles to recompute `commission_eligible_total` + `commission_amount`. State transitions: `paid → clawed_back` (always); `confirmed`/`walk_in` with newCommission=0 → `clawed_back`; otherwise reduce only. Deposit_only journeys keep state. Surfaced in ambassador dashboard as REFUNDED chip + struck subtotal in recent-orders feed + expanded journey-card order rows; journey-card already renders `clawed_back` red.
- **`shopify-register-webhooks`** (WITH JWT, admin-only) — one-shot helper. Lists existing webhooks, deletes stale URLs, registers `orders/paid` + `orders/refunded` against our webhook endpoint. Idempotent. Triggered by REGISTER WEBHOOKS admin button in DISCOUNTS → TEMPLATES tab.
- **`shopify-backfill-orders`** (WITH JWT, admin-only) — pulls historical orders matching an ambassador's codes via GraphQL Admin API, runs same classification engine. Used for testing AND for migrating real Collabs-era ambassadors' historical attribution. Processes orders chronologically (oldest first) so deposits land before confirmations. **Gotcha**: Shopify GraphQL `discount_code:` filter is case-sensitive + only matches NATIVE Shopify discount codes (not Collabs-only constructs). When backfill returns 0 orders for a code that should match, see `project_collabs_migration_playbook` for the 4 failure modes + use `shopify-lookup-order` + MANUAL ADD ORDER UI as the per-order fallback.
- **`shopify-lookup-order`** (WITH JWT, admin-only, added 2026-05-29) — POST `{ order_number: "#12345" }` → GET `/admin/api/{ver}/orders.json?name=#12345&status=any` → returns `subtotal`, `customer_email/shopify_id/name`, `order_date`, `suggested_eligible` (subtotal minus excluded product_types per `commission_config`), `line_items[]`. Powers the Shopify-lookup mode of the admin MANUAL ADD ORDER modal so admin doesn't type numbers from another tab. Requires `read_all_orders` Shopify scope for orders >60 days old.

Required Supabase secrets:
- `SHOPIFY_ADMIN_TOKEN` — long-lived `shpat_` token from OAuth install
- `SHOPIFY_SHOP_DOMAIN` — `lone-peak-overland.myshopify.com`
- `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET` — for OAuth-app webhook signing verification
- `SHOPIFY_DEPOSIT_PRODUCT_ID` — numeric Shopify product ID for the DEPOSIT product (scopes primary public codes)

Deploy:
```bash
cd /Users/cainen/Documents/Claude/Projects/Trailhead && \
  supabase functions deploy shopify-create-discount-code && \
  supabase functions deploy shopify-webhook --no-verify-jwt && \
  supabase functions deploy shopify-register-webhooks && \
  supabase functions deploy shopify-backfill-orders
```

Shopify app config lives at `/Users/cainen/Documents/Claude/Projects/Trailhead/shopify-app-config/shopify.app.toml`, managed via Shopify CLI. To update scopes / redirect URLs / app config, edit the toml and run `shopify app deploy` from that directory.

API version: `2026-04` (locked in toml + edge functions).

**Phase 1B.5/.6 SHIPPED (2026-05-27)**: Conflict queue UI lives at admin AMBASSADORS → CONFLICTS sub-tab (red badge with count, per-conflict card with current attribution + linked orders + RE-ATTRIBUTE picker + DISMISS); backed by `resolve_conflict_attribution(p_journey_id, p_new_ambassador_id)` (atomic re-attribute journey + all linked orders + clear flag) and `dismiss_conflict_flag(p_journey_id)` (just clears flag) SECURITY DEFINER RPCs. Refund handling lives in `handleOrderRefunded` inside `shopify-webhook` — recomputes from scratch each delivery, paid→clawed_back state transition.

**Admin analytics RPCs** (applied 2026-05-27, all admin-only via `is_admin()` + `#variable_conflict use_column`, granted to authenticated):
- `admin_ambassador_overview_stats()` — single row: pending/paid commission totals + counts of active ambassadors / pending journeys / confirmed / paid / expired / conflicts / orders
- `admin_commission_vs_payouts_by_month(p_months int default 6)` — earned-vs-paid stacked bars on the EARNED VS PAID chart (admin analytics tab). Returns `(month date, earned numeric, paid numeric)` for the last N months
- `admin_top_earner_ambassadors(p_limit int default 10)` — leaderboard with handle/full_name + total/pending/paid commission + journey count, filtered to active ambassadors with commission > 0
- `admin_pending_journey_list(p_limit int default 50)` — deposit_only journeys awaiting confirmation, with `days_until_expiry`, sorted by `expires_at asc` (soonest-to-expire first). Used by admin DISCOUNTS → ANALYTICS sub-tab.
- `admin_top_click_ambassadors(p_limit int default 10)` (2026-05-28) — leaderboard sum of `ambassador_discount_codes.click_count` across all of each ambassador's codes (status != deleted). Returns ambassador info + total_clicks + last_clicked_at. Powers TOP SHARE-LINK CLICKS card

**Payout workflow RPCs** (2026-05-27): `admin_all_pending_payouts()` (un-linked confirmed/walk_in commissions grouped by month for the admin queue), `admin_approve_payout(p_ambassador_id, p_period_start, p_period_end, p_scheduled_for, p_notes)` (atomic insert + link journeys + insert payout_approved notification), `admin_mark_payout_paid(p_payout_id, p_notes)` (flips payout + journeys to paid), `admin_cancel_payout(p_payout_id)` (un-links, status=cancelled).

**Stripe Connect edge functions** (2026-05-27, Phase 2A+2B):
- `stripe-connect-onboard` (WITH JWT) — creates Stripe Express account on first call (saves `ambassadors.stripe_account_id`) + returns AccountLink onboarding URL. refresh_url + return_url both go to `https://trailhead.lonepeakoverland.com/?stripe_return=1`. Admin can onboard for any ambassador; ambassador can onboard for self.
- `stripe-connect-status` (WITH JWT) — fetches account from Stripe API + syncs `ambassadors.stripe_onboarded`. Used by return-from-Stripe handler + manual REFRESH STATUS.
- `stripe-webhook` (`--no-verify-jwt`, HMAC via `STRIPE_WEBHOOK_SECRET`) — handles `account.updated` (sync onboarded) + `transfer.reversed` (rare Stripe-side reversal → flip payout to status=failed, revert journeys to confirmed).
- `stripe-transfer-payout` (WITH JWT, admin-only, Phase 2B) — replaces the manual MARK PAID action. POSTs to /v1/transfers with amount in cents, idempotency key = `trailhead_payout_${id}_retry_${prior_failure_ms}` (retry-aware so admins can retry after fixing insufficient funds). On success: persists `stripe_transfer_id`, flips payout to paid + journeys to paid, inserts `payout_paid` notification (push fires via DB trigger). Description format: `LPO ambassador commission · {Full Name} · {Month Year}`.

Required Stripe secrets: `STRIPE_SECRET_KEY` (test mode: `sk_test_...`; switch to `sk_live_...` for production), `STRIPE_WEBHOOK_SECRET` (whsec_... — per endpoint).

**Pre-launch Stripe checklist**: (1) Switch to live mode keys in Supabase secrets, (2) re-register webhook endpoint in Stripe live mode dashboard, (3) decide on 1099 filing path — current config is `fees.payer=application_express` so LPO is filer of record; options are switch to `fees.payer=account` (Stripe files 1099-K, ambassador pays Stripe fees) OR keep current + use Stripe Tax for Connect / Track1099 (~$2/form). Decide before Jan 2027 tax season.

**Share-link redirect** (2026-05-28): `api/r.js` Vercel serverless function. Rewrite `/r/:code` → `/api/r?code=:code`. Function calls `bump_discount_code_click(p_code)` RPC (anon-granted, SECURITY DEFINER — looks up by code OR internal_code, status != 'deleted', increments counter), then 302s to `https://lonepeakoverland.com/discount/{CODE}?redirect=/`. Shopify's `/discount/` URL pattern sets a session cookie + persists the discount through to checkout (more reliable than `?discount=` query param).

## Design System

Defined in code as the `T` object (line ~6):

| Token | Value | Usage |
|---|---|---|
| `T.red` | `#BD472A` | Primary brand red, CTAs, destructive actions |
| `T.copper` | `#C49A6C` | Accent copper, highlights, links |
| `T.tertiary` | `#8B7D6B` | Muted text, secondary elements |
| `T.charcoal` | `#2A2A28` | Card backgrounds |
| `T.darkBg` | `#111111` | App background |
| `T.darkCard` | `#1A1A1A` | Darker card variant |
| `T.white` | `#FFFFFF` | Primary text on dark |
| `T.green` | `#4A7C59` | Success, follow actions |

**Typography:** Sans-serif (`Trebuchet MS, Gill Sans, sans-serif`) for headings/UI, `Source Serif 4` (Google Fonts) for body text. Referenced as `sans` and `serif` variables in code.

**Dark theme only.** No light mode.

## Major Components (all in trailhead-v1.jsx)

| Component | Line | Purpose |
|---|---|---|
| `Trailhead` | ~12450 | Root component. All state, auth, hydration, realtime subscriptions, CRUD functions |
| `FeedScreen` | ~1482 | Social feed with filters, likes, comments, share, edit/delete |
| `ForumScreen` | ~2760 | Forum with categories, threads, replies, rich text |
| `RouteRecorder` | ~4145 | GPS route recording with live map |
| `RoutesScreen` | ~5911 | Route library browse/search/save |
| `BuildsScreen` | ~6248 | Vehicle builds gallery |
| `RanksScreen` | ~7750 | Leaderboard and loyalty points |
| `ProfileScreen` | ~8744 | User profile with settings, activity, builds |
| `OtherProfileScreen` | ~9676 | View other users' profiles (fetches from Supabase) |
| `AdminDashboardScreen` | ~18739 | Admin-only analytics + push broadcast. 4 tabs (Overview / Users / Content / Push). Inline SVG charts (`Sparkline`, `StackedBars`, `AdminStatCard`). See `project_admin_dashboard` |
| `GearDropsListScreen` / `GearDropEditor` / `GearDropDetailScreen` / `GearDropRunScreen` / `GearDropLiveTracker` | (search by name) | Gear Drops UI surfaces. **List**: admin DRAFTS/SCHEDULED/LIVE/ENDED tabs. **Editor**: full admin form (basic / prize / lifecycle inc arrival_radius_m / waypoints w/ PREVIEW ROUTE ON MAP read-only toggle / afterparty w/ reverse-geocoded address autofill / co-hosts / status / DUPLICATE TO DRAFT / DANGER ZONE inc cascade delete for ended drops). **Detail**: public hero + brand row + about + prize carousel + countdown + start map w/ arrival popup + AFTERPARTY reveal card (gated on winner_announced_at) + stats row + **HOST CONTROLS** card (admin/host only — GO LIVE / END EVENT / SEND ANNOUNCEMENT / LIVE TRACKER) + LEADERBOARD + RACER RECAPS cards + comments + JOIN/ATTENDING. **Run**: live race overlay with live Mapbox map (target marker + radius gate ring + user puck + camera flyTo per pin) + leaderboard + GPS distance gate + ARRIVED submit sheet w/ chime+haptic + YOU WON overlay. Broadcasts {lat,lng,handle,full_name,avatar_url,unlocked,last_seen_at} every 15s on Supabase Realtime presence channel `gd_track_<drop_id>` for the host's tracker. **LiveTracker** (host-only fullscreen overlay): Mapbox map + route polyline + numbered pin markers + 36px avatar pucks w/ name chip per active racer + live submission feed cards (photo+note+timestamp, max 3 visible, auto-expire 45s) + chime+haptic on every submission. Stale racers (last_seen >90s) fade to 45% opacity. See `project_gear_drops` |
| `GDImageCropper` / `GDImagePicker` / `GDMultiImagePicker` / `GDRichEditor` / `GDPinRow` / `useGearDropPinBuilderLayer` | (search by name) | Gear Drops module-scope helpers (hoisted to avoid the inline-component-state-wipe trap). Cropper uses `addEventListener({passive:false})` for wheel + touchmove. RichEditor uses scoped `gd-rb` CSS (`padding-left:0; list-style-position:inside`) so bullets + paragraphs share the same left edge. PinBuilderLayer mirrors `usePlanBuilderLayer` (Mapbox Directions segment routing + 50m off-road threshold); **loop course detection** — when pin 0 and last pin are within 25m, renders a single 36px split S/E badge (half copper / half red) instead of stacking E on S. `makeCircleGeoJSON(lat,lng,radiusM)` — equirectangular polygon for the run screen's radius gate ring. `playGearDropWaypointChime()` — two-note Web Audio synth chime (A5→E6) used on racer + host submission events. `triggerGearDropWaypointHaptic()` — `navigator.vibrate([60,30,60])`. See `project_gear_drops` |
| `ContentPartnersAdminScreen` / `ContentPartnerEditor` / `ContentPartnerDashboard` / `ContentPartnerUploadModal` / `PendingSubmissionCard` | (search by name) | Content Partners surfaces (2026-06-17). **AdminScreen**: tabbed list — PENDING REVIEW (red urgent badge) / ACTIVE / PENDING DELIVERY / COMPLETED / ENDED. PendingSubmissionCard per group: partner avatar + "Xd ago" + pending FOLDER quick-link + per-kind row w/ reported count + editable accepted input (defaults to reported) + reviewer notes (REQUIRED when any rejected) + three buttons REJECT ALL / SAVE AS ENTERED / CONFIRM AS REPORTED. **Editor**: contract form. Partner picker is a focus-driven dropdown of every `is_content_partner=true` profile w/ green NEW / copper EXISTING badges. 3 Dropbox URL inputs (upload request / pending folder / approved folder — last is ADMIN-ONLY). Quotas section: 4 built-in cards + ADD CUSTOM KIND button; each card togglable w/ cadence dropdown (TERM single input, MILESTONE total + due, QUARTER/MONTH "same # each" toggle that flips to Q1-Q4 / M1-M12 grid); per-quota NOTES textarea. BACKDATE DELIVERIES section (existing partners only). STANDING section w/ FLAG NOT IN GOOD STANDING (required reason → status='breached' + appended to admin notes + partner notif) or RESTORE TO ACTIVE. **Dashboard** (partner overlay launched from copper PARTNERSHIP pill on ProfileScreen): status pill + days-left + PENDING FOLDER + VIEW SIGNED CONTRACT buttons (approved folder hidden); per-kind progress cards w/ status pill (ON TRACK / BEHIND / AHEAD / DONE / PAST DUE / DUE SOON), colored progress bar, white "expected by now" tick, accepted/pending/target row; YOUR SUBMISSIONS history grouped by submission_group_id w/ "4/5" format when admin adjusted. Sticky UPLOAD CONTENT button (active contracts only). **UploadModal**: per-kind counter row w/ quota notes as hint; submit batches all non-zero kinds into ONE `submission_group_id`; on success ALSO `window.open`s the upload-request URL so partner gets bounced straight to Dropbox to drop in files. Module-scope helpers `contentPartnerKindLabel(q)` + `computeContentPartnerQuotaProgress(quota, deliverables, contract)` resolve labels + progress (term prorating, per-period cumulative + partial, milestone past-due). See `project_content_partners` |
| `LoginScreen` | ~9954 | Email/password + Google OAuth login |
| `SignupScreen` | ~10080 | Registration flow |
| `OnboardingScreen` | ~10477 | Post-signup profile setup |
| `ComposeScreen` | ~10857 | Create new post (text, photos, routes, builds, convoys) |
| `RecoveryScreen` | ~11593 | Recovery assist feature |
| `DMScreen` | ~11715 | Direct messaging |
| `MapOverlay` | ~243 | Mapbox GL JS integration for routes/recovery |
| `GlobalSearch` | ~1116 | Cross-feature search |
| `TopBar` | ~1011 | App header with notifications |
| `BottomNav` | ~730 | Tab bar navigation |

## Key Patterns

**Optimistic updates:** All mutations (like, comment, delete) update local state immediately, then write to Supabase. On failure, they log errors but don't revert (fire-and-forget for most cases).

**DB↔Client shape translators:** `dbRowToFeedItem`, `dbRowToComment`, `dbRowToLocalBuild`, `dbNotifToBell` — these convert Supabase row shapes to the local state shapes that screens expect.

**feedItemsRef:** A `useRef` mirror of `feedItems` state, updated via useEffect. Used inside async Realtime callbacks that need to read the latest feed state without stale closures.

**requireAuth / Guest gating:** `requireAuth(fn)` wraps mutation callbacks — if the user is a guest, it shows a sign-in prompt instead of executing the action.

**Shared links:** URL format `/post/{id}` — parsed once at module load (`__INITIAL_SHARED_LINK`) before React mounts, to avoid double-render race conditions. Forum threads use `/forum/<sub-slug>/<thread-slug>`; subcategory pages use `/forum/<sub-slug>`. ForumScreen pushState + popstate handler keep the full forum stack history-aware.

**Desktop 3-col layout:** at viewport ≥ 1024px, `isDesktop = matchMedia("(min-width: 1024px)").matches` flips. The existing mobile 430px column gets wrapped in a 3-col flex shell: 260px left nav (vertical version of BottomNav + POST button + user pill) + center column + 340px right info sidebar (welcome card + forum categories + admin's pending-ambassador-requests widget when applicable). BottomNav hidden on desktop. Feed filter pills lifted to root (`feedFilter` + `setFeedFilter`) so the left sidebar can nest them under the Feed nav item AND the inline pill bar reflects the same state. See `project_desktop_layout`.

**User roles:** `currentRole` / `isAdmin` / `isAmbassador` derived at root from `currentProfile.role` (must be declared EARLY, right after currentProfile, to avoid TDZ on downstream useEffects). `isAdmin` is passed as prop into FeedScreen / ForumScreen / OtherProfileScreen so owner-only UI gates also fire for admins. Server-side RLS enforces the same via admin-override policies. Admins are server-assigned only (`update profiles set role='admin' ...`). Ambassador is approval-gated via `requested_role`. See `project_user_roles_system`.

**SSR pipeline** (api/preview.js): every entity URL injects a complete `<article>` (breadcrumb → h1 title → byline → hero → body → footer) into the SPA's `#root` div before React mounts. React's `createRoot.render()` swaps to the interactive SPA on mount. Crawlers see real content; humans see the article paint immediately on slow loads then transition. Helpers: `ssrArticleShell`, `ssrAuthorByline`, `ssrCrumbs`. Per-entity builders: `buildForumThreadSSR`, `buildForumSubSSR`, `buildTripArticleSSR`, `buildCampingSpotSSR`, `buildBuildSSR`, `buildHQSSR`, `buildPostSSR`. `sanitizeForumHtml` strips dangerous tags + on*= handlers before injecting user HTML.

## Rank / Points System

Seven tiers from Scout (0pts) to Legend (100k+ pts). Points awarded for posting, commenting, recording routes, etc. `RANK_TIERS` array defines thresholds, colors, and icons. `getUserRank(points)` returns the current tier. `RankBadge` and `RankBadgeWithName` render the badge UI.

## Known Quirks / Watch Out For

1. **No package.json** — dependencies must be available to esbuild at build time. If you `npm init` and add deps, the build still works but you'll need to adjust the workflow.
2. **Many old bundle files** in `deploy-v2.2/` — `build.sh` cleans them but manual builds accumulate. Only the one referenced in `index.html` matters.
3. **Seed/mock data** still exists in the code (e.g., `USER_POINTS`, `SEED_MY_BUILDS`, forum seed data). Real data comes from Supabase; seeds are fallback/demo content.
4. **`posts_type_check` constraint** — the posts table has a CHECK constraint that must include all post types: `POST`, `PHOTOS`, `ROUTES`, `BUILDS`, `CONVOYS`. If you add a new type, update the constraint via SQL.
5. **Realtime requires replica identity** — `post_likes` uses `REPLICA IDENTITY FULL` so DELETE events include the full row (needed to decrement like counts). If you add realtime to other tables, set replica identity accordingly.
6. **13,700-line single file** — this is intentional for now. All components are in one file. When making edits, search by component name or function name to navigate.

## SQL Already Applied

The following have been run in the Supabase SQL Editor across prior sessions:
- Tables: profiles, posts, post_likes, post_comments, post_comment_likes, notifications, builds, follows, convoy_rsvps, dm_conversations, dm_participants, dm_messages, push_subscriptions, build_likes, dm_message_likes, camping_spots, trip_reports, trip_report_likes, build_comments, build_comment_likes
- RLS policies on all tables
- Realtime publication on posts, post_likes, post_comments, post_comment_likes, notifications, profiles, follows, convoy_rsvps, dm_conversations, dm_participants, dm_messages, build_likes, dm_message_likes, camping_spots, trip_reports, trip_report_likes, build_comments, build_comment_likes
- REPLICA IDENTITY FULL on post_likes, post_comments, post_comment_likes, follows, convoy_rsvps, dm_*, build_likes, dm_message_likes, camping_spots, trip_reports, trip_report_likes, build_comments, build_comment_likes
- `notifications.build_id uuid REFERENCES builds(id) ON DELETE CASCADE` (added May 2026 for build-comment deep-linking; bell click routes to BuildsScreen when build_id is set)
- **Slim-fetch + lazy hydrate** for builds gallery: `loadAllBuildsOnce` now SELECTs only `id, user_id, name, year, make, model, trim, hero_img, created_at` (skipping the heavy `build_data` jsonb that was timing out at 57014). The user's own builds keep using `select("*")` (small set, eq user_id). Detail page lazy-fetches `build_data` via `loadBuildById` when it opens against a slim row. `loadBuildById` setAllBuilds REPLACES the slim entry with the fully-hydrated version. Same pattern can be applied to any large jsonb-heavy table.
- `build_comments.parent_id uuid REFERENCES build_comments(id) ON DELETE CASCADE` (added May 2026 for forum-style threaded replies; nesting capped at depth 1 in UI)
- ON DELETE CASCADE on all user_id FKs, SET NULL on notifications.actor_id and camping_spots.user_id
- CHECK constraint on posts.type including POST, PHOTOS, ROUTES, BUILDS, CONVOYS
- `is_dm_participant(conv_id, uid)` SECURITY DEFINER helper used by all dm_* policies
- `dm_message_likes.emoji text not null default '❤️'` column for iMessage-style reactions
- `camping_spots.unique(source, source_id)` for idempotent seed re-runs
- `trip_reports.slug text not null unique` for SEO-friendly URLs (auto-generated client-side, retry on collision)
- `trip_reports.status text check in ('draft', 'published')` and dual SELECT policy: `status = 'published' OR auth.uid() = user_id`
- `trip_reports.max_elev_ft integer` (added after initial creation — max elevation auto-derived from route data)
- `trip_report_likes(trip_id, user_id)` composite-PK like table mirroring `build_likes` exactly (RLS, replica identity full, realtime publication)
- `bump_trip_view(p_trip_id uuid) returns void` — SECURITY DEFINER RPC that increments trip_reports.view_count for published rows. Granted to anon + authenticated. Lets viewers bump the owner's row past RLS without exposing UPDATE perms.
- `posts_created_at_idx on public.posts (created_at desc)` — added after the unindexed `select * order by created_at desc limit 100` started hitting the PostgREST statement timeout (Postgres code 57014). When other timestamp-sorted tables get hot, mirror this pattern (post_comments, notifications, dm_messages, trip_reports).
- One-time data: URL cleanup on `trip_reports`: nulled `hero_img` and stripped data: entries from `route_data.photos` + `route_data.pins[].photo` after the photo-upload-before-persist bug fix. Future flows should never need this — `uploadPostPhotoList` is wired into all four trip save paths now (editor / TripPinFullscreen / live recorder / manual form).
- `camping_spots.visibility text check in ('public','private') default 'public'` — for community/private toggle. SELECT policy `visibility = 'public' OR auth.uid() = user_id`. Owner UPDATE/DELETE policies (`auth.uid() = user_id`).
- `camping_spots.photos jsonb default '[]'::jsonb` — multi-photo array (stored as `[{url, name?}]`). Bbox/hydrate selects deliberately omit this column; `loadCampingSpotPhotos(id)` lazy-fetches per-spot when the popup opens.
- `camping_spots_lat_idx on public.camping_spots (lat)` — B-tree on lat for the bbox `gte/lte` predicate path. Lng filter happens on the smaller subset.
- `trip_reports.end_lat double precision`, `trip_reports.end_lng double precision`, `trip_reports.route_geom jsonb` — derived on publish/edit by `deriveTripGeom(rd)` so the bbox layer can render the line + endpoints without the full `route_data`.
- `trip_reports_start_lat_published_idx on public.trip_reports (start_lat) where status = 'published'` — partial index for bbox queries.
- One-time backfill on `trip_reports`: populated `end_lat`, `end_lng`, `route_geom` from existing `route_data` for already-published rows (1:N subsample of points/pins, ~80 tuples). Subsequent publishes/edits keep these in sync via `updateTripDraft` auto-recompute.
- **Plan a Trip extension** (May 2026): `trip_reports` doubles as a planner. Added columns: `kind text not null default 'report' check in ('plan','report')`, `visibility text not null default 'public' check in ('public','private')`, `planned_start date`, `planned_end date`, `party_size int`, `checklist jsonb default '[]'::jsonb`, `promoted_to_trip_id uuid references trip_reports(id) on delete set null`. SELECT policy reissued to `auth.uid() = user_id OR (status='published' AND (kind='report' OR (kind='plan' AND visibility='public')))` so private plans stay owner-only. Partial index `trip_reports_kind_status_start_lat_idx on (kind, start_lat) where status='published'` for the per-kind bbox queries. New `kind='plan'` rows render via `useTripPlansLayer` (dashed copper line, copper-fill start dot, white-fill copper-stroke end dot). Bbox fetcher `fetchTripPlansInBbox` mirrors the trip-reports one but filters `kind='plan'`. Root state: `viewportTripPlans` slice + `allTripPlans` memo (dedup + graft pattern from `mergeTripSlices`). `allTripReports` filters out plans explicitly so legacy consumers don't accidentally render them.
- **Forum DB tables** (May 2026): `forum_threads` (id, user_id, category_slug, subcategory_slug, title, slug unique, body, sections jsonb, photos jsonb, pinned, view_count, created/updated_at), `forum_replies` (id, thread_id FK, user_id FK, parent_id self-FK, body, photos jsonb), `forum_thread_likes` + `forum_reply_likes` (composite PK). Indexes: `forum_threads_sub_created_idx (subcategory_slug, created_at desc)`, `forum_threads_cat_created_idx`, `forum_threads_created_at_idx`, `forum_replies_thread_id_created_idx (thread_id, created_at asc)`, `forum_replies_parent_id_idx`. RLS: public SELECT; owner INSERT/UPDATE/DELETE + admin override. Realtime publication + REPLICA IDENTITY FULL on all four. `bump_forum_thread_view(p_thread_id uuid)` SECURITY DEFINER RPC granted to anon + authenticated for view-count increments without UPDATE perms. `notifications.forum_thread_id uuid references forum_threads(id) on delete cascade` + index for bell deep-linking from role/like/reply notifications. `forum_threads.sections jsonb default '[]'::jsonb` for the multi-section editor payload.
- **User roles** (May 2026): `profiles.role text not null default 'user' check (role in ('user', 'ambassador', 'admin'))` + index. `profiles.requested_role text check (requested_role is null or requested_role in ('ambassador'))` + partial index. `public.is_admin(uid uuid) returns boolean` + `public.is_ambassador_or_admin(uid uuid)` SECURITY DEFINER helpers (granted to anon + authenticated). `profiles_role_guard` trigger (BEFORE INSERT OR UPDATE on profiles): non-admins can only INSERT with role='user', can NEVER UPDATE role. Admins bypass everything. Admin-override RLS policies added as SEPARATE same-op policies (Postgres ORs them) on profiles (UPDATE only, `profiles_admin_update`), forum_threads, forum_replies, posts, post_comments, builds, build_comments, trip_reports, camping_spots — each `for {update|delete} using (public.is_admin(auth.uid()))`. Idempotent SQL via a DO block + pg_policies check. **The profiles policy was added 2026-05-20** after admin role-change clicks were silently no-opping — Supabase's `.update().eq()` returns `{error:null, data:[]}` when RLS filters all rows. Admin role mutations now chain `.select("id")` and treat zero rows as an explicit error. See `project_user_roles_system`.
- **SEO infra** (May 2026): `/sitemap.xml` via `api/sitemap.xml.js` (queries Supabase per request — home, HQ, every forum subcategory landing, every forum thread, every published trip/plan, every build, every public camping spot, every public user profile). `/robots.txt` static at `deploy-v2.2/robots.txt`. `api/preview.js` carries every-entity OG + JSON-LD + canonical + BreadcrumbList + SSR injection into `<div id="root">`. `vercel.json` rewrites: `/sitemap.xml`, `/forum/:sub/:slug`, `/forum/:sub`, `/users/:handle`, plus the existing per-entity rewrites. Forum threads emit DiscussionForumPosting OR QAPage (when title ends with `?`) with Comment[] schema. User profiles emit ProfilePage + Person + 4-section content hub (builds / trips / threads / spots) for E-E-A-T. All entities emit a per-type Schema.org type (Article / TouristAttraction / LocalBusiness / Article+Vehicle / ProfilePage). See `project_seo_blocked_on_domain` + `project_pre_launch_hardening`.
- **Forum categories + subcategories DB tables** (2026-05-20, Phase 2): `forum_categories` (id, slug unique, name, color, icon, sort_order, created_by, timestamps) + `forum_subcategories` (id, category_id FK RESTRICT, slug, name, sort_order, created_by, timestamps; unique(category_id, slug)). Indexes: `forum_categories_sort_idx`, `forum_subcategories_cat_sort_idx`, `forum_subcategories_slug_idx`. RLS: categories admin-only mutation via `is_admin()`; subcategories INSERT via `is_ambassador_or_admin() AND auth.uid() = created_by`, UPDATE/DELETE by owner OR admin-override (separate policies, Postgres ORs them). Realtime + REPLICA IDENTITY FULL. Seeded with the original 6 hardcoded cats + 30 subs (idempotent INSERT...ON CONFLICT DO NOTHING). `api/preview.js` loads via a 60s-TTL in-memory cache; `api/sitemap.xml.js` fetches per request. Old `forumData.categories` constant + module-level populate loop REMOVED — module-level `FORUM_CAT_BY_SLUG`/`FORUM_SUB_BY_SLUG` maps are now mutable and refreshed by a root useEffect off the hydrated state. See `project_forums_db_persistence`.
- **Forum marketplace listing columns** (2026-05-20): `alter table forum_threads add column listing_price numeric, listing_currency text default 'USD', listing_status text default 'active' check (listing_status in ('active','sold','withdrawn')), listing_details jsonb default '{}'::jsonb`. Partial index `forum_threads_marketplace_idx on (subcategory_slug, listing_status, created_at desc) where category_slug = 'marketplace'` for future browse/filter UI. RLS unchanged — owner UPDATE + admin override on `forum_threads` already covers it. Status flips fire through `updateForumThread({listingStatus: ...})`. See `project_marketplace_listings`.
- **Saved trips table** (2026-05-20): `saved_trips (user_id uuid FK auth.users CASCADE, trip_id uuid FK trip_reports CASCADE, saved_at timestamptz default now(), primary key (user_id, trip_id))`. Index `saved_trips_user_idx on (user_id, saved_at desc)`. RLS: owner-only SELECT/INSERT/DELETE via `auth.uid() = user_id`. Realtime publication + REPLICA IDENTITY FULL. See `project_saved_trips`.
- **Pre-launch hardening SQL** (2026-05-20):
  - **Notifications RLS lockdown** — dropped existing INSERT policies on `public.notifications`, replaced with `notifications_actor_insert` (`for insert to authenticated with check (auth.uid() = actor_id)`). Plus CHECK constraint `notifications_type_check` enforcing `type IN ('like','comment','mention','reply','follow','rsvp','role','recovery','convoy')`. Stops anyone from forging push-phishing notifications.
  - **Storage bucket MIME + size lockdown** — `update storage.buckets set allowed_mime_types = ARRAY[...]::text[], file_size_limit = N where id in (...)`. `post-photos` + `dm-attachments`: jpeg/png/webp/gif + mp4/quicktime/webm, 100MB cap. `avatars`: jpeg/png/webp only, 5MB cap. Defense in depth — bucket-level rejects bypass-the-helper attacks (direct `supabase.storage.upload()` via DevTools).
  - **send-push shared-secret lockdown** — `vault.create_secret(<random>, 'send_push_secret')` + new `public._send_push_request(p_table, p_record)` SECURITY DEFINER helper that reads from vault and POSTs to edge function with `x-trailhead-push-secret` header. Trigger functions `notify_push_on_notification_insert()` + `notify_push_on_dm_message_insert()` recreated to delegate to the helper. Same secret value stored as `SEND_PUSH_SECRET` env var on the edge function — it timing-safe-compares header to env. Stops anyone with the function URL from blasting arbitrary push notifications.
  - See `project_pre_launch_hardening` for the full pass + the SHOULD-FIX backlog still pending.
- **Admin dashboard SQL** (2026-05-21):
  - `profiles.last_seen_at timestamptz` + `profiles_last_seen_at_idx`. Heartbeat-driven; powers Live Now + DAU on `/admin`.
  - `bump_last_seen()` SECURITY DEFINER RPC — `update profiles set last_seen_at = now() where id = auth.uid()`. Called by client every 60s while foregrounded.
  - `push_broadcasts (id uuid pk, sender_id uuid FK auth.users SET NULL, body text, segment text check ('all','admin','ambassador','user'), image_url text, recipient_count int, sent_at timestamptz, status text check ('sent','partial','failed'))`. RLS: admin SELECT-only. No INSERT policy (only edge function via service role writes). Realtime + REPLICA IDENTITY FULL. `image_url` added 2026-05-21 evening for v2 image-attachment broadcasts.
  - Admin analytics RPCs — all SECURITY DEFINER + `is_admin(auth.uid())`-gated + granted to authenticated. **MUST have `#variable_conflict use_column` directive after `as $$`** to avoid OUT-param-name collisions with column refs (see [[plpgsql-out-param-collision]]). RPCs: `admin_get_overview_stats()` (10 cols incl WAU/MAU/stickiness_pct/pending_ambassadors), `admin_get_signups_daily(int)`, `admin_get_dau_daily(int)` (union of heartbeat + every user-action table), `admin_get_posts_by_type_daily(int)` (padded N×5 grid where N=p_days), `admin_get_role_breakdown()`, `admin_get_top_creators(int)`, `admin_get_engagement_totals()`, `admin_get_push_recipient_count(text)`, `admin_get_push_history(int)` (returns image_url). **v3 additions (2026-05-21 evening)**: `admin_get_pending_ambassadors(int)`, `admin_get_recent_signups(int, int)`, `admin_get_trending_posts(int)` (likes + 2×comments in last 7d), `admin_get_forum_category_activity()`, `admin_get_most_followed(int)`, `admin_get_push_delivery_stats()`, `admin_get_recent_activity(int)` (UNION ALL across posts/threads/spots/builds/trips with kind discriminator).
  - See `project_admin_dashboard` for the full feature.
- **Camping spots — admin moderation + community photos** (2026-05-22):
  - Admin override RLS on `camping_spots`: `camping_spots_admin_update` + `camping_spots_admin_delete`, each `for {update|delete} using (public.is_admin(auth.uid()))`. ORed by Postgres with the existing owner policies so owner OR admin can mutate. See `project_camping_spots_community`.
  - `add_camping_spot_photo(p_spot_id uuid, p_url text, p_alt text)` — SECURITY DEFINER RPC; any authenticated user can add a photo to any spot. URL allowlist (must start with our Supabase storage public origin). Appends `{url, alt, added_by, added_at}` to `camping_spots.photos` jsonb.
  - `delete_camping_spot_photo(p_spot_id uuid, p_url text) returns boolean` — SECURITY DEFINER; deletes the first photo matching `p_url`. Authorized for admin OR `added_by === auth.uid()` OR spot owner. Both RPCs use `#variable_conflict use_column`.
- **Recovery RESPOND group DM** (2026-05-22):
  - `alter table dm_conversations add column recovery_post_id uuid references posts(id) on delete set null`. Unique partial index `dm_conversations_recovery_post_id_unique on (recovery_post_id) where recovery_post_id is not null and type = 'group'` — mirrors `convoy_post_id` constraint.
  - `respond_to_recovery(p_post_id uuid) returns table(conv_id uuid, joined boolean)` — SECURITY DEFINER RPC. Verifies post type='RECOVERY', looks up or creates the group DM linked to the post (with requester + responder as initial participants), adds responder if not already in. Returns `(conv_id, joined)` so the client conditionally sends the "I'm responding…" auto-message only on first join. See `project_recovery_group_dm`.
- **Bug reports** (2026-05-26):
  - `bug_reports` table (description text, screenshot_url text, context text, device_info text, reoccurs text check ('yes','no','not_tried'), status text check ('open','fixed'), admin_notes text [legacy], notify_on_fix boolean, fixed_at timestamptz, fixed_by uuid FK, reporter snapshot fields). RLS: `bug_reports_user_insert` (auth user as self), `bug_reports_admin_select` + `bug_reports_admin_update` (is_admin only). Realtime + REPLICA IDENTITY FULL.
  - `bug_report_comments` table — multi-admin discussion thread per bug. FK CASCADE on bug delete. RLS: admin-only SELECT/INSERT-as-self/DELETE-own. Realtime + REPLICA IDENTITY FULL.
  - `notify_admins_of_bug_report()` SECURITY DEFINER trigger function (AFTER INSERT on bug_reports) — fans out `bug_report` notifications to every admin except the reporter themselves. Uses `#variable_conflict use_column`.
  - `notifications.type` CHECK enum widened to add `'bug_fix'` (admin → reporter when fix is marked) and `'bug_report'` (trigger → admins on new bug). Full enum: `('like','comment','mention','reply','follow','rsvp','role','recovery','convoy','bug_fix','bug_report')`.
  - See `project_bug_reports` for the full feature.
- **Content reports + AI moderation** (2026-05-26):
  - `content_reports` table — user-submitted moderation flags. Polymorphic `target_type ∈ ('post','forum_thread','forum_reply')` + `target_id uuid`. Reporter snapshot (id/handle/name) + target snapshot (id/owner/snippet/url) + `reason_code ∈ ('spam','harassment','adult','violence','hate','offtopic','illegal','other')` + free-text details. `status ∈ ('pending','dismissed','actioned')`. RLS: any auth user INSERT as self; reporter SELECT own + admin SELECT all; admin-only UPDATE/DELETE. Indexes `(status, created_at desc)`, `(target_type, target_id)`, `(reporter_id)`. Realtime + REPLICA IDENTITY FULL.
  - `notify_admins_of_content_report()` SECURITY DEFINER trigger function (AFTER INSERT) — fans `content_report` notifications to every admin (excluding reporter if admin). Uses `#variable_conflict use_column`.
  - `notifications.type` enum widened to add `'content_report'`. Full enum now: `('like','comment','mention','reply','follow','rsvp','role','recovery','convoy','bug_fix','bug_report','content_report')`.
  - **AI image moderation** — `generate-alt-text` edge function extended to return `{alt, moderation:{adult,reason}}` from a single Claude Haiku 4.5 vision call (same cost as alt-text alone). Conservative threshold: only explicit nudity/sexual acts flagged. `uploadPostPhotoList` deletes blocked URLs from storage + emits `trailhead:moderation_blocked` window event for global toast + throws `Error.code = "moderation_blocked"`. Covers feed posts, builds, trip reports, camping spots, bug-report screenshots, push images. NOT yet wired into avatars or DM attachments. See `project_content_moderation`.
- **Gear Drops 2026-06-12 batch** (after the initial Phase 0-3c shipped 2026-06-11):
  - `20260612_gear_drops_arrival_radius.sql` — adds `gear_drops.arrival_radius_m int default 100` for the host-tunable arrival popup threshold on the detail page.
  - `20260612_gear_drops_phase_4_memento.sql` — extends `gear_drop_advance_run` so the final-pin submission flips the racer's `trip_reports` row to `status='published'` + `visibility='public'` + `name='@handle · <drop title>'` + auto-generated `slug='<drop-slug>-<handle>'` (-2/-3/random tail retry on UNIQUE collision) + `hero_img=<first submission photo>`. Wrapped in EXCEPTION block — memento publish failure must NEVER block the race finish. Widens `trip_reports` SELECT policy to include `kind='gear_drop_run' AND visibility='public'` so the public can read mementos via `/trips/<slug>` AND so the gear drop recap page can list them. Mementos stay excluded from `fetchTripReportsInBbox` + `allTripReports` (both filter `kind='report'`).
  - `20260612_gear_drops_admin_delete_cascade.sql` — new `admin_delete_gear_drop_cascade(p_drop_id uuid)` SECURITY DEFINER RPC. Wipes participant `trip_reports` rows FIRST (gear_drop_id FK is SET NULL so a plain delete would leave orphan mementos), then the drop. FK cascades on editors/comments/notifications handle the rest. Returns `{ok, runs_deleted}`. Client `deleteGearDrop` calls this regardless of state — drafts no-op the runs delete; ended/archived drops use it for full test cleanup. Editor exposes DELETE GEAR DROP on ended/archived drops; live + scheduled keep the END EVENT gate.
  - `20260612_gear_drops_host_broadcast.sql` — widens `notifications.type` CHECK to include `gear_drop_announcement` + installs `gear_drop_broadcast_announcement(p_drop_id uuid, p_body text)` SECURITY DEFINER RPC. Caps body at 280 chars; inserts a notification row per participant EXCEPT the actor (host doesn't push to self); existing `notifications_send_push` trigger fans out web push. `can_edit_gear_drop`-gated so admin + host_admin_id + co-hosts can all send. Returns `{ok, sent_to}`. Wired into the HOST CONTROLS card on `GearDropDetailScreen` via SEND ANNOUNCEMENT modal.
  - **Live tracker** uses Supabase Realtime PRESENCE (not DB writes) — channel `gd_track_<drop_id>`. Each racer's `GearDropRunScreen` joins + `track()`s {lat,lng,handle,full_name,avatar_url,unlocked,last_seen_at} every 15s while in foreground (skipped after finished_at). Host's `GearDropLiveTracker` subscribes + reconciles avatar pucks (36px disc anchored 'bottom' w/ dark name chip below). Stale racers (last_seen_at >90s) fade to 45% opacity. Live submission feed on the tracker uses a separate `postgres_changes` realtime sub on `trip_reports` — diffs `progress.submissions` length and queues a card per fresh submission (photo thumb + racer + waypoint label + note + relative timestamp; max 3 visible; auto-expire 45s). `playGearDropWaypointChime()` (Web Audio synth, A5→E6) + `triggerGearDropWaypointHaptic()` (`navigator.vibrate([60,30,60])`) fire on every submission detected by the tracker AND on the racer's own submit. iOS Safari AudioContext is gesture-locked — the racer's submit tap satisfies; the host's tap-to-open-tracker satisfies.
- **Content Partners 2026-06-17 batch** (9 migrations under `supabase/migrations/20260617_content_partners_*.sql`):
  - `chunk_1` — `profiles.is_content_partner boolean default false`; 3 new tables (`content_partners`, `content_partner_quotas`, `content_partner_deliverables`) w/ RLS gating partner-self-read + admin-full + partner self-INSERT on deliverables ONLY when contract status='active' AND row.status='pending' AND quantity_accepted IS NULL. Realtime + REPLICA IDENTITY FULL.
  - `chunk_1b_custom_quotas` — DROPs CHECK on `kind` column on BOTH `content_partner_quotas` AND `content_partner_deliverables` so admin can register custom quota types (slug-ified as `custom_<slug>`). Adds `label` + `notes` columns to quotas.
  - `chunk_3_review_notif` — widens `notifications.type` CHECK to include `'content_partner_review'`.
  - `chunk_3b_approved_folder` — adds `dropbox_approved_folder_url` (admin-only).
  - `chunk_3c_pending_folder` — adds `dropbox_pending_folder_url` (partner-visible read).
  - **`chunk_4_compliance`** — adds `content_partners.breach_source text check ('manual','auto')`. Installs `recompute_content_partner_standing(p_partner_id uuid)` SECURITY DEFINER RPC — walks cadence-based quotas, sums base expected vs approved across ENDED periods, flips status active ↔ breached/auto on deficit. Companion `recompute_all_content_partner_standings()` admin-only sweeper. Auto-restore only fires when breach_source='auto'.
  - **`chunk_5_breach_can_upload`** — widens `content_partner_deliverables_partner_insert` RLS to allow INSERT when contract status IN ('active','breached','at_risk'). Without this, auto-breached partners couldn't upload to catch up.
  - **`chunk_6_at_risk_status`** — adds new status value `'at_risk'`. Backfills all historical `breached + auto` rows → `at_risk`. Recompute RPC re-defined to flip `active ↔ at_risk` (never touches 'breached'). 'breached' is now reserved for MANUAL admin flags (off-app invoicing). See `project_content_partners`.
- **Gear Drops 2026-06-22 batch** (Phases 5/6/7 + field-test fixes):
  - **`phase_5_leaderboard_visibility.sql`** — fixes 2 field-test bugs sharing the same RLS root cause. Widens `trip_reports` SELECT policy to allow `kind='gear_drop_run'` rows when parent drop's status IN ('scheduled','live','ended','archived') — was previously gated on `published+public` so in-progress racer rows were invisible to non-owners and the leaderboard appeared frozen. Lifts memento auto-publish OUT of the winner branch — EVERY finisher's run now flips to status='published' + visibility='public' + slug + hero_img + name (was winner-only, so non-winners had no slug and their recap wasn't reachable via /trips/<slug>). Backfill publishes historical non-winner finished runs.
  - **`phase_6_brand_url.sql`** — adds `gear_drops.brand_partner_url text`. Per-waypoint photo_prompt/note_prompt + loop_marker_mode live in `route_data.pins[i]` jsonb (no schema change).
  - **`phase_7_prize_pack.sql`** — adds `gear_drops.prize_items jsonb default '[]'`. Shape: `[{id, title, description, value_cents, photos[]}]`. Backfills existing drops w/ legacy prize_title/description/value/photos into single-item packs. Legacy columns stay populated for SSR / OG cards back-compat.
  - **`notifications_add_data_column.sql`** — adds the missing `public.notifications.data jsonb` column. The column never existed; every server-side gear_drop_advance_run / claim_gear_drop_winner / gear_drop_broadcast_announcement insert was silently failing inside `EXCEPTION when others` blocks for weeks → no notif inserted → no push fanout. Surfaced only when broadcast announcement re-raised the error (client 400 'column data does not exist'). Adding the column retroactively fixed ALL gear_drop_* push notifications. **Important diagnosis update**: PGRST204 'column not found in schema cache' means the column doesn't exist AT ALL — NOT that PostgREST is filtering an existing column. The earlier `feedback_notifications_no_client_data_column` memory had the wrong root cause; updated 2026-06-22. See `feedback_notifications_no_client_data_column`.
- **Gear Drops 2026-06-26 — drop per-waypoint unlock notif**:
  - **`20260626_gear_drops_drop_per_waypoint_notif.sql`** — re-defines `gear_drop_advance_run` to NOT insert a `gear_drop_unlock` notification on intermediate waypoints. Per-waypoint pushes were noise: every submission fired a self-notif ("Stop 2 of 5 complete · 3 to go") that the racer was already seeing live in-app, and each insert triggered notifications_send_push → buzz on every waypoint. Final-pin branch unchanged: winner gets `gear_drop_won` (self), fellow racers get `gear_drop_winner` fanout (both still push — endpoint pushes are the only push gear drops need). `'gear_drop_unlock'` value stays in the CHECK enum so historical bell-history rows still render; we just stop producing new ones.
