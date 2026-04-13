---
phase: 03-check-ins-goals
plan: 03
subsystem: ui
tags: [react, server-components, client-components, stepper, progress-tracker, streak, tailwind, dashboard, settings]

# Dependency graph
requires:
  - phase: 03-check-ins-goals
    plan: 01
    provides: "checkIns table, weeklyGoal column, updateWeeklyGoalAction, getWeeklyProgress, computeStreak, getMonday"
provides:
  - "GoalStepper client component for weekly goal setting on Settings page"
  - "DayDots server component for 7-day M-S progress tracker on Dashboard"
  - "StreakCounter server component for fire emoji + consecutive week count on Dashboard"
  - "Dashboard wired to getWeeklyProgress and computeStreak for live progress data"
affects: [03-04, 04-points-stakes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client component for optimistic state updates with server action revert on error"
    - "Server components for data-display-only UI (DayDots, StreakCounter receive props from parent Server Component)"
    - "Date arithmetic via string-based YYYY-MM-DD for timezone safety"

key-files:
  created:
    - src/components/settings/goal-stepper.tsx
    - src/components/dashboard/day-dots.tsx
    - src/components/dashboard/streak-counter.tsx
  modified:
    - src/app/(protected)/settings/page.tsx
    - src/app/(protected)/dashboard/page.tsx
    - tests/check-ins.test.ts

key-decisions:
  - "GoalStepper uses optimistic useState with revert-on-error pattern rather than useOptimistic hook for simpler error handling"
  - "DayDots computes day dates from weekStart string prop using addDays helper to avoid timezone issues with Date objects"
  - "StreakCounter uses text-secondary color for streaks >= 4 weeks as extra visual emphasis"

patterns-established:
  - "Optimistic client component pattern: useState for local value, call server action, revert on error result"
  - "Server component prop pattern: parent Server Component fetches data, passes as typed props to child Server Components"

requirements-completed: [CHKN-03, CHKN-04, CHKN-05]

# Metrics
duration: 4min
completed: 2026-04-13
---

# Phase 3 Plan 03: Goal Stepper, Day Dots & Streak Counter Summary

**GoalStepper 1-7 stepper on Settings with optimistic updates, DayDots M-S progress tracker with today highlight, and StreakCounter fire emoji display on Dashboard**

## Performance

- **Duration:** 4 minutes
- **Started:** 2026-04-13T11:05:50Z
- **Completed:** 2026-04-13T11:09:52Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Built GoalStepper client component with minus/plus buttons clamped 1-7, optimistic state updates via updateWeeklyGoalAction, 44x44px tap targets, and error display
- Built DayDots server component with 7-dot M-S progress tracker, filled/empty states using design tokens, today ring highlight, and "X/Y days" progress count
- Built StreakCounter server component with fire emoji, singular/plural week handling, zero-streak message, and color emphasis at 4+ weeks
- Integrated all components into Settings and Dashboard pages with data wiring to week utility functions
- Replaced Plan 01 stub tests with 23 new passing tests across CHKN-03, CHKN-04, CHKN-05 describe blocks (109 total tests pass)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build GoalStepper and integrate into Settings** - `805bb1f` (feat)
2. **Task 2: Build DayDots, StreakCounter, integrate into Dashboard, add tests** - `ad15b27` (feat)

## Files Created/Modified
- `src/components/settings/goal-stepper.tsx` - Client component: stepper UI with minus/plus buttons, optimistic goal update via server action
- `src/components/dashboard/day-dots.tsx` - Server component: 7-dot M-S tracker with filled/empty states, today highlight, progress count
- `src/components/dashboard/streak-counter.tsx` - Server component: fire emoji + streak count with zero-state and plural handling
- `src/app/(protected)/settings/page.tsx` - Added GoalStepper section (visible when in challenge), extended membership query for weeklyGoal
- `src/app/(protected)/dashboard/page.tsx` - Added DayDots and StreakCounter below MemberAvatarRow, wired to getWeeklyProgress and computeStreak
- `tests/check-ins.test.ts` - Replaced 6 stub tests with 23 new tests across 3 describe blocks for CHKN-03, CHKN-04, CHKN-05

## Decisions Made
- GoalStepper uses `useState` with manual revert-on-error rather than React 19's `useOptimistic` hook -- simpler error handling and clearer control flow for a single-value stepper
- DayDots computes each day's date by adding days to the `weekStart` string prop using a local `addDays` helper, avoiding timezone pitfalls from passing Date objects as props to Server Components
- StreakCounter applies `text-secondary` (emerald green) color for streaks >= 4 weeks as extra visual motivation -- below 4 weeks uses standard `text-on-surface`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in `src/components/connections/invite-link-section.tsx:18` causes `npm run build` to fail at type-check stage. Not caused by this plan's changes. Already tracked in deferred-items.md.
- Pre-existing CRLF test failure in `tests/connections.test.ts` for `leaveChallengeAction deletes membership row`. Not caused by this plan's changes. Already tracked in deferred-items.md.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All three UI components (GoalStepper, DayDots, StreakCounter) are complete and integrated
- Dashboard displays live progress data when user is in a challenge
- Plan 04 (bottom nav FAB) can proceed independently
- Phase 04 (points/stakes) will consume the weekly goal and progress data already wired

## Self-Check: PASSED

All 6 created/modified files verified present. Both commit hashes (805bb1f, ad15b27) verified in git log.

---
*Phase: 03-check-ins-goals*
*Completed: 2026-04-13*
