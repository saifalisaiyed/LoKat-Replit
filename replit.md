# LoKate

## Overview
LoKate is a mobile app connecting photo seekers with LoKaters. Seekers drop pins on a map to request photos at specific locations with orientation, angle, and timing preferences. LoKaters browse nearby requests, go to the location, take photos, and earn money.

## Recent Changes
- 2026-02-10: Initial build with map, activity feed, profile, camera, create-request screens

## Architecture
- **Frontend**: Expo Router with file-based routing, React Native
- **Backend**: Express (minimal, mainly serving landing page)
- **State**: AsyncStorage for local persistence
- **Fonts**: DM Sans (@expo-google-fonts/dm-sans)
- **Maps**: react-native-maps@1.18.0
- **Camera**: expo-camera
- **Colors**: Emerald/navy theme in constants/colors.ts

## Key Files
- `app/(tabs)/map.tsx` - Map screen for exploring/pinning locations
- `app/(tabs)/activity.tsx` - Request feed (seeker's requests / LoKater available)
- `app/(tabs)/profile.tsx` - Profile with role toggle, stats, earnings
- `app/create-request.tsx` - Modal form to create photo requests
- `app/request-detail/[id].tsx` - Request detail with actions
- `app/camera/[id].tsx` - Camera screen for LoKaters to take photos
- `lib/store.ts` - AppProvider context with AsyncStorage persistence
- `lib/types.ts` - TypeScript types
- `lib/demo-data.ts` - Seed demo requests

## Personas
- **Seeker**: Creates photo requests at map locations
- **LoKater**: Browses requests, claims them, takes photos, earns rewards
