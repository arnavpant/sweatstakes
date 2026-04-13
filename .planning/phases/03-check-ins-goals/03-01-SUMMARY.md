---
phase: 03-check-ins-goals
plan: 01
subsystem: database
tags: [drizzle, postgres, server-actions, zod, week-utilities, check-ins, goals]

# Dependency graph
requires:
  - phase: 02-connections
    provides: "challenges, challengeMembers, inviteLinks tables and Server Action auth pattern"
provides:
  - "checkIns table definition in Drizzle schema"
  - "weeklyGoal column on challengeMembers"
  - "submitCheckInAction and updateWeeklyGoalAction Server Actions"
  - "getMonday, getSunday, getWeekBounds pure utility functions"
  - "getWeeklyProgress and computeStreak data-fetching utilities"
affects: [03-02, 03-03, 03-04, 04-points-stakes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lazy dynamic imports for db in utility modules to avoid DATABASE_URL requirement at import time"
    - "Pure utility functions (no db dependency) co-located with db-dependent async functions in same file"
    - "Monday-Sunday week boundary convention (D-13) via getMonday/getSunday/getWeekBounds"

key-files:
  created:
    - src/lib/actions/check-ins.ts
    - src/lib/utils/week.ts
    - tests/check-ins.test.ts
  modified:
    - src/db/schema.ts

key-decisions:
  - "Used lazy dynamic imports for db/schema in week.ts data functions to keep pure utils importable without DATABASE_URL"
  - "No deduplication on check-in insert per D-17; deduplication happens in getWeeklyProgress via Set"
  - "computeStreak starts from previous completed week, never current week per D-16"
  - "Date validation allows today and yesterday only (1 day backdating window)"

patterns-established:
  - "Lazy db import pattern: async functions use await import('@/db') instead of top-level import when co-located with pure functions"
  - "Week boundary convention: all week calculations use getMonday/getSunday/getWeekBounds from src/lib/utils/week.ts"

requirements-completed: [CHKN-01, CHKN-02, CHKN-03, CHKN-04, CHKN-05]

# Metrics
duration: 9min
completed: 2026-04-13
---

# Phase 3 Plan 01: Check-ins Data Layer Summary

**Drizzle checkIns table with photo/date columns, two Server Actions with auth+Zod validation, and Monday-Sunday week utilities with progress/streak computation**

## Performance

- **Duration:** 9 minutes
- **Started:** 2026-04-13T10:44:30Z
- **Completed:** 2026-04-13T10:53:21Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Extended Drizzle schema with checkIns table (6 columns, 2 composite indexes) and weeklyGoal column on challengeMembers
- Created two Server Actions (submitCheckInAction, updateWeeklyGoalAction) with full auth gating, Zod validation, and threat mitigations T-03-01 through T-03-05
- Built pure week boundary utilities (getMonday, getSunday, getWeekBounds) and data-fetching functions (getWeeklyProgress, computeStreak) with correct Monday-Sunday boundaries
- Comprehensive test suite with 66 passing tests covering all 5 CHKN requirements

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Drizzle schema and create week utility functions** - `089f110` (test: RED), `f0f94bb` (feat: GREEN)
2. **Task 2: Create check-in Server Actions and progress/streak computation** - `0522fa1` (test: RED), `1804d68` (feat: GREEN)
3. **Task 3: Create comprehensive test file for CHKN-01 through CHKN-05** - `a8295bb` (test)

## Files Created/Modified
- `src/db/schema.ts` - Extended with checkIns table and weeklyGoal column on challengeMembers
- `src/lib/actions/check-ins.ts` - submitCheckInAction and updateWeeklyGoalAction with auth gates and Zod validation
- `src/lib/utils/week.ts` - Pure week boundary functions + async data-fetching utilities (getWeeklyProgress, computeStreak)
- `tests/check-ins.test.ts` - 66 passing tests + 4 skipped future stubs covering CHKN-01 through CHKN-05
- `.planning/phases/03-check-ins-goals/deferred-items.md` - Pre-existing issues log

## Decisions Made
- Used lazy dynamic imports (`await import('@/db')`) inside getWeeklyProgress and computeStreak so that importing week.ts for pure utility functions (getMonday, getSunday, getWeekBounds) does not require DATABASE_URL at module evaluation time. This enables direct function imports in vitest tests.
- submitCheckInAction validates checkedInDate allows only today and yesterday (1 day backdating window) per the plan's "not more than 1 day in the past" requirement.
- computeStreak walks backward from the previous completed week (never current) with a 52-week cap, breaking on first missed week per D-15 and D-16.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Lazy db imports in week.ts for test compatibility**
- **Found during:** Task 3 (comprehensive test file creation)
- **Issue:** Direct `import { db } from '@/db'` at top of week.ts caused DATABASE_URL requirement at module load, making it impossible to import pure utility functions (getMonday, getSunday) in vitest tests
- **Fix:** Changed top-level db/schema/drizzle-orm imports to lazy `await import()` calls inside the two async data-fetching functions (getWeeklyProgress, computeStreak), keeping pure functions dependency-free
- **Files modified:** src/lib/utils/week.ts
- **Verification:** `npx vitest run tests/check-ins.test.ts` passes with direct function imports
- **Committed in:** a8295bb (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix for test compatibility. No scope creep. Pure functions remain unchanged, only import mechanism for db-dependent functions changed.

## Issues Encountered
- Pre-existing TypeScript error in `src/components/connections/invite-link-section.tsx:18` causes `npm run build` to fail at type-check stage. Not caused by this plan's changes. Logged to deferred-items.md.
- Pre-existing CRLF test failure in `tests/connections.test.ts` for `leaveChallengeAction deletes membership row`. Not caused by this plan's changes. Logged to deferred-items.md.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Schema and Server Actions ready for Plan 02 (camera capture + Supabase Storage upload)
- Week utilities ready for Plan 03 (day dots progress tracker + streak counter on Dashboard)
- Plan 02 will call submitCheckInAction after uploading photo to Supabase Storage
- Plan 03 will call getWeeklyProgress and computeStreak from Dashboard Server Component
- Supabase Storage bucket creation needed in Plan 02 (not this plan)
- `npx drizzle-kit push` needed in Plan 04 to sync schema changes to database

## Self-Check: PASSED

All 5 created/modified files verified present. All 5 commit hashes verified in git log.

---
*Phase: 03-check-ins-goals*
*Completed: 2026-04-13*
