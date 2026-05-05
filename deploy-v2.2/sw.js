// Trailhead service worker — handles incoming web pushes + click routing.
//
// Lifecycle: registered by the client during the push-subscribe flow.
// Updates whenever this file's bytes change (browsers diff at register time).
const CACHE_VERSION = "trailhead-sw-v1";

self.addEventListener("install", (event) => {
  // Activate the new SW immediately on first install — avoids a "stuck on old"
  // window where the user has registered SW but the new one is waiting.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Push event — the server delivers a JSON payload describing the notification.
// Shape (set by our Edge Function): { title, body, icon?, badge?, tag?, data? }.
// data.url is the in-app URL we should open when the user taps the banner.
self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (e) { /* non-JSON push, ignore */ }
  const title = payload.title || "Trailhead";
  const opts = {
    body: payload.body || "",
    icon: payload.icon || "/lone-peak-flag.png",
    badge: payload.badge || "/lone-peak-flag.png",
    // Large preview image — Chrome/Edge/Android render this below the body.
    // Firefox/Safari/iOS silently ignore the field.
    image: payload.image || undefined,
    tag: payload.tag || undefined,
    data: payload.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

// Click handler — focus existing tab if open at our origin, else open one.
// data.url is a relative path like "/post/<uuid>" — handled by the SPA shell.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of allClients) {
      try {
        const u = new URL(client.url);
        if (u.origin === self.location.origin) {
          await client.focus();
          // If we control this client, tell the SPA to navigate.
          client.postMessage({ type: "navigate", url });
          return;
        }
      } catch (e) { /* skip */ }
    }
    if (self.clients.openWindow) {
      await self.clients.openWindow(url);
    }
  })());
});
