---
name: Security hardening
description: What security measures are in place and where they live
---

# Security Hardening

## Rate limiting (server/index.ts)
- General API: 100 req / 15 min
- Auth endpoints (login, register, forgot-password): 10 req / 15 min

## Input validation helpers (top of server/routes.ts)
- `UUID_RE` + `requireValidId()` — rejects non-UUID :id params with 400
- `escapeHtml()` — escapes HTML in strings sent in emails
- `maxLen(str, n)` — trims strings to max length
- `VALID_CATEGORIES`, `VALID_ORIENTATIONS`, `VALID_ANGLES`, `VALID_TIMING` — enum whitelists

## Body size limits (server/index.ts)
- JSON body: 10kb
- Multipart (multer for blur-faces endpoint): 20MB

## Error handling
- Global error handler: 5xx → "Something went wrong" in production; 4xx → original message
- `stripeError` field removed from 402 payment response (no internal Stripe messages to client)

## Process guards (server/index.ts)
- `process.on('unhandledRejection')` — logs and continues
- `process.on('uncaughtException')` — logs and exits (process manager restarts)

## Database indexes added
photo_requests(status), photo_requests(creator_id), photo_requests(accepted_by), notifications(user_id), messages(request_id)

## CORS
- Localhost origins only allowed when `REPLIT_DEPLOYMENT !== '1'`
- Production only accepts REPLIT_DOMAINS origins

## Sessions
- SESSION_SECRET throws at startup if unset
- Cookies: httpOnly, secure in production, sameSite: lax
