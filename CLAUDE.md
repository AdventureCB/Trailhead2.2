# Trailhead — Claude Code Handoff

## What This Project Is

Trailhead is a mobile-first social web app for the overlanding community, built by Lone Peak Overland (Kyle, kyle@lonepeakoverland.com). Think Instagram meets AllTrails for overlanders — social feed, route library, vehicle builds, forum, convoy coordination, recovery assist, leaderboard/loyalty points, and DMs.

Live at: Deployed on Vercel via GitHub (https://github.com/AdventureCB/Trailhead2.2.git)

## Architecture

**Single-file React app** — the entire UI is one JSX file (`trailhead-v1.jsx`, ~13,700 lines). No component library, no router, no state management library. All state lives in the root `Trailhead` component and is passed down via props. Screen switching is done via a `screen` state variable.

**Entry point:** `entry.jsx` imports `Trailhead` from `trailhead-v1.jsx`, calls `createRoot` and `render`. The main JSX file does NOT mount itself — the comment at the bottom explains why (double-mount race condition).

**No package.json / no node_modules in the repo.** Dependencies (React, Supabase, Lucide) are resolved by esbuild at bundle time from wherever they're installed globally or via npx. If setting up locally, you'll need: `react`, `react-dom`, `@supabase/supabase-js`, `lucide-react`.

## Backend — Supabase

**Project URL:** `https://babbgaziiyjfaqjsaxgd.supabase.co`
**Client file:** `supabase-client.js` (exports `supabase` instance + constants)
**Auth flow:** Email/password + Google OAuth, implicit flow. Session persisted in localStorage.

### Database Tables (all in `public` schema)

| Table | Purpose | Key FKs |
|---|---|---|
| `profiles` | User profiles (full_name, handle, avatar_url, bio, etc.) | `id` → `auth.users(id)` ON DELETE CASCADE |
| `posts` | Feed posts (type: POST, PHOTOS, ROUTES, BUILDS, CONVOYS) | `user_id` → `auth.users(id)` ON DELETE CASCADE |
| `post_likes` | Like join table | `post_id` → `posts(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE |
| `post_comments` | Comments on posts | `post_id` → `posts(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE |
| `post_comment_likes` | Likes on comments | `comment_id` → `post_comments(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE |
| `notifications` | Bell notifications (like, comment, mention, reply, follow, rsvp) | `user_id` → `auth.users(id)` CASCADE, `actor_id` → `auth.users(id)` SET NULL |
| `builds` | Vehicle builds | `user_id` → `auth.users(id)` CASCADE |
| `follows` | Follow graph (composite PK on follower_id+following_id) | `follower_id`, `following_id` → `auth.users(id)` CASCADE |
| `convoy_rsvps` | RSVPs to CONVOYS posts (status: going/maybe/declined) | `post_id` → `posts(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE; composite PK |
| `dm_conversations` | Direct + group DMs. `type ∈ {direct, group}`. `convoy_post_id` links a group to a convoy post (auto-created when first RSVPs going) | `created_by` → `auth.users(id)` SET NULL; `convoy_post_id` → `posts(id)` SET NULL; UNIQUE(convoy_post_id) for group |
| `dm_participants` | Membership join. `last_read_at` for unread counts; `hidden_at` for soft-delete (direct convos reappear on next inbound message) | composite PK on conv_id+user_id |
| `dm_messages` | DM messages. `body` text + `payload` jsonb (photos, sharedPost, convoy_invite) | `conversation_id` CASCADE, `sender_id` CASCADE |
| `push_subscriptions` | Web Push endpoints, one row per device. PK is the endpoint URL | `user_id` → `auth.users(id)` CASCADE |
| `build_likes` | Likes on builds (heart in builds gallery / detail) | `build_id` → `builds(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE; composite PK |
| `dm_message_likes` | iMessage-style emoji reactions on DM messages. `emoji` column holds the picked emoji | `message_id` → `dm_messages(id)` CASCADE, `user_id` → `auth.users(id)` CASCADE; composite PK |
| `camping_spots` | Public dataset of camping locations rendered on routes maps. Seeded with OSM + Recreation.gov via `supabase/seed/seed-camping-spots.js`; users can also add their own (`source = 'user'`). `unique(source, source_id)` makes seed re-runs idempotent | `user_id` → `auth.users(id)` SET NULL |

**Row Level Security (RLS):** Enabled on all tables. Public posts readable by anyone, mutations restricted to authenticated owner.

**`is_dm_participant(conv_id, uid)` SECURITY DEFINER function** — used by all `dm_*` policies to avoid recursion when a participant policy needs to self-reference dm_participants. Required because Postgres RLS would infinitely recurse otherwise.

**Realtime:** Publication includes `posts`, `post_likes`, `post_comments`, `post_comment_likes`, `notifications`, `profiles`, `follows`, `convoy_rsvps`, `dm_conversations`, `dm_participants`, `dm_messages`. REPLICA IDENTITY FULL on `posts`, `post_comments`, `post_likes`, `post_comment_likes`, `follows`, `convoy_rsvps`, `dm_*` (so DELETE payloads carry user_id for self-echo skipping). The app subscribes to two channels:
- `notifs_{uid}` — filtered INSERT on notifications for the current user
- `feed_realtime_{uid}` — broad listener for posts (INSERT/UPDATE/DELETE), post_comments (INSERT/DELETE), post_likes (INSERT/DELETE), post_comment_likes (INSERT/DELETE), profiles (UPDATE — propagates name/avatar changes to existing posts/comments), follows (INSERT/DELETE — own follower count), convoy_rsvps (INSERT/UPDATE/DELETE), dm_messages (INSERT — recipient un-hides hidden direct convos), dm_participants (INSERT/DELETE — keeps participant lists live)

**Storage buckets:** `avatars` (profile pics), `post-photos` (feed photos), `dm-attachments` (DM photo messages). All public-read; URLs are unguessable uuids and the message body containing them is RLS-protected.

**DB triggers (push notifications):**
- `notifications_send_push` AFTER INSERT on `notifications` → calls `notify_push_on_notification_insert()` which uses `net.http_post` (pg_net extension) to POST the row to the `send-push` Edge Function
- `dm_messages_send_push` AFTER INSERT on `dm_messages` → same pattern; Edge Function looks up convo participants and pushes to all but the sender
- `dm_messages_bump_conv` AFTER INSERT on `dm_messages` → updates `dm_conversations.updated_at` for inbox sort

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

- **Token:** public `pk.*` token defined inline as `MAPBOX_TOKEN`. URL-restricted in the Mapbox dashboard to `trailhead2-2.vercel.app` + `localhost`. Tokens are designed to ship in the bundle; URL restrictions handle the security model.
- **API helpers:** `mapboxGeocode`, `mapboxGeocodeSearch` (multi-result), `mapboxReverseGeocode`, `mapboxDirections(from, to, { steps, waypoints })`.
- **Marker DOM:** Mapbox markers are HTML elements (no Symbol icons). Use `buildCircleMarkerEl(color, size)` and `buildEmojiMarkerEl(color, emoji, size)`.
- **Polylines:** GeoJSON line layers, not a `Polyline` class. Pattern: `map.addSource(id, { type: 'geojson', data: ... })` + `map.addLayer({ type: 'line', source: id, paint: {...} })`. Update with `source.setData(geom)`.
- **Elevation:** No native ElevationService. We use the free Open-Elevation API via `fetchElevationsAlongPath(coords)` for manual route entry. Falls back to `elevGain=0` if Open-Elevation times out.
- **External deep links** still use `https://www.google.com/maps/dir/?...` — the user's installed maps app handles them; that's not an API call.

### Map overlays

Two togglable overlay layers wired into RouteRecorder + RouteNavigation. Toggle UI is a top-left floating panel (`<MapLayerToggle>`); choices persist to `localStorage` (`th_show_camping`, `th_show_publands`).

- **Camping spots layer** — `useCampingSpotsLayer(mapInst, mapReady, rows, visible, onSelect)`. Adds a clustered GeoJSON source plus three layers (cluster bubble, cluster count, individual 🏕️ glyph). Backed by `public.camping_spots`. Tap a marker → fires `onSelect` with the row props.
- **Public lands layer** — `usePublicLandsLayer(mapInst, mapReady, visible)`. Backed by a Mapbox vector tileset (PAD-US uploaded to Mapbox Studio). No-op until `MAPBOX_PUBLIC_LANDS_TILESET_ID` is set in `trailhead-v1.jsx`. Renders as a 22% green fill + thin outline.
- **User-contributed spots:** `addCampingSpot({ name, lat, lng, description, ... })` at the root inserts with `source: 'user'`. The "+ ADD SPOT" button on RouteRecorder enters add-mode → next map tap stages a name/notes form.

### Camping-spots seed

One-time data import script at `supabase/seed/seed-camping-spots.js`. Usage:
```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... RIDB_API_KEY=... node supabase/seed/seed-camping-spots.js
```
Fetches `tourism=camp_site` + `tourism=caravan_site` from OpenStreetMap (Overpass API; tries main + two mirrors) and federal campgrounds from Recreation.gov RIDB API. Upserts to `public.camping_spots` using `unique (source, source_id)` so re-runs are idempotent. RIDB key is free from https://ridb.recreation.gov/. Default bbox = continental US + southern Canada.

## Edge Function Deploy

The `send-push` Edge Function lives at `supabase/functions/send-push/index.ts`. To redeploy after editing it:

```bash
cd /Users/cainen/Documents/Claude/Projects/Trailhead && supabase functions deploy send-push --no-verify-jwt
```

`--no-verify-jwt` is required because the Postgres triggers call the function without an auth header. Secrets (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) are already set in Supabase — only re-set them if the VAPID key pair is rotated.

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

**Shared links:** URL format `/post/{id}` — parsed once at module load (`__INITIAL_SHARED_LINK`) before React mounts, to avoid double-render race conditions.

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
- Tables: profiles, posts, post_likes, post_comments, post_comment_likes, notifications, builds, follows, convoy_rsvps, dm_conversations, dm_participants, dm_messages, push_subscriptions, build_likes, dm_message_likes, camping_spots
- RLS policies on all tables
- Realtime publication on posts, post_likes, post_comments, post_comment_likes, notifications, profiles, follows, convoy_rsvps, dm_conversations, dm_participants, dm_messages, build_likes, dm_message_likes, camping_spots
- REPLICA IDENTITY FULL on post_likes, post_comments, post_comment_likes, follows, convoy_rsvps, dm_*, build_likes, dm_message_likes, camping_spots
- ON DELETE CASCADE on all user_id FKs, SET NULL on notifications.actor_id and camping_spots.user_id
- CHECK constraint on posts.type including POST, PHOTOS, ROUTES, BUILDS, CONVOYS
- `is_dm_participant(conv_id, uid)` SECURITY DEFINER helper used by all dm_* policies
- `dm_message_likes.emoji text not null default '❤️'` column for iMessage-style reactions
- `camping_spots.unique(source, source_id)` for idempotent seed re-runs
