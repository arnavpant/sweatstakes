# Phase 4: Points & Stakes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-13
**Phase:** 04-points-stakes
**Areas discussed:** Settlement mechanics, Ledger screen, Rewards menu, Redemption flow

---

## Settlement mechanics

| Option | Description | Selected |
|--------|-------------|----------|
| Manual trigger | Any member taps a "Settle week" button after the week ends | |
| Automatic at week boundary | A scheduled job runs Sunday night / Monday morning and settles automatically | ✓ |
| First Monday check-in | Settlement triggers automatically when anyone does their first action on Monday | |

**User's choice:** Automatic at week boundary
**Notes:** User wants hands-off settlement, no manual action required.

---

| Option | Description | Selected |
|--------|-------------|----------|
| 1 point per met week | Simple flat economy. Hit goal = +1 point. | ✓ |
| Points scale with goal difficulty | Higher weekly goal = more points earned | |
| Flat 10 points per met week | Larger numbers, rewards in multiples of 10 | |

**User's choice:** 1 point per met week
**Notes:** None — straightforward pick.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Owe 1 point to each hitter | Miss = -1 point per person who hit. Scales with group size. | ✓ |
| Owe 1 point total, split evenly | Miss = -1 total, distributed among hitters | |
| Match the hitters' earnings | Each hitter earns 1, each misser owes 1 to the pot | |

**User's choice:** Owe 1 point to each hitter
**Notes:** None — straightforward pick.

---

| Option | Description | Selected |
|--------|-------------|----------|
| No pending state | Members only see finalized balances after cron runs | ✓ |
| Show pending preview | Show "projected" adjustment before settlement runs | |

**User's choice:** No pending state
**Notes:** None.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed UTC boundary | Cron runs at a fixed UTC time, all members share same boundary | |
| Challenge-level timezone | Challenge stores a timezone, settlement cron adjusts per challenge | ✓ (modified) |
| Per-member timezone | Each member's week boundary based on their own timezone | |

**User's choice:** Challenge-level timezone with custom settlement hour
**Notes:** User's girlfriend is in the UK, user is in Virginia. Both workout before midnight local time. User wants a timezone picker (IANA standard zones) plus a custom time picker for settlement hour. Default: America/New_York at 5:00 AM ET (= 10:00 AM London).

---

## Ledger screen

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — Streaks & Balance | Repurpose Streaks placeholder into combined streaks + balance screen | ✓ |
| Separate Ledger page | Keep Streaks separate, add new Ledger page | |
| Ledger on Dashboard | Show balances on Dashboard, no separate page | |

**User's choice:** Streaks & Balance (repurpose placeholder)
**Notes:** None.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Balance + name + avatar | Leaderboard-style list sorted by balance | ✓ |
| Balance + recent history | Same plus last 3-5 transactions per member | |
| Full transaction log | Complete scrollable history with timestamps | |

**User's choice:** Balance + name + avatar
**Notes:** None.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Rewards on same page | Streaks + balances + rewards all on one page | ✓ |
| Rewards on separate page | Rewards on its own page or in Settings | |
| Rewards in bottom sheet | "Redeem" button opens bottom sheet with rewards | |

**User's choice:** Rewards on same page
**Notes:** None.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Current streak + personal best | Your streak and all-time best, reuses StreakCounter | ✓ |
| Streak for all members | Every member's streak alongside their balance | |
| You decide | Claude picks the approach | |

**User's choice:** Current streak + personal best
**Notes:** None.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — allow negative | Balance can go below zero, creating debt | ✓ |
| Floor at zero | Balance can't go below 0, debt forgiven | |

**User's choice:** Allow negative balances
**Notes:** User values real accountability — debt follows you.

---

## Rewards menu

| Option | Description | Selected |
|--------|-------------|----------|
| Name + point cost only | Simple text + number. "Movie night pick — 3 pts" | ✓ |
| Name + cost + description | Optional description field for more context | |
| Name + cost + emoji/icon | Each reward gets a fun emoji from the creator | |

**User's choice:** Name + point cost only
**Notes:** None.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Any member can add and remove | No owner role, trust-based | ✓ |
| Any member adds, only creator removes | Only the person who created can remove | |
| Any member adds, removal needs confirmation | Removing requires confirmation dialog | |

**User's choice:** Any member can add and remove
**Notes:** Consistent with Phase 2 no-owner-role decision.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Inline form at bottom | Always-visible text + number inputs at bottom of list | |
| Add button opens bottom sheet | "+" button opens a small bottom sheet with name and cost fields | ✓ |
| You decide | Claude picks the UX | |

**User's choice:** Add button opens bottom sheet
**Notes:** User prefers cleaner list with one extra tap to add.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Minimum 1, no maximum | Any positive integer. Trust the group. | ✓ |
| Min 1, max 100 | Cap at 100 to prevent silly entries | |
| Suggested tiers | Show suggested tiers but allow any value | |

**User's choice:** Minimum 1, no maximum
**Notes:** None.

---

## Redemption flow

| Option | Description | Selected |
|--------|-------------|----------|
| Confirmation dialog then done | Tap → confirm dialog → balance deducted | ✓ |
| Instant redeem, no confirmation | Tap and done, undo for 5 seconds | |
| Request-based redemption | Sends "redemption request" to group | |

**User's choice:** Confirmation dialog then done
**Notes:** Prevents accidental taps.

---

| Option | Description | Selected |
|--------|-------------|----------|
| No — must have enough | Disabled if balance < cost. "You need N more points" | ✓ |
| Yes — go further into debt | Can always redeem regardless of balance | |
| Allow if positive balance | Can redeem if positive, even if result is negative | |

**User's choice:** Must have sufficient balance
**Notes:** Keeps the economy meaningful — earn before spending.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Balance updates silently | Deduction only, no notification to others | ✓ |
| Show in redemption history | Section showing recent redemptions on Streaks & Balance | |
| Defer visibility to Phase 5 feed | Add as feed entries later | |

**User's choice:** Balance updates silently
**Notes:** None.

---

## Claude's Discretion

- Settlement cron implementation details (Vercel Cron syntax, error handling, idempotency)
- Database schema for point transactions, rewards, redemptions
- Leaderboard visual design (card style, spacing, balance formatting)
- Bottom sheet component for adding rewards
- Confirmation dialog styling
- Streak "personal best" computation logic
- How settlement handles members who joined mid-week
- Timezone picker component choice

## Deferred Ideas

- Redemption notifications to group members — could be feed entries in Phase 5
- Transaction history / full audit log — v2
- Streak milestones or achievements tied to points — future enhancement
- Settlement override / manual trigger as backup — add if cron proves unreliable
