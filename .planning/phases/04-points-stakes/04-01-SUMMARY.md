---
phase: 04-points-stakes
plan: 01
subsystem: points-economy-foundation
tags: [schema, settlement, tdd, pure-functions]
dependency_graph:
  requires: [03-01, 03-02]
  provides: [settlement-algorithm, points-schema, personal-best]
  affects: [04-02, 04-03, 04-04]
tech_stack:
  added: []
  patterns: [pure-function-utility, drizzle-schema-extension, tdd-red-green]
key_files:
  created:
    - src/lib/utils/settlement.ts
    - drizzle/0001_points_stakes.sql
    - tests/points.test.ts
  modified:
    - src/db/schema.ts
decisions:
  - Used getTableName from drizzle-orm for schema assertions (internal _.name property not reliable in Drizzle v0.45)
  - Settlement utility is zero-dependency pure math (no DB imports), following established week.ts pattern
metrics:
  duration: 4min
  completed: 2026-04-13T21:47:00Z
  tasks: 2
  files: 4
---

# Phase 04 Plan 01: Points Economy Schema & Settlement Algorithm Summary

Pure settlement algorithm with TDD coverage and Drizzle schema extensions for the full points economy (settled weeks, transactions ledger, rewards, redemptions).

## What Was Done

### Task 1: Extend Drizzle schema with points economy tables and challenge columns
- Added `timezone` (text, default 'America/New_York') and `settlementHour` (smallint, default 5) columns to `challenges` table
- Created `settledWeeks` table with unique constraint on (challengeId, weekStart) for idempotent settlement
- Created `pointTransactions` table with composite index on (challengeId, userId) for ledger queries
- Created `rewards` table for group-curated reward menu items
- Created `redemptions` table for reward redemption audit log
- Created SQL migration reference file at `drizzle/0001_points_stakes.sql`
- All 4 existing tables (challenges, challengeMembers, inviteLinks, checkIns) remain intact
- **Commit:** `fa1c855`

### Task 2: Implement pure settlement algorithm and personal best streak with unit tests
- Created `computeSettlement()` pure function implementing D-02 (hitter earns per misser), D-03 (misser owes per hitter), D-04 (wash rule)
- Created `computePersonalBest()` pure function for longest consecutive week streak
- Exported `MemberProgress`, `SettlementTransaction`, `SettlementResult` TypeScript interfaces
- Zero database dependencies — pure math importable in any context
- 17 total test cases: 6 schema assertions + 7 settlement scenarios + 4 personal best scenarios
- **Commit:** `c32b4f4`

## Test Results

```
Tests: 17 passed (17)
Duration: 1.78s
```

Test breakdown:
- Schema Static Assertions (6): settledWeeks, pointTransactions, rewards, redemptions exports + challenges timezone/settlementHour columns
- computeSettlement (7): 3h/1m, 0h/3m wash, 2h/0m, 1h/1m, empty, solo-hit, solo-miss
- computePersonalBest (4): mixed, all-false, all-true, empty

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed schema test assertions using getTableName**
- **Found during:** Task 1 GREEN phase
- **Issue:** Plan's `_.name` property path doesn't exist on Drizzle v0.45 table objects
- **Fix:** Used `getTableName()` from `drizzle-orm` package instead
- **Files modified:** tests/points.test.ts
- **Commit:** fa1c855

## Verification

- `npx vitest run tests/points.test.ts` -- 17/17 tests pass
- `npx tsc --noEmit` -- no TypeScript errors in schema.ts or settlement.ts (pre-existing errors in unrelated Phase 2/3 files only)
- Schema exports all 8 tables (4 existing + 4 new)
- SQL migration reference file exists

## Self-Check: PASSED

All 4 files verified on disk. Both commit hashes (fa1c855, c32b4f4) found in git log.
