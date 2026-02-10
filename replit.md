# LoKate

## Overview
LoKate is a mobile app connecting photo seekers with LoKaters. Seekers drop pins on a map to request photos at specific locations with orientation, angle, and timing preferences. LoKaters browse nearby requests, go to the location, take photos, and earn money.

## Recent Changes
- 2026-02-10: Redesigned Home Page to match UI reference: dark map, search bar overlay, purple accent, new request card layout, 3-tab icon-only bottom nav
- 2026-02-10: Updated color palette from sky blue/grass green to purple (#7C3AED) accent with orange time indicators
- 2026-02-10: Changed font from DM Sans to Archivo throughout
- 2026-02-10: Initial build with map, activity feed, profile, camera, create-request screens

## Architecture
- **Frontend**: Expo Router with file-based routing, React Native
- **Backend**: Express (minimal, mainly serving landing page)
- **State**: AsyncStorage for local persistence
- **Fonts**: Archivo (@expo-google-fonts/dm-sans package, using Archivo_* families)
- **Maps**: react-native-maps@1.18.0
- **Camera**: expo-camera
- **Colors**: Purple accent (#7C3AED), dark map (#1A1B2E), orange time (#F97316), defined in constants/colors.ts

## Design System
- **Primary**: Purple #7C3AED (buttons, active states, markers)
- **Time indicators**: Orange #F97316
- **Background**: Light gray #F5F5F7
- **Map**: Dark navy #1A1B2E
- **Category colors**: Gold (landmarks), Green (nature), Pink (markets), Orange (beaches), Blue (cityscapes), Red (food), Purple (hidden-gems), Teal (events)
- **Bottom nav**: 3 visible tabs (Explore, Orders, Profile), icon-only, active tab has purple circle bg
- **Notifications tab**: Hidden from nav (href: null), still accessible via routing

## Key Files
- `app/(tabs)/index.tsx` - Home: dark map with search bar, category pills, request cards
- `app/(tabs)/orders.tsx` - Orders with active/past tabs
- `app/(tabs)/notifications.tsx` - Notifications (hidden from tab bar)
- `app/(tabs)/profile.tsx` - Profile with stats, earnings
- `app/(tabs)/_layout.tsx` - Tab layout with 3 visible tabs, purple active state
- `app/create-request.tsx` - Modal form to create photo requests
- `app/request-detail/[id].tsx` - Request detail with actions
- `app/camera/[id].tsx` - Camera screen for LoKaters to take photos
- `components/MapViewWrapper.web.tsx` - Web map with dark theme, area labels, grid
- `components/MapViewWrapper.native.tsx` - Native map with react-native-maps
- `constants/colors.ts` - Color palette and theme
- `lib/store.ts` - AppProvider context with AsyncStorage persistence
- `lib/types.ts` - TypeScript types and CATEGORIES
- `lib/demo-data.ts` - Seed demo requests

## Personas
- **Seeker**: Creates photo requests at map locations
- **LoKater**: Browses requests, claims them, takes photos, earns rewards
