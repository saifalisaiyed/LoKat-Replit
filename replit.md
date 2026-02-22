# LoKate

## Overview
LoKate is a mobile app connecting photo seekers with LoKaters. Seekers drop pins on a map to request photos at specific locations with orientation, angle, and timing preferences. LoKaters browse nearby requests, go to the location, take photos, and earn money.

## Recent Changes
- 2026-02-22: Full backend with PostgreSQL, session auth, REST API, seeded demo data
- 2026-02-22: Frontend rewritten to use API calls via React context (replaced AsyncStorage)
- 2026-02-22: Auth screens (login/register) with session-based authentication
- 2026-02-22: All screens use real user IDs from auth, auth guards on create actions
- 2026-02-10: Redesigned Home Page: dark map, search bar, purple accent, category pills, request cards
- 2026-02-10: Changed font from DM Sans to Archivo throughout

## Architecture
- **Frontend**: Expo Router with file-based routing, React Native
- **Backend**: Express with TypeScript, session-based auth (express-session + connect-pg-simple)
- **Database**: PostgreSQL via Drizzle ORM (users, photo_requests, notifications tables)
- **State**: React context (useApp) wrapping API calls; no more AsyncStorage
- **Auth**: Session cookies, login/register at /auth, guards on create/claim actions
- **Fonts**: Archivo (@expo-google-fonts/dm-sans package, using Archivo_* families)
- **Maps**: react-native-maps@1.18.0
- **Camera**: expo-camera
- **Search**: Google Places API (legacy Text Search) with Nominatim fallback
- **Colors**: Purple accent (#7C3AED), dark map (#1A1B2E), orange time (#F97316)

## API Endpoints
- `POST /api/auth/register` - Register new user (username, password, displayName)
- `POST /api/auth/login` - Login (username, password)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current session user
- `GET /api/requests` - List all open requests
- `GET /api/requests/:id` - Get single request
- `POST /api/requests` - Create request (auth required)
- `PATCH /api/requests/:id/claim` - Claim a request (auth required)
- `PATCH /api/requests/:id/complete` - Complete a request (auth required)
- `GET /api/notifications` - Get user notifications (auth required)
- `POST /api/notifications/:id/read` - Mark notification read (auth required)
- `GET /api/search?q=query` - Location search (Google Places + Nominatim fallback)
- `GET /api/profile/:id` - Get user profile stats

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
- `app/auth.tsx` - Login/Register authentication screen
- `app/create-request.tsx` - Modal form to create photo requests
- `app/request-detail/[id].tsx` - Request detail with actions
- `app/camera/[id].tsx` - Camera screen for LoKaters to take photos
- `app/lokater-mode/[id].tsx` - Navigation mode for fulfilling requests
- `components/MapViewWrapper.web.tsx` - Web map with dark theme, area labels, grid
- `components/MapViewWrapper.native.tsx` - Native map with react-native-maps
- `constants/colors.ts` - Color palette and theme
- `lib/store.ts` - AppProvider context wrapping API calls
- `lib/types.ts` - TypeScript types and CATEGORIES
- `shared/schema.ts` - Drizzle ORM schema (users, photo_requests, notifications)
- `server/routes.ts` - All API route handlers
- `server/storage.ts` - Database storage layer
- `server/seed.ts` - Demo data seeder (12 NYC photo requests)

## Database Schema
- **users**: id (uuid), username (unique), password (sha256), displayName, requestsCreated, requestsFulfilled, earnings, rating
- **photo_requests**: id (uuid), creatorId, claimedBy, latitude, longitude, locationName, address, category, orientation, angle, timing, reward, status, notes, createdAt
- **notifications**: id (uuid), userId, type, title, message, requestId, read, createdAt

## Personas
- **Seeker**: Creates photo requests at map locations
- **LoKater**: Browses requests, claims them, takes photos, earns rewards
