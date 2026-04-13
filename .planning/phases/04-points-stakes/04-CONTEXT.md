# Phase 4: Points & Stakes - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Points flow correctly — users earn when they hit goals, owe when they miss, and can redeem against a group rewards menu. Delivers: automatic weekly settlement via cron, point earning/penalty logic with wash rule, challenge-level timezone with custom settlement hour, the Streaks & Balance page (replacing the placeholder), a leaderboard-style ledger, rewards menu with add/remove/redeem, and redemption with balance enforcement.

</domain>

<decisions>
## Implementation Decisions

### Settlement mechanics
- **D-01:** Automatic weekly settlement via Vercel Cron Job at the week boundary (Monday morning). No manual trigger needed.
- **D-02:** 1 point earned per met-goal week. Simple flat economy.
- **D-03:** Members who miss owe 1 point to EACH member who hit their goal. If 3 hit and you miss, you owe 3 points total (-3 to your balance, +1 to each hitter).
- **D-04:** Wash rule: if ALL members miss in the same week, no points change hands. Ledger unchanged.
- **D-05:** No pending/projected settlement state. Members only see finalized balances after the cron runs.
- **D-06:** Challenge-level timezone. Each challenge stores a timezone (IANA format, e.g., America/New_York) and a custom settlement hour. Default: America/New_York at 5:00 AM ET. The cron converts to the challenge timezone to determine week boundaries.
- **D-07:** Standard IANA timezone picker on Settings, plus a custom time-of-day picker for settlement hour. Any member can change it (no owner role, consistent with Phase 2 D-13).
- **D-08:** Settlement time chosen to work for Virginia + UK friend group: Monday 5:00 AM ET = Monday 10:00 AM London. Both can finish workouts before midnight local time.

### Ledger screen (Streaks & Balance)
- **D-09:** Repurpose the existing Streaks placeholder page (`/streaks`) into the full Streaks & Balance screen. Bottom nav already links here.
- **D-10:** Page layout top-to-bottom: (1) Your streak section, (2) Member balance leaderboard, (3) Rewards menu.
- **D-11:** Streak section shows current streak (🔥 N week streak) and personal best streak. Reuses the StreakCounter component pattern from Dashboard.
- **D-12:** Leaderboard-style member list: avatar + display name + current point balance. Sorted by balance descending (highest first).
- **D-13:** Negative balances allowed. Members can go into debt from missing weeks. Creates real accountability.

### Rewards menu
- **D-14:** Reward items are simple: name + point cost. No description, emoji, or image.
- **D-15:** Any member can add and remove any reward item. No owner role, trust-based for friend group (consistent with Phase 2 D-13).
- **D-16:** "+" button on the rewards section opens a bottom sheet with name input and cost input. Tap Add to create.
- **D-17:** Point cost constraints: minimum 1, no maximum. Friends calibrate their own economy.
- **D-18:** Rewards menu lives on the Streaks & Balance page, below the member balance leaderboard.

### Redemption flow
- **D-19:** Tap a reward item → confirmation dialog: "Redeem '[reward name]' for [N] pts?" → Confirm → balance deducted instantly.
- **D-20:** Must have sufficient balance to redeem. Redeem button disabled if balance < cost. Show "You need N more points" message.
- **D-21:** Redemption updates balance silently. No notification to other members, no feed entry. Others see the balance change on the ledger.

### Claude's Discretion
- Settlement cron implementation details (Vercel Cron syntax, error handling, idempotency)
- Database schema for point transactions, rewards, redemptions
- Leaderboard visual design (card style, spacing, balance formatting)
- Bottom sheet component for adding rewards
- Confirmation dialog styling
- Streak "personal best" computation logic
- How settlement handles members who joined mid-week
- Timezone picker component choice

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design reference
- `stitch-copy-paste-code-inspiration.txt` — Full Stitch Royale HTML with Tailwind config, color tokens, typography, and component patterns. Use as design inspiration.

### Project docs
- `.planning/PROJECT.md` — Project vision, constraints, key decisions (points economy, group-curated rewards)
- `.planning/REQUIREMENTS.md` — STAK-01 through STAK-06 are this phase's requirements
- `CLAUDE.md` — Full technology stack specification (Next.js 16, Supabase, Drizzle, Tailwind v4, Vercel)

