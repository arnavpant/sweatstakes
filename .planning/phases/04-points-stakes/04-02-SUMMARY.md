---
phase: 04-points-stakes
plan: 02
subsystem: settlement-cron-actions
tags: [cron, settlement, rewards, redemption, server-actions, settings]
dependency_graph:
  requires: [04-01]
  provides: [settleWeekForChallenge, addRewardAction, deleteRewardAction, redeemRewardAction, updateSettlementSettingsAction, cron-endpoint]
  affects: [04-03, 04-04]
tech_stack:
  added: [vercel-cron]
  patterns: [idempotent-settlement, timezone-aware-cron, atomic-redemption, auth-gate-helper]
key_files:
  created:
    - vercel.json
    - src/app/api/cron/settle/route.ts
    - src/lib/actions/settlement.ts
    - src/lib/actions/points.ts
    - src/components/settings/settlement-settings.tsx
  modified:
    - src/app/(protected)/settings/page.tsx
decisions:
  - "Zod v4 uses `error` param instead of `invalid_type_error` and `.issues` instead of `.errors` — adapted schema definitions"
  - "getAuthAndMembership helper extracts shared auth + membership pattern across all 4 Server Actions"
metrics:
  duration: 4min
  completed: 2026-04-13
  tasks: 3
  files: 6
---

# Phase 04 Plan 02: Settlement Cron, Server Actions & Settings UI Summary

Vercel Cron endpoint for idempotent weekly settlement, 4 Server Actions for the rewards economy, and timezone/hour settings UI on the Settings page.

## Tasks Completed

### Task 1: Create Vercel Cron settlement endpoint and DB integration function
**Commit:** `29cdfae`
**Files:** `vercel.json`, `src/app/api/cron/settle/route.ts`, `src/lib/actions/settlement.ts`

- Created `vercel.json` with Monday 10:00 AM UTC cron schedule (`0 10 * * 1`)
- `settleWeekForChallenge` DB integration function connects `computeSettlement` pure logic to the database
- Idempotent via `settledWeeks` unique constraint + `onConflictDoNothing()`
- Mid-week joiner exclusion: members with `joinedAt` after the week start are filtered out
- Timezone-aware settlement check using `Intl.DateTimeFormat` API
- Cron endpoint protected by `CRON_SECRET` Bearer token (401 on mismatch)

### Task 2: Create rewards and redemption Server Actions
**Commit:** `09a3d0f`
**Files:** `src/lib/actions/points.ts`

- `addRewardAction`: Zod validation (name 1-60 chars, pointCost >= 1), auth gate + membership check
- `deleteRewardAction`: UUID validation, verifies reward belongs to user's challenge before deletion
- `redeemRewardAction`: Balance check via `COALESCE(SUM(delta), 0)`, atomic DB transaction for deduction + redemption record
- `updateSettlementSettingsAction`: IANA timezone validation via `Intl.DateTimeFormat`, hour range 0-23
- Shared `getAuthAndMembership()` helper for auth gate + challenge membership pattern

### Task 3: Add settlement settings section to Settings page
**Commit:** `88e77dc`
**Files:** `src/components/settings/settlement-settings.tsx`, `src/app/(protected)/settings/page.tsx`

- `SettlementSettings` client component with timezone picker (all IANA timezones via `Intl.supportedValuesOf`) and settlement hour picker (00:00-23:00)
- Save button disabled when no changes, shows spinner via `useTransition`
- Settings page query updated with `innerJoin(challenges)` to fetch timezone and settlementHour
- Component rendered between GoalStepper and Leave Challenge sections

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Zod v4 API incompatibility**
- **Found during:** Task 2
- **Issue:** Plan used Zod v3 API (`invalid_type_error` param, `.errors` property) but project has Zod v4.3.6 installed which uses `error` param and `.issues` property
- **Fix:** Changed `invalid_type_error` to `error` in `z.number()` and `.errors[0]` to `.issues[0]` in error extraction
- **Files modified:** `src/lib/actions/points.ts`
- **Commit:** `09a3d0f`

## Verification

- `npx vitest run tests/points.test.ts` — 17/17 tests passed
- `npx tsc --noEmit` — no TypeScript errors in new/modified files (pre-existing errors in other files unrelated to this plan)
- All acceptance criteria met for all 3 tasks

## Known Stubs

None — all actions are fully wired to the database with complete validation and error handling.

## Self-Check: PASSED

All 6 files found on disk. All 3 commit hashes verified in git log.
