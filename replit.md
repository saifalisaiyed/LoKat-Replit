# LoKat

## Overview
LoKat is a mobile app connecting photo seekers with LoKaters. Seekers drop pins on a map to request photos at specific locations with orientation, angle, and timing preferences. LoKaters browse nearby requests, go to the location, take photos, and earn money.

## Product Decisions
- **Target platforms**: iOS App Store + Android Play Store only. Web preview exists for Replit development only, not for public distribution.
- **No phone/email verification at signup**: Deferred — can add SMS (Twilio) or email OTP (Resend) before public launch. Twilio integration available in Replit but not yet connected.
- **Camera only — no gallery picker**: LoKaters can only submit live camera captures. No `ImagePicker`/gallery access anywhere in the codebase. GPS is captured at shutter press for verification.

## Recent Changes
- 2026-02-27: Payment gates added: seekers prompted for card (Stripe Checkout SetupMode via expo-web-browser) when posting first request; LoKaters prompted for payout info (PayPal email or bank details) when accepting first request. `hasPaymentMethod` + `payoutInfo` fields added to users table. New screens: `app/payment-setup.tsx`, `app/payout-setup.tsx`. Backend: `/api/payments/setup-session`, `/api/payments/payment-status`, `/api/auth/payout-info`, `/payment-success`, `/payment-cancel`.
- 2026-02-26: Profile page fully wired: settings gear → edit-profile; Notifications menu → notifications tab; Withdraw/History → payment-methods/transaction-history; Privacy & Security, Help, Terms all navigate to new screens; Contact Us opens mailto; member since date shown; all dead buttons removed
- 2026-02-26: New screens: `app/transaction-history.tsx` (completed requests with earn/spend summary), `app/payment-methods.tsx` (wallet + withdraw modal), `app/privacy-security.tsx` (change password, location toggle, delete account), `app/help.tsx` (FAQ accordion by category), `app/terms.tsx` (scrollable T&C)
- 2026-02-26: `createdAt` added to AuthUser and UserProfile; member since date shown on profile card
- 2026-02-26: Live walking route on navigation map: Google Maps Directions API via `/api/directions` endpoint; native map has tilted camera tracking user position/heading with blue route polyline; web Leaflet map draws real route; fallback to straight dashed line if no route
- 2026-02-26: Fixed auth cookie issue: removed expo/fetch import from query-client.ts so native global fetch handles session cookies properly
- 2026-02-26: Fixed double-abandon bug: abandonRequest now immediately clears activeRequestId; home redirect useEffect guards against abandoned=1 param
- 2026-02-26: Fixed accept/abandon navigation crashes: removed all router.dismissAll() calls; handleAccept awaits result and only navigates on success
- 2026-02-26: Location verification: camera locked until within 300m; GPS captured at shutter press; server rejects if >300m from target (returns TOO_FAR error with distance)
- 2026-02-26: Stripe payment flow complete: photo submission → `/api/payments/complete-submission` → Stripe PaymentIntent created → LoKater earnings credited → receipt screen with animation
- 2026-02-26: `app/receipt/[id].tsx` — animated success screen showing earned amount, new wallet balance, Stripe reference, timestamp
- 2026-02-26: `completeRequestWithPayment` and `updateUserStripeCustomerId` added to storage.ts
- 2026-02-26: `POST /api/payments/complete-submission` endpoint; `GET /api/stripe/publishable-key` endpoint; webhook route `/api/stripe/webhook`
- 2026-02-26: Stripe initialized at server startup via `stripe-replit-sync`; `stripeCustomerId` on users table, `stripePaymentIntentId` on photo_requests
- 2026-02-22: Admin panel: admin@lokat.app/admin1234 can view all requests (all statuses), user stats, filter by status
- 2026-02-22: Three test accounts: seeker@lokat.app/demo1234, lokater@lokat.app/demo1234, admin@lokat.app/admin1234
- 2026-02-22: isAdmin field on users table, requireAdmin middleware, admin API endpoints
- 2026-02-22: Multi-step sign-up: phone+password → name → email → app (progressive onboarding)
- 2026-02-22: Login uses email+password; sign-up uses phone+password
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
- `POST /api/auth/register` - Register new user (phone, password)
- `POST /api/auth/login` - Login (email, password)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current session user
- `PATCH /api/auth/profile` - Update profile (displayName, email) (auth required)
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
- `app/auth.tsx` - Login (email+password) / Sign Up (phone+password) screen
- `app/onboarding/name.tsx` - Onboarding step: "What's your name?"
- `app/onboarding/email.tsx` - Onboarding step: "Add your email"
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
- **users**: id (uuid), username (unique), email, phone, password (sha256), displayName, requestsCreated, requestsFulfilled, earnings
- **photo_requests**: id (uuid), creatorId, claimedBy, latitude, longitude, locationName, address, category, orientation, angle, timing, reward, status, notes, createdAt
- **notifications**: id (uuid), userId, type, title, message, requestId, read, createdAt

## Personas
- **Seeker**: Creates photo requests at map locations
- **LoKater**: Browses requests, claims them, takes photos, earns rewards
