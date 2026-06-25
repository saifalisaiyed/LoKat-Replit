---
name: Expo Router app/ dir pitfalls
description: Files in app/ that crash Metro/Expo Router route resolution and the expo-notifications import crash in Expo Go
---

# app/ directory route-resolution crashes

Everything in `app/` is treated as a route by Expo Router. Two patterns cause hard crashes:

1. **Platform-tagged non-route files** — e.g. `map-picker.native.styles.ts` + `map-picker.web.styles.ts` with NO plain `map-picker.styles.ts` sibling. Expo Router's `getRoutes` throws `"The file ... does not have a fallback sibling file without a platform extension."` at route-tree build time, crashing `ContextNavigator` for the whole app.
   - Plain `*.styles.ts` in app/ ROOT or a Stack group are tolerated: they generate an unused route that's never navigated to, so no warning/crash.
   - **BUT** any non-route file inside `app/(tabs)/` (or any folder rendered by a Tabs/NativeTabs navigator) becomes a VISIBLE phantom tab — an empty, icon-less box in the tab bar. This includes `*.styles.ts` AND any helper `.ts` (e.g. a renamed `tabStyles.ts`). Symptom: "bunch of empty boxes in the bottom nav."
   - **Correct fix (do this for the whole project):** keep ALL non-route files out of `app/` entirely. Move them to a top-level `styles/` dir mirroring the structure and import via the `@/` alias (`@/styles/(tabs)/index`, etc.). The `@/*` → `./*` alias resolves folder names with parentheses fine. Do NOT just rename-in-place (e.g. `_layout.styles.ts`→`tabStyles.ts`); if it stays in app/ it's still a route/phantom tab.

2. **Co-located helper files importing `@/constants/colors.js`** — the `@/` alias does not resolve from inside `node_modules`; never let a node_modules file import it.

**How to apply:** when the app crashes with `ContextNavigator` errors or "missing required default export" warnings for real route files, check `find app -name "*.native.*" -o -name "*.web.*"` for platform-tagged non-component files first.

# expo-notifications crashes on import in Expo Go (SDK 53+)

`import * as Notifications from "expo-notifications"` THROWS at module-load time on Android Expo Go since SDK 53 (remote notifications removed). A runtime `isExpoGo` guard does NOT help because the top-level import runs first and crashes the whole app on launch.

**Fix:** lazy-load with `require("expo-notifications")` inside a `if (!isExpoGo && Platform.OS !== "web")` guard, store in a module-level `let Notifications: any = null`, and null-check it everywhere before use.

**Why:** the import chain `app/(tabs)/_layout.tsx → lib/store.ts → lib/usePushNotifications.ts → expo-notifications` took the entire app down on every phone scan; symptom was "shake → reload does nothing" because the bundle crashed before rendering.
