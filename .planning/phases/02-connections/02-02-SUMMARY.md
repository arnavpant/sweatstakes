---
phase: 02-connections
plan: 02
subsystem: server-actions, routing, auth
tags: [server-actions, invite-link, join-flow, oauth-threading, nanoid]
dependency_graph:
  requires: [db-client, challenges-table, challenge-members-table, invite-links-table]
  provides: [generateInviteLinkAction, joinChallengeAction, leaveChallengeAction, join-route, join-error-page, auth-next-param]
  affects: [02-03]
tech_stack:
  added: []
  patterns: [server-action-auth-gate, atomic-update-returning, oauth-next-param-threading, nanoid-custom-alphabet]
key_files:
  created:
    - src/lib/actions/connections.ts
    - src/app/join/[code]/page.tsx
    - src/app/join/[code]/error/page.tsx
  modified:
    - src/lib/actions/auth.ts
    - src/components/auth/google-sign-in-button.tsx
    - tests/connections.test.ts
decisions:
  - All three Server Actions use supabase.auth.getUser() as RLS substitute since Drizzle bypasses PostgreSQL RLS
  - joinChallengeAction uses atomic UPDATE WHERE used_at IS NULL AND expires_at > NOW() RETURNING to prevent race conditions on one-time-use codes
  - signInWithGoogleAction accepts next param threaded through OAuth redirectTo to preserve join intent through Google sign-in round-trip
  - Login page does not need changes -- GoogleSignInButton already uses useSearchParams() which reads next param automatically
metrics:
  duration: 6m
  completed: 2026-04-13T08:31:53Z
  tasks_completed: 3
  tasks_total: 3
  tests_added: 27
  tests_total: 64
  files_changed: 6
---

# Phase 02 Plan 02: Server Actions & Join Flow Summary

Three connection Server Actions (generate invite link, join challenge, leave challenge) with atomic DB patterns, a public /join/[code] route handling both auth states, an error page for invalid links, and OAuth next-param threading for unauthenticated join flow.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create connection Server Actions (generate, join, leave) | 2c3f470 | src/lib/actions/connections.ts |
| 2 | Create /join/[code] route, error page, update auth flow | dd3b1ac | src/app/join/[code]/page.tsx, src/app/join/[code]/error/page.tsx, src/lib/actions/auth.ts, src/components/auth/google-sign-in-button.tsx |
| 3 | Add Server Action and join flow tests | d147ed8 | tests/connections.test.ts |

## What Was Built

### Server Actions (src/lib/actions/connections.ts)
- **generateInviteLinkAction**: Auth-gated. Finds or creates challenge implicitly (D-11). Generates 8-char uppercase code via nanoid customAlphabet (excludes ambiguous 0/O/I/1). 24-hour expiry (D-03). Returns full invite URL.
- **joinChallengeAction(code)**: Auth-gated. Checks existing membership first (D-14, returns `already_in_challenge`). Atomically validates and consumes invite code via UPDATE WHERE used_at IS NULL AND expires_at > NOW() RETURNING (Pitfall 3 race condition prevention). Creates membership row. Returns `{ success: true }` or `{ error: string }`.
- **leaveChallengeAction**: Auth-gated. Deletes membership row. No owner role, challenge persists with remaining members (D-13).

### Join Route (src/app/join/[code]/page.tsx)
- Public Server Component (not in protected route group, not in proxy.ts protectedRoutes array)
- Uses Next.js 16 async params: `await params`
- Unauthenticated users: redirects to `/login?next=/join/{code}` preserving join intent (D-07)
- Authenticated users: calls joinChallengeAction immediately (D-08), redirects to dashboard on success, error page on failure

### Error Page (src/app/join/[code]/error/page.tsx)
- Maps error codes to user-friendly messages (T-02-08: no internal details exposed)
- `invalid_or_expired`: "This invite link has expired or already been used."
- `already_in_challenge`: "You are already in a challenge. Leave your current challenge first to join a new one."
- Shows "Ask your friend to send a new invite link" suggestion
- Link back to dashboard

### Auth Flow Updates
- **signInWithGoogleAction**: Now accepts optional `next` param (default `/dashboard`). Threads it through OAuth redirectTo as `?next=${encodeURIComponent(next)}` so auth/callback redirects to the right place after sign-in (Pitfall 4 mitigation).
- **GoogleSignInButton**: Reads `next` from searchParams via `useSearchParams()`, passes it to `signInWithGoogleAction`.
- **auth/callback/route.ts**: Already handles `next` param -- no changes needed (verified as regression test).

### Tests
- 27 new tests added to tests/connections.test.ts covering:
  - Server Actions: 13 tests (directive, exports, nanoid usage, alphabet, code length, atomic pattern, auth checks, implicit creation, expiry, membership check, delete)
  - Join Flow: 9 tests (file existence, redirects, async params, error messages, dashboard link)
  - Auth Threading: 5 tests (next param signature, encodeURIComponent, searchParams reading, action passing, callback regression)
- Full suite: 64 tests passing (20 auth + 44 connections)

## Deviations from Plan

None -- plan executed exactly as written.

## Threat Mitigations Implemented

| Threat ID | Mitigation | Implementation |
|-----------|-----------|----------------|
| T-02-05 | Atomic UPDATE prevents race condition on one-time codes | `isNull(inviteLinks.usedAt)` + `gt(inviteLinks.expiresAt, new Date())` in WHERE clause with RETURNING |
| T-02-06 | Open redirect prevention via next param | auth/callback/route.ts already validates: must start with `/`, must not start with `//` (pre-existing) |
| T-02-07 | Auth gate on all Server Actions | All 3 actions call `supabase.auth.getUser()` before any DB query |
| T-02-08 | Generic error messages, no SQL details | Error page maps codes to user-friendly strings |
| T-02-09 | Existing membership check before join | `joinChallengeAction` queries challengeMembers before consuming invite code |

## Verification Results

| Check | Status |
|-------|--------|
| npm run build | PASS |
| npx vitest run tests/connections.test.ts | PASS (44/44) |
| npx vitest run (full suite) | PASS (64/64) |
| connections.ts exports 3 actions | PASS |
| join page handles both auth states | PASS |
| error page shows user-friendly messages | PASS |
| signInWithGoogleAction threads next param | PASS |

## Self-Check: PASSED

All 7 created/modified files verified on disk. All 3 commits verified in git log.
