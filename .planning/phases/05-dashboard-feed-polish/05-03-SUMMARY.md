---
phase: 05-dashboard-feed-polish
plan: 03
subsystem: ui
tags: [dashboard, feed, leader-callout, pull-to-refresh, horizontal-scroll, intl-relative-time]

requires:
  - phase: 05-dashboard-feed-polish
    plan: 01
    provides: react-simple-pull-to-refresh installed, challenge_members schema extensions
  - phase: 04-points-stakes
    plan: 01
    provides: point_transactions table + delta ledger for leader callout
  - phase: 03-check-ins-goals
    plan: 02
    provides: check_ins table + photoUrl column for feed and gallery
  - phase: 03-check-ins-goals
    plan: 03
    provides: DayDots component + getWeeklyProgress helper (reused per-member)
provides:
  - formatRelative(date, now?) — Intl.RelativeTimeFormat wrapper with injectable now
  - computeLeaderCallout(balances, viewerUserId) — pure viewer-POV headline generator
  - getBalancesForChallenge, getRecentCheckInPhotos, getMemberProgressRows — dashboard query helpers
  - getFeedItems(challengeId) — feed query joined with member display data
  - LeaderCallout, MemberCard, MemberCardRow, PhotoGallery — dashboard server components
  - FeedCard, FeedList — feed client components with 60s re-tick + pull-to-refresh
  - /feed route replaced from placeholder to real Server Component
  - .no-scrollbar Tailwind utility (horizontal scroll without visible bar)
affects: [dashboard, feed, 05-04]

tech-stack:
  added: []
  patterns:
    - "Server Component fetches balances + member rows + photos in parallel, passes to Server Components for rendering; only the feed card list is a Client Component (for 60s tick) and FeedList (for PullToRefresh + router.refresh on navigation)"
    - "Injectable now parameter on formatRelative keeps tests deterministic"
    - "Leader callout is a pure function — DB-derived balances computed server-side, never client-supplied, so string content is untamperable from the client"

key-files:
  created:
    - src/lib/utils/relative-time.ts
    - src/lib/utils/leader-callout.ts
    - src/lib/queries/dashboard.ts
    - src/lib/queries/feed.ts
    - src/components/dashboard/leader-callout.tsx
    - src/components/dashboard/member-card.tsx
    - src/components/dashboard/member-card-row.tsx
    - src/components/dashboard/photo-gallery.tsx
    - src/components/feed/feed-card.tsx
    - src/components/feed/feed-list.tsx
    - tests/relative-time.test.ts
    - tests/leader-callout.test.ts
    - tests/dashboard-queries.test.ts
    - .planning/phases/05-dashboard-feed-polish/deferred-items.md
  modified:
    - src/app/(protected)/dashboard/page.tsx
    - src/app/(protected)/feed/page.tsx
    - src/app/globals.css

key-decisions:
  - "Viewer-POV leader callout (not global) — locked in 05-CONTEXT.md DASH-01. String personalizes per viewer (`You lead…` vs `You're N behind…`)."
  - "Horizontal scroll card row with current user pinned first (DASH-02) — served by sorting member rows by `isCurrentUser` desc before rendering"
  - "Photo gallery wraps the entire 3×2 grid in `<Link href='/feed'>` — no inline lightbox per locked decision; tapping any thumbnail opens Feed"
  - "Feed load-all (no LIMIT) — locked in 05-CONTEXT.md FEED. Friend-group scale makes cursor pagination premature; T-05-03-04 DoS threat explicitly accepted"
  - "FeedCard is the only client component in the feed stack — required for the 60s setInterval re-tick of relative timestamps. FeedList is client because PullToRefresh + router.refresh need client hooks."
  - "formatRelative accepts both Date and string — Next.js serializes Date → string across the server→client boundary, so FeedList receiving FeedItem.createdAt as a string still works"
  - "computeLeaderCallout ties break alphabetically by displayName for determinism"

requirements-completed: [DASH-01, DASH-02, DASH-03, FEED-01, FEED-02, DSGN-01, DSGN-02, DSGN-03]

duration: ~12min
completed: 2026-04-14
---

# Phase 5 Plan 3: Dashboard completion + Feed surface

