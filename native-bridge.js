// native-bridge.js — Capacitor native shell integration for Trailhead.
//
// WEB-SAFE BY DESIGN: this module accesses Capacitor ONLY through the runtime
// `window.Capacitor` global — there are NO static `@capacitor/*` imports. That
// keeps the esbuild web bundle byte-for-byte free of native dependencies, so
// `bash build.sh` needs no extra npm installs and the Vercel/PWA deploy is
// completely unaffected. On native, Capacitor's runtime injects
// `window.Capacitor` (and `.Plugins`) into the WebView BEFORE this bundle
// loads, so the plugin lookups below resolve there and only there.
//
// Every export is a no-op on web (isNativePlatform() === false), so importing
// and calling these from entry.jsx changes nothing about the web experience.

// TODO: set this to your OneSignal App ID once the OneSignal app is created
// (OneSignal dashboard → Settings → Keys & IDs). Until it's set, all native
// push glue below is a no-op. Web is never affected either way.
export const ONESIGNAL_APP_ID = "7cfbec5d-4e49-4406-8131-e9d7ab94914a";

// Custom URL scheme the app registers (iOS Info.plist CFBundleURLTypes +
// Android intent-filter). Used as the OAuth redirect target on native so the
// provider hands control back INTO the app instead of dead-ending in Safari.
export const NATIVE_OAUTH_REDIRECT = "com.lonepeakoverland.trailhub://login-callback";

// OTA live-updates (Capgo). The build publishes a zipped web bundle + this
// manifest to Vercel; the native app checks it on launch and self-updates
// without an App Store release. Served statically from deploy-v2.2/ota/.
const OTA_MANIFEST_URL = "https://trailhead.lonepeakoverland.com/ota/latest.json";

function cap() {
  return (typeof window !== "undefined" && window.Capacitor) || null;
}

// True only inside a Capacitor native WebView (iOS/Android app). Always false
// on the web / PWA build.
export function isNativePlatform() {
  const c = cap();
  try {
    return !!(c && typeof c.isNativePlatform === "function" && c.isNativePlatform());
  } catch (_) {
    return false;
  }
}

// "ios" | "android" | "web"
export function getPlatform() {
  const c = cap();
  try {
    return c && typeof c.getPlatform === "function" ? c.getPlatform() : "web";
  } catch (_) {
    return "web";
  }
}

function plugin(name) {
  const c = cap();
  return (c && c.Plugins && c.Plugins[name]) || null;
}

// Reduce a native deep-link URL (custom scheme `trailhead://win/<slug>` or a
// universal link `https://trailhead.lonepeakoverland.com/win/<slug>`) to a
// same-origin path, then hand it to the SPA's shared deep-link router via a
// window event. The app-side listener (trailhead:deeplink) routes it with the
// exact same logic as a web push-notification tap.
function emitDeepLink(url) {
  if (!url || typeof window === "undefined") return;
  try {
    let path = String(url);
    const m = path.match(/^[a-z][a-z0-9+.\-]*:\/\/[^/]*(\/.*)?$/i);
    if (m) path = m[1] || "/";
    window.dispatchEvent(new CustomEvent("trailhead:deeplink", { detail: { url: path } }));
  } catch (_) {}
}

let _inited = false;

// Idempotent. Safe to call unconditionally from entry.jsx — returns immediately
// on web. On native it wires the status bar, deep links, Android back button,
// and hides the native splash once the web app has painted.
export async function initNativeShell() {
  if (_inited || !isNativePlatform()) return;
  _inited = true;

  // Status bar — match the app's dark theme.
  const StatusBar = plugin("StatusBar");
  if (StatusBar) {
    try { await StatusBar.setStyle({ style: "DARK" }); } catch (_) {}
    try { await StatusBar.setBackgroundColor({ color: "#111111" }); } catch (_) {} // Android only
  }

  // Deep links — universal links + custom scheme.
  const App = plugin("App");
  if (App) {
    try {
      App.addListener("appUrlOpen", (data) => {
        const u = data && data.url;
        if (!u) return;
        // OAuth callback (Supabase redirects to our scheme with tokens in the
        // hash) → hand to the app to set the session, then close the browser.
        // Everything else routes as a normal in-app deep link.
        if (u.indexOf("login-callback") !== -1 || u.indexOf("access_token=") !== -1 || u.indexOf("error=") !== -1) {
          try { window.dispatchEvent(new CustomEvent("trailhead:oauth", { detail: { url: u } })); } catch (_) {}
          return;
        }
        emitDeepLink(u);
      });
    } catch (_) {}
    // Cold-start launch URL — dispatch after the SPA's deep-link listener has
    // had time to mount (it registers inside a React effect).
    try {
      const launch = await App.getLaunchUrl();
      if (launch && launch.url) setTimeout(() => emitDeepLink(launch.url), 1200);
    } catch (_) {}
    // Android hardware back — walk WebView history, else exit the app.
    try {
      App.addListener("backButton", (ev) => {
        if (ev && ev.canGoBack) { try { window.history.back(); } catch (_) {} }
        else { try { App.exitApp(); } catch (_) {} }
      });
    } catch (_) {}
  }

  // Hide the native splash once the web app is up.
  const SplashScreen = plugin("SplashScreen");
  if (SplashScreen) {
    try { await SplashScreen.hide(); } catch (_) {}
  }

  // Prime OneSignal so the tap handler is registered even before login.
  initOneSignal();

  // Check for an OTA web-bundle update.
  initOta();
}

