# Trailhead — Native App (Capacitor) Setup Runbook

Milestone A: get the existing web app onto the iOS/Android stores as a Capacitor
shell wrapping the **local** esbuild bundle, using online Mapbox. Offline maps
(MapLibre + Protomaps) are Milestone B, a later isolated follow-on.

## The golden rule — web keeps working

The web/PWA at `trailhead.lonepeakoverland.com` is untouched. `build.sh` →
`deploy-v2.2/` → Vercel is exactly as before. All native behavior is gated
behind `isNativePlatform()` in `native-bridge.js`, which reads the runtime
`window.Capacitor` global and has **no static `@capacitor/*` imports** — so the
web bundle carries zero native code and needs no extra installs to build.
`webDir` in `capacitor.config.json` points at `deploy-v2.2`, so the native app
ships the *same* built assets the web does. One `entry.jsx`, two targets.

## What's already committed in-repo

- `capacitor.config.json` — appId `com.lonepeakoverland.trailhub`, appName `Trailhub`, `webDir: deploy-v2.2`, dark status bar + splash. (App Store / home-screen name is **Trailhub**; the `trailhead.lonepeakoverland.com` web domain is unchanged.)
- `native-bridge.js` — web-safe shell: platform detect, deep-link routing (→ `trailhead:deeplink` window event), Android back button, status bar, splash hide. No-op on web.
- `entry.jsx` — calls `initNativeShell()` after mount (inert on web).
- `trailhead-v1.jsx` — deep-link router now listens for BOTH the SW `navigate` message (web) and the native `trailhead:deeplink` event, routing both identically.

## Prerequisites (your machine)

- **iOS:** macOS + Xcode (App Store), CocoaPods (`sudo gem install cocoapods` or `brew install cocoapods`).
- **Android:** Android Studio + JDK 17.
- **Accounts:** Apple Developer ($99/yr) + Google Play ($25 one-time). Start these now — activation can take a day+.

## One-time install + platform add

```bash
cd /Users/cainen/Documents/Claude/Projects/Trailhead

# Capacitor core + CLI + platforms + the plugins the shell uses
npm install @capacitor/core @capacitor/cli \
  @capacitor/ios @capacitor/android \
  @capacitor/app @capacitor/status-bar @capacitor/splash-screen

# Build the web assets FIRST (native copies from deploy-v2.2)
bash build.sh

# Add native platforms (creates ios/ and android/ project folders)
npx cap add ios
npx cap add android
```

`npx cap init` is NOT needed — `capacitor.config.json` already exists.

## Every time the web bundle changes

```bash
bash build.sh          # rebuild deploy-v2.2
npx cap copy           # copy web assets into ios/ + android/
# npx cap sync         # use sync instead of copy after adding/removing plugins
```

## Open + run

```bash
npx cap open ios       # opens Xcode → pick a simulator or device → Run
npx cap open android   # opens Android Studio → Run
```

The iOS **simulator** runs without a paid Apple account. Real-device installs +
TestFlight require the Developer account + a signing team (set in Xcode →
Signing & Capabilities).

## iOS Info.plist privacy strings (required or the app crashes on permission use)

Add in Xcode (Info tab) or `ios/App/App/Info.plist`:

- `NSLocationWhenInUseUsageDescription` — "Trailhead uses your location to show nearby camping spots, record routes, and share recovery alerts."
- `NSCameraUsageDescription` — "Trailhead uses your camera to add photos to posts, builds, and trip reports."
- `NSPhotoLibraryUsageDescription` / `NSPhotoLibraryAddUsageDescription` — "Trailhead accesses your photos to attach them to posts and share images."

## Deep links (do during Phase 1/2, needed for push-tap routing + share links)

- **Custom scheme** (`trailhead://…`): iOS → URL Types in Xcode; Android → intent-filter in `AndroidManifest.xml`. `native-bridge.js` already converts these to app paths.
- **Universal / App Links** (`https://trailhead.lonepeakoverland.com/…`): iOS Associated Domains (`applinks:trailhead.lonepeakoverland.com`) + host an `apple-app-site-association` file; Android `assetlinks.json` + `android:autoVerify`. Lets existing share URLs open the app directly.

## Still ahead (not in this shell)

- **Phase 0 gates:** Sign in with Apple (needs Apple Dev account → Service ID + key + Supabase Apple provider), in-app account deletion (building next — works on web too).
- **Phase 2 — native push:** OneSignal (simplest) or APNs/FCM wired into `send-push`; register device token on native, keep web VAPID. Add `@capacitor/push-notifications` (or the OneSignal plugin) then extend `native-bridge.js`.
- **Phase 4/5 — store submit:** screenshots, privacy nutrition labels, TestFlight, then Play.
- **Phase 6 — OTA live updates:** `@capgo/capacitor-updater` or Appflow so single-file web changes ship without a full App Review resubmission (critical for our deploy cadence).
- **Milestone B — offline maps:** MapLibre GL + Protomaps PMTiles region packs (see `project_offline_maps_plan`).

## The one 4.2 risk

Apple may reject a web-wrapper as "just a website" (guideline 4.2). Mitigated by
native push + GPS + camera + share (and later offline maps). If they push back,
move offline maps up the queue — the native capabilities usually clear it.