**Completed the Dashboard with leader callout (viewer-POV), horizontal per-member card row, and 3×2 photo grid, and replaced the Feed placeholder with a BeReal-style vertical card stack backed by pull-to-refresh and router.refresh-on-navigate — shipping DASH-01/02/03, FEED-01/02, and DSGN-01/02/03 in a single autonomous pass.**

## Performance

- **Duration:** ~12 minutes (3 atomic tasks, TDD for Task 1)
- **Completed:** 2026-04-14
- **Tasks:** 3 (all `type=auto`; Task 1 tdd=true)
- **Files created:** 14
- **Files modified:** 3

## Accomplishments

- Pure `formatRelative` with injectable `now` wraps `Intl.RelativeTimeFormat('en', { numeric: 'auto' })` so "yesterday" is emitted for ~28h diffs instead of "1 day ago"
- Pure `computeLeaderCallout(balances, viewerUserId)` covers all eight locked phrasings: empty, all-zero, sole leader (with or without gap), viewer-not-leading (with or without runner-up tail), viewer tied with one, viewer tied with multiple, viewer at bottom with negative balances
- Four server-only query helpers (`getBalancesForChallenge`, `getRecentCheckInPhotos`, `getMemberProgressRows`, `getFeedItems`) — all scoped by challengeId derived from the authenticated membership
- Dashboard page now fetches weekly progress + streak + balances + member progress rows + recent photos, pins current user first in the member card row, and renders `LeaderCallout`/`MemberCardRow`/`PhotoGallery` below the existing `DayDots`/`StreakCounter` block
- Feed page: membership resolved server-side, feed items joined with member display data, rendered into `FeedList` which wraps `PullToRefresh` and fires `router.refresh()` on both pull gesture and tab-navigation (`useEffect` on pathname)
- `FeedCard` re-ticks the relative timestamp every 60s via `setInterval` so "2m ago" progresses while the page is open
- Three new Vitest suites: 6 relative-time + 8 leader-callout + 4 dashboard-queries = 18 new tests, all green
- `.no-scrollbar` utility added in `globals.css` for the horizontal member card row

## Task Commits

1. **Task 1 RED: failing tests for relative-time, leader-callout, dashboard queries** — `bc1468f` (test)
2. **Task 1 GREEN: utility modules + query helpers** — `4ec508e` (feat)
3. **Task 2: dashboard components + page extension + .no-scrollbar** — `acf06cd` (feat)
4. **Task 3: feed components + page replacement** — `3777dd3` (feat)

## Files Created/Modified

**Created**
- `src/lib/utils/relative-time.ts` — `formatRelative(date, now?)` wrapper
- `src/lib/utils/leader-callout.ts` — `computeLeaderCallout(balances, viewerUserId)` + `LeaderCalloutInput`
- `src/lib/queries/dashboard.ts` — `getBalancesForChallenge`, `getRecentCheckInPhotos`, `getMemberProgressRows`
- `src/lib/queries/feed.ts` — `getFeedItems(challengeId)` + `FeedItem` interface
- `src/components/dashboard/leader-callout.tsx` — Server Component
- `src/components/dashboard/member-card.tsx` — Server Component (avatar + name + DayDots)
- `src/components/dashboard/member-card-row.tsx` — Server Component (snap-scroll container)
- `src/components/dashboard/photo-gallery.tsx` — Server Component (3×2 grid → /feed link)
- `src/components/feed/feed-card.tsx` — Client Component (60s tick)
- `src/components/feed/feed-list.tsx` — Client Component (PullToRefresh + router.refresh)
- `tests/relative-time.test.ts` — 6 tests
- `tests/leader-callout.test.ts` — 8 tests
- `tests/dashboard-queries.test.ts` — 4 tests (drizzle chain inspection)
- `.planning/phases/05-dashboard-feed-polish/deferred-items.md` — pre-existing connections.test.ts failure logged

**Modified**
- `src/app/(protected)/dashboard/page.tsx` — adds balances/memberRows/recentPhotos fetch + renders new sections
- `src/app/(protected)/feed/page.tsx` — replaced Construction placeholder with real Server Component
- `src/app/globals.css` — added `.no-scrollbar` utility inside `@layer utilities`

## Decisions Made

