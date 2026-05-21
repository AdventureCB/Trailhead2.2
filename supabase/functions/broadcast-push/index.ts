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

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Service-role client — bypasses RLS so we can look up the caller's role,
// fetch push subscriptions across users, and insert the audit row.
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

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
  let payload: { body?: string; segment?: string };
  try { payload = await req.json(); } catch { return json({ ok: false, error: "bad json" }, 400); }
  const body = (payload?.body || "").trim();
  const segment = (payload?.segment || "all").trim();
  if (!body) return json({ ok: false, error: "body required" }, 400);
  if (body.length > 500) return json({ ok: false, error: "body too long (max 500)" }, 400);
  if (!ALLOWED_SEGMENTS.includes(segment)) return json({ ok: false, error: "invalid segment" }, 400);

  // 4) Resolve recipient user_ids by segment. "all" = every subscribed user.
  //    Role-filtered segments join profiles.
  let subsQuery = sb.from("push_subscriptions").select("endpoint, p256dh, auth, user_id");
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
        sender_id: callerUid, body, segment, recipient_count: 0, status: "sent",
      });
      return json({ ok: true, recipient_count: 0, sent: 0 });
    }
    subsQuery = subsQuery.in("user_id", uids);
  }
  const { data: subs, error: subErr } = await subsQuery;
  if (subErr) return json({ ok: false, error: "subscription lookup failed" }, 500);

  // 5) Build the payload once. Admin push title is the brand name so users
  //    know this is an official broadcast, not a per-user notification.
  const pushBody = JSON.stringify({
    title: "Trailhead",
    body,
    icon: "/lone-peak-flag.png",
    badge: "/lone-peak-flag.png",
    tag: "trailhead-broadcast",
    data: { url: "/", type: "broadcast" },
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
    sender_id: callerUid, body, segment, recipient_count: sentOk, status,
  });

  return json({ ok: true, recipient_count: sentOk, failed: sentFail, status });
});
