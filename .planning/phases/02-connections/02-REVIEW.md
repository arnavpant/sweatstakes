---
phase: 02-connections
reviewed: 2026-04-13T12:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - src/db/schema.ts
  - src/db/index.ts
  - src/lib/actions/connections.ts
  - src/app/join/[code]/page.tsx
  - src/app/join/[code]/error/page.tsx
  - src/components/connections/invite-link-section.tsx
  - src/components/connections/share-invite-button.tsx
  - src/components/connections/leave-challenge-button.tsx
  - src/components/connections/member-avatar-row.tsx
  - tests/connections.test.ts
  - src/lib/actions/auth.ts
  - src/components/auth/google-sign-in-button.tsx
  - src/app/(protected)/settings/page.tsx
  - src/app/(protected)/dashboard/page.tsx
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-13T12:00:00Z
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

Phase 02 adds the connections domain: Drizzle ORM schema with 3 tables (challenges, challenge_members, invite_links), Server Actions for invite/join/leave flows, a public join route with auth threading, and UI components for the settings and dashboard pages.

Overall code quality is good. The invite code generation uses nanoid with a well-chosen ambiguity-free alphabet. The atomic UPDATE-WHERE-RETURNING pattern for consuming invite codes properly prevents race conditions on code reuse. The auth callback has correct open-redirect protection. The Next.js 16 async params pattern is used correctly throughout.

However, there is one critical issue (missing database constraint enabling duplicate memberships via race condition) and several warnings related to error handling and silent failures.

## Critical Issues

### CR-01: Missing unique constraint on challengeMembers allows duplicate memberships via race condition

**File:** `src/db/schema.ts:8-15`
**Issue:** The `challengeMembers` table has no unique constraint on `(userId)` or `(challengeId, userId)`. In `joinChallengeAction` (connections.ts:73-81), the "already in challenge" check is a SELECT followed by a separate INSERT. Two concurrent requests for the same user (e.g., double-tap on a join link, or two invite links opened in different tabs) can both pass the SELECT check before either INSERT executes, resulting in the user being inserted into the challenge twice -- or into two different challenges simultaneously.

The invite code atomic consume (UPDATE...WHERE...RETURNING) correctly prevents one code from being used twice, but does NOT prevent one user from joining two different challenges if they have two valid invite codes and click both simultaneously. The design intent (D-14) is "one challenge per user," but nothing at the database level enforces this.

**Fix:** Add a unique constraint on `userId` in `challengeMembers` so the database rejects duplicate memberships atomically, regardless of application-level race conditions:

```typescript
import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core'

export const challengeMembers = pgTable('challenge_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique('challenge_members_user_id_unique').on(table.userId),
])
```

Then wrap the INSERT in `joinChallengeAction` with a try/catch to handle the unique constraint violation gracefully:

```typescript
try {
  await db.insert(challengeMembers).values({
    challengeId: updated[0].challengeId,
    userId: user.id,
    displayName: user.user_metadata.full_name || user.email || 'Member',
    avatarUrl: user.user_metadata.avatar_url || null,
  })
} catch (err: unknown) {
  // Unique constraint violation -- user already joined via concurrent request
  return { error: 'already_in_challenge' }
}
```

## Warnings

### WR-01: generateInviteLinkAction has no collision handling for invite codes

**File:** `src/lib/actions/connections.ts:47`
**Issue:** The invite code is generated with `nanoid(customAlphabet, 8)` yielding 32^8 (~1.1 trillion) possible codes. While collisions are extremely unlikely for a small-scale app, the `code` column has a unique constraint in the database. If a collision occurs, the `db.insert(inviteLinks)` will throw an unhandled exception, which will bubble up as a generic 500 error to the user rather than a retryable error. As the app scales or during testing with shorter code lengths, this becomes more likely.

**Fix:** Wrap the insert in a retry loop (1-2 retries) or catch the unique constraint violation:

```typescript
let attempts = 0
while (attempts < 3) {
  const code = generateCode()
  try {
    await db.insert(inviteLinks).values({ code, challengeId, createdBy: user.id, expiresAt })
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    return { url: `${siteUrl}/join/${code}` }
  } catch {
    attempts++
    if (attempts >= 3) return { error: 'Failed to generate invite link. Please try again.' }
  }
}
```

### WR-02: leaveChallengeAction silently succeeds even when user has no membership to delete

**File:** `src/lib/actions/connections.ts:120-123`
**Issue:** The `db.delete(challengeMembers).where(eq(challengeMembers.userId, user.id))` will succeed (returning 0 affected rows) even if the user is not in any challenge. The action returns `{ success: true }` regardless, which gives the caller a false positive. While not a crash, it could mask bugs in the UI (e.g., showing the "Leave" button when membership data is stale).

