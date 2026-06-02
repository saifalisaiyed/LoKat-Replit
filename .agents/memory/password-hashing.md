---
name: Password hashing
description: bcrypt upgrade with SHA-256 backwards compatibility for existing accounts
---

# Password Hashing

## Current state
`hashPassword` uses bcrypt (12 rounds, ~250ms) via `bcryptjs`.
`verifyPassword` detects legacy SHA-256 hashes by checking if the stored hash matches `/^[0-9a-f]{64}$/` and falls back to SHA-256 comparison if so.

## Why the fallback exists
The demo accounts (seeker@lokat.app, lokater@lokat.app, admin@lokat.app) were seeded with SHA-256 hashes before bcrypt was introduced. Removing the fallback would lock them out. New registrations automatically get bcrypt hashes.

**Do not remove the SHA-256 fallback** until all existing user passwords have been re-hashed (either by re-seeding or by upgrading on next login).

## Location
`server/storage.ts` — `hashPassword()` and `verifyPassword()`
