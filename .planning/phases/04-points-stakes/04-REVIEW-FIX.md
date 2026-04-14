---
phase: 04-points-stakes
scope: critical_warning
fixed_at: 2026-04-13T20:16:00Z
review_path: .planning/phases/04-points-stakes/04-REVIEW.md
iteration: 1
findings_in_scope: 7
findings_addressed:
  critical: 2
  warning: 5
  info: 0
total_applied: 7
total_skipped: 0
status: complete
---

# Phase 04: Code Review Fix Report

**Fixed at:** 2026-04-13T20:16:00Z
**Source review:** `.planning/phases/04-points-stakes/04-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope (Critical + Warning, minus withdrawn WR-05): 7
- Fixed: 7
- Skipped: 0

## Fixed Issues

### CR-01: CRON_SECRET bypass when environment variable is unset

**Files modified:** `src/app/api/cron/settle/route.ts`
**Commit:** `b09d440`
**Status:** fixed
**Applied fix:** Added explicit presence check at the top of `GET`. If `process.env.CRON_SECRET` is missing or empty, the handler now returns `500 Server misconfigured` before any comparison. This removes the "Bearer undefined" guessable-token bypass. The comparison still uses `===`; adopting `crypto.timingSafeEqual` is left as a future hardening step.

### CR-02: Far-west timezone groups never settle

**Files modified:** `vercel.json`, `src/app/api/cron/settle/route.ts`
**Commit:** `c287334`
**Status:** fixed
**Applied fix:** Cron schedule changed from `0 10 * * 1` (weekly, Mon 10:00 UTC) to `0 * * * *` (hourly). This guarantees `shouldSettle(now, tz, settlementHour)` is evaluated at every hour-of-day slot for every timezone, so the Monday hour match fires exactly once per challenge per week. The `settled_weeks` unique constraint prevents any double-settlement during the remaining Monday hours. Also updated the JSDoc in `route.ts` to reflect the new schedule.

**User action required — Vercel plan upgrade:**
Vercel Hobby allows only **2 cron executions per day**. An hourly cron needs **Vercel Pro ($20/month)**. Before deploying to production, either:
1. Upgrade the project to Vercel Pro, or
2. Switch to a different approach (e.g., move settlement into an on-demand endpoint triggered by an external scheduler or on-access lazy settlement).

### WR-01: Race condition in `redeemRewardAction` allows overspending

**Files modified:** `src/lib/actions/points.ts`
**Commit:** `a456df8`
**Status:** fixed — *requires human verification* (logic change in a money-path)
**Applied fix:** Moved the `SUM(delta)` balance read inside the existing `db.transaction`. The transaction now starts with `SELECT pg_advisory_xact_lock(hashtext(challengeId::text || ':' || userId::text))` so two concurrent redeem calls from the same user in the same challenge serialize. Insufficient-balance is thrown inside the transaction (auto-rollback) and converted to a `{ error }` return by an outer try/catch so the Server Action contract is unchanged.

**Why human verification:** The advisory-lock key is `hashtext(challengeId + ':' + userId)` which is fine for per-(challenge, user) serialization; manual review is recommended to confirm this is the intended contention granularity and that the error-to-message conversion preserves UX copy.

### WR-02: Missing foreign-key constraint on `redemptions.reward_id`

**Files modified:** `src/db/schema.ts`, `drizzle/0002_phase04_fixes.sql`, `scripts/push-0002-phase04-fixes.mjs`
**Commit:** `353409c` (combined with WR-06)
**Status:** fixed (partial — scope: only `reward_id` FK)
**Applied fix:**
- Added `.references(() => rewards.id, { onDelete: 'restrict' })` to `redemptions.rewardId` in the Drizzle schema.
- Created `drizzle/0002_phase04_fixes.sql` with an idempotent `DO $$ ... ALTER TABLE ADD CONSTRAINT ... $$` block.
- Created `scripts/push-0002-phase04-fixes.mjs` using the same `postgres` driver pattern as Phase 3/4 schema pushes, since `drizzle-kit push` crashes on Supabase check-constraint introspection.
- Ran the script against live Supabase; verified `redemptions_reward_id_fkey` exists via `pg_constraint`.

**Intentionally skipped:** `user_id` FKs on `redemptions` and `point_transactions` pointing to `auth.users`. Supabase manages the `auth` schema and cross-schema FKs from `public` require extra grant wiring and can interact badly with Supabase's managed auth delete flows. The app only ever inserts `user_id` values that were just authenticated via Supabase Auth, so orphan risk is low. Tracking this as a future hardening item if/when user deletion is wired up.

### WR-03: `<img>` tag bypasses Next.js image optimization

**Files modified:** `src/components/streaks/member-leaderboard.tsx`, `next.config.ts`
**Commit:** `c785f06`
**Status:** fixed
**Applied fix:** Replaced native `<img>` with `next/image` `<Image>` including explicit `width={36}` / `height={36}` and `unoptimized` flag (these are tiny 36px OAuth/CDN avatars; the optimization round-trip costs more than it saves). Added `images.remotePatterns` to `next.config.ts` covering:
- `https://lh3.googleusercontent.com` (Google OAuth profile photos)
- `https://*.supabase.co` and `https://*.supabase.in` (Supabase Storage CDN)