See frontmatter `key-decisions`. Highlights:
- **Viewer-POV leader callout** — every user sees a string tailored to them (the user's id is passed into the pure function). Sorting is stable by balance desc, tie-breaking alphabetically by displayName for determinism.
- **Current user pinned first** — sort by `isCurrentUser` desc before rendering. Rest of the row is in arbitrary-but-stable DB order.
- **Photo gallery tap = navigate to /feed** — no inline lightbox. Entire grid wrapped in `<Link>` with an `aria-label`.
- **Pull-to-refresh gesture + pathname useEffect** — no Realtime subscription in feed per locked CONTEXT.md decision. Both triggers call `router.refresh()` which re-runs the Server Component and swaps in the fresh feed items.

## Deviations from Plan

**None.** Plan executed end-to-end as written across all 3 tasks.

One minor acceptable-within-spec variation: the plan's `runnerUp` calc was shown as `sorted[1]`, which conflates "second in sort" with "runner-up" in the tied-leader case. The shipped implementation uses `sorted.find(b => b.balance !== leader.balance)` so the "N ahead of" phrasing correctly skips tied leaders and picks the next-balance person. Both produce the same output for the single-leader test cases the plan specified; the change only matters for the tied-leader cases which the test suite exercises directly.

## Issues Encountered

- **Pre-existing test failure in `tests/connections.test.ts`:** asserts the raw source string `db.delete(challengeMembers)` appears in `connections.ts`, but the action has been refactored. Verified pre-existing by running the test against a stash of this plan's work — same failure without Plan 03 changes. Logged in `deferred-items.md` as out of scope per SCOPE BOUNDARY. No impact on plan-03 outcomes.
- **TS error on the initial thenable-builder mock in `dashboard-queries.test.ts`:** `PromiseLike<unknown[]>` was too strict for the chainable-builder pattern. Resolved by typing the builder as `any` with an inline eslint-disable — standard pattern for test-only mock chains.

## Known Stubs

None. All data paths are wired end-to-end:
- `LeaderCallout` → `getBalancesForChallenge` → `point_transactions` + `challenge_members` join (real DB)
- `MemberCardRow` → `getMemberProgressRows` + per-member `getWeeklyProgress` (real DB)
- `PhotoGallery` → `getRecentCheckInPhotos` (real DB, limit 6)
- `FeedList` → `getFeedItems` (real DB, full challenge)

Empty arrays only appear when data genuinely doesn't exist (no challenge, no check-ins), and each case renders a proper empty-state UI message, not a silent blank.

## Testing Summary

- `npx vitest run tests/relative-time.test.ts tests/leader-callout.test.ts tests/dashboard-queries.test.ts` → **18/18 passed**
- `npx tsc --noEmit` → **0 errors**
- Full `npx vitest run` → 261 passed, 1 pre-existing failure in `connections.test.ts` (out of scope, logged)

## Next Plan Readiness

Plan 05-04 (profile editor — SETT-03) can proceed independently. It consumes the existing `avatars` bucket from Plan 05-01 and the `challenge_members.avatarUrl` column; no coupling to anything in this plan.

Plan 05-02 (notifications + cron triggers — also Wave 2, runs independent of this plan) remains unblocked; I touched none of its `files_modified` list.

---
*Phase: 05-dashboard-feed-polish*
*Completed: 2026-04-14*

## Self-Check: PASSED

Verified each created file exists and each commit is in `git log`:

- FOUND: src/lib/utils/relative-time.ts
- FOUND: src/lib/utils/leader-callout.ts
- FOUND: src/lib/queries/dashboard.ts
- FOUND: src/lib/queries/feed.ts
- FOUND: src/components/dashboard/leader-callout.tsx
- FOUND: src/components/dashboard/member-card.tsx
- FOUND: src/components/dashboard/member-card-row.tsx
- FOUND: src/components/dashboard/photo-gallery.tsx
- FOUND: src/components/feed/feed-card.tsx
- FOUND: src/components/feed/feed-list.tsx
- FOUND: tests/relative-time.test.ts
- FOUND: tests/leader-callout.test.ts
- FOUND: tests/dashboard-queries.test.ts
- FOUND commit: bc1468f (test 05-03 RED)
- FOUND commit: 4ec508e (feat 05-03 utilities + queries)
- FOUND commit: acf06cd (feat 05-03 dashboard UI)
- FOUND commit: 3777dd3 (feat 05-03 feed)
