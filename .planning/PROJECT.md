# SweatStakes

## What This Is

A mobile web app where friend groups hold each other accountable to personal fitness goals through a points-based stakes system. Each person sets their own weekly workout target, logs workouts via photo check-ins, and earns or loses points based on whether they hit their goal. Groups curate their own reward menus, and points can be redeemed for real-world stakes like dinners, movie picks, or whatever the group decides.

## Core Value

Friends actually stick to their workout routines because there's something real on the line — social accountability with tangible stakes.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Users can sign up / log in with email+password or Google/Apple OAuth
- [ ] Users can create a group ("sanctuary") and invite others via link
- [ ] Groups support 2+ members (couples, friend groups, etc.)
- [ ] Each member sets their own weekly workout goal (e.g., 4 of 7 days)
- [ ] Members log workouts by taking a photo check-in (camera API)
- [ ] Weekly progress tracked per member (days completed vs goal)
- [ ] Streak tracking — consecutive days/weeks of hitting goals
- [ ] Points system — earn points for hitting goal, owe points to all who hit theirs when you miss
- [ ] If everyone misses, nobody owes — it's a wash
- [ ] Group-curated rewards/stakes menu (any member can add items with point costs)
- [ ] Points can be redeemed for items on the stakes menu
- [ ] The Ledger — running balance of who's up/down in points
- [ ] History of settled stakes
- [ ] Activity feed showing partner check-in photos, journal notes, and progress
- [ ] Hype and Nudge social reactions on feed posts
- [ ] Dashboard showing active bet, your progress vs partner progress, workout gallery
- [ ] Settings: weekly goal stepper, notifications toggle, privacy toggle
- [ ] All 5 screens from Stitch design: Login, Dashboard (Sanctuary), Streaks & Balance, Feed, Settings

### Out of Scope

- Fitness tracker integration (Apple Health, Google Fit) — photo check-in is the mechanic
- Real payment processing — stakes are honor-system, tracked in-app
- Native mobile app — this is a mobile web app
- Workout details (type, duration, reps) — photo is the only proof needed
- Public social features beyond the group — no global feed or discovery

## Context

- Stitch design (Royale theme) already defines the full visual language: dark navy (#001233), emerald green (#50C878), glass panels, Plus Jakarta Sans, Material Symbols icons, floating bottom nav
- The design uses Tailwind CSS with a custom Material Design 3 color token system
- Mobile-first responsive layout — designed for phone screens with bottom nav
- Photo check-in needs browser camera API access
- Starting as a personal project for Arnav and friends, with potential to open publicly later
- The Stitch HTML serves as design reference/inspiration, not production code

## Constraints

- **Platform**: Mobile web app (responsive website, not native) — must work well on phone browsers
- **Camera**: Needs browser camera API for photo check-ins
- **Design**: Must closely follow the Stitch Royale theme (colors, typography, component patterns)
- **Scope**: All 5 designed screens functional for v1
- **Auth**: Email/password + Google and Apple OAuth

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mobile web over native app | Lower barrier to entry, shareable via link, no app store friction | — Pending |
| Photo-only workout logging | Keeps it simple and social — the photo IS the proof | — Pending |
| Per-person custom goals | Different fitness levels, same accountability mechanic | — Pending |
| Points economy over text-only stakes | Enables a reward menu and quantifiable tracking | — Pending |
| Group-curated rewards | Groups own their stakes — more personal and flexible | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-12 after initialization*
