# Forum bot drafting API

Lets an external bot (Grok) draft forum threads. Drafts are reviewed, edited, and published by an admin in **Admin → BOT DRAFTS** — nothing goes live from the API.

**Endpoint:** `POST https://babbgaziiyjfaqjsaxgd.supabase.co/functions/v1/forum-bot-draft`
**Auth header:** `x-api-key: <FORUM_BOT_API_KEY>`
**Body:** JSON. `action` is one of `create` (default), `status`, `subcategories`, `list`.

## Find the right subcategory
```bash
curl -s -X POST "$URL" -H "x-api-key: $KEY" -H "content-type: application/json" \
  -d '{"action":"subcategories"}'
# → {"ok":true,"subcategories":[{"slug":"tire-talk","name":"Tire Talk","category":"Gear"}, …]}
```

## Create a draft (markdown)
```bash
curl -s -X POST "$URL" -H "x-api-key: $KEY" -H "content-type: application/json" -d '{
  "title": "Airing down for sand: what pressure actually works",
  "subcategory_slug": "tire-talk",
  "body_markdown": "Everyone says 15 psi. Here is what we measured.\n\n## The test\nSame truck, same dune, three pressures…\n\n- 20 psi: still digging\n- 15 psi: floated\n- 12 psi: floated, bead risk\n\n## Takeaway\nStart at 15 and go lower **only** with beadlocks. [Our kit](https://www.lonepeakoverland.com/).",
  "photos": ["https://example.com/sand.jpg"],
  "members_only_hours": 24,
  "notes": "Source: our Sept dune trip + 3 forum replies. Please check the psi numbers."
}'
# → {"ok":true,"id":"…","status":"pending","review_url":"https://trailhead.lonepeakoverland.com/admin"}
```

Rules the converter follows:
- `## Heading` (or `#`, `###`) starts a new section; the heading becomes the section's subheading (rendered as an h2 in the thread). Text before the first heading is the intro section.
- Paragraphs are separated by blank lines. `- item` / `1. item` become lists. `**bold**`, `*italic*`, `` `code` ``, `[text](https://url)` work.
- `photos`: up to 10 public image URLs (jpg/png/webp/gif, ≤15 MB). They're copied into Trailhub storage; the first one is the thread's hero image. `{"url":…,"alt":…}` objects are accepted for alt text.
- `members_only_hours` (0–720): signed-in-only reading window after publish. Optional.
- `notes`: a message to the reviewer (not published).

## YouTube videos
Each section can carry **one** embedded YouTube video; it renders as a player below that section's text. Three ways to attach one:

1. **In markdown** — put the YouTube link alone on its own line, inside the section it belongs to:
   ```
   ## The test
   Same truck, same dune, three pressures.

   https://youtu.be/dQw4w9WgXcQ

   Here is what the footage shows…
   ```
   (`@youtube https://…` or `video: https://…` on the line also works.) A second link in the same section starts a new untitled section so nothing is dropped.
2. **Top-level** — `"video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"` attaches to the first section (handy for a single-video post).
3. **In `sections`** — `{ "subheading": "…", "body": "<p>…</p>", "video_url": "https://youtu.be/…" }`.

Accepted forms: `youtube.com/watch?v=ID`, `youtu.be/ID`, `youtube.com/shorts/ID`, `youtube.com/live/ID`, `youtube.com/embed/ID`, or the bare 11-character ID. Anything else is rejected with a 400 naming the bad link. Only YouTube is supported (no Vimeo/TikTok). Embeds aren't allowed inside the HTML body — a pasted `<iframe>` is stripped — so always use one of the three methods above.

## Link buttons (calls to action)
A button is a full-width copper link rendered between sections (e.g. "Shop the kit", "Book a demo"). Three ways to add one:

1. **In markdown** — a line of its own, placed where the button should appear:
   ```
   ## Takeaway
   Start at 15 psi and go lower only with beadlocks.

   [button: Shop beadlock wheels](https://www.lonepeakoverland.com/collections/wheels)

   ## What's next
   ```
   `@button Shop beadlock wheels | https://…` also works. Any number of buttons, anywhere.
2. **Top-level** — `"buttons": [{ "label": "Shop the kit", "url": "https://…" }]` appends them after the body (max 5).
3. **In `sections`** — `{ "type": "url", "label": "Shop the kit", "url": "https://…" }` as its own entry in the array, in position.

Labels are trimmed to 80 characters; the URL must be a full `https://` link or the request is rejected with a 400. Admins can move, relabel, or remove buttons in the review screen before publishing.

Alternatively send `sections: [{ "subheading": "…", "body": "<p>HTML</p>" }]` (allowed tags: p, br, strong, em, u, a, ul, ol, li, code, blockquote) or a single `body_html`.

## Check what happened
```bash
curl -s -X POST "$URL" -H "x-api-key: $KEY" -H "content-type: application/json" -d '{"action":"status","id":"<draft id>"}'
# → {"ok":true,"status":"published","thread_url":"https://trailhead.lonepeakoverland.com/forum/tire-talk/airing-down-for-sand-…"}
#   status is pending | rejected (review_notes says why) | published
```
`{"action":"list","limit":20}` returns recent drafts.

## Ops
- Deploy: `cd <repo> && supabase functions deploy forum-bot-draft --no-verify-jwt`
- Rotate key: `supabase secrets set FORUM_BOT_API_KEY=<new>` (then update the bot).
- Each new draft notifies every admin (bell + push). Publishing inserts the thread as the approving admin (or another admin account chosen in the review screen).
