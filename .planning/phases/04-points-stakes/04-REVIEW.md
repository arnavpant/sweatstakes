---
phase: 04-points-stakes
reviewed: 2026-04-13T00:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - src/db/schema.ts
  - src/lib/utils/settlement.ts
  - src/lib/actions/settlement.ts
  - src/lib/actions/points.ts
  - src/app/api/cron/settle/route.ts
  - src/app/(protected)/settings/page.tsx
  - src/app/(protected)/streaks/page.tsx
  - src/components/settings/settlement-settings.tsx
  - src/components/streaks/streak-section.tsx
  - src/components/streaks/member-leaderboard.tsx
  - src/components/streaks/rewards-menu.tsx
  - src/components/streaks/add-reward-drawer.tsx
  - src/components/streaks/redeem-dialog.tsx
  - tests/points.test.ts
  - drizzle/0001_points_stakes.sql
  - vercel.json
findings:
  critical: 2
  warning: 6
  info: 8
  total: 16
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-04-13
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Phase 04 delivers a solid points-economy foundation: the pure settlement algorithm is clean and well-tested, the Server Actions use Zod validation, authorization is checked via `getAuthAndMembership`, and settlement is idempotent via the `settled_weeks` unique constraint. The review surfaced two critical issues, both in operational paths:

1. **CRON_SECRET auth can be bypassed** when the environment variable is missing or empty — the string-concatenation comparison `Bearer ${undefined}` creates a guessable constant token.
2. **Far-west timezone groups never settle.** The cron runs once a week at `Mon 10:00 UTC`, which is `Mon 00:00` in Pacific/Honolulu (UTC-10). Any such group with `settlementHour >= 1` will skip every single run, because the next cron invocation is a week later and still at Honolulu 00:00.

Additional high-signal issues: a TOCTOU race in `redeemRewardAction` (two parallel redemptions can both pass the balance check), missing foreign-key constraints on the `redemptions` and `pointTransactions` user/reward columns, and `<img>` instead of `next/image` in the leaderboard. Most other findings are code-quality polish.

## Critical Issues

### CR-01: CRON_SECRET bypass when environment variable is unset

**File:** `src/app/api/cron/settle/route.ts:69-72`
**Issue:** The Bearer-token check interpolates `process.env.CRON_SECRET` directly into a template string. When the env var is missing in a deployment, the expected header becomes the literal string `"Bearer undefined"` (or `"Bearer "` if empty). Any attacker who sends exactly that header is authorized and can trigger settlement on demand, which writes to `point_transactions`. Because settlement is idempotent for a given `(challengeId, weekStart)`, replay is partly bounded, but an attacker can still force premature settlement for the current week's date and corrupt balances once the real window opens.

Also, the comparison is not constant-time. Timing attacks against a single request per Monday are impractical, but the guessable-token failure mode is the real risk.

**Fix:**
```ts
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('CRON_SECRET is not configured')
    return new Response('Server misconfigured', { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  // ...
}
```
Consider also using `crypto.timingSafeEqual` on the raw token bytes for defense-in-depth.

### CR-02: Far-west timezone groups never settle (design bug)

**File:** `src/app/api/cron/settle/route.ts:28-31`, `vercel.json:5`
**Issue:** The cron schedule is `0 10 * * 1` (Monday 10:00 UTC), which is a single weekly fire. `shouldSettle` requires `getWeekdayInTimezone(now, tz) === 'Monday' && hour >= settlementHour`. For a group in `Pacific/Honolulu` (UTC-10), Monday 10:00 UTC is Monday 00:00 local. If `settlementHour >= 1`, the check fails and the cron moves on. Because the next cron invocation is exactly one week later (again Monday 00:00 local), this group's week will never satisfy both conditions — it will not be settled, ever.

The same class of bug affects any timezone where `10 − tz_offset_hours < settlementHour`. With the default `settlementHour = 5`, anywhere west of UTC-5 (Americas) at 10 UTC is before 05:00 local, so ANY challenge in `America/Los_Angeles`, `America/Denver`, `America/Chicago`, `America/Anchorage`, and all Pacific US/Canada zones will never settle under default settings.

**Fix:** Either (a) change the cron cadence to every hour (`0 * * * 1`) so the hourly poll will eventually find a matching `(weekday, hour)`; or (b) compute settlement based on the most recent complete local-week without requiring hour-of-day equality. Option (a) is the smallest change:

```json
{ "crons": [{ "path": "/api/cron/settle", "schedule": "0 * * * *" }] }
```

Then `shouldSettle` correctly matches exactly one hour slot per challenge per week, and the `settled_weeks` unique constraint still prevents double-settlement. Vercel Hobby allows 2 cron executions/day — Pro is required for hourly. Alternative: compute which local week has already ended and settle that, regardless of hour.

This is P0 for any deployment where members are not in US Eastern (the default).

## Warnings

### WR-01: Race condition in `redeemRewardAction` allows overspending