**Fix:** Check the number of deleted rows using `.returning()`:

```typescript
const deleted = await db
  .delete(challengeMembers)
  .where(eq(challengeMembers.userId, user.id))
  .returning()

if (deleted.length === 0) {
  return { error: 'not_in_challenge' }
}

return { success: true }
```

### WR-03: LeaveChallengeButton silently swallows errors from leaveChallengeAction

**File:** `src/components/connections/leave-challenge-button.tsx:20-22`
**Issue:** The catch block on line 20 is empty. If `leaveChallengeAction` returns `{ error: '...' }`, the error is also ignored (only `result.success` is checked on line 17). The user sees the confirmation dialog disappear but gets no feedback that the operation failed. Additionally, if the server action throws (e.g., database down), the user gets no feedback at all.

**Fix:** Add error state handling:

```typescript
const [error, setError] = useState<string | null>(null)

async function handleLeave() {
  setLoading(true)
  setError(null)
  try {
    const result = await leaveChallengeAction()
    if (result.success) {
      router.refresh()
    } else {
      setError('Failed to leave challenge. Please try again.')
    }
  } catch {
    setError('Something went wrong. Please try again.')
  } finally {
    setLoading(false)
    setConfirming(false)
  }
}
```

And render the error in the UI:

```tsx
{error && <p role="alert" className="text-error text-sm text-center">{error}</p>}
```

### WR-04: ShareInviteButton silently ignores clipboard write failure

**File:** `src/components/connections/share-invite-button.tsx:40-42`
**Issue:** If both the Web Share API and the Clipboard API fail (e.g., user denies clipboard permission, or the page is not served over HTTPS in a non-localhost dev environment), the user clicks "Share Invite Link" and nothing happens -- no copy, no share, no feedback. The catch block on line 40 silently swallows the error.

**Fix:** Add a fallback error state so the user knows the copy failed:

```typescript
const [copyFailed, setCopyFailed] = useState(false)

// In the catch block:
catch {
  setCopyFailed(true)
  setTimeout(() => setCopyFailed(false), 3000)
}
```

And render feedback in the button:

```tsx
{copyFailed ? 'Copy failed -- try manually' : 'Share Invite Link'}
```

## Info

### IN-01: member-avatar-row.tsx uses raw img tag instead of next/image

**File:** `src/components/connections/member-avatar-row.tsx:29`
**Issue:** External avatar URLs (from Google OAuth via Supabase) are rendered with `<img>` instead of Next.js `<Image>`. This is acceptable for external URLs that are not known at build time (and would require `remotePatterns` config), but worth noting. The `referrerPolicy="no-referrer"` is correctly set for Google avatar URLs. The same pattern exists in `dashboard/page.tsx:45`.

**Fix:** No immediate action needed. If you later add `remotePatterns` for `lh3.googleusercontent.com` in `next.config.ts`, switch to `<Image>` for automatic optimization.

### IN-02: drizzle.config.ts uses non-null assertion on DATABASE_URL

**File:** `drizzle.config.ts:13`
**Issue:** `process.env.DATABASE_URL!` uses TypeScript non-null assertion. If `DATABASE_URL` is not set (and `.env.local` fails to load), `drizzle-kit` commands will fail with an opaque connection error rather than a clear message. The main `src/db/index.ts` correctly validates this variable -- but `drizzle.config.ts` does not.

**Fix:** Add a guard similar to `src/db/index.ts`:

```typescript
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL in .env.local -- required for drizzle-kit commands.')
}

export default defineConfig({
  // ...
  dbCredentials: { url: databaseUrl },
})
```

### IN-03: generateInviteLinkAction creates implicit challenge without transaction

**File:** `src/lib/actions/connections.ts:36-43`
**Issue:** When a user generates their first invite link, the code creates a new challenge and then inserts the user as a member in two separate queries (lines 36-43). If the second INSERT fails (e.g., database transient error), an orphaned challenge row is left in the database with no members. This is a minor data integrity concern -- the orphan row has no functional impact since no one references it, but it is theoretically unclean.

**Fix:** Wrap in a Drizzle transaction:

```typescript
const result = await db.transaction(async (tx) => {
  const [newChallenge] = await tx.insert(challenges).values({}).returning()
  await tx.insert(challengeMembers).values({
    challengeId: newChallenge.id,
    userId: user.id,
    displayName: user.user_metadata.full_name || user.email || 'Member',
    avatarUrl: user.user_metadata.avatar_url || null,
  })
  return newChallenge.id
})
challengeId = result
```

---

_Reviewed: 2026-04-13T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
