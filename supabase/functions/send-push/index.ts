// Trailhead — Edge Function: send-push
//
// Triggered by Postgres triggers on:
//   - public.notifications  INSERT  (likes, comments, follows, RSVPs, etc.)
//   - public.dm_messages    INSERT  (direct + group DM messages)
//
// Looks up the recipient(s)' push_subscriptions and fans out a web-push
// payload to each endpoint.
//
// Environment (set via `supabase secrets set ...`):
//   VAPID_PUBLIC_KEY      — same key embedded in the client
//   VAPID_PRIVATE_KEY     — secret half of the pair (do NOT commit)
//   VAPID_SUBJECT         — mailto: address used in JWT (e.g. mailto:kyle@lonepeakoverland.com)
//   SEND_PUSH_SECRET      — shared secret with the DB triggers. Triggers
//                           pass it as the `x-trailhead-push-secret` header.
//                           Without a matching header the function rejects
//                           with 401 — stops anyone from finding the URL
//                           and blasting arbitrary push notifications.
//   SUPABASE_URL          — auto-populated by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — auto-populated by Supabase

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:noreply@trailhead.app";
const SEND_PUSH_SECRET = Deno.env.get("SEND_PUSH_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// OneSignal (native iOS/Android push). Optional — until BOTH are set, the
// OneSignal fan-out is a silent no-op and only web push (VAPID) runs, so the
// current web/PWA experience is completely unaffected.
const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID") ?? "";
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";

// Constant-time string comparison so an attacker can't time-side-channel
// the correct secret one character at a time.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Service-role client bypasses RLS so we can read subscriptions + cross-user
// data (DM participants, sender profile, etc.) regardless of auth context.
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Native push via OneSignal, targeting External IDs (= Supabase user id, set
// on the device by native-bridge.js via OneSignal.login(uid)). Independent of
// web push_subscriptions, so native-only installs still get delivered. Puts the
// deep-link path in `data.url` (NOT the top-level `url`, which would open a
// browser) so the native tap handler routes it in-app via trailhead:deeplink.
// No-op unless both secrets are set.
async function sendOneSignal(recipientIds: string[], p: any) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) return { skipped: "not configured" };
  if (!recipientIds || recipientIds.length === 0) return { skipped: "no recipients" };
  const body: any = {
    app_id: ONESIGNAL_APP_ID,
    target_channel: "push",
    include_aliases: { external_id: recipientIds },
    headings: { en: p.title || "Trailhub" },
    contents: { en: p.body || "" },
    data: (p.data && typeof p.data === "object") ? p.data : {},
  };
  if (p.image) { body.big_picture = p.image; body.ios_attachments = { th: p.image }; }
  if (p.tag) body.collapse_id = String(p.tag).slice(0, 64); // dedupe like web `tag`
  try {
    const r = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Key ${ONESIGNAL_REST_API_KEY}` },
      body: JSON.stringify(body),
    });
    let data: any = null; try { data = await r.json(); } catch {}
    if (!r.ok) console.error("[send-push] OneSignal error", r.status, data);
    return { ok: r.ok, status: r.status, id: data?.id, errors: data?.errors };
  } catch (e) {
    console.error("[send-push] OneSignal fetch failed", e);
    return { ok: false, error: String(e) };
  }
}

// Resolve the hero image URL for a post — checks the typed hero_img column
// first, then the photo_urls text[] array, then several places inside the
// data jsonb (which carries different shapes for different post types).
// Returns a public https URL or null.
async function resolvePostHeroImage(postId: string): Promise<string | null> {
  if (!postId) return null;
  try {
    const { data: post } = await sb.from("posts").select("hero_img, photo_urls, data").eq("id", postId).maybeSingle();
    if (!post) return null;
    if (post.hero_img) return post.hero_img;
    if (Array.isArray(post.photo_urls) && post.photo_urls.length > 0) {
      const first = post.photo_urls[0];
      if (typeof first === "string" && first.startsWith("http")) return first;
    }
    const d = post.data || {};
    if (d.heroImg && typeof d.heroImg === "string") return d.heroImg;
    if (d.image && typeof d.image === "string") return d.image;
    if (Array.isArray(d.photoUrls) && d.photoUrls.length > 0) {
      const first = d.photoUrls[0];
      const url = typeof first === "string" ? first : (first && first.url);
      if (typeof url === "string" && url.startsWith("http")) return url;
    }
    return null;
  } catch (_) { return null; }
}

// Resolve a build's hero image for the push preview card. Builds store the
// hero on `hero_img`; fall back to the first main photo inside build_data.
async function resolveBuildHeroImage(buildId: string): Promise<string | null> {
  if (!buildId) return null;
  try {
    const { data: b } = await sb.from("builds").select("hero_img, build_data").eq("id", buildId).maybeSingle();
    if (!b) return null;
    if (b.hero_img && typeof b.hero_img === "string") return b.hero_img;
    const bd = b.build_data || {};
    if (Array.isArray(bd.mainPhotos) && bd.mainPhotos[0]) {
      const first = bd.mainPhotos[0];
      const url = typeof first === "string" ? first : (first && first.url);
      if (typeof url === "string" && url.startsWith("http")) return url;
    }
    return null;
  } catch (_) { return null; }
}

// Resolve a forum thread's canonical URL path from its id. Threads store the
// stable `slug` + `subcategory_slug` (decoupled from display names), which
// map to the /forum/<sub-slug>/<thread-slug> deep link the SPA + SSR resolve.
async function resolveForumThreadPath(threadId: string): Promise<string> {
  if (!threadId) return "/forum";
  try {
    const { data: th } = await sb.from("forum_threads").select("slug, subcategory_slug").eq("id", threadId).maybeSingle();
    if (th && th.slug && th.subcategory_slug) return `/forum/${th.subcategory_slug}/${th.slug}`;
  } catch (_) { /* fall through */ }
  return "/forum";
}

// Resolve the hero image + slug for a gear drop. Used when the
// notification references gear_drop_id so the push card can carry a
// large preview AND deep-link straight into /drops/<slug>.
async function resolveGearDropPreview(gearDropId: string | null): Promise<{ image: string | null; slug: string | null; title: string | null }> {
  if (!gearDropId) return { image: null, slug: null, title: null };
  try {
    const { data: drop } = await sb.from("gear_drops").select("slug, title, hero_img").eq("id", gearDropId).maybeSingle();
    if (!drop) return { image: null, slug: null, title: null };
    return { image: drop.hero_img || null, slug: drop.slug || null, title: drop.title || null };
  } catch (_) { return { image: null, slug: null, title: null }; }
}

// Build the push payload for a notifications row (likes/comments/etc.).
// Title is the actor's @handle (Meta-style: who interacted is the headline);
// body is the verb phrase + target (e.g. `liked your post: "Trail Report"`).
// `image` carries a large preview (hero of the related post) when available;
// browsers that don't support the image field silently ignore it.
async function buildNotifPayload(n: any) {
  // Resolve actor handle. Falls back to actor_name (the snapshot stored at
  // insert time) if the profile lookup fails or the actor has no handle.
  let title = n.actor_name || "Someone";
  if (n.actor_id) {
    try {
      const { data: prof } = await sb.from("profiles").select("handle, full_name").eq("id", n.actor_id).maybeSingle();
      if (prof) title = prof.handle ? `@${prof.handle}` : (prof.full_name || title);
    } catch (_) { /* non-fatal */ }
  }
  const text = n.text || "sent you a notification";
  // raffle_won stores the event slug in `target` (for routing), so don't
  // append it as a body suffix like the entity types do.
  const isRaffle = n.type === "raffle_won";
  const target = (n.target && !isRaffle) ? `: "${n.target}"` : "";
  // Resolve the tap URL + preview image from whichever entity FK is set.
  // Mentions can carry post_id / forum_thread_id / build_id / gear_drop_id
  // depending on where the tag happened, so all four route to their exact
  // deep link (not the app home). gear_drop_id is checked without the
  // gear_drop_* type gate so a mention in a gear drop comment routes too.
  const isGearDrop = typeof n.type === "string" && n.type.startsWith("gear_drop_");
  let url = "/";
  let image: string | null = null;
  if (isRaffle && n.target) {
    url = `/win/${n.target}`;
  } else if (n.gear_drop_id) {
    const drop = await resolveGearDropPreview(n.gear_drop_id);
    if (drop.slug) url = `/drops/${drop.slug}`;
    image = drop.image;
  } else if (n.post_id) {
    url = `/post/${n.post_id}`;
    image = await resolvePostHeroImage(n.post_id);
  } else if (n.forum_thread_id) {
    url = await resolveForumThreadPath(n.forum_thread_id);
  } else if (n.build_id) {
    url = `/builds/${n.build_id}`;
    image = await resolveBuildHeroImage(n.build_id);
  }
  return {
    title,
    body: `${text}${target}`,
    icon: "/lone-peak-flag.png",
    badge: "/lone-peak-flag.png",
    image: image || undefined,
    // Tag dedupes spam: rapid likes on the same post collapse to one banner.
    tag: isGearDrop && n.gear_drop_id
      ? `gd:${n.gear_drop_id}:${n.type}`
      : n.post_id ? `post:${n.post_id}:${n.type}` : `notif:${n.id}`,
    data: { url, notifId: n.id, type: n.type },
  };
}

// Build the push payload for a dm_messages row. Title is the sender's
// @handle (with " · <group>" suffix for group convos); body is "Message: ..."
// for text or a friendly attachment label.
async function buildDmPayload(m: any) {
  // Sender profile lookup — best-effort.
  let title = "Someone";
  try {
    const { data: prof } = await sb.from("profiles").select("full_name, handle").eq("id", m.sender_id).maybeSingle();
    if (prof) title = prof.handle ? `@${prof.handle}` : (prof.full_name || title);
  } catch (_) { /* non-fatal */ }
  // For groups, append the group title so the recipient knows which crew chat.
  try {
    const { data: conv } = await sb.from("dm_conversations").select("type, title").eq("id", m.conversation_id).maybeSingle();
    if (conv && conv.type === "group" && conv.title) title = `${title} · ${conv.title}`;
  } catch (_) { /* non-fatal */ }
  // Body — Meta-style "Message: ..." prefix for text, friendly label otherwise.
  const payload = m.payload || {};
  const text = m.body && m.body.trim().length > 0 ? m.body.trim() : null;
  let body;
  if (text) body = `Message: ${text}`;
  else if (payload.sharedPost) body = `Shared: ${payload.sharedPost.title || "a post"}`;
  else if (Array.isArray(payload.photos) && payload.photos.length > 0) body = "📷 Photo";
  else body = "Sent a message";
  // Image preview — first attached photo if there is one, otherwise the
  // shared-post's image. Falls back to no preview for plain text DMs.
  let image: string | null = null;
  if (Array.isArray(payload.photos) && payload.photos.length > 0) {
    const first = payload.photos[0];
    const url = typeof first === "string" ? first : (first && first.url);
    if (typeof url === "string" && url.startsWith("http")) image = url;
  } else if (payload.sharedPost && typeof payload.sharedPost.image === "string" && payload.sharedPost.image.startsWith("http")) {
    image = payload.sharedPost.image;
  }
  return {
    title,
    body,
    icon: "/lone-peak-flag.png",
    badge: "/lone-peak-flag.png",
    image: image || undefined,
    // Dedupe rapid messages from same sender in same convo.
    tag: `dm:${m.conversation_id}`,
    data: { url: `/dm/${m.conversation_id}`, convId: m.conversation_id, type: "dm" },
  };
}

// Resolve which auth.users.id values should receive a push for a given record.
async function resolveRecipients(table: string, record: any): Promise<string[]> {
  if (table === "notifications") {
    return record.user_id ? [record.user_id] : [];
  }
  if (table === "dm_messages") {
    if (!record.conversation_id) return [];
    const { data: parts, error } = await sb
      .from("dm_participants")
      .select("user_id, hidden_at")
      .eq("conversation_id", record.conversation_id)
      .neq("user_id", record.sender_id);
    if (error) { console.error("[send-push] participants lookup error", error); return []; }
    // Push to every active participant; soft-hidden direct convos still get the
    // push (they'll re-appear in the inbox once the message lands client-side
    // anyway). If we want to suppress pushes for hidden convos later, filter
    // out rows with hidden_at IS NOT NULL here.
    return (parts || []).map((p: any) => p.user_id);
  }
  return [];
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  // Bearer-token gate: DB triggers send `x-trailhead-push-secret` matching
  // SEND_PUSH_SECRET. Refuse if the secret isn't configured (don't run
  // wide-open in any environment) or if the header doesn't match.
  if (!SEND_PUSH_SECRET) {
    console.error("[send-push] SEND_PUSH_SECRET not set — refusing all requests");
    return new Response("server not configured", { status: 500 });
  }
  const provided = req.headers.get("x-trailhead-push-secret") || "";
  if (!timingSafeEqual(provided, SEND_PUSH_SECRET)) {
    return new Response("unauthorized", { status: 401 });
  }
  let payload: any;
  try { payload = await req.json(); } catch { return new Response("bad json", { status: 400 }); }
  const table: string = payload?.table;
  const record: any = payload?.record;
  if (!record || !table) return new Response("ignored: no record/table", { status: 200 });

  // Build the push payload once (it doesn't vary per recipient).
  let payloadObj: any;
  if (table === "notifications") payloadObj = await buildNotifPayload(record);
  else if (table === "dm_messages") payloadObj = await buildDmPayload(record);
  else return new Response(`ignored: unsupported table ${table}`, { status: 200 });
  const pushBody = JSON.stringify(payloadObj);

  const recipientIds = await resolveRecipients(table, record);
  if (recipientIds.length === 0) return new Response("no recipients", { status: 200 });

  // Native push (OneSignal) — fire FIRST, independent of web subscriptions, so
  // a native-only user (no push_subscriptions row) still gets delivered.
  const oneSignal = await sendOneSignal(recipientIds, payloadObj);

  // Web push (VAPID) to browser / PWA subscriptions.
  const { data: subs, error } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id")
    .in("user_id", recipientIds);
  if (error) {
    console.error("[send-push] subs lookup error", error);
    return new Response(JSON.stringify({ error: error.message, oneSignal }), { status: 500 });
  }

  const results = (!subs || subs.length === 0) ? [] : await Promise.allSettled(subs.map(async (s: any) => {
    try {
      await webpush.sendNotification({
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      }, pushBody);
      return { endpoint: s.endpoint, ok: true };
    } catch (e: any) {
      // 404/410 = subscription is gone (revoked, browser cleared, etc).
      // Clean it up so we don't keep hammering a dead endpoint.
      const status = e?.statusCode;
      if (status === 404 || status === 410) {
        await sb.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      }
      return { endpoint: s.endpoint, ok: false, status, message: e?.message };
    }
  }));

  return new Response(JSON.stringify({ table, recipients: recipientIds.length, web_sent: results.length, oneSignal, results }), {
    headers: { "content-type": "application/json" },
  });
});
