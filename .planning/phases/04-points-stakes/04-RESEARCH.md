# Phase 4: Points & Stakes - Research

**Researched:** 2026-04-13
**Domain:** Points economy, weekly settlement cron, leaderboard UI, rewards CRUD, Vercel Cron Jobs
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Settlement mechanics:**
- D-01: Automatic weekly settlement via Vercel Cron Job at the week boundary (Monday morning). No manual trigger needed.
- D-02: 1 point earned per met-goal week. Simple flat economy.
- D-03: Members who miss owe 1 point to EACH member who hit their goal. If 3 hit and you miss, you owe 3 points total (-3 to your balance, +1 to each hitter).
- D-04: Wash rule: if ALL members miss in the same week, no points change hands. Ledger unchanged.
- D-05: No pending/projected settlement state. Members only see finalized balances after the cron runs.
- D-06: Challenge-level timezone (IANA format). Default: America/New_York at 5:00 AM ET. Cron converts to challenge timezone.
- D-07: Standard IANA timezone picker on Settings, plus custom time-of-day picker for settlement hour. Any member can change it.
- D-08: Settlement time chosen for Virginia + UK: Monday 5:00 AM ET = Monday 10:00 AM London.

**Ledger screen (Streaks & Balance):**
- D-09: Repurpose existing `/streaks` placeholder page.
- D-10: Page layout top-to-bottom: (1) streak section, (2) member balance leaderboard, (3) rewards menu.
- D-11: Streak section shows current streak (fire N week streak) and personal best streak. Reuses StreakCounter pattern.
- D-12: Leaderboard-style member list: avatar + display name + current point balance. Sorted by balance descending.
- D-13: Negative balances allowed.

**Rewards menu:**
- D-14: Reward items are simple: name + point cost. No description, emoji, or image.
- D-15: Any member can add and remove any reward item. No owner role, trust-based.
- D-16: "+" button on rewards section opens a bottom sheet with name input and cost input.
- D-17: Point cost constraints: minimum 1, no maximum.
- D-18: Rewards menu lives on Streaks & Balance page, below the member balance leaderboard.

**Redemption flow:**
- D-19: Tap reward item -> confirmation dialog: "Redeem '[name]' for [N] pts?" -> Confirm -> balance deducted instantly.
- D-20: Must have sufficient balance to redeem. Redeem button disabled if balance < cost. Show "You need N more points" message.
- D-21: Redemption updates balance silently. No notification to other members, no feed entry.

### Claude's Discretion
- Settlement cron implementation details (Vercel Cron syntax, error handling, idempotency)
- Database schema for point transactions, rewards, redemptions
- Leaderboard visual design (card style, spacing, balance formatting)
- Bottom sheet component for adding rewards
- Confirmation dialog styling
- Streak "personal best" computation logic
- How settlement handles members who joined mid-week
- Timezone picker component choice

### Deferred Ideas (OUT OF SCOPE)
- Redemption notifications to group members (Phase 5 feed entries)
- Transaction history / full audit log (v2)
- Streak milestones or achievements tied to points (future)
- Settlement override / manual trigger as backup (add if cron proves unreliable)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STAK-01 | User earns points when they hit their weekly goal | Settlement cron reads check-ins vs weeklyGoal, inserts pointTransactions |
| STAK-02 | User owes points to everyone who hit their goal when they miss theirs | D-03 formula: misser pays 1 pt per hitter; computed in settlement function |
| STAK-03 | If everyone misses, nobody owes (wash rule) | D-04: cron early-exits when 0 hitters; idempotency via settled_weeks unique constraint |
| STAK-04 | The Ledger shows running point balance per member | Materialized balance via SUM query on pointTransactions; leaderboard component |
| STAK-05 | Group members can add items to a rewards menu with point costs | rewards table + Server Action + bottom sheet UI |
| STAK-06 | Members can redeem points for items on the rewards menu | redemptions table + balance check + Server Action + confirmation dialog |
</phase_requirements>

---

## Summary

Phase 4 builds the points economy on top of Phase 3's check-in foundation. The technical work divides into three independent areas: (1) database schema for point tracking, (2) a Vercel Cron Job that settles the week, and (3) the Streaks & Balance UI page.

