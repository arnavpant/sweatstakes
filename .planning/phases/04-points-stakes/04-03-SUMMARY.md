---
phase: 04-points-stakes
plan: 03
subsystem: streaks-balance-ui
tags: [ui, streaks, leaderboard, rewards, base-ui, drawer, dialog]
dependency_graph:
  requires: [04-01, 04-02]
  provides: [streaks-page, streak-section, member-leaderboard, rewards-menu, add-reward-drawer, redeem-dialog]
  affects: [/streaks route]
tech_stack:
  added: []
  patterns: [Base UI Drawer, Base UI Dialog, react-hook-form + zod client validation, Server Component data fetching with client component interactivity]
key_files:
  created:
    - src/components/streaks/streak-section.tsx
    - src/components/streaks/member-leaderboard.tsx
    - src/components/streaks/rewards-menu.tsx
    - src/components/streaks/add-reward-drawer.tsx
    - src/components/streaks/redeem-dialog.tsx
  modified:
    - src/app/(protected)/streaks/page.tsx
decisions:
  - Used record-based form typing to resolve z.coerce type mismatch with react-hook-form zodResolver
  - Personal best computed via 52-week walk in the server component (same pattern as computeStreak)
  - RewardsMenu manages RedeemDialog open state via redeemTarget useState rather than per-row state
metrics:
  duration: 7min
  completed: 2026-04-13T22:05:00Z
  tasks: 2
  files: 6
---

# Phase 4 Plan 3: Streaks & Balance Page UI Summary

Full Streaks & Balance page with streak display, member leaderboard sorted by balance, and interactive rewards menu using Base UI Drawer/Dialog primitives.

## What Was Built

### Task 1: StreakSection, MemberLeaderboard, and Streaks Page Shell
- **StreakSection** (`streak-section.tsx`): Server Component reusing `StreakCounter` for current streak, plus personal best display with trophy emoji and "Current best!" badge when streak equals personal best
- **MemberLeaderboard** (`member-leaderboard.tsx`): Server Component rendering ranked balance list with avatar (Google pic or initial fallback), display name with "(You)" indicator, and color-coded balance (green positive, red negative, muted zero) with U+2212 minus sign for negatives. Current user's row highlighted with `ring-1 ring-secondary/30`
- **Streaks page** (`page.tsx`): Async Server Component that authenticates user, computes current streak via `computeStreak()`, walks 52 weeks of check-in history for personal best via `computePersonalBest()`, queries member balances via LEFT JOIN with SUM(pointTransactions.delta), and fetches rewards. Renders three sections with proper spacing (`px-4 pt-6 pb-32 space-y-8`)

### Task 2: RewardsMenu, AddRewardDrawer, and RedeemDialog
- **AddRewardDrawer** (`add-reward-drawer.tsx`): Client Component using Base UI `Drawer` with react-hook-form + zod validation. Name field (max 60 chars) and point cost field (min 1, numeric). Submit calls `addRewardAction` server action, with loading spinner and server error display. Discard button resets and closes
- **RedeemDialog** (`redeem-dialog.tsx`): Client Component using Base UI `Dialog` with controlled open state. Shows quoted reward name, point cost, and current balance. Confirm calls `redeemRewardAction`, dismiss labeled "Keep my points"
- **RewardsMenu** (`rewards-menu.tsx`): Client Component rendering reward list with cost badges, enabled/disabled Redeem buttons (based on balance vs cost), and Trash2 delete icons. Empty state shows Gift icon with "No rewards yet" message. Delete uses inline loading (row dims to opacity-50). AddRewardDrawer trigger integrated as "+" button in section header

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type mismatch with z.coerce and react-hook-form**
- **Found during:** Task 2
- **Issue:** `z.coerce.number()` creates an input type of `unknown` which conflicts with react-hook-form's `Resolver` generic expecting matching input/output types
- **Fix:** Used untyped `useForm()` call with runtime cast after zod validation, and added fallback strings for nullable error fields
- **Files modified:** `src/components/streaks/add-reward-drawer.tsx`, `src/components/streaks/redeem-dialog.tsx`
- **Commit:** 3f2ef5a

## Verification Results

- `npx vitest run tests/points.test.ts` -- 17/17 tests pass
- `npx tsc --noEmit` -- no TypeScript errors in any streaks files
- Streaks page no longer shows "Coming in a future update" placeholder
- All 5 new component files exist in `src/components/streaks/`

## Self-Check: PASSED

- [x] `src/components/streaks/streak-section.tsx` -- FOUND
- [x] `src/components/streaks/member-leaderboard.tsx` -- FOUND
- [x] `src/components/streaks/rewards-menu.tsx` -- FOUND
- [x] `src/components/streaks/add-reward-drawer.tsx` -- FOUND
- [x] `src/components/streaks/redeem-dialog.tsx` -- FOUND
- [x] `src/app/(protected)/streaks/page.tsx` -- FOUND (modified)
- [x] Commit `e299c68` -- FOUND (Task 1)
- [x] Commit `3f2ef5a` -- FOUND (Task 2)
