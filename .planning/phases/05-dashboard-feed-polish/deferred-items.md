# Phase 5 Deferred Items

Items discovered during Phase 5 execution that are out of scope and deferred.

## Pre-existing test failures

### tests/connections.test.ts — `leaveChallengeAction deletes membership row`
- **Discovered during:** Phase 05 Plan 03, Task 1
- **Location:** `tests/connections.test.ts:189`
- **Issue:** Test asserts the string `db.delete(challengeMembers)` appears in `src/lib/actions/connections.ts`. The action file has been refactored since — the string pattern no longer matches even though the behavior is preserved.
- **Why deferred:** This is a pre-existing failure unrelated to Plan 03 scope (verified by running the test against a clean stash of plan-03 work). It's a brittle-regex test of Phase 2 code, not a regression caused by this plan.
- **Fix path:** Either update the assertion to match the current implementation or replace the regex test with a behavioral test (mock db + invoke action).