The settlement algorithm is deterministic and straightforward: count hitters vs missers for the completed week across all challenge members, then insert point transaction rows accordingly. The wash rule (D-04) is a simple early-exit when hitter count is 0. Idempotency — protection against the cron firing twice for the same week — is achieved via a unique constraint on `(challengeId, weekStart)` in a `settledWeeks` tracking table, combined with `onConflictDoNothing()` in Drizzle.

The Vercel Cron Job runs on Hobby plan, which means: once per day max, timing precision is ±59 minutes within the hour. The cron fires at UTC time; the handler must convert UTC to each challenge's IANA timezone + settlementHour to decide whether that challenge's week boundary has been crossed. The existing `Intl.DateTimeFormat` API in Node.js 22 handles all IANA timezone conversions without extra libraries.

The UI is a single scrollable server page at `/streaks` with three sections: streak stats, member balance leaderboard, and rewards menu. The rewards bottom sheet and redemption confirmation dialog use Base UI's `Drawer` and `Dialog` components (already in the project as `@base-ui/react`). No new UI libraries are needed.

**Primary recommendation:** Build schema + settlement cron first (foundational, everything else reads from pointTransactions), then the leaderboard page, then rewards CRUD, then redemption flow.

---

## Standard Stack

### Core (already installed — no new dependencies needed for core logic)

| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| `drizzle-orm` | ^0.45.2 | Point transaction schema + queries | [VERIFIED: package.json] |
| `@base-ui/react` | ^1.3.0 | Drawer (bottom sheet) + Dialog (confirmation) | [VERIFIED: package.json] |
| `zod` | ^4.3.6 | Validate reward name/cost, settlement inputs | [VERIFIED: package.json] |
| `react-hook-form` | ^7.72.1 | Add reward form in bottom sheet | [VERIFIED: package.json] |
| `@hookform/resolvers` | ^5.2.2 | Zod resolver for react-hook-form | [VERIFIED: package.json] |

### Supporting (may need to install)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-timezone-select` | latest (~2.1.x) | IANA timezone picker component for Settings | D-07 requires timezone picker; this wraps Intl display names with a searchable select. Alternative: hand-roll a native `<select>` with `Intl.supportedValuesOf('timeZone')`. |

