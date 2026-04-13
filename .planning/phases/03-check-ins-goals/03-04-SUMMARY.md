---
phase: 03-check-ins-goals
plan: 04
subsystem: ui, database
tags: [bottom-nav, fab, floating-action-button, drizzle-kit, schema-push, supabase, check-in]

# Dependency graph
requires:
  - phase: 03-check-ins-goals
    plan: 02
    provides: "CameraView component and /check-in page route"
  - phase: 03-check-ins-goals
    plan: 03
    provides: "GoalStepper, DayDots, StreakCounter components integrated into Settings and Dashboard"
provides:
  - "Bottom nav with center FAB linking to /check-in"
  - "5-slot nav layout: Dashboard, Feed, [FAB], Streaks, Settings"
  - "Nav auto-hide on /check-in page for full-screen camera"
  - "Database tables pushed to Supabase: check_ins, weekly_goal column, indexes"
  - "Drizzle migration file for schema reference"
affects: [04-points-stakes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Center FAB pattern: separate Link element between left/right tab arrays with -mt-5 pop-out and bg-secondary styling"
    - "Route-based nav hiding: pathname check returns null to hide nav on full-screen pages"
    - "Direct SQL schema push as workaround for drizzle-kit introspection bug with Supabase check constraints"

key-files:
  created:
    - drizzle/0000_fresh_red_hulk.sql
  modified:
    - src/components/layout/bottom-nav.tsx
    - tests/check-ins.test.ts
    - drizzle.config.ts

key-decisions:
  - "Applied schema via direct SQL instead of drizzle-kit push due to drizzle-kit v0.31.10 crash on Supabase check constraint introspection"
  - "Added schemaFilter: ['public'] to drizzle.config.ts to scope introspection to public schema only"
  - "FAB uses add_a_photo Material Symbol icon for clear camera/check-in affordance"
  - "Tab arrays split into leftTabs/rightTabs with FAB rendered as separate Link element between them"

patterns-established:
  - "Center FAB pattern: w-14 h-14, -mt-5, bg-secondary, rounded-full, shadow-lg shadow-secondary/30, no active state"
  - "Full-screen page nav hiding: if (pathname === '/route') return null in BottomNav"

requirements-completed: [CHKN-01, CHKN-02, CHKN-03, CHKN-04, CHKN-05]

# Metrics
duration: 4min
completed: 2026-04-13
---

# Phase 3 Plan 04: Bottom Nav FAB & Schema Push Summary

**Center FAB on bottom nav for one-tap check-in access, database schema pushed to Supabase with check_ins table, weekly_goal column, and composite indexes**

## Performance

- **Duration:** 4 minutes
- **Started:** 2026-04-13T11:12:46Z
- **Completed:** 2026-04-13T11:17:24Z
- **Tasks:** 2 completed, 1 skipped (human verification checkpoint)
- **Files modified:** 4

## Accomplishments
- Updated bottom nav with 5-slot layout: Dashboard, Feed, [center FAB], Streaks, Settings per D-19 and D-20
- FAB is a 56px emerald green circle with add_a_photo icon, -mt-5 pop-out, shadow elevation, and aria-label="Check in"
- Bottom nav auto-hides when pathname === '/check-in' for full-screen camera experience
- Pushed schema to Supabase: check_ins table (6 columns), weekly_goal column on challenge_members, 2 composite indexes
- Added 22 new tests (15 for Bottom Nav FAB, 7 for End-to-End Integration) -- 124 total check-in tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Update bottom nav with center FAB and add final tests** - `e60347e` (feat)
2. **Task 2: Push database schema to Supabase** - `f16603f` (chore)
3. **Task 3: Human verification checkpoint** - SKIPPED (pending human verification)

## Files Created/Modified
- `src/components/layout/bottom-nav.tsx` - Updated with center FAB, split into leftTabs/rightTabs arrays, /check-in hide logic
- `tests/check-ins.test.ts` - Added "Bottom Nav FAB (CHKN-01)" and "End-to-End Integration (all CHKN)" describe blocks
- `drizzle.config.ts` - Added schemaFilter: ['public'] for Supabase compatibility
- `drizzle/0000_fresh_red_hulk.sql` - Generated migration SQL for full schema reference

## Decisions Made
- Used direct SQL execution via postgres driver to push schema changes, because drizzle-kit v0.31.10 crashes during introspection of Supabase databases with check constraints (TypeError at bin.cjs:17861). The crash occurs when drizzle-kit tries to parse check constraints from Supabase's internal schemas. The workaround applies the exact same SQL that drizzle-kit generate produces.
- Added `schemaFilter: ['public']` to drizzle.config.ts to scope future introspection attempts to the public schema only.
- Split the tabs array into `leftTabs` and `rightTabs` with the FAB rendered as a separate Link element between them, rather than using a special marker in a single array. This keeps the FAB styling completely independent from regular tab rendering.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] drizzle-kit push crashes on Supabase check constraint introspection**
- **Found during:** Task 2 (schema push)
- **Issue:** `npx drizzle-kit push` crashes with `TypeError: Cannot read properties of undefined (reading 'replace')` at bin.cjs:17861 when introspecting Supabase database check constraints
- **Fix:** Generated migration SQL with `npx drizzle-kit generate`, then applied the schema changes directly via the `postgres` driver using `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ADD COLUMN IF NOT EXISTS`, and `CREATE INDEX IF NOT EXISTS` statements
- **Files modified:** drizzle.config.ts (added schemaFilter), drizzle/ directory (generated migration)
- **Verification:** Queried information_schema to confirm all tables, columns, and indexes exist
- **Committed in:** f16603f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential workaround for drizzle-kit bug. Same SQL was applied, same end result. No scope creep.

## Issues Encountered
- drizzle-kit v0.31.10 `push` command crashes when introspecting Supabase databases due to a bug parsing check constraints (see deviation above). The `schemaFilter: ['public']` config did not resolve it -- the bug is in the introspection phase before schema filtering takes effect.
- Pre-existing TypeScript error in `src/components/connections/invite-link-section.tsx:18` causes `npm run build` to fail at type-check stage. Not caused by this plan's changes. Already tracked in deferred-items.md since Plan 03-01.
- Pre-existing CRLF test failure in `tests/connections.test.ts` for `leaveChallengeAction deletes membership row`. Not caused by this plan's changes. Already tracked in deferred-items.md since Plan 03-01.

## User Setup Required

None - schema push completed successfully. Supabase Storage bucket setup (check-in-photos) was required by Plan 02 and is documented in 03-02-SUMMARY.md.

## Next Phase Readiness
- Phase 3 is functionally complete: camera flow, goal stepper, day dots, streak counter, bottom nav FAB, and database schema all in place
- Task 3 (human verification checkpoint) is pending -- full end-to-end flow should be manually tested
- Phase 4 (points/stakes) can proceed -- it will consume the check-in data and weekly goal from the schema created here
- The pre-existing build failure in invite-link-section.tsx should be fixed before Phase 4 to unblock clean builds

## Self-Check: PASSED

All 4 created/modified files verified present. Both commit hashes (e60347e, f16603f) verified in git log.

---
*Phase: 03-check-ins-goals*
*Completed: 2026-04-13*