**File:** `src/lib/actions/points.ts:115-146`
**Issue:** Classic TOCTOU — the balance is read outside the transaction and the write is inside, with no row lock. Two concurrent redeem requests from the same user can both observe balance `5`, both see `cost=5` as affordable, and both insert a `-5` transaction, leaving the user at `-5` even though they only had enough for one. Postgres `READ COMMITTED` does not prevent this because neither query holds a lock on the aggregate.

**Fix:** Move the SUM query inside the transaction and acquire a row-level lock on a sentinel row, or use an advisory lock keyed on `(user_id, challenge_id)`. Simplest option:

```ts
await db.transaction(async (tx) => {
  // Per-user advisory lock keyed on hash of (challengeId, userId)
  await tx.execute(sql`SELECT pg_advisory_xact_lock(
    hashtext(${auth.challengeId}::text || ':' || ${auth.user.id}::text)
  )`)

  const [{ balance }] = await tx
    .select({ balance: sql<number>`COALESCE(SUM(${pointTransactions.delta}), 0)` })
    .from(pointTransactions)
    .where(and(
      eq(pointTransactions.challengeId, auth.challengeId),
      eq(pointTransactions.userId, auth.user.id),
    ))

  if (Number(balance) < reward[0].pointCost) {
    throw new Error(`You need ${reward[0].pointCost - Number(balance)} more points.`)
  }

  await tx.insert(pointTransactions).values({ /* ... */ })
  await tx.insert(redemptions).values({ /* ... */ })
})
```

### WR-02: Missing foreign-key constraints on `point_transactions.user_id`, `redemptions.user_id`, `redemptions.reward_id`

**File:** `src/db/schema.ts:55-83`, `drizzle/0001_points_stakes.sql:17-46`
**Issue:** `challenge_id` has `ON DELETE CASCADE` but sibling columns (`user_id` on both tables, `reward_id` on redemptions) have no FK. Consequences:
- Deleting a `rewards` row (via `deleteRewardAction`) leaves `redemptions.reward_id` pointing to nothing — future UI that joins history will 500.
- A user removed from auth (via `auth.users` deletion) leaves orphaned ledger rows.
- Drizzle's schema inference loses the relation, so no safe joins.

**Fix:** Add FKs. For `redemptions.reward_id`, use `ON DELETE RESTRICT` so you can't delete a reward that has history, OR promote to `ON DELETE SET NULL` and snapshot `name` in the redemption row (`point_cost` is already snapshotted, so `name` is the missing piece).

```sql
ALTER TABLE redemptions
  ADD CONSTRAINT redemptions_reward_id_fkey
  FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE RESTRICT;
```

### WR-03: `<img>` tag bypasses Next.js image optimization and layout stability

**File:** `src/components/streaks/member-leaderboard.tsx:40-45`
**Issue:** Using the native `<img>` element in a Next.js 16 app triggers an ESLint warning (`@next/next/no-img-element`), skips automatic LCP hints, and doesn't reserve layout space (CLS). The avatar URL is likely a Supabase Storage CDN URL or Google OAuth profile image.

**Fix:** Use `next/image` with `width`/`height`:
```tsx
import Image from 'next/image'
<Image src={member.avatarUrl} alt={member.displayName} width={36} height={36}
       className="w-9 h-9 rounded-full object-cover" referrerPolicy="no-referrer" />
```
Remember to add the Supabase hostname to `next.config.ts` `images.remotePatterns` if not already present.

### WR-04: `settleWeekForChallenge` does not validate `weekStart` is a Monday

**File:** `src/lib/actions/settlement.ts:14-32`
**Issue:** If a caller (future feature, test, or manual trigger) passes a non-Monday date, the function still computes `weekEnd = weekStart + 6 days` and settles that arbitrary window. The idempotency key is `(challengeId, weekStart)`, so two overlapping windows (Mon `2026-04-06` and Wed `2026-04-08`) could both persist, double-counting check-ins for Wed-Sun. Cron always passes a Monday today, but defense in depth matters for a ledger.

**Fix:** Assert at the top of the function:
```ts
const d = new Date(weekStart + 'T00:00:00Z')
if (isNaN(d.getTime()) || d.getUTCDay() !== 1) {
  throw new Error(`weekStart must be a Monday in YYYY-MM-DD form, got ${weekStart}`)
}
```

### WR-05: Balance check in `redeemRewardAction` returns error message leaking info even when reward lookup failed

**File:** `src/lib/actions/points.ts:113, 126-128`
**Issue:** Minor, but the balance error `You need X more points.` uses `reward[0].pointCost - currentBalance`. If the balance is negative (legal — a misser can go below zero), the message says e.g. `You need 8 more points.` for a 3-point reward when balance is `-5`. That's actually correct math, so it's fine. However, when balance is `0` (default for new user), message is `You need 3 more points.` which matches. No issue here. **[Removing — false positive on re-read.]** — see IN-07 below for the only real concern (message polish).

### WR-06: `pointTransactions.reason` is free-form text with no check constraint

**File:** `src/db/schema.ts:61`, `src/lib/actions/settlement.ts:89`, `src/lib/actions/points.ts:137`
**Issue:** Code writes three literal strings (`'earned'`, `'penalty'`, `'redemption'`) but the column is unrestricted `text`. A future bug could write `'Earned'`, `'refund'`, etc., and no UI/report would catch it. Balance aggregation would still work, but analytics and debugging would be corrupted.