**Timezone picker decision (Claude's Discretion):** `react-timezone-select` adds ~15KB gzipped and works well, but it depends on `react-select` which may conflict with Tailwind v4 styling. A simpler approach is a native `<select>` populated via `Intl.supportedValuesOf('timeZone')` (available in Node.js 18+, confirmed working in Node.js 22 on this machine) styled with Tailwind tokens. The native select is recommended to avoid a new dependency. [VERIFIED: Intl.supportedValuesOf confirmed working via Node.js 22 check]

### No new dependencies needed

The entire phase can be implemented with the existing stack. No new npm installs are required for schema, cron endpoint, leaderboard, rewards, or redemption flow.

**Installation (timezone picker — only if native select is insufficient):**
```bash
npm install react-timezone-select
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── cron/
│   │       └── settle/
│   │           └── route.ts          # Vercel Cron Job endpoint
│   └── (protected)/
│       └── streaks/
│           └── page.tsx              # Streaks & Balance page (replace placeholder)
├── components/
│   └── streaks/
│       ├── streak-section.tsx        # Streak + personal best display
│       ├── member-leaderboard.tsx    # Balance leaderboard (avatar + name + points)
│       ├── rewards-menu.tsx          # Rewards list with add/delete/redeem
│       ├── add-reward-drawer.tsx     # Bottom sheet form (Base UI Drawer)
│       └── redeem-dialog.tsx         # Confirmation dialog (Base UI Dialog)
├── db/
│   └── schema.ts                     # Add: settledWeeks, pointTransactions, rewards, redemptions; alter: challenges
└── lib/
    ├── actions/
    │   ├── points.ts                 # addRewardAction, deleteRewardAction, redeemRewardAction
    │   └── settlement.ts             # settleWeekForChallenge() — shared logic for cron + testing
    └── utils/
        └── settlement.ts             # Pure settlement math (hitters/missers/wash rule) — unit-testable
```

### Pattern 1: Settlement Algorithm (pure function)

Extract the settlement math into a pure function in `src/lib/utils/settlement.ts` so it can be unit-tested without hitting the database:

```typescript
// Source: design decisions D-02, D-03, D-04

export interface MemberProgress {
  userId: string
  challengeMemberId: string
  checkedInCount: number
  weeklyGoal: number
}

export interface SettlementResult {
  washRule: boolean   // true = all missed, no points change
  hitters: string[]  // userIds who met goal
  missers: string[]  // userIds who missed
  transactions: Array<{
    userId: string
    delta: number   // positive = earned, negative = owed
    reason: 'earned' | 'penalty'
  }>
}

export function computeSettlement(members: MemberProgress[]): SettlementResult {
  const hitters = members.filter(m => m.checkedInCount >= m.weeklyGoal)
  const missers = members.filter(m => m.checkedInCount < m.weeklyGoal)

  // D-04: Wash rule — all missed, no points change
  if (hitters.length === 0) {
    return { washRule: true, hitters: [], missers: members.map(m => m.userId), transactions: [] }
  }

  const transactions: SettlementResult['transactions'] = []

  // D-02: Each hitter earns 1 point per misser
  for (const hitter of hitters) {
    transactions.push({
      userId: hitter.userId,
      delta: missers.length,
      reason: 'earned',
    })
  }

  // D-03: Each misser owes 1 point per hitter
  for (const misser of missers) {
    transactions.push({
      userId: misser.userId,
      delta: -hitters.length,
      reason: 'penalty',
    })
  }

  return { washRule: false, hitters: hitters.map(m => m.userId), missers: missers.map(m => m.userId), transactions }
}
```

### Pattern 2: Idempotent Cron Endpoint

```typescript
// Source: [CITED: vercel.com/docs/cron-jobs/manage-cron-jobs - idempotency guidance]
// File: src/app/api/cron/settle/route.ts

import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // 1. Verify CRON_SECRET (D-01 security requirement)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // 2. Load all challenges with their timezone/settlementHour
  // 3. For each challenge, check if the week boundary has passed in challenge's timezone
  // 4. Call settleWeekForChallenge() — idempotency via settledWeeks unique constraint
  // 5. Return summary

  return Response.json({ settled: challengeCount, skipped: skippedCount })
}
```

**Idempotency mechanism:** Before inserting transactions, attempt `INSERT INTO settled_weeks (challenge_id, week_start) ON CONFLICT DO NOTHING`. If it returns 0 rows (conflict = already settled), skip. This makes double-invocations safe. [VERIFIED: Drizzle `onConflictDoNothing()` confirmed pattern via official Drizzle docs]

### Pattern 3: Timezone-Aware Week Boundary Check

```typescript
// Source: [VERIFIED: Intl.DateTimeFormat confirmed working in Node.js 22 on this machine]
// Used in cron handler to decide if challenge's settlement hour has arrived

function getWeekdayInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  })
  return formatter.format(date)  // e.g. "Monday"
}

function getHourInTimezone(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  })
  return parseInt(formatter.format(date), 10)
}

// Settlement condition: weekday is Monday AND hour >= settlementHour
function shouldSettle(now: Date, timezone: string, settlementHour: number): boolean {
  return getWeekdayInTimezone(now, timezone) === 'Monday'
    && getHourInTimezone(now, timezone) >= settlementHour
}
```

Note: Hobby plan cron precision is ±59 minutes. The check uses `>=` (not `===`) so a 5:00 AM trigger that fires at 5:47 AM still settles. [VERIFIED: vercel.com/docs/cron-jobs/usage-and-pricing]

### Pattern 4: Balance Query (running sum)

Don't store a denormalized balance field — compute it from the ledger:

```typescript
// Source: [ASSUMED] — SQL SUM pattern on transactions table, standard ledger approach
import { sql, eq } from 'drizzle-orm'

const balances = await db
  .select({
    userId: pointTransactions.userId,
    balance: sql<number>`SUM(${pointTransactions.delta})`,
  })
  .from(pointTransactions)
  .where(eq(pointTransactions.challengeId, challengeId))
  .groupBy(pointTransactions.userId)
```

**Why no materialized balance column:** The transaction ledger is the source of truth (D-13 allows negatives). Summing from the ledger avoids dual-write bugs where balance and transaction rows diverge. At personal-project scale (< 10 members, < 52 weeks/year), performance is not a concern.

### Pattern 5: Base UI Drawer (bottom sheet for add reward)

```typescript
// Source: [CITED: base-ui.com/react/components/drawer]
'use client'
import { Drawer } from '@base-ui/react/drawer'

export function AddRewardDrawer({ challengeId }: { challengeId: string }) {
  return (
    <Drawer.Root>
      <Drawer.Trigger className="...">+ Add Reward</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Viewport>
          <Drawer.Popup className="bg-surface-container-high rounded-t-2xl p-6 ...">
            <Drawer.Title className="text-on-surface font-bold">New Reward</Drawer.Title>
            {/* react-hook-form + zod form here */}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
```

### Pattern 6: Base UI Dialog (confirmation for redeem)

```typescript
// Source: [CITED: base-ui.com/react/components/dialog]
'use client'
import { Dialog } from '@base-ui/react/dialog'

// open/onOpenChange controlled from parent; confirmed via Dialog.Root props
```

### Pattern 7: vercel.json cron configuration

```json
// Source: [CITED: vercel.com/docs/cron-jobs - configuration format]
{
  "crons": [
    {
      "path": "/api/cron/settle",
      "schedule": "0 10 * * 1"
    }
  ]
}
```

`0 10 * * 1` = 10:00 AM UTC every Monday = 5:00 AM ET (D-08). Hobby precision is ±59 min, so fires 10:00–10:59 AM UTC = 5:00–5:59 AM ET. [VERIFIED: vercel.com/docs/cron-jobs/usage-and-pricing]

### Anti-Patterns to Avoid

- **Storing a `balance` column on `challengeMembers`:** Creates dual-write risk. Compute balance from `SUM(delta)` on `pointTransactions`.
- **Not checking idempotency:** The Vercel docs explicitly state cron can fire twice. Without the `settledWeeks` unique constraint, double-settlement doubles all balances.
- **Using `getSession()` instead of `getUser()` in Server Actions:** Established project pattern — always `getUser()`.
- **Importing `db` in pure utility functions:** Phase 3 established that pure math (like `computeSettlement`) must not import the db, to keep them importable in tests.
- **Hardcoding UTC as the settlement timezone:** The challenge stores its own IANA timezone. Cron fires in UTC; the handler converts.
- **Blocking the Vercel Function too long:** Settlement for 2–5 members in one challenge is fast (< 1 second). Not a concern at this scale, but keep the logic synchronous-style without unnecessary awaits in loops.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IANA timezone conversion | Custom offset table | `Intl.DateTimeFormat` with `timeZone` option | Built into V8/Node.js 22; handles DST automatically. [VERIFIED: confirmed working on this machine] |
| Bottom sheet gesture UI | Custom CSS drawer | `@base-ui/react/drawer` (already installed) | Handles swipe gestures, focus trap, accessibility, backdrop. Already in `package.json`. |
| Confirmation dialog | Custom modal div | `@base-ui/react/dialog` (already installed) | Same package, handles focus trap, Escape key, accessible by default. |
| Unique timezone list | Hardcoded array | `Intl.supportedValuesOf('timeZone')` | Returns full current IANA list from V8 timezone data; always current. [VERIFIED: working in Node.js 22] |
| Balance calculation | Denormalized balance field | `SUM(delta)` query on `pointTransactions` | Avoids dual-write bugs; at 2–10 members the query is instant. |

**Key insight:** This project already has the right tools installed. The main risk is reaching for new libraries when the existing stack covers all needs.

---

## Database Schema Design

### New Tables

**`settled_weeks`** — idempotency guard, one row per settled week per challenge:
```typescript
export const settledWeeks = pgTable('settled_weeks', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  weekStart: date('week_start', { mode: 'string' }).notNull(),  // YYYY-MM-DD, Monday
  settledAt: timestamp('settled_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique('settled_weeks_challenge_week_unique').on(t.challengeId, t.weekStart),
])
```

**`pointTransactions`** — immutable ledger rows:
```typescript
export const pointTransactions = pgTable('point_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  weekStart: date('week_start', { mode: 'string' }).notNull(),
  delta: smallint('delta').notNull(),           // positive = earned, negative = penalty
  reason: text('reason').notNull(),             // 'earned' | 'penalty'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('pt_challenge_user_idx').on(t.challengeId, t.userId),
])
```

**`rewards`** — group-curated reward menu:
```typescript
export const rewards = pgTable('rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  pointCost: smallint('point_cost').notNull(),  // min 1 per D-17
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
```

**`redemptions`** — audit log for redeemed rewards (balance is authoritative from pointTransactions):
```typescript
export const redemptions = pgTable('redemptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  rewardId: uuid('reward_id').notNull().references(() => rewards.id, { onDelete: 'set null' }),
  pointCost: smallint('point_cost').notNull(),  // snapshot cost at redemption time
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
```

### Schema Alterations to Existing Tables

**`challenges`** — add timezone and settlementHour:
```sql
ALTER TABLE challenges
  ADD COLUMN timezone text NOT NULL DEFAULT 'America/New_York',
  ADD COLUMN settlement_hour smallint NOT NULL DEFAULT 5;
```

```typescript
// In Drizzle schema:
export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  timezone: text('timezone').notNull().default('America/New_York'),
  settlementHour: smallint('settlement_hour').notNull().default(5),
})
```

**Important:** Per the project's established pattern (from STATE.md and CONTEXT.md), schema is applied directly via SQL, NOT via `drizzle-kit push`, due to the v0.31.10 introspection crash on Supabase check constraints. [VERIFIED: project STATE.md + CONTEXT.md code context note]

---

## Common Pitfalls

### Pitfall 1: Double Settlement (Missing Idempotency)
**What goes wrong:** Vercel docs explicitly state "the same cron event can occasionally be delivered more than once." Without a guard, both invocations settle the same week, doubling all balances.
**Why it happens:** Vercel's event-driven cron delivery does not guarantee exactly-once semantics.
**How to avoid:** `INSERT INTO settled_weeks ON CONFLICT DO NOTHING` returns 0 rows on conflict; cron handler skips settlement for that challenge.
**Warning signs:** Balances doubling after Monday morning.
[CITED: vercel.com/docs/cron-jobs/manage-cron-jobs — "Vercel's event-driven system can occasionally deliver the same cron event more than once"]

### Pitfall 2: Cron Firing Before Challenge's Settlement Hour
**What goes wrong:** Cron fires at 10:00 AM UTC, but the check passes `shouldSettle()` for a different-timezone challenge when it shouldn't, settling before Sunday midnight local time.
**Why it happens:** Timezone conversion logic off-by-one or using UTC weekday instead of local weekday.
**How to avoid:** Use `Intl.DateTimeFormat` with the challenge's `timezone` to get local weekday AND local hour. Both must satisfy: weekday === Monday AND hour >= settlementHour.
**Warning signs:** Settlement happening on Sunday night for non-ET challenges.

### Pitfall 3: Hobby Plan Timing Imprecision (±59 minutes)
**What goes wrong:** Planning assumes `0 10 * * 1` fires at exactly 10:00 AM UTC, but Hobby plan fires anywhere in the 10:xx AM hour.
**Why it happens:** Vercel explicitly limits Hobby plan cron precision to hourly granularity.
**How to avoid:** Use `>= settlementHour` (not `=== settlementHour`) in the timezone check. Don't design any feature that requires minute-precise timing.
**Warning signs:** Settlement sometimes not running, or running inconsistently.
[VERIFIED: vercel.com/docs/cron-jobs/usage-and-pricing — "Scheduling precision: Hourly (±59 min)" for Hobby]

### Pitfall 4: Balance Going Negative on Redeem Race Condition
**What goes wrong:** Two concurrent redemption requests both read the balance as sufficient, both pass the balance check, both deduct — final balance goes too negative.
**Why it happens:** Read-check-then-write is a classic TOCTOU race condition in Server Actions.
**How to avoid:** In `redeemRewardAction`, perform the balance check + insert in a single Drizzle transaction. Use a PostgreSQL CTE or check the current balance with a subquery inside the insert. Alternatively, accept the risk at personal-project scale (2-person group makes this nearly impossible).
**Warning signs:** Balance going more negative than expected after concurrent redemptions.

### Pitfall 5: "Personal Best" Streak Not Persisted
**What goes wrong:** Computing personal best by scanning all historical weeks is slow and fragile.
**Why it happens:** computeStreak() in week.ts already does a backward walk up to 52 weeks — but this gives CURRENT streak, not personal best.
**How to avoid:** Two options: (a) compute personal best by scanning all 52 weeks at render time (acceptable for small group), or (b) store personal best in `challengeMembers` updated at settlement time. Option (a) requires extending computeStreak() to also return the max streak seen. This is Claude's Discretion per the context.
**Warning signs:** Personal best always showing same value as current streak.

### Pitfall 6: drizzle-kit push Crash
**What goes wrong:** Running `npm run db:push` crashes with drizzle-kit v0.31.10 due to Supabase check constraint introspection bug.
**Why it happens:** Known v0.31.10 issue, documented in project STATE.md.
**How to avoid:** Apply schema changes directly via SQL in the Supabase SQL Editor, then update schema.ts to match. Do NOT use drizzle-kit push.
[VERIFIED: project STATE.md + 04-CONTEXT.md code context]

### Pitfall 7: Mid-Week Joiners Being Treated as Missers
**What goes wrong:** A member who joined mid-week has fewer check-in opportunities but is compared against the full-week goal. Settlement penalizes them unfairly.
**Why it happens:** The settlement logic counts all challenge members without accounting for join date.
**How to avoid (Claude's Discretion per CONTEXT.md):** Grace period strategy — if `challengeMembers.joinedAt` is within the current week being settled, exclude that member from settlement entirely (neither earns nor owes). This is the simplest correct approach.
**Warning signs:** New members starting with negative balance after their first partial week.

---

## Vercel Cron Job — Key Facts

[VERIFIED: vercel.com/docs/cron-jobs, vercel.com/docs/cron-jobs/manage-cron-jobs, vercel.com/docs/cron-jobs/usage-and-pricing]

| Property | Hobby Plan | Source |
|----------|-----------|--------|
| Max cron jobs per project | 100 | Official pricing page |
| Min interval | Once per day | Official pricing page |
| Timing precision | ±59 minutes within the scheduled hour | Official pricing page |
| Timezone | Always UTC | Official docs |
| Failure retry | None — Vercel does NOT retry on failure | Official manage-cron-jobs page |
| Security mechanism | `CRON_SECRET` env var auto-sent as `Authorization: Bearer {secret}` | Official manage-cron-jobs page |
| Local testing | Direct HTTP request to `http://localhost:3000/api/cron/settle` | Official docs |
| No concurrent execution guard | Race possible if job runs longer than interval | Need idempotency + optional lock |

**CRON_SECRET pattern:**
```typescript
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  // ... settlement logic
}
```

**vercel.json schedule for D-08 (Monday 5 AM ET = 10 AM UTC):**
```json
{ "crons": [{ "path": "/api/cron/settle", "schedule": "0 10 * * 1" }] }
```

---

## Code Examples

### Settlement transaction in Drizzle (idempotent)

```typescript
// Source: [CITED: orm.drizzle.team/docs/transactions] + [CITED: orm.drizzle.team/docs/insert]

async function settleWeekForChallenge(
  challengeId: string,
  weekStart: string,  // YYYY-MM-DD Monday
  transactions: Array<{ userId: string; delta: number; reason: string }>
): Promise<'settled' | 'already_settled' | 'wash_rule'> {
  if (transactions.length === 0) return 'wash_rule'

  await db.transaction(async (tx) => {
    // Idempotency guard: fails silently on conflict
    const inserted = await tx
      .insert(settledWeeks)
      .values({ challengeId, weekStart })
      .onConflictDoNothing()
      .returning()

    // 0 rows returned = conflict = already settled
    if (inserted.length === 0) return  // tx commits with no writes

    // Insert all point transaction rows
    await tx.insert(pointTransactions).values(
      transactions.map(t => ({
        challengeId,
        userId: t.userId,
        weekStart,
        delta: t.delta,
        reason: t.reason,
      }))
    )
  })

  return 'settled'
}
```

### Balance query for leaderboard

```typescript
// Source: [ASSUMED] — standard SQL SUM aggregation
import { sql, eq } from 'drizzle-orm'

const memberBalances = await db
  .select({
    userId: pointTransactions.userId,
    balance: sql<number>`COALESCE(SUM(${pointTransactions.delta}), 0)`,
  })
  .from(pointTransactions)
  .where(eq(pointTransactions.challengeId, challengeId))
  .groupBy(pointTransactions.userId)
// Then join with challengeMembers for displayName + avatarUrl
```

**Note:** Members with zero transactions won't appear in this query. The leaderboard query should LEFT JOIN challengeMembers and COALESCE to 0 for members with no transactions yet.

### Reward Server Action pattern

```typescript
// Source: existing check-ins.ts + connections.ts patterns in this project [VERIFIED: codebase]
'use server'

import { z } from 'zod'
import { db } from '@/db'
import { rewards, challengeMembers } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'
import { eq } from 'drizzle-orm'

const addRewardSchema = z.object({
  name: z.string().min(1).max(100),
  pointCost: z.number().int().min(1),
})

export async function addRewardAction(input: { name: string; pointCost: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = addRewardSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input' }

  const membership = await db
    .select({ challengeId: challengeMembers.challengeId })
    .from(challengeMembers)
    .where(eq(challengeMembers.userId, user.id))
    .limit(1)
  if (membership.length === 0) return { error: 'Not in a challenge' }

  await db.insert(rewards).values({
    challengeId: membership[0].challengeId,
    name: parsed.data.name,
    pointCost: parsed.data.pointCost,
    createdBy: user.id,
  })
  return { success: true }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-----------------|--------------|--------|
| `middleware.ts` + `export function middleware` | `proxy.ts` + `export async function proxy` | Next.js 16 | Already correctly implemented in this project's `proxy.ts` [VERIFIED: codebase] |
| Cron via external service (cron-job.org, GitHub Actions) | Vercel Cron Jobs native in `vercel.json` | Vercel introduced ~2023, stable 2024+ | Zero-config for this project |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | Already using correct package [VERIFIED: package.json] |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Balance computed via `SUM(delta)` on `pointTransactions` (no materialized column) | Architecture Patterns P4, Don't Hand-Roll | Low risk — standard ledger pattern, easily changed |
| A2 | Mid-week joiners excluded from settlement if joined within the week being settled | Common Pitfalls P7 | Medium — if ignored, new members start negative |
| A3 | `redemptions` table stores snapshot `pointCost` to handle reward edits/deletions | Schema Design | Low risk — defensive pattern |
| A4 | LEFT JOIN + COALESCE(0) needed for leaderboard to show members with no transactions | Code Examples (balance query) | Low — easily fixed if query returns no rows for new members |
| A5 | `rewardId` in `redemptions` uses `onDelete: 'set null'` (not cascade) to preserve history | Schema Design | Medium — if cascade, redeemed items vanish from history if reward is deleted |

---

## Open Questions

1. **Personal best streak computation method**
   - What we know: `computeStreak()` walks backward 52 weeks for current streak
   - What's unclear: Personal best requires finding the MAX streak in all history — do we scan all 52 weeks differently, or store it during settlement?
   - Recommendation (Claude's Discretion): Walk all 52 weeks collecting all run lengths, return both current streak and max streak. No DB storage needed.

2. **Redemption balance check race condition**
   - What we know: Server Actions are not automatically atomic with a balance check
   - What's unclear: Is a TOCTOU race realistic with a 2-person group?
   - Recommendation: For a 2-person personal project, accept the risk without a transaction lock. If 5+ members, add a PostgreSQL serializable transaction or re-verify balance inside the transaction.

3. **Settlement for empty challenges (0 members)**
   - What we know: Can a challenge exist with 0 members? Yes — if last member leaves.
   - What's unclear: Should cron skip empty challenges?
   - Recommendation: Guard with `if (members.length < 2) skip` — settlement requires at least 2 members to be meaningful.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js 22 | `Intl.supportedValuesOf('timeZone')` | Yes | v22.11.0 | — |
| Vercel Cron Jobs | Settlement automation (D-01) | Yes (Hobby plan) | — | Manual HTTP trigger for testing |
| Supabase (DATABASE_URL) | All DB queries | Yes (existing) | — | — |
| `@base-ui/react` (Drawer, Dialog) | Bottom sheet + confirmation | Yes | ^1.3.0 | — |
| `drizzle-kit` | Schema application note: use SQL directly | Yes | v0.31.10 | Apply SQL manually (established pattern) |

**No missing dependencies.** All Phase 4 work runs with the current installed packages.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest v4.1.4 |
| Config file | `vitest.config.mts` (project root) |
| Quick run command | `npx vitest run tests/points.test.ts` |
| Full suite command | `npx vitest run` |

**Pre-existing test failure:** `tests/connections.test.ts > leaveChallengeAction deletes membership row` — 1 test fails asserting `db.delete(challengeMembers)` is present in the action file. This is a test artifact from an earlier phase; the actual code is correct. Phase 4 should not fix this (out of scope) but should not break any of the 214 currently-passing tests. [VERIFIED: `npx vitest run` output on this machine]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STAK-01 | computeSettlement: 2 members, 1 hits, 1 misses → hitter gets +1, misser gets -1 | unit | `npx vitest run tests/points.test.ts` | Wave 0 gap |
| STAK-02 | computeSettlement: 1 hits, 2 miss → hitter gets +2, each misser gets -1 | unit | `npx vitest run tests/points.test.ts` | Wave 0 gap |
| STAK-03 | computeSettlement: all miss → washRule=true, transactions=[] | unit | `npx vitest run tests/points.test.ts` | Wave 0 gap |
| STAK-03 | computeSettlement: all hit → each gets +0 (no missers) | unit | `npx vitest run tests/points.test.ts` | Wave 0 gap |
| STAK-04 | schema exports pointTransactions with correct columns | unit (static) | `npx vitest run tests/points.test.ts` | Wave 0 gap |
| STAK-04 | schema exports settledWeeks with unique constraint | unit (static) | `npx vitest run tests/points.test.ts` | Wave 0 gap |
| STAK-05 | schema exports rewards table | unit (static) | `npx vitest run tests/points.test.ts` | Wave 0 gap |
| STAK-05 | addRewardAction validates pointCost >= 1 and rejects 0 | unit | `npx vitest run tests/points.test.ts` | Wave 0 gap |
| STAK-06 | schema exports redemptions table | unit (static) | `npx vitest run tests/points.test.ts` | Wave 0 gap |
| STAK-06 | redeemRewardAction rejects when balance < pointCost | unit | `npx vitest run tests/points.test.ts` | Wave 0 gap |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/points.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite (minus pre-existing connections.test.ts failure) green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/points.test.ts` — covers STAK-01 through STAK-06 (schema + pure logic)
- [ ] `src/lib/utils/settlement.ts` — pure settlement function (no DB, easily testable)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `getUser()` in every Server Action (project standard) |
| V3 Session Management | no | Handled by Supabase Auth + proxy.ts (existing) |
| V4 Access Control | yes | Challenge membership check before all mutations |
| V5 Input Validation | yes | Zod for reward name (min 1, max 100) and pointCost (int, min 1) |
| V6 Cryptography | no | No new crypto; CRON_SECRET is an env var secret |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthenticated cron trigger | Spoofing | `CRON_SECRET` Authorization header check on `/api/cron/settle` |
| Redeeming another member's points | Tampering | Server Action always uses `user.id` from `getUser()`, never from client |
| Adding reward for different challenge | Tampering | Server Action verifies `challengeMembers.userId = user.id` before insert |
| Negative pointCost reward | Tampering | Zod validates `z.number().int().min(1)` |
| Over-redeeming (balance race) | Tampering | Accept at 2-person scale; note in Open Questions for future hardening |

---

## Sources

### Primary (HIGH confidence)
- [vercel.com/docs/cron-jobs](https://vercel.com/docs/cron-jobs) — cron configuration, schedule syntax, UTC-only timezone
- [vercel.com/docs/cron-jobs/manage-cron-jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs) — CRON_SECRET pattern, idempotency guidance, no retry on failure
- [vercel.com/docs/cron-jobs/usage-and-pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) — Hobby plan limits (once/day, ±59 min precision)
- [base-ui.com/react/components/drawer](https://base-ui.com/react/components/drawer) — Drawer.Root / Drawer.Portal / Drawer.Popup API
- [base-ui.com/react/components/dialog](https://base-ui.com/react/components/dialog) — Dialog controlled pattern
- [orm.drizzle.team/docs/insert](https://orm.drizzle.team/docs/insert) — onConflictDoNothing pattern
- [orm.drizzle.team/docs/transactions](https://orm.drizzle.team/docs/transactions) — db.transaction() API
- Project codebase (package.json, schema.ts, week.ts, check-ins.ts, proxy.ts, settings/page.tsx) — verified via Read tool

### Secondary (MEDIUM confidence)
- [github.com/ndom91/react-timezone-select](https://github.com/ndom91/react-timezone-select) — timezone picker alternative
- Node.js 22 `Intl.supportedValuesOf('timeZone')` — verified live on this machine

### Tertiary (LOW confidence)
- None — all critical claims verified via official sources or live machine checks

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json; cron and Base UI confirmed via official docs
- Architecture: HIGH — settlement algorithm is deterministic logic; idempotency pattern verified via Vercel docs
- Pitfalls: HIGH — idempotency and timing pitfalls cited from official Vercel docs; others from established patterns
- Schema design: MEDIUM — column choices and foreign keys are designed but not yet validated by drizzle-kit (apply via SQL directly per project pattern)

**Research date:** 2026-04-13
**Valid until:** 2026-07-13 (stable stack — Vercel Cron and Base UI APIs are stable)
