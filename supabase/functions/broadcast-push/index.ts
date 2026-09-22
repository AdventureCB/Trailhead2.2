// Trailhead — Edge Function: broadcast-push
//
// Admin-only push broadcast. Called from the AdminDashboardScreen "Push"
// tab. Verifies the caller is an admin (server-side, via service-role
// lookup of profiles.role), resolves push subscriptions by segment, and
// fans out a web push payload. Inserts a push_broadcasts row for audit.
//
// Deploy: `supabase functions deploy broadcast-push` (NO --no-verify-jwt).
//   Supabase's auth gateway validates the JWT signature first; our code
//   then re-asserts the role server-side. Two layers of admin gating.
//
// Environment (set via `supabase secrets set ...`):
//   VAPID_PUBLIC_KEY      — same key embedded in the client
//   VAPID_PRIVATE_KEY     — secret half of the pair (do NOT commit)
//   VAPID_SUBJECT         — mailto: address used in JWT
//   SUPABASE_URL          — auto-populated
//   SUPABASE_SERVICE_ROLE_KEY — auto-populated

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:noreply@trailhead.app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// OneSignal (native iOS/Android push). No-op until both are set.
const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID") ?? "";
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Service-role client — bypasses RLS so we can look up the caller's role,
// fetch push subscriptions across users, and insert the audit row.
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Fan a broadcast out to native apps via OneSignal. "all" → the built-in
// Subscribed Users segment; role segments → target by External ID (Supabase
// uid). Deep-link path rides in data.url (not top-level url) for in-app routing.
async function sendOneSignalBroadcast(opts: { body: string; title: string; imageUrl: string | null; linkUrl: string | null; segment: string; uids: string[] | null }) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) return { skipped: "not configured" };
  const payload: any = {
    app_id: ONESIGNAL_APP_ID,
    target_channel: "push",
    headings: { en: opts.title },
    contents: { en: opts.body },
    data: { url: opts.linkUrl || "/", type: "broadcast" },
  };
  if (opts.imageUrl) { payload.big_picture = opts.imageUrl; payload.ios_attachments = { th: opts.imageUrl }; }
  if (opts.segment === "all") {
    payload.included_segments = ["Subscribed Users"];
  } else {
    if (!opts.uids || opts.uids.length === 0) return { skipped: "no recipients" };
    payload.include_aliases = { external_id: opts.uids };
  }
  try {
    const r = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Key ${ONESIGNAL_REST_API_KEY}` },
      body: JSON.stringify(payload),
    });
    let data: any = null; try { data = await r.json(); } catch {}
    if (!r.ok) console.error("[broadcast-push] OneSignal error", r.status, data);
    return { ok: r.ok, status: r.status, id: data?.id, recipients: data?.recipients, errors: data?.errors };
  } catch (e) {
    console.error("[broadcast-push] OneSignal fetch failed", e);
    return { ok: false, error: String(e) };
  }
}

const ALLOWED_SEGMENTS = ["all", "admin", "ambassador", "user"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });
}

// Extract auth.uid() from the request's Authorization header. Supabase's
// gateway has already verified the JWT signature (--no-verify-jwt NOT set
// on deploy), so we trust the `sub` claim.
function extractUserId(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    // base64url → base64
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const payload = JSON.parse(atob(b64));
    return payload?.sub ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);

  // 1) Identify the caller via JWT.
  const callerUid = extractUserId(req.headers.get("authorization"));
  if (!callerUid) return json({ ok: false, error: "unauthorized" }, 401);

  // 2) Server-side admin assertion. Defense in depth — even if the client
  //    UI gate is bypassed, the role check happens here against the
  //    canonical profiles.role column.
  const { data: profile, error: profErr } = await sb
    .from("profiles")
    .select("role")
    .eq("id", callerUid)
    .maybeSingle();
  if (profErr || !profile || profile.role !== "admin") {
    return json({ ok: false, error: "forbidden" }, 403);
  }

  // 3) Parse + validate the payload.
  let payload: { body?: string; segment?: string; image_url?: string | null; link_url?: string | null };
  try { payload = await req.json(); } catch { return json({ ok: false, error: "bad json" }, 400); }
  const body = (payload?.body || "").trim();
  const segment = (payload?.segment || "all").trim();
  const imageUrl = (payload?.image_url || "").trim() || null;
  const linkUrl = (payload?.link_url || "").trim() || null;
  if (!body) return json({ ok: false, error: "body required" }, 400);
  if (body.length > 500) return json({ ok: false, error: "body too long (max 500)" }, 400);
  if (!ALLOWED_SEGMENTS.includes(segment)) return json({ ok: false, error: "invalid segment" }, 400);
  // Image URL allowlist — must be our Supabase storage origin so a forged
  // payload can't link to phishing-style external content.
  if (imageUrl && !imageUrl.startsWith("https://babbgaziiyjfaqjsaxgd.supabase.co/storage/v1/object/public/")) {
    return json({ ok: false, error: "invalid image_url origin" }, 400);
  }
  // Tap-through link. Accept an in-app path ("/drops/x") or a full https://
  // URL. Reject protocol-relative ("//host") — it would open-redirect off our
  // origin on a hard navigation.
  if (linkUrl) {
    const okRelative = linkUrl.startsWith("/") && !linkUrl.startsWith("//");
    const okAbsolute = /^https:\/\//i.test(linkUrl);
    if (!okRelative && !okAbsolute) return json({ ok: false, error: "invalid link_url" }, 400);
    if (linkUrl.length > 800) return json({ ok: false, error: "link_url too long" }, 400);
  }

  // 4) Resolve recipient user_ids by segment. "all" = every subscribed user.
  //    Role-filtered segments join profiles.
  let subsQuery = sb.from("push_subscriptions").select("endpoint, p256dh, auth, user_id");
  let roleUids: string[] | null = null; // null = "all" (OneSignal Subscribed Users segment)
  if (segment !== "all") {
    // Two-step: fetch user_ids for the role first, then filter subscriptions.
    const { data: roleUsers, error: rerr } = await sb
      .from("profiles")
      .select("id")
      .eq("role", segment);
    if (rerr) return json({ ok: false, error: "role lookup failed" }, 500);
    const uids = (roleUsers || []).map((r) => r.id);
    if (uids.length === 0) {
      // No matching users → still record the broadcast attempt with 0 sent.
      await sb.from("push_broadcasts").insert({
        sender_id: callerUid, body, segment, image_url: imageUrl, link_url: linkUrl, recipient_count: 0, status: "sent",
      });
      return json({ ok: true, recipient_count: 0, sent: 0 });
    }
    roleUids = uids;
    subsQuery = subsQuery.in("user_id", uids);
  }
  const { data: subs, error: subErr } = await subsQuery;
  if (subErr) return json({ ok: false, error: "subscription lookup failed" }, 500);

  // Native apps via OneSignal — independent of web push_subscriptions.
  const oneSignal = await sendOneSignalBroadcast({ body, title: "Trailhub", imageUrl, linkUrl, segment, uids: roleUids });

  // 5) Build the payload once. Admin push title is the brand name so users
  //    know this is an official broadcast, not a per-user notification.
  const pushBody = JSON.stringify({
    title: "Trailhub",
    body,
    icon: "/lone-peak-flag.png",
    badge: "/lone-peak-flag.png",
    image: imageUrl || undefined,
    tag: "trailhead-broadcast",
    data: { url: linkUrl || "/", type: "broadcast" },
  });

  // 6) Fan out in parallel. Clean up 404/410 (dead endpoints) as we go.
  let sentOk = 0;
  let sentFail = 0;
  await Promise.allSettled((subs || []).map(async (s: any) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        pushBody,
      );
      sentOk++;
    } catch (e: any) {
      sentFail++;
      const status = e?.statusCode;
      if (status === 404 || status === 410) {
        await sb.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      }
    }
  }));

  // 7) Audit row. Status reflects whether anything failed.
  const status = sentFail === 0 ? "sent" : (sentOk === 0 ? "failed" : "partial");
  await sb.from("push_broadcasts").insert({
    sender_id: callerUid, body, segment, image_url: imageUrl, link_url: linkUrl, recipient_count: sentOk, status,
  });

  return json({ ok: true, recipient_count: sentOk, failed: sentFail, status, oneSignal });
});
