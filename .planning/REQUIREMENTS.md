# Requirements: SweatStakes

**Defined:** 2026-04-12
**Core Value:** Friends actually stick to their workout routines because there's something real on the line — social accountability with tangible stakes.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can sign up and log in with Google sign-in (one-tap OAuth)
- [ ] **AUTH-02**: User session persists across browser refresh

### Connections

- [ ] **CONN-01**: User can invite others via a secure shareable link
- [ ] **CONN-02**: Recipient taps invite link and joins the shared group
- [ ] **CONN-03**: All connected users are in one shared challenge together

### Check-ins

- [x] **CHKN-01**: User can take a photo to log a workout (browser camera API)
- [x] **CHKN-02**: Photo is uploaded and visible in the activity feed
- [x] **CHKN-03**: User sets their personal weekly goal (1-7 days per week)
- [x] **CHKN-04**: Weekly progress tracker shows days completed vs goal
- [x] **CHKN-05**: Streak counter tracks consecutive weeks of hitting goal

### Points & Stakes

- [ ] **STAK-01**: User earns points when they hit their weekly goal
- [ ] **STAK-02**: User owes points to everyone who hit their goal when they miss theirs
- [ ] **STAK-03**: If everyone misses, nobody owes (wash rule)
- [ ] **STAK-04**: The Ledger shows running point balance per member
- [ ] **STAK-05**: Group members can add items to a rewards menu with point costs
- [ ] **STAK-06**: Members can redeem points for items on the rewards menu

### Feed

- [ ] **FEED-01**: Activity feed shows check-in photos from all connections
- [ ] **FEED-02**: Feed entries show who posted, when, and the photo

### Dashboard

- [ ] **DASH-01**: Dashboard shows the active bet/stakes description
- [ ] **DASH-02**: Dashboard shows your weekly progress vs others' progress
- [ ] **DASH-03**: Dashboard shows a workout photo gallery (recent check-ins)

### Settings

- [ ] **SETT-01**: User can change their weekly goal
- [ ] **SETT-02**: User can toggle notifications on/off
- [ ] **SETT-03**: User can set their profile name and picture

### Design

- [ ] **DSGN-01**: All screens follow the Stitch Royale design (dark navy + emerald, Plus Jakarta Sans, Material icons)
- [ ] **DSGN-02**: Mobile-first responsive layout with bottom navigation
- [ ] **DSGN-03**: 5 working screens: Login, Dashboard, Streaks & Balance, Feed, Settings

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication

- **AUTH-03**: Apple sign-in OAuth
- **AUTH-04**: Email + password signup as alternative
- **AUTH-05**: Password reset via email

### Social

- **SOCL-01**: Hype reaction button on feed posts
- **SOCL-02**: Nudge button to poke inactive members
- **SOCL-03**: Journal/text notes attached to check-in photos

### Notifications

- **NOTF-01**: Push notifications for check-in reminders
- **NOTF-02**: Notification when someone in your group checks in
- **NOTF-03**: Weekly settlement summary notification

### History

- **HIST-01**: Full history of settled stakes and redemptions
- **HIST-02**: Historical streak records and personal bests

## Out of Scope

| Feature | Reason |
|---------|--------|
| Fitness tracker / wearable sync | Photo check-in is the mechanic — no Apple Health or Google Fit |
| Real payment processing | Stakes are honor-system, tracked in-app only |
| Native mobile app | Mobile web app — no app store friction |
| Workout details (type, duration, reps) | Photo is the only proof needed |
| Public feed or user discovery | Private connections only — no global social features |
| In-app group chat | Users already have iMessage/WhatsApp — no need to compete |
| Global leaderboard | Group-relative accountability outperforms global rankings for retention |
| Named groups / "sanctuaries" | Flat connection model — no group naming or management |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| CONN-01 | Phase 2 | Pending |
| CONN-02 | Phase 2 | Pending |
| CONN-03 | Phase 2 | Pending |
| CHKN-01 | Phase 3 | Complete |
| CHKN-02 | Phase 3 | Complete |
| CHKN-03 | Phase 3 | Complete |
| CHKN-04 | Phase 3 | Complete |
| CHKN-05 | Phase 3 | Complete |
| STAK-01 | Phase 4 | Pending |
| STAK-02 | Phase 4 | Pending |
| STAK-03 | Phase 4 | Pending |
| STAK-04 | Phase 4 | Pending |
| STAK-05 | Phase 4 | Pending |
| STAK-06 | Phase 4 | Pending |
| FEED-01 | Phase 5 | Pending |
| FEED-02 | Phase 5 | Pending |
| DASH-01 | Phase 5 | Pending |
| DASH-02 | Phase 5 | Pending |
| DASH-03 | Phase 5 | Pending |
| SETT-01 | Phase 5 | Pending |
| SETT-02 | Phase 5 | Pending |
| SETT-03 | Phase 5 | Pending |
| DSGN-01 | Phase 5 | Pending |
| DSGN-02 | Phase 5 | Pending |
| DSGN-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-04-12*
*Last updated: 2026-04-12 after roadmap creation*