// ── OTA live-updates (Capgo @capgo/capacitor-updater) ───────────────────────
// Manual mode: on launch we mark the running bundle healthy (notifyAppReady —
// required, else the plugin auto-rolls-back), then fetch our version manifest.
// If a newer bundle exists we download it and apply it the NEXT time the app
// goes to the background, so the update lands seamlessly on the next open
// instead of reloading mid-session. Fully guarded → inert on web.
let _otaPending = null;
async function initOta() {
  if (!isNativePlatform()) return;
  const Updater = plugin("CapacitorUpdater");
  if (!Updater) return;
  try { await Updater.notifyAppReady(); } catch (_) {}
  // Apply a downloaded bundle when the app is backgrounded.
  const App = plugin("App");
  if (App) {
    try {
      App.addListener("appStateChange", async (state) => {
        if (state && state.isActive === false && _otaPending) {
          const b = _otaPending; _otaPending = null;
          try { await Updater.set(b); } catch (_) {}
        }
      });
    } catch (_) {}
  }
  try {
    const res = await fetch(OTA_MANIFEST_URL + "?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) return;
    const manifest = await res.json();
    if (!manifest || !manifest.version || !manifest.url) return;
    let current = "";
    try { const c = await Updater.current(); current = c && c.bundle && c.bundle.version; } catch (_) {}
    if (manifest.version === current) return; // already up to date
    _otaPending = await Updater.download({ url: manifest.url, version: manifest.version });
  } catch (_) { /* offline / manifest missing — try again next launch */ }
}

// ── OAuth (open provider login in the in-app browser, close on return) ──────
// Opens the Supabase OAuth URL in an SFSafariViewController/Custom Tab via the
// @capacitor/browser plugin so cookies/session flow works and the custom-scheme
// redirect can reopen the app. Falls back to the system browser if the plugin
// isn't installed.
export async function openOAuthUrl(url) {
  if (!url) return;
  const Browser = plugin("Browser");
  if (Browser) { try { await Browser.open({ url }); return; } catch (_) {} }
  try { window.open(url, "_system"); } catch (_) {}
}

export function closeInAppBrowser() {
  const Browser = plugin("Browser");
  if (Browser) { try { Browser.close(); } catch (_) {} }
}

// ── Sign in with Apple (native ASAuthorization sheet) ───────────────────────
// Uses @capacitor-community/apple-sign-in on iOS to show the native Apple sheet
// (Face ID, no browser). Returns { identityToken, rawNonce } for the app to
// hand to supabase.auth.signInWithIdToken({ provider:'apple', token, nonce }).
// Apple embeds sha256(nonce) in the token; Supabase re-hashes the raw nonce we
// return and compares — so we send the HASH to Apple and the RAW nonce onward.
function genNonce(len = 32) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._";
  const arr = new Uint8Array(len);
  if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(arr);
  else for (let i = 0; i < len; i++) arr[i] = Math.floor(Math.random() * 256);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}