### Phase 3 artifacts (dependencies)
- `.planning/phases/03-check-ins-goals/03-CONTEXT.md` — Phase 3 decisions (weekly goals, streaks, week boundaries)
- `src/db/schema.ts` — Existing Drizzle schema (challenges, challengeMembers with weeklyGoal, checkIns) — new points/rewards tables extend this
- `src/db/index.ts` — Drizzle client (reuse for all points queries)
- `src/lib/utils/week.ts` — Week boundary utilities (getMonday, getSunday, getWeekBounds, getWeeklyProgress, computeStreak) — settlement logic builds on these
- `src/lib/actions/check-ins.ts` — Server Action patterns with auth + challenge membership gating (follow same pattern for points actions)
- `src/app/(protected)/streaks/page.tsx` — Placeholder page to be replaced with Streaks & Balance
- `src/app/(protected)/dashboard/page.tsx` — Dashboard with DayDots and StreakCounter (streak pattern reference)
- `src/components/dashboard/streak-counter.tsx` — Existing streak display component to reuse/extend
- `src/components/layout/bottom-nav.tsx` — Bottom nav already links to /streaks

### Phase 2 artifacts (challenge model)
- `.planning/phases/02-connections/02-CONTEXT.md` — Phase 2 decisions (one challenge per user, no owner role, any member can manage)
- `src/lib/actions/connections.ts` — Server Action patterns (auth gating, challenge membership checks)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/utils/week.ts`: Week boundary utilities — `getWeeklyProgress()` already computes who checked in per week, `getMonday()`/`getSunday()` define week boundaries. Settlement logic can reuse these directly.
- `src/db/schema.ts`: Drizzle schema with `challenges`, `challengeMembers` (has `weeklyGoal`), `checkIns` — new tables for point transactions, rewards, and redemptions extend this.
- `src/components/dashboard/streak-counter.tsx`: Streak display component — reuse pattern for Streaks & Balance page.
- `src/components/dashboard/day-dots.tsx`: Day dots component — reference for consistent visual patterns.
- `src/lib/actions/check-ins.ts`: Server Action pattern with `createClient()` + `getUser()` auth gate + challenge membership check — follow identical pattern for points actions.

### Established Patterns
- Server Actions for mutations (not API routes) — all write operations use this pattern
- Drizzle ORM for all database queries (not Supabase JS client for data tables)
- `createClient()` + `getUser()` auth gating in every Server Action
- Protected routes under `src/app/(protected)/` with auth guard in layout
- Royale design tokens in `src/app/globals.css` via `@theme` — all new UI must use these tokens
- Client components use `'use client'` directive with useState for loading/error states
- Schema applied directly via SQL (not drizzle-kit push) due to drizzle-kit v0.31.10 issue

### Integration Points
- `src/app/(protected)/streaks/page.tsx` — replace placeholder with full Streaks & Balance page
- `src/db/schema.ts` — add pointTransactions, rewards, redemptions tables
- `src/lib/utils/week.ts` — settlement logic uses existing week utility functions
- `challenges` table — add `timezone` and `settlementHour` columns
- Vercel Cron — new `src/app/api/cron/settle/route.ts` endpoint for weekly settlement
- `src/app/(protected)/settings/page.tsx` — add timezone/settlement time picker

</code_context>

<specifics>
## Specific Ideas

- The timezone default (America/New_York at 5:00 AM ET) is specifically chosen for Arnav (Virginia) and his girlfriend (London) — both finish workouts before midnight local, settlement happens Monday morning after both are done.
- Negative balances create real stakes — you can't just stop playing. The debt follows you until you earn it back.
- Rewards menu is intentionally minimal (name + cost only) — the group decides what's valuable. "Movie night pick — 3 pts" or "Dinner choice — 5 pts" are the expected reward types.
- The Streaks & Balance page is the central hub for the points economy — everything in one scrollable page, no extra navigation.

</specifics>

<deferred>
## Deferred Ideas

- Redemption notifications to group members — could be added as feed entries in Phase 5
- Transaction history / full audit log — v2, if members want to see detailed point flow
- Streak milestones or achievements tied to points — future enhancement
- Settlement override / manual trigger as backup — add if cron proves unreliable

</deferred>

---

*Phase: 04-points-stakes*
*Context gathered: 2026-04-13*
