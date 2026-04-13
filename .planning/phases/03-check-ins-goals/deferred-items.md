# Phase 03: Deferred Items

## Pre-existing Issues (Not Caused by Phase 03)

### 1. TypeScript error in invite-link-section.tsx
- **File:** `src/components/connections/invite-link-section.tsx:18`
- **Error:** `'result' is possibly 'undefined'` -- generateInviteLinkAction return type allows undefined
- **Impact:** `npm run build` fails at type-check stage
- **Origin:** Phase 2 (02-03)
- **Fix:** Add nullish check: `if (!result || result.error)` or add explicit return type to generateInviteLinkAction

### 2. CRLF test failure in connections.test.ts
- **File:** `tests/connections.test.ts`
- **Test:** `leaveChallengeAction deletes membership row`
- **Error:** Content matching fails due to CRLF line endings -- `db.delete(challengeMembers)` is split across lines
- **Impact:** 1 test failure in full suite
- **Origin:** Phase 2 (02-02)
- **Fix:** Adjust test to use `.toMatch()` with multiline regex instead of `.toContain()`
