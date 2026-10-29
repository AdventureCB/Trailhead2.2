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
