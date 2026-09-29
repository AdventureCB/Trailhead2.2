# Trailhead — Forum Content Generation Handoff

A reference doc for a separate workspace generating "how to use Trailhead" forum posts. Self-contained — assume zero prior context on the project.

## 1. The product in two sentences

**Trailhead** (https://trailhead.lonepeakoverland.com) is a mobile-first social PWA for the overlanding community, built by **Lone Peak Overland**. Think *Instagram meets AllTrails for overlanders* — feed, route library, vehicle builds, forum, convoy coordination, recovery assist, DMs, leaderboard.

Audience: overlanders, off-road camping enthusiasts, vehicle builders, weekend wheelers, full-time vanlife/camper folks. Tone is practical, friendly, second-person ("you"), comfortable with overlanding jargon (e.g. "rig", "GVWR", "MPPT", "winch", "recovery point") without over-explaining.

## 2. How forum threads are structured

### URL pattern
`/forum/<subcategory-slug>/<thread-slug>` — e.g. `/forum/electrical-wiring/lone-peak-power-plate-wiring-diagram`. Slugs auto-generated from titles with `-2`/`-3` suffix on collision.

### Thread body shape (the "multi-section editor")
The composer is **NOT** a single textarea. It's a list of **sections**, each with:
- `subheading` (renders as `<h2>`) — optional but strongly recommended for long posts
- `body` (paragraphs + inline elements only — `<p>`, `<ul>`/`<ol>`, `<a>`, `<img>`, **no** nested `<h*>` or block components)

The thread title is the `<h1>` — never embed a duplicate title inside the body. The first section's body becomes the OG description excerpt (~200 chars), so lead with a punchy summary paragraph.

### Photos
- A **hero image** is shown at the top (becomes `og:image` for social cards + the feed thumbnail). Always include one if possible.
- Additional photos can be embedded inline in section bodies via the editor's image-paste flow.
- All photos get **AI-generated alt text** (Claude Haiku vision) on upload. Hero image quality and contextual clarity matter for SEO and accessibility.

### Marketplace is special
The `marketplace` category swaps the multi-section editor for a structured form (price, condition, brand, model/year, location, description). Don't generate marketplace listings via this content workflow — that's user-driven commerce, not editorial.

## 3. Categories + subcategories

Categories live in the database and are admin-editable. The seeded taxonomy (May 2026) includes:
- **General** (Introductions, News & Announcements, Open Discussion)
- **How-To Guides** (Electrical & Wiring, Suspension & Lift, Recovery Gear, Camper Buildouts, Roof Top Tents)
- **Trip Reports** (US Southwest, Pacific Northwest, Rockies, etc.)
- **Vehicle Builds** (Trucks, SUVs, Vans, Campers)
- **Gear & Reviews** (Tires, Tools, Cooking, Electronics)
- **Marketplace** (Wanted/ISO, For Sale, Trade) — structured listings; skip for content gen

**The live list is authoritative.** Before generating content, pull the current sitemap (`https://trailhead.lonepeakoverland.com/sitemap.xml`) or ask Kyle (kyle@lonepeakoverland.com) for the latest taxonomy. Don't invent categories that don't exist — threads need a real `category_slug` + `subcategory_slug` to post.

## 4. SEO-friendly forum post conventions

Trailhead emits per-thread:
- `<title>` — `<Thread Title> · Trailhead Forum`
- `og:title`, `og:description` (~200-char body excerpt), `og:image` (hero), `og:image:alt` (Claude-generated)
- `article:author`, `article:section`, `article:published_time`
- `BreadcrumbList` JSON-LD (Trailhead → Forum → Category → Thread)
- `DiscussionForumPosting` JSON-LD by default; **`QAPage` JSON-LD when the title ends in `?`** — use a question-formatted title when the post is a Q&A.
- Server-side rendered article HTML so LLM crawlers + search bots see full content without executing JS.

### Title best practices
- 50–70 characters
- Lead with the keyword users would search ("Power Plate Wiring Diagram", "Best Tire Pressure for Sand", "How To Wire a Dual Battery System")
- Question form when it's genuinely a Q&A ("?" triggers QAPage schema)
- Avoid generic titles ("My Build", "Trip Photos") — describe the *specific* content
- Don't keyword-stuff; Trailhead's voice is human, not SEO-spammy

### Body best practices
- **First paragraph of the first section** should answer "what is this and why does it matter" in ~150 chars — this becomes the meta description on Google + social cards.
- Use **section subheadings** liberally for long posts — both crawlers and users skim. Each `<h2>` is a chance to rank for a related query.
- **Lists** (`<ul>`/`<ol>`) for steps and gear lists. Crawlers love structured procedural content.
- **Internal cross-references** — when mentioning a Trailhead feature, name it the way the UI names it (capitalize "Plan a Trip", "Convoy", "Build", etc.). Future link enrichment will be easier.
- **Photo placement** — embed photos at section boundaries, not mid-paragraph. Each photo's alt text is auto-generated from visual content; if the photo is critical to the explanation, mention in the surrounding prose what it shows (so the post still reads if alt fails).
- **No emoji** (Trailhead style; the rest of the app avoids them).
- **No "Hey everyone, just sharing this"** preambles — get to the value in the first sentence.

### Thread length
- **Short (300–600 words)**: single-question Q&A, gear quick-take, "did you know X feature exists" announcements
- **Medium (800–1500 words)**: feature tutorial with 3–5 sections + hero image + 2–4 inline photos
- **Long (2000+ words)**: comprehensive how-to (e.g. full electrical buildout walkthrough). Always section it.

Aim for **medium** as the default. Trailhead's audience reads on phones; deep walls of text underperform.

### Linking
The platform doesn't yet auto-parse internal entity references (no `[[trip:slug]]` syntax). Use plain prose ("See the **Plan a Trip** flow"). Bare external URLs render as `<a>` links. Avoid affiliate links unless explicitly approved by Kyle.

## 5. Feature catalog — what to write about

Each feature below is a candidate for a "How to use Trailhead's X" thread. Source-of-truth for behavior is the live app — sanity-check flows by walking through them before publishing.

### Plan a Trip (map-first trip planner)
- Entry: Maps screen → FAB → "Plan a Trip", or tap any popup (camping spot / trip report / HQ) → "PLAN A TRIP" / "ADD TO PLAN"
- Long-press the map (500ms hold) anywhere to drop a draggable pin → pick **WAYPOINT** / **CAMP** / **CANCEL**
- Pins can be reordered. The "END" anchor pin is special — subsequent pins insert BEFORE it so the destination stays last
- Per-segment routing: each pair of consecutive pins gets its own Mapbox Directions call. Road-following segments draw as **copper dashed**; off-road snaps (where the routed line drifts > 50m from your pin) draw as **red dashed**
- Save flow: name + description prompt → plan persists as a trip with `kind=plan`
- Plans show on the explore map as **dashed copper polylines** with **copper start dot + white end dot**
- Visibility: public or private (private = owner only)
- Sharing: shareable via `/plans/<slug>` deep link; preview cards show on social media

### Live route recording
- Maps screen → tap the user-location puck or "RECORD ROUTE" entry
- GPS track records continuously while screen is on (wake lock holds screen awake during active recording)
- Pause/resume + add waypoint pins along the way
- On finish: opens trip-report editor with track + stats (distance, elev gain, max elev) auto-derived

### Trip Reports
- Drafts vs Published states. Drafts are private to the owner; published is public
- Three creation paths: live recording, manual pin placement, or skip (text-only)
- Editor includes per-pin notes, hero image, multi-photo gallery, difficulty/region/state/terrain/tags for SEO
- Published trip reports get `/trips/<slug>` URLs with full OG + JSON-LD
- Other users can **like, share, save (bookmark)**, and **comment** (comments pending — currently view-only)
- Owner can re-edit any field inline on the detail page

### Vehicle Builds
- Profile → Builds tab → "+ NEW BUILD"
- Year / Make / Model / Trim + hero photo + per-category mods list
- Mod categories: Suspension, Wheels & Tires, Armor, Lighting, Recovery, Electrical, Camping/Sleep, Cargo & Storage, Cooking, Transmission, Other
- Each mod is `{value, photo, link}` — multiple mods per category supported
- Builds get `/builds/<id>` URLs with comments + likes + the structured mod list rendered as a nav-able spec sheet
- Share to feed: posts as a BUILDS-type feed card with the hero + vehicle line + your caption

### Convoys
- Compose → CONVOY → fill date, location, route source (link an existing trip plan OR draw on the spot), equipment gate (require recovery gear, comms radio, etc.), invite list
- RSVP states: going / maybe / declined
- "Going" RSVPs auto-join a **group DM** linked to the convoy post — coordination chat without manual setup
- Convoy detail page shows attendees, equipment gate, route preview, comments
- Feed card is a slim summary that links to the detail page

### Recovery Assist
- Maps screen FAB or top-bar SOS → "REQUEST RECOVERY"
- Posts a RECOVERY-type feed entry with your location, vehicle, urgency, situation description
- Responders tap "RESPOND" → joins a group DM with the requester (mirrors the convoy DM pattern)
- Auto-message on first response: "I'm responding to your recovery alert..."
- v2 (currently flag-gated off): GPS proximity confirms arrival + awards points

### Direct Messages
- Tap any user → MESSAGE button, or compose new from DM inbox
- Supports text, photo attachments, iMessage-style emoji reactions on individual messages
- Group DMs auto-created for convoys + recovery responders
- Soft-delete (hide) direct convos — they reappear on next inbound message
- Web push delivers DMs when the app isn't foregrounded

### Camping Spots (map layer)
- Seeded with 50k+ spots from OSM + Recreation.gov
- Users can ADD their own (public or private) via Maps → FAB → "Add Spot" or long-press the map
- Public spots appear to everyone; private spots only to the owner
- Per-spot photo contributions: any signed-in user can add a photo to any spot; only the owner/admin/photo-uploader can delete it
- External deep links to Recreation.gov / OpenStreetMap for canonical info on seeded spots

### Feed
- Pull-to-refresh, infinite scroll, filter pills (ALL / POSTS / PHOTOS / TRIP REPORTS / BUILDS / CONVOYS)
- Like, comment, share, save
- Realtime — new posts from anyone you follow appear without refresh
- Compose: text, photos (up to ~10), video (up to 60s on feed, 200MB cap)

### Forum
- Threaded discussions in topical subcategories (see §3)
- Categories + subcategories are admin-editable; ambassadors can create new subcategories
- Likes on threads + replies; depth-1 reply nesting
- View counter per thread (counts unique views per session)
- Owner + admin can edit; moderators can soft-hide pending admin review

### Profile
- Public profile at `/users/<handle>` with builds, trips, threads, spots, and bio
- Tap FOLLOWERS or FOLLOWING to see the lists — tap a row to open that user's profile, tap inline FOLLOW to follow without leaving the sheet
- Settings include push subscription toggles, public/private mode, bio + avatar
- Activity tab shows your own feed posts, comments, likes

### Notifications
- Bell icon → list of likes, comments, mentions, replies, follows, RSVPs, role changes, recovery responses, payouts, etc.
- Mention with `@handle` in any comment/thread/post → notifies that user
- Web push delivers when the PWA is installed (iOS requires Add-to-Home-Screen)

### Search
- Top-bar search → 7 tabs (Users / Threads / Trips / Builds / Spots / Posts / All)
- Server-side user search; client-side for everything else (real-time as you type)

### Ambassador Program (currently invite-only)
- Lone Peak Overland affiliates earn commission on confirmed camper orders + walk-ins
- Each ambassador gets a unique discount code customers can use at checkout
- Share-link redirects: `/r/<CODE>` → Shopify discount + click tracking
- Dashboard shows pending commission, paid statements, monthly trends
- Apply via Profile → "REQUEST AMBASSADOR ROLE"

## 6. Suggested first-wave content topics

Prioritized for SEO impact + new-user value:

1. **"How to Plan a Trip with Friends Using Trailhead's Convoy Feature"** — covers Plan a Trip → Convoy creation → invite flow → group DM
2. **"Building Your Vehicle Profile: A Walkthrough of Trailhead Builds"** — feature tour with example mod entries
3. **"Sharing a Trip Report: From GPS Recording to Published Story"** — live recording → editor → publish → share
4. **"Finding Free Dispersed Camping with Trailhead's Map Layers"** — public lands overlay + camping spots filter + saving favorites
5. **"How to Use Trailhead's Recovery Assist If You're Stuck Off-Road"** — Request → respond → group DM coordination
6. **"Trailhead Forum Etiquette: Categories, Subcategories, and Marketplace Rules"** — meta post explaining how the forum works
7. **"Following Other Overlanders on Trailhead: Building Your Trail Network"** — Follow flow + feed personalization
8. **"Setting Up Web Push Notifications for Trailhead (iOS + Android)"** — PWA install + push subscription walkthrough
9. **"Saving and Bookmarking Routes for Your Next Adventure"** — Saved trips/plans + Profile → Trips → SAVED
10. **"DMing on Trailhead: Group Chats, Photo Sharing, and Reactions"** — DM feature tour

For Q&A-format threads (titles ending in `?` get QAPage schema):
- "What's the best subcategory to post a build for my Tacoma?"
- "Can I record a route offline?"
- "How do I share a Trailhead trip report on Instagram?"
- "Why isn't my push notification working on iPhone?"

## 7. Posting mechanics (for the workspace doing the publishing)

Threads are created via Trailhead's UI today — there's no public REST/GraphQL endpoint for thread insertion. The workspace generating content should produce **drafts as markdown** (or the Trailhead section structure) and hand them to Kyle / a designated content lead to paste into the live composer.

If/when a content API is built, the row shape is:
```
forum_threads:
  category_slug    text  -- must match a real forum_categories.slug
  subcategory_slug text  -- must match a real forum_subcategories.slug
  title            text  -- becomes <h1> + slug source
  slug             text  -- auto-generated from title
  sections         jsonb -- [{ subheading, body }, ...]  body is HTML (p/ul/ol/a/img only)
  body             text  -- legacy concatenated HTML (auto-derived from sections for SEO crawlers)
  photos           jsonb -- [{ url, alt }, ...] — hero is photos[0]
```

## 8. Quick reference: things NOT to do

- Don't write a post that requires features Trailhead doesn't have yet (offline maps, comments on trip reports, post scheduling) — check this doc + live site before claiming capability
- Don't pitch competitor apps (Gaia, OnX, AllTrails) by name; reference is fine, comparison framing isn't on-brand
- Don't generate marketplace listings via this content workflow
- Don't fabricate user testimonials or fake screenshots — Kyle will pull real ones
- Don't use emoji or marketing-speak ("revolutionary", "game-changing", "amazing")
- Don't add "What do you think? Comment below!" boilerplate — Trailhead's audience engages without prompting
- Don't write thread titles that depend on the post body for context ("My Setup" is bad; "Dual-Battery Setup for an FJ Cruiser Camper Build" is good)
- Don't claim Trailhead is "the first" or "the only" anything in the overlanding space — it's positioned as community-built, not lead-generation

## 9. Contact + verification

When in doubt about a feature behavior, taxonomy, or brand voice question:
- Kyle Buchanan / Lone Peak Overland — kyle@lonepeakoverland.com
- Live app: https://trailhead.lonepeakoverland.com
- Sitemap (for current taxonomy + indexed threads): https://trailhead.lonepeakoverland.com/sitemap.xml

Sanity-check every generated post against the live UI before publishing. Trailhead ships frequently; a feature described here may have shifted by the time content lands.
