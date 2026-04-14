# Roadmap: SweatStakes

## Overview

SweatStakes ships in five phases that build on each other without dead ends. Phase 1 gets the project running and users logged in. Phase 2 connects them to each other. Phase 3 delivers the core workout loop — photo check-ins, personal goals, and streaks. Phase 4 implements the points economy that turns accountability into real stakes. Phase 5 assembles all five designed screens into a polished, shippable product.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Auth** - Project scaffold, hosting, and Google OAuth login
- [ ] **Phase 2: Connections** - Invite links and shared group membership
- [ ] **Phase 3: Check-ins & Goals** - Photo workout logging, personal weekly goals, progress tracking, and streak counting
- [ ] **Phase 4: Points & Stakes** - Points economy, the ledger, rewards menu, and point redemption
- [ ] **Phase 5: Dashboard, Feed & Polish** - All five Stitch-designed screens functional with Royale theme

## Phase Details

### Phase 1: Foundation & Auth
**Goal**: The app is deployed and users can sign in with Google
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02
**Success Criteria** (what must be TRUE):
  1. User can open the app on a phone browser and see the Login screen
  2. User can tap "Sign in with Google" and complete OAuth in the same browser tab
  3. User lands on the dashboard after a successful sign-in
  4. User is still logged in after refreshing the browser tab
**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Next.js 16 with Tailwind v4 Royale design system, shadcn/ui, and test infrastructure
- [x] 01-02-PLAN.md — Supabase Auth with Google OAuth, proxy.ts session management, and Login screen UI
- [x] 01-03-PLAN.md — Dashboard shell, bottom navigation, placeholder pages, settings sign-out, PWA manifest, and icon inventory
- [x] 01-04-PLAN.md — Deploy to Vercel and configure OAuth redirect URIs for production URL

### Phase 2: Connections
**Goal**: Users can bring their friends into a shared challenge via a link
**Depends on**: Phase 1
**Requirements**: CONN-01, CONN-02, CONN-03
**Success Criteria** (what must be TRUE):
  1. A logged-in user can generate a shareable invite link
  2. A new user who taps the invite link is prompted to sign in and then joins the group
  3. After joining, both users can see each other as members of the same challenge
**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md — Drizzle ORM client, database schema (challenges, members, invites), and schema push to Supabase
- [x] 02-02-PLAN.md — Server Actions (generate, join, leave), public /join/[code] route, and auth next-param threading
- [x] 02-03-PLAN.md — Settings invite UI, dashboard member avatar row, share/leave components, and end-to-end verification

### Phase 3: Check-ins & Goals
**Goal**: Users can log workouts via photo and track their weekly progress toward personal goals
**Depends on**: Phase 2
**Requirements**: CHKN-01, CHKN-02, CHKN-03, CHKN-04, CHKN-05
**Success Criteria** (what must be TRUE):
  1. User can tap a button, grant camera permission, take a photo, and submit it as a workout check-in
  2. The submitted photo appears in the activity feed
  3. User can set their personal weekly workout goal (1-7 days per week)
  4. A progress tracker shows how many days the user has checked in vs their weekly goal
  5. A streak counter correctly increments each week the user hits their goal and resets on a missed week
**Plans:** 4 plans
**UI hint**: yes

Plans:
- [x] 03-01-PLAN.md — Drizzle schema (checkIns table, weeklyGoal column), Server Actions (submit, updateGoal), week utilities, and test scaffolding
- [x] 03-02-PLAN.md — BeReal-style dual-camera check-in flow with compression and Supabase Storage upload
- [x] 03-03-PLAN.md — Goal stepper on Settings, day dots progress tracker, and streak counter on Dashboard
- [x] 03-04-PLAN.md — Bottom nav center FAB, database schema push, and end-to-end verification

### Phase 4: Points & Stakes
**Goal**: Points flow correctly — users earn when they hit goals, owe when they miss, and can redeem against a group rewards menu
**Depends on**: Phase 3
**Requirements**: STAK-01, STAK-02, STAK-03, STAK-04, STAK-05, STAK-06
**Success Criteria** (what must be TRUE):
  1. User who hits their weekly goal earns points at week-end settlement
  2. User who misses their goal sees a negative ledger adjustment equal to points owed to each member who hit their goal
  3. When all members miss, no points change hands and the ledger is unchanged
  4. The Ledger screen shows each member's current running point balance
  5. Any member can add a reward item with a name and point cost to the group rewards menu
  6. A member with sufficient points can redeem a reward; their balance decreases by the item cost
**Plans:** 4 plans
**UI hint**: yes

Plans:
- [x] 04-01-PLAN.md — Drizzle schema (points tables, rewards, redemptions), pure settlement algorithm, and test scaffold
- [x] 04-02-PLAN.md — Vercel Cron settlement endpoint, rewards/redemption Server Actions, and Settings timezone pickers
- [x] 04-03-PLAN.md — Streaks & Balance page UI (streak section, member leaderboard, rewards menu with bottom sheet and dialog)
- [x] 04-04-PLAN.md — Database schema push to Supabase and end-to-end human verification

### Phase 5: Dashboard, Feed & Polish
**Goal**: All five Stitch-designed screens are fully functional and visually match the Royale design system
**Depends on**: Phase 4
**Requirements**: FEED-01, FEED-02, DASH-01, DASH-02, DASH-03, SETT-01, SETT-02, SETT-03, DSGN-01, DSGN-02, DSGN-03
**Success Criteria** (what must be TRUE):
  1. The Dashboard screen shows the active stakes description, each member's weekly progress side-by-side, and a gallery of recent check-in photos
  2. The Feed screen shows a reverse-chronological list of check-in photos from all group members, with poster name and timestamp on each entry
  3. The Settings screen lets the user change their weekly goal, toggle notifications, and update their profile name and photo
  4. All five screens — Login, Dashboard, Streaks & Balance, Feed, Settings — are reachable via the floating bottom navigation
  5. Every screen renders in dark navy and emerald green using Plus Jakarta Sans and Material icons on a phone-sized browser viewport
**Plans:** 4 plans

Plans:
- [x] 05-01-PLAN.md — Foundation: push_subscriptions table, reminder_hour + notifications_enabled columns, avatars bucket + RLS, VAPID keys, web-push install, service worker, sendPushToUsers helper
- [ ] 05-02-PLAN.md — Web Push end-to-end: subscribe flow, Settings notifications section with iOS install detection, 4 triggers (check-in, redemption, settlement, daily reminder cron), notifications_enabled master switch
- [ ] 05-03-PLAN.md — Dashboard + Feed UI: leader callout, horizontal member progress cards, photo gallery grid, BeReal-style Feed with pull-to-refresh, Intl.RelativeTimeFormat timestamps
- [ ] 05-04-PLAN.md — Profile editor: display name (challenge_members + auth.users.user_metadata), avatar upload to avatars bucket with cache-busting, Google photo fallback
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Auth | 4/4 | Complete | - |
| 2. Connections | 0/3 | Planning complete | - |
| 3. Check-ins & Goals | 0/4 | Planning complete | - |
| 4. Points & Stakes | 0/4 | Planning complete | - |
| 5. Dashboard, Feed & Polish | 0/4 | Planning complete | - |
