---
phase: 02-connections
fixed_at: 2026-04-13T12:15:00Z
review_path: .planning/phases/02-connections/02-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-04-13T12:15:00Z
**Source review:** .planning/phases/02-connections/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5
- Fixed: 5
- Skipped: 0

## Fixed Issues

### CR-01: Missing unique constraint on challengeMembers allows duplicate memberships via race condition

**Files modified:** `src/db/schema.ts`, `src/lib/actions/connections.ts`
**Commit:** 7b951d6
**Applied fix:** Added `unique('challenge_members_user_id_unique').on(table.userId)` constraint to the `challengeMembers` table definition via Drizzle's third-argument callback. Imported `unique` from `drizzle-orm/pg-core`. Wrapped the INSERT in `joinChallengeAction` with try/catch to gracefully handle unique constraint violations from concurrent requests, returning `{ error: 'already_in_challenge' }`.

### WR-01: generateInviteLinkAction has no collision handling for invite codes

**Files modified:** `src/lib/actions/connections.ts`
**Commit:** d5a0eff
**Applied fix:** Replaced the single `generateCode()` + `db.insert()` with a retry loop (up to 3 attempts). Each iteration generates a fresh code and attempts the insert. If a unique constraint collision occurs, the loop retries with a new code. After 3 failures, returns a user-friendly error message.

### WR-02: leaveChallengeAction silently succeeds even when user has no membership to delete

**Files modified:** `src/lib/actions/connections.ts`
**Commit:** 53a3ab7
**Applied fix:** Added `.returning()` to the `db.delete()` call and check `deleted.length === 0` to detect when no rows were actually removed. Returns `{ error: 'not_in_challenge' }` instead of a false `{ success: true }`.

### WR-03: LeaveChallengeButton silently swallows errors from leaveChallengeAction

**Files modified:** `src/components/connections/leave-challenge-button.tsx`
**Commit:** 6b66f7c
**Applied fix:** Added `error` state (`useState<string | null>(null)`). The `handleLeave` function now clears error on retry, sets a user-facing error message on both server action failure (`result.success` falsy) and catch (network/server error). Error is rendered with `role="alert"` below the confirmation buttons for accessibility.

### WR-04: ShareInviteButton silently ignores clipboard write failure

**Files modified:** `src/components/connections/share-invite-button.tsx`
**Commit:** 5c85df1
**Applied fix:** Added `copyFailed` state. The clipboard API catch block now sets `copyFailed` to true with a 3-second auto-clear via `setTimeout`. The button renders "Copy failed -- try manually" in error color when the clipboard write fails, giving the user actionable feedback.

---

_Fixed: 2026-04-13T12:15:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
