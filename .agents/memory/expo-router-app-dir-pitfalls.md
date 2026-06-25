---
name: Expo Router app/ dir pitfalls
description: Files in app/ that crash Metro/Expo Router route resolution and the expo-notifications import crash in Expo Go
---

# app/ directory route-resolution crashes

Everything in `app/` is treated as a route by Expo Router. Two patterns cause hard crashes:

1. **Platform-tagged non-route files** — e.g. `map-picker.native.styles.ts` + `map-picker.web.styles.ts` with NO plain `map-picker.styles.ts` sibling. Expo Router's `getRoutes` throws `"The file ... does not have a fallback sibling file without a platform extension."` at route-tree build time, crashing `ContextNavigator` for the whole app.
   - Plain `*.styles.ts` (no `.native`/`.web`) are tolerated: they generate an unused route that's never navigated to, so no warning/crash.
   - **Fix:** if native/web style files are identical, merge into one plain `*.styles.ts` and import that from both `*.native.tsx` and `*.web.tsx`. Better: keep non-route files out of `app/` entirely.

2. **Co-located helper files importing `@/constants/colors.js`** — the `@/` alias does not resolve from inside `node_modules`; never let a node_modules file import it.

**How to apply:** when the app crashes with `ContextNavigator` errors or "missing required default export" warnings for real route files, check `find app -name "*.native.*" -o -name "*.web.*"` for platform-tagged non-component files first.

# expo-notifications crashes on import in Expo Go (SDK 53+)

`import * as Notifications from "expo-notifications"` THROWS at module-load time on Android Expo Go since SDK 53 (remote notifications removed). A runtime `isExpoGo` guard does NOT help because the top-level import runs first and crashes the whole app on launch.

**Fix:** lazy-load with `require("expo-notifications")` inside a `if (!isExpoGo && Platform.OS !== "web")` guard, store in a module-level `let Notifications: any = null`, and null-check it everywhere before use.

**Why:** the import chain `app/(tabs)/_layout.tsx → lib/store.ts → lib/usePushNotifications.ts → expo-notifications` took the entire app down on every phone scan; symptom was "shake → reload does nothing" because the bundle crashed before rendering.