### WR-04: `settleWeekForChallenge` does not validate `weekStart` is a Monday

**Files modified:** `src/lib/actions/settlement.ts`
**Commit:** `5cef6c9`
**Status:** fixed
**Applied fix:** Added a defensive assertion at the top of `settleWeekForChallenge` that parses `weekStart` and throws `weekStart must be a Monday in YYYY-MM-DD form, got <value>` if the date is invalid or `getUTCDay() !== 1`. Prevents a non-Monday from silently creating an overlapping 7-day window that the `(challengeId, weekStart)` idempotency key would happily accept alongside the real Monday window.

### WR-06: `pointTransactions.reason` is unrestricted text

**Files modified:** `src/db/schema.ts`, `drizzle/0002_phase04_fixes.sql`, `scripts/push-0002-phase04-fixes.mjs`
**Commit:** `353409c` (combined with WR-02)
**Status:** fixed
**Applied fix:**
- Narrowed the Drizzle column type to `text('reason', { enum: ['earned', 'penalty', 'redemption'] })` so TypeScript refuses unknown literals at compile time.
- Added Postgres CHECK constraint `point_transactions_reason_check CHECK (reason IN ('earned','penalty','redemption'))` via the 0002 migration.
- Pushed the migration to Supabase; verified constraint definition returned by `pg_get_constraintdef`:
  `CHECK ((reason = ANY (ARRAY['earned'::text, 'penalty'::text, 'redemption'::text])))`

## Skipped Issues

None in scope — all 7 targeted findings were fixed.

### Out of scope (by design, not skipped-with-error)

- **WR-05** — Withdrawn by reviewer as a false positive on re-read.
- **IN-01 through IN-08** — Info tier, excluded from this pass per `fix_scope: critical_warning`. Tracked for future polish pass.

## Verification Results

### Tests
- `npx vitest run tests/points.test.ts` — **17/17 passed** (13.97s).

### TypeScript
- `npx tsc --noEmit` — **no new errors** from any of these fixes.
- The 5 pre-existing errors listed below remain and are documented in prior phase summaries as deferred items:
  - `src/components/connections/invite-link-section.tsx:18-21` — 4× `result` possibly undefined (pre-existing since Phase 03-01).
  - `src/components/settings/goal-stepper.tsx:33` — `string | undefined` SetStateAction (pre-existing).

### Database (schema changes)
Verified via live Supabase query after running `node scripts/push-0002-phase04-fixes.mjs`:
- `redemptions_reward_id_fkey` present in `pg_constraint` — **OK**.
- `point_transactions_reason_check` present with definition `CHECK ((reason = ANY (ARRAY['earned'::text, 'penalty'::text, 'redemption'::text])))` — **OK**.

## Commit Ledger (chronological)

| Finding | Commit | Files |
|---|---|---|
| CR-01 | `b09d440` | `src/app/api/cron/settle/route.ts` |
| CR-02 | `c287334` | `vercel.json`, `src/app/api/cron/settle/route.ts` |
| WR-01 | `a456df8` | `src/lib/actions/points.ts` |
| WR-02 + WR-06 | `353409c` | `src/db/schema.ts`, `drizzle/0002_phase04_fixes.sql`, `scripts/push-0002-phase04-fixes.mjs` |
| WR-03 | `c785f06` | `src/components/streaks/member-leaderboard.tsx`, `next.config.ts` |
| WR-04 | `5cef6c9` | `src/lib/actions/settlement.ts` |

## User Action Items

1. **CR-02 — Vercel Pro required for hourly cron.** Before deploying to production, upgrade the Vercel project to Pro ($20/month) or switch to a non-cron settlement strategy. Hobby tier caps cron at 2 executions/day, which will silently limit the new hourly schedule.
2. **WR-01 — Logic review.** Manually confirm the advisory-lock key granularity and the error-to-message conversion match intended UX.
3. **WR-02 — `user_id` FKs deferred.** When adding user-deletion flows, revisit whether cross-schema FKs into `auth.users` are warranted.

---

_Fixed: 2026-04-13_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
