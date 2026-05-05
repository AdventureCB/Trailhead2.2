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
| `notifications` | Bell notifications (like, comment, mention, reply, follow) | `user_id` → `auth.users(id)` CASCADE, `actor_id` → `auth.users(id)` SET NULL |
| `builds` | Vehicle builds | `user_id` → `auth.users(id)` CASCADE |

**Row Level Security (RLS):** Enabled on all tables. Public posts readable by anyone, mutations restricted to authenticated owner.

**Realtime:** Enabled on `posts`, `post_likes`, `post_comments`, `notifications`. The app subscribes to two channels:
- `notifs_{uid}` — filtered INSERT on notifications for the current user
- `feed_realtime_{uid}` — INSERT on posts, post_comments; INSERT/DELETE on post_likes (unfiltered, skips own user_id to avoid double-counting optimistic updates)

**Storage:** Supabase Storage used for profile avatars and post photos. Uploads go through the client SDK with public URLs.

### Cascade Deletion

When a user is deleted from `auth.users`, all their data cascades: profile, posts, likes, comments, notifications. When a post is deleted, its likes, comments, and related notifications cascade. The `notifications.actor_id` uses SET NULL (not CASCADE) so recipients keep "Someone liked your post" even if the actor deletes their account.

## File Structure

```
Trailhead/
├── entry.jsx                    # Mount point — createRoot + render
├── trailhead-v1.jsx             # Entire app (~13,700 lines)
├── supabase-client.js           # Supabase client init
├── build.sh                     # Build script (cleans old bundles, builds, updates index.html)
├── vercel.json                  # Vercel config — outputDirectory: deploy-v2.2, SPA rewrites
├── deploy-v2.2/                 # Production deploy directory
│   ├── index.html               # Shell HTML — loads bundle via <script> tag
│   └── trailhead-bundle.*.js    # Hashed esbuild bundles (many old ones accumulate)
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
| `MapOverlay` | ~243 | Google Maps integration for routes/recovery |
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
- Tables: profiles, posts, post_likes, post_comments, post_comment_likes, notifications, builds
- RLS policies on all tables
- Realtime publication on posts, post_likes, post_comments, notifications
- REPLICA IDENTITY FULL on post_likes
- ON DELETE CASCADE on all user_id FKs, SET NULL on notifications.actor_id
- CHECK constraint on posts.type including POST, PHOTOS, ROUTES, BUILDS, CONVOYS
