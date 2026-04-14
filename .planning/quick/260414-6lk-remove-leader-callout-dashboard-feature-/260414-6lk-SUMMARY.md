---
phase: quick-260414-6lk
plan: 01
subsystem: dashboard
tags: [refactor, cleanup, dashboard, dead-code]
dependency_graph:
  requires: []
  provides: []
  affects:
    - src/app/(protected)/dashboard/page.tsx
    - src/lib/queries/dashboard.ts
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  deleted:
    - src/components/dashboard/leader-callout.tsx
    - src/lib/utils/leader-callout.ts
    - tests/leader-callout.test.ts
  modified:
    - src/app/(protected)/dashboard/page.tsx
    - src/lib/queries/dashboard.ts
    - tests/dashboard-queries.test.ts
decisions:
  - "Atomic single-commit removal: deletions + edits landed together so no intermediate state would break the build."
metrics:
  duration: ~4min
  completed: 2026-04-14
  tasks: 1
  files: 6
  test_delta: -10
requirements:
  - QUICK-260414-6lk
---

# Quick Task 260414-6lk: Remove Leader Callout Dashboard Feature Summary

Removed the dashboard "leader callout" feature end-to-end — the component, its pure utility, its tests, and the now-orphan `getBalancesForChallenge` query helper and its tests. Six files changed in one atomic commit; no TypeScript or remaining-test regressions.

## What Was Done

**Files deleted (3):**
- `src/components/dashboard/leader-callout.tsx` — the callout UI component
- `src/lib/utils/leader-callout.ts` — pure copy-generation utility (`computeLeaderCallout`, `LeaderCalloutInput`)
- `tests/leader-callout.test.ts` — 8 tests for the utility

**Files edited (3):**
- `src/app/(protected)/dashboard/page.tsx` — removed `LeaderCallout` import, `LeaderCalloutInput` type import, dropped `getBalancesForChallenge` from the `@/lib/queries/dashboard` import list, removed `balances` state declaration, removed the DASH-01 balance fetch, removed the `<LeaderCallout balances=... viewerUserId=... />` JSX node. Updated the state comment from `DASH-01/02/03` to `DASH-02/03`. All other sections (MemberAvatarRow, DayDots, StreakCounter, MemberCardRow, PhotoGallery, empty state, greeting, membership query, weeklyProgress/streak/memberRows/recentPhotos computation) left untouched.
- `src/lib/queries/dashboard.ts` — deleted `getBalancesForChallenge` and its JSDoc block; pruned imports accordingly (removed `pointTransactions` from `@/db/schema`, removed `and` and `sql` from `drizzle-orm`). `getRecentCheckInPhotos` and `getMemberProgressRows` kept exactly as-is.
- `tests/dashboard-queries.test.ts` — removed the `describe('getBalancesForChallenge', ...)` block (2 tests), updated the file-header JSDoc to reference only `getRecentCheckInPhotos`. Chainable builder retained unchanged (`innerJoin`/`groupBy` are harmless no-ops for the remaining tests).

**Commit:** `68933e7`

## Test Impact

**Test count went down by exactly 10:**
- `tests/leader-callout.test.ts`: **-8 tests** (entire file deleted — 8 passing tests for `computeLeaderCallout`)
- `tests/dashboard-queries.test.ts`: **-2 tests** (the `describe('getBalancesForChallenge')` block contained 2 tests: "groups by userId and displayName" and "joins challengeMembers via innerJoin")

Baseline (pre-change, run on `leader-callout.test.ts` + `dashboard-queries.test.ts`): 12 tests passing.
Post-change (same two files — only `dashboard-queries.test.ts` remains): 2 tests passing.
Full suite: 273 → 263 tests (delta exactly -10, matching plan expectation).

## Verification

- `npx tsc --noEmit` — **PASS** (exit 0, no output, no new errors).
- `npx vitest run` (full suite) — **PASS** for all changed/remaining dashboard code paths. 272 tests pass, including all 2 remaining `dashboard-queries.test.ts` tests.
- Grep `LeaderCallout|getBalancesForChallenge|leader-callout|computeLeaderCallout|LeaderCalloutInput` under `src/` and `tests/` — **zero matches**. Clean removal.
- `git status` confirms the three deletions are staged alongside the three edits. Commit `68933e7` contains all six file changes atomically: `6 files changed, 4 insertions(+), 228 deletions(-)`.

## Deferred Issues (pre-existing, out of scope)

**1. `tests/connections.test.ts` — "leaveChallengeAction deletes membership row"**
- Pre-existing failure unrelated to this change. Verified by running the test on the baseline (pre-stash) codebase — it fails identically there.
- The test asserts that `src/app/(protected)/connections/actions.ts` contains the literal string `db.delete(challengeMembers)`, but the action is apparently no longer present or has been refactored.
- Out of scope per the GSD scope-boundary rule: the leader-callout removal does not touch connections code.
- Logged here for future investigation; not blocking this task.

## Deviations from Plan

None. The plan was executed exactly as written, with all surgical edits matching the listed instructions and no auto-fix deviations required.

## Self-Check: PASSED

Verified:
- Deleted files absent: `src/components/dashboard/leader-callout.tsx` **MISSING** (expected — deleted), `src/lib/utils/leader-callout.ts` **MISSING** (expected), `tests/leader-callout.test.ts` **MISSING** (expected).
- Edited files present and correct: `src/app/(protected)/dashboard/page.tsx` **FOUND**, `src/lib/queries/dashboard.ts` **FOUND**, `tests/dashboard-queries.test.ts` **FOUND**.
- Commit `68933e7` **FOUND** in `git log`.
- Grep of forbidden symbols in `src/` and `tests/` returns **no matches**.
- Success criteria from PLAN: three deletions, three edits, zero collateral changes, `tsc --noEmit` passes, remaining suite passes, single atomic commit. All met.