**Fix:** Either add a Postgres CHECK constraint, promote to a proper enum, or type it in Drizzle:
```ts
reason: text('reason', { enum: ['earned', 'penalty', 'redemption'] }).notNull(),
```
and add a migration:
```sql
ALTER TABLE point_transactions
  ADD CONSTRAINT point_transactions_reason_check
  CHECK (reason IN ('earned', 'penalty', 'redemption'));
```

## Info

### IN-01: `addRewardAction` accepts arbitrarily large `pointCost`

**File:** `src/lib/actions/points.ts:14-15`
**Issue:** Zod schema has `.min(1)` but no `.max()`. `point_cost` is a Postgres `smallint` (max 32767). A client submitting `pointCost: 999999` would pass validation, then fail at DB insert with a generic error that the user sees as `Failed to add reward.`
**Fix:** Add `.max(9999, 'Cost must be 9999 or less.')` (or whatever product-sensible cap).

### IN-02: `AddRewardDrawer.onSubmit` uses untyped generic signature and casts

**File:** `src/components/streaks/add-reward-drawer.tsx:33-34`
**Issue:** `function onSubmit(data: Record<string, unknown>) { const parsed = data as FormData }`. This defeats the type safety from `useForm<FormData>`. Should be `function onSubmit(data: FormData)`.
**Fix:** Type `useForm<FormData>({ resolver: zodResolver(schema) })` and `function onSubmit(data: FormData)`. The cast to `Record<string, unknown>` is a workaround for a type issue that no longer exists in RHF v7 + Zod v3.

### IN-03: `Intl.DateTimeFormat` called without `new` for validation

**File:** `src/lib/actions/points.ts:164`
**Issue:** `Intl.DateTimeFormat(undefined, { timeZone: parsed.data.timezone })` works (valid call form), but conventionally uses `new`. Consistency nit.
**Fix:** `new Intl.DateTimeFormat(undefined, { timeZone: parsed.data.timezone })` — makes intent clearer.

### IN-04: Streaks page performs 52 sequential DB round-trips

**File:** `src/app/(protected)/streaks/page.tsx:59-78`
**Issue:** Out of scope for v1 per review charter, but flagging: each page render makes 52 serial SELECT queries against `check_ins` to compute personal-best. A single aggregate query with `date_trunc('week', checked_in_date)` and `GROUP BY` would be one round-trip. Also `weekResults.unshift` is O(n²); use reversed iteration or `push` + reverse at end.
**Fix:** Defer to performance pass, but the query pattern is worth refactoring when you next touch this file.

### IN-05: `SettlementSettings` initial `timezones` state may not contain `currentTimezone`

**File:** `src/components/settings/settlement-settings.tsx:21-24`
**Issue:** Pre-hydration, `timezones = [currentTimezone]` so the select shows the current value. After mount, `Intl.supportedValuesOf('timeZone')` replaces it. If the browser's ICU data doesn't include the stored `currentTimezone` (rare but possible for old timezone IDs like `Asia/Calcutta`), the select will silently switch to the first option, leaving `timezone` state out of sync with what the UI displays. The Save button won't know a "change" was made because `timezone` state wasn't updated.
**Fix:** After setting the list, ensure `currentTimezone` is in it:
```ts
useEffect(() => {
  const list = Intl.supportedValuesOf('timeZone')
  setTimezones(list.includes(currentTimezone) ? list : [currentTimezone, ...list])
}, [currentTimezone])
```

### IN-06: `redeemRewardAction` stores `weekStart` as today's UTC date for non-week-scoped event

**File:** `src/lib/actions/points.ts:135`
**Issue:** `weekStart` is conceptually the key for weekly settlement rollups. Storing a redemption date there overloads the meaning. It's still queryable but muddies analytics (a weekly audit report would show a "-3 redemption" in a week the user may not have been active).
**Fix:** Either (a) make `weekStart` nullable and leave null for redemptions, or (b) rename the column to `occurred_for` / remove the semantic tie to weeks. Low urgency.

### IN-07: Leaderboard "(updated after weekly settlement)" caption is misleading for redemptions

**File:** `src/components/streaks/member-leaderboard.tsx:19`
**Issue:** Balances do update in real time on redemption (redemptions insert a negative transaction immediately). The caption suggests balances only move at weekly settlement, which contradicts the UX.
**Fix:** Reword to e.g. `(settled weekly — redemptions update instantly)` or drop the qualifier.

### IN-08: `DiscardButton` in AddRewardDrawer resets form but doesn't clear server error

**File:** `src/components/streaks/add-reward-drawer.tsx:104-110`
**Issue:** Minor UX — if the form submits, errors, and the user clicks "Discard", the drawer closes but `serverError` state persists in React. Next open shows the stale error for a frame before reset. Not a bug but a polish item.
**Fix:** Add `setServerError(null)` to the Discard handler.

---

_Reviewed: 2026-04-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