async function sha256Hex(str) {
  const data = new TextEncoder().encode(str);
  const buf = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function signInWithApple() {
  if (!isNativePlatform()) return { error: new Error("not native") };
  const raw = plugin("SignInWithApple");
  const api = raw && raw.default && typeof raw.default.authorize === "function" ? raw.default : raw;
  if (!api || typeof api.authorize !== "function") return { error: new Error("Apple Sign-In plugin unavailable") };
  const rawNonce = genNonce();
  let hashedNonce;
  try { hashedNonce = await sha256Hex(rawNonce); } catch (_) { hashedNonce = rawNonce; }
  try {
    const res = await api.authorize({
      clientId: "com.lonepeakoverland.trailhub",
      redirectURI: "https://auth.lonepeakoverland.com/auth/v1/callback",
      scopes: "email name",
      nonce: hashedNonce,
    });
    const r = res && res.response;
    const idToken = r && r.identityToken;
    if (!idToken) return { error: new Error("Apple sign-in returned no identity token.") };
    // Apple returns the name ONLY on the first authorization, here in the
    // response (not in the id token). Capture it so we can prefill onboarding.
    const fullName = [r && r.givenName, r && r.familyName].filter(Boolean).join(" ").trim();
    return { identityToken: idToken, rawNonce, fullName };
  } catch (e) {
    return { error: e };
  }
}

// ── OneSignal native push ──────────────────────────────────────────────────
// Accessed via runtime global only (the onesignal-cordova-plugin is injected
// by Capacitor at runtime on native; it is NOT in the esbuild web bundle).
// Probes the known clobber targets across plugin versions so we don't depend
// on one exact global. All calls are guarded + try/catch so web stays inert.
function osApi() {
  if (typeof window === "undefined") return null;
  const raw =
    window.OneSignal ||
    (window.plugins && window.plugins.OneSignal) ||
    (window.cordova && window.cordova.plugins && window.cordova.plugins.OneSignal) ||
    null;
  if (!raw) return null;
  // onesignal-cordova-plugin v5 exports its API under `.default` (CJS/ESM
  // interop wrapper) — the methods (initialize/Notifications/login) live there,
  // not on the wrapper object. Unwrap it, falling back to raw for other shapes.
  return (raw.default && typeof raw.default.initialize === "function") ? raw.default : raw;
}

let _osInited = false;
// Cordova plugins clobber onto window (window.OneSignal) only AFTER the native
// bridge finishes loading, which is typically LATER than when our JS boots. So
// osApi() can be null on the first call — we poll for up to ~9s until it's
// ready rather than silently giving up (that was why no permission prompt fired).
function initOneSignal(attempt = 0) {
  if (_osInited || !isNativePlatform() || !ONESIGNAL_APP_ID) return;
  const OneSignal = osApi();
  if (!OneSignal) {
    if (attempt < 30) setTimeout(() => initOneSignal(attempt + 1), 300);
    return;
  }
  _osInited = true;
  try { OneSignal.initialize(ONESIGNAL_APP_ID); } catch (_) {}
  // Notification tap → route in-app via the shared deep-link router. We put the
  // path in additionalData.url server-side (send-push), NOT the launch URL, so
  // taps route inside the app instead of opening a browser.
  try {
    OneSignal.Notifications.addEventListener("click", (ev) => {
      try {
        const d = ev && ev.notification && ev.notification.additionalData;
        if (d && d.url) emitDeepLink(d.url);
      } catch (_) {}
    });
  } catch (_) {}
  // NOTE: no permission prompt here. Asking at boot (before sign-up) was the
  // wrong moment and burned iOS's one system prompt. The app asks from the
  // onboarding wizard's ENABLE button via requestNativePushPermission().
}

// Ask iOS for push permission through OneSignal. Resolves true when granted.
// Polls for the plugin global like everything else here (cordova attaches
// after our JS boots). Safe to call repeatedly — once decided, iOS returns
// the stored answer without re-prompting.
export async function requestNativePushPermission() {
  if (!isNativePlatform()) return false;
  initOneSignal();
  let OneSignal = osApi();
  for (let i = 0; !OneSignal && i < 30; i++) { await new Promise(r => setTimeout(r, 300)); OneSignal = osApi(); }
  if (!OneSignal) return false;
  try {
    const already = await OneSignal.Notifications.getPermissionAsync();
    if (already) return true;
  } catch (_) {}
  try {
    const granted = await OneSignal.Notifications.requestPermission(true);
    return !!granted;
  } catch (e) { console.warn("[push] native permission request failed", e); return false; }
}

// Bind this device's push identity to the Supabase user id via OneSignal's
// External ID, so send-push can target `external_id` without us storing tokens.
// Called from the app whenever the signed-in user is known. Polls for the
// plugin global too, since login can be attempted before it's ready.
export function registerNativePush(uid, attempt = 0) {
  if (!isNativePlatform() || !uid) return;
  initOneSignal();
  const OneSignal = osApi();
  if (!OneSignal) {
    if (attempt < 30) setTimeout(() => registerNativePush(uid, attempt + 1), 300);
    return;
  }
  try { OneSignal.login(String(uid)); } catch (_) {}
}

// Unbind on sign-out so pushes stop going to a signed-out device.
export function logoutNativePush() {
  if (!isNativePlatform()) return;
  const OneSignal = osApi();
  if (!OneSignal) return;
  try { OneSignal.logout(); } catch (_) {}
}
