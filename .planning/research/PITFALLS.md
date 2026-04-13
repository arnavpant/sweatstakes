# Domain Pitfalls: SweatStakes

**Domain:** Fitness accountability web app with group challenges and points-based stakes
**Researched:** 2026-04-12
**Confidence:** HIGH (camera/auth pitfalls from official docs; economy/retention from peer-reviewed research + game design literature)

---

## Critical Pitfalls

Mistakes that cause rewrites, broken trust between users, or app abandonment.

---

### Pitfall 1: Broken Camera on iOS PWA (Home Screen Mode)

**What goes wrong:** When a user adds the app to their iOS home screen and launches it in standalone/PWA mode, the browser camera (`getUserMedia`) silently fails or refuses permission. Tapping "Check In" does nothing.

**Why it happens:** WebKit on iOS enforces a stricter camera permission model for home-screen web apps than for in-browser Safari. There are documented bugs (iOS 16–17) where permission is granted once but re-prompted on every session, or where the camera API is completely blocked in standalone mode.

**Consequences:** The core mechanic of the entire app (photo check-in as proof) is broken for users who install to home screen — exactly the users most engaged with the app.

**Prevention:**
- Test camera access in three distinct modes from day one: in-browser Safari, in-browser Chrome/Firefox, and home-screen standalone (add to home screen and test as a separate session)
- Use `<input type="file" accept="image/*" capture="environment">` as a fallback alongside `getUserMedia` — it bypasses WebKit's PWA camera restriction by delegating to the OS camera picker
- Do not rely solely on `getUserMedia` for the check-in flow; the file input capture fallback must be first-class, not bolted on
- Verify camera permissions using the Permissions API and show a clear "allow camera" UI state rather than a silent failure

**Warning signs:**
- Camera works in desktop testing but "nothing happens" reports from iOS users
- Users reporting the app worked once then stopped asking for camera permission

**Phase to address:** Phase 1 / Foundation — camera access must be verified working on iOS before building the check-in UX on top of it

---

### Pitfall 2: Apple Sign-In Secret Key Expiry Breaking Auth in Production

**What goes wrong:** Apple's Sign In with Apple OAuth requires a JWT client secret generated from a `.p8` signing key. This secret has a maximum validity of 6 months. When it expires, every Apple-authenticated user is silently locked out. No error is thrown at build time or deploy time.

**Why it happens:** Unlike Google OAuth which uses a static client secret, Apple's flow mandates a short-lived JWT. Developers set it up once, it works, and the expiry is forgotten. Six months later, `invalid_client` errors appear in production.

**Consequences:** All users who signed up with Apple (a significant share on iOS) lose access permanently until the secret is rotated. There is no graceful degradation — the OAuth flow simply fails.

**Prevention:**
- Add an automated alert (cron job or monitoring) at 30 days before expiry to trigger secret rotation
- Document the rotation procedure in the repo README at the time of initial setup, not retroactively
- If using Supabase Auth, verify that Supabase's Apple provider handles the JWT generation and whether it requires manual rotation or automates it

**Additional Apple gotcha:**
- Apple only provides the user's full name on the very first sign-in. All subsequent sign-ins return `null` for name fields. Capture and persist the name immediately during the first OAuth callback, never rely on fetching it later.
- Users can choose a private relay email (`@privaterelay.appleid.com`). Your system must accept and store these without attempting to validate or normalize them.

**Warning signs:**
- Apple login suddenly returning `invalid_client` across all users simultaneously
- No failed logins during development (secret is fresh) but failures appear months after launch

**Phase to address:** Phase 1 / Auth — implement rotation alerting at the same time as initial Apple OAuth setup

---

### Pitfall 3: Photo Check-In Has No Deterrent Against Reuse or Screenshots

**What goes wrong:** A user uploads a photo they took three days ago, or screenshots someone else's check-in from the feed, and logs it as today's workout. The social contract breaks silently — other group members don't know, but once discovered, trust in the entire system collapses.

**Why it happens:** Browser-uploaded images have no enforced recency. EXIF metadata is easily stripped by iOS before upload. There is no liveness check in a standard file input flow.

**Consequences:** The entire value proposition of "photo as proof" becomes performative. Friends catch on, engagement collapses, and the group disbands.

**Prevention:**
- Display the upload timestamp prominently on each check-in post in the feed ("Taken just now" vs a specific timestamp), making reuse socially visible even if not technically blocked
- Record server-side upload time as a separate field from any EXIF date; display it as the canonical check-in time
- Add a short-lived upload token: generate a one-time token when the camera UI opens, require it to be submitted with the photo, and expire it in under 10 minutes — this blocks uploading pre-taken photos through the API
- For v1 with friends, lean into social deterrence (visible timestamps + group trust) rather than technical enforcement. Save liveness detection for a post-launch feature if abuse patterns emerge.

**Warning signs:**
- Check-in photos appearing inconsistently (studio lighting, different locations than usual, suspiciously polished)
- Members raising disputes about check-in legitimacy in the group

**Phase to address:** Phase 2 / Check-in mechanic — bake server-side upload token into the check-in API design from the start; retroactively adding it breaks existing upload flows

---

### Pitfall 4: Points Economy Debt Spiral for Persistent Losers

**What goes wrong:** A user misses their goal repeatedly. They accumulate a large negative balance. The ledger shows them far behind every other member. At this point, the psychological effect reverses — the gap feels unrecoverable, and they disengage entirely rather than trying to climb back.

**Why it happens:** Unbounded point debt with no floor creates a runaway downward spiral. Game economy research (Stankovic, Unity) consistently identifies this as a primary cause of player churn in competitive systems. The punishment accumulates faster than the recovery pace.

**Consequences:** The weakest performers — who need accountability most — are the first to quit. The group then loses membership, which can trigger a cascade (see Pitfall 7).

**Prevention:**
- Implement a weekly point floor: a user cannot owe more than N points in a single week regardless of group size (e.g., cap weekly loss at the equivalent of one stake menu item)
- Design the ledger UI to show the current week's net change prominently, not only the all-time balance — this frames the deficit as recoverable
- Consider a "comeback" visual element (week-over-week trend arrow) so a user who misses but is improving sees positive reinforcement
- The "if everyone misses, it's a wash" rule already prevents the catastrophic all-lose scenario — keep it and make it visible to users as a fairness feature, not a footnote

**Warning signs:**
- Users with large negative balances stop logging check-ins without leaving the group
- Group activity drops correlated with one member's extended streak of misses

**Phase to address:** Phase 2 / Points engine design — establish debt caps in the calculation logic before the first week's settlement runs

---

## Moderate Pitfalls

---

### Pitfall 5: Weekly Reset Timezone Bugs Breaking Streaks and Settlements

**What goes wrong:** The weekly goal resets at midnight Sunday — but midnight for whom? A user in PST and another in EST are in the same group. If the server runs UTC resets, a user on the US West Coast may have their week cut short by 8 hours, losing a streak unfairly. Worse, a check-in submitted at 11:58 PM local time may be recorded as Monday.

**Why it happens:** Storing and calculating dates without a per-user timezone context is the default if not explicitly designed. This is a documented class of bugs ("falsehoods programmers believe about time") that is trivially easy to avoid but painful to fix retroactively.

**Consequences:** Streaks broken incorrectly destroy trust in the system. Disputed settlements ("I checked in on Sunday!") create social friction within groups.

**Prevention:**
- Store user timezone at signup (detect from browser, allow override in Settings)
- All streak calculations and weekly window boundaries must be computed in user-local time, not server UTC
- The weekly settlement job should run per-group, based on the group creator's timezone as the canonical reference, with user check-ins evaluated in each user's local time
- Add a 15-minute grace window around midnight to absorb minor clock drift and submission latency
- Store all timestamps as UTC in the database; convert to local time only at display and calculation layers

**Warning signs:**
- Users reporting "I checked in but it didn't count"
- Streak counts resetting unexpectedly around daylight saving time transitions

**Phase to address:** Phase 2 / Data model — define timezone columns and calculation strategy before writing any streak/settlement logic

---

### Pitfall 6: Activity Feed Performance Degrading with Supabase Realtime at Scale

**What goes wrong:** Using Supabase Realtime Postgres Changes to push feed updates works fine for 2–3 users in a group during development. As group count and concurrent users grow, the single-threaded change authorization model creates a database bottleneck: every row change triggers an RLS check per connected subscriber. With 50 groups of 6 each and everyone online simultaneously, a single check-in insert triggers 5 authorization reads.

**Why it happens:** Supabase's own documentation acknowledges that Postgres Changes "do not scale as well as Broadcast" and that "compute upgrades don't have a large effect" due to single-thread processing.

**Consequences:** Feed updates become delayed or dropped under load. Users refresh the page to see check-ins, reducing the live social experience to a polling UX.

**Prevention:**
- For v1 (small group of friends), Postgres Changes with RLS is fine — do not over-engineer
- Design the feed data model so that a future migration to Broadcast is possible: keep feed events in a dedicated table separate from check-ins, with a simple public structure
- If realtime latency becomes noticeable, switch to a polling fallback first (30-second refresh) before committing to an architectural change
- Defer realtime for reactions (Hype/Nudge) specifically — these are low-stakes and can be eventually consistent

**Warning signs:**
- Feed showing stale data; users seeing their own check-ins appear after a 5–10 second delay
- Supabase dashboard showing high Realtime connection counts relative to the Pro tier limits

**Phase to address:** Phase 3 / Feed — note the scaling ceiling in code comments; revisit before any public launch

---

### Pitfall 7: Group Death Spiral When One Member Goes Inactive

**What goes wrong:** In a 2–4 person group (the most common early-adopter case), one member stops logging for two weeks. The ledger becomes lopsided, the feed goes quiet, and remaining members lose motivation because there is no one to hold accountable and no social activity to react to.

**Why it happens:** Small-group accountability apps have a single point of failure per member. Research from Stanford's Behavior Design Lab finds that groups below 5 have the highest individual pressure, making any single absence disproportionately impactful. Unlike a large community app where one dropout is invisible, here it is felt immediately.

**Consequences:** The remaining member(s) stop logging too. The group becomes a ghost town. The app is uninstalled.

**Prevention:**
- The "Nudge" reaction mechanic is a direct countermeasure — make it prominent in the feed and on the dashboard for inactive members; it gives active members a constructive action rather than passive disappointment
- Weekly push notification for the group: "X hasn't checked in yet — send a nudge?" gives a re-engagement hook before the user fully disengages
- Design group invite links to be re-shareable at any time from Settings, reducing the friction of adding a replacement member
- Do not auto-dissolve a group on inactivity; allow the data (history, ledger) to persist so that when a member returns, continuity is preserved

**Warning signs:**
- One member's last check-in timestamp exceeding 10+ days in a group with an active weekly goal
- Feed showing only one member's posts for multiple consecutive weeks

**Phase to address:** Phase 3 / Social mechanics — notification triggers for inactivity should be designed alongside the push notification system

---

### Pitfall 8: Image Upload Causing Slow UX on Mobile Networks

**What goes wrong:** Mobile cameras produce images of 8–25 MB. Without client-side compression, the check-in upload takes 15–60 seconds on a 4G connection. The user waits on a spinner, assumes it failed, taps again, and submits a duplicate. Or they give up and don't check in at all.

**Why it happens:** The gap between native camera output size and acceptable web upload payload is enormous. Most developers test on WiFi in development and never notice.

**Consequences:** High upload abandonment rates. Duplicate check-in submissions. Feed images slow to load for all group members.

**Prevention:**
- Compress images client-side before upload using `canvas.toBlob()` or a library like `browser-image-compression`; target 300–600 KB for feed display quality
- Show a meaningful progress indicator during upload, not just a spinner ("Compressing..." then "Uploading...")
- Use a CDN-backed storage service (Supabase Storage with a CDN, or Cloudinary) for serving feed images; never serve raw storage URLs directly in the feed
- Store a thumbnail variant (150px wide) alongside the full image for feed list views — load the thumbnail first, full image on tap

**Warning signs:**
- Upload times exceeding 10 seconds in local testing with a real phone camera photo (not a screenshot)
- Storage costs growing faster than user count

**Phase to address:** Phase 2 / Check-in mechanic — client-side compression must be in the first working upload implementation

---

## Minor Pitfalls

---

### Pitfall 9: Onboarding Asking for Too Much Before Showing Value

**What goes wrong:** New users are asked to: create an account, verify email, set a weekly goal, add friends, and configure a rewards menu — all before they see any meaningful content. They drop off during setup.

**Why it happens:** The full feature set requires configuration, but each configuration step adds friction before the user has experienced the core value.

**Prevention:**
- Use a phased onboarding: create account → land on a "create your first sanctuary" screen with one prompt (invite link or goal) → defer rewards menu, streak settings, and notifications to Settings
- Show the dashboard immediately after account creation, even if empty, with clear CTAs ("Invite your first friend")
- Notifications opt-in should be deferred until after the first successful check-in, not during signup

**Phase to address:** Phase 4 / Polish

---

### Pitfall 10: Inviting Users by Link Without Expiry or Access Control

**What goes wrong:** An invite link shared in a group chat is later forwarded by someone unintended. A stranger joins the group and can see all members' photos and progress.

**Why it happens:** The fastest invite implementation is a static group ID in the URL. This never expires and has no access control.

**Prevention:**
- Invite links should be time-limited (e.g., 7 days) or single-use, generated server-side with a short token
- Group members should be able to see who joined via an invite link
- Add a group membership cap (e.g., 20) to prevent accidental public exposure if a link escapes

**Phase to address:** Phase 1 / Group creation — design the invite token schema before building the invite flow

---

### Pitfall 11: Streak Logic Inconsistency Between "Days" and "Weeks"

**What goes wrong:** The app tracks both a daily streak (consecutive days checked in) and a weekly streak (consecutive weeks hitting goal). These are different mechanics. A user who hits 3 of 4 goal days in a week hits their weekly goal, but has a daily streak of 0 if they missed day 4. Conflating these in the UI — or in the database — causes confusing numbers and disputes.

**Why it happens:** The two mechanics are conceptually separate but share terminology. Rushed implementation merges them into one `streak` counter.

**Prevention:**
- Define and store two separate streak fields: `current_daily_streak` and `current_weekly_streak`
- Display them on separate UI elements with different labels; never show a single "streak" number without qualification
- Document the calculation rule for each in code comments at implementation time

**Phase to address:** Phase 2 / Data model and streak calculation

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Camera integration (Phase 1) | iOS PWA camera silently blocked in home screen mode | Use file input `capture` fallback from day one |
| Apple OAuth setup (Phase 1) | JWT secret expires in 6 months with no warning | Schedule rotation alert at setup time |
| Group invite flow (Phase 1) | Static invite link has no expiry or access control | Generate short-lived tokens server-side |
| Points engine (Phase 2) | Uncapped debt spiral disengages losing members | Define weekly loss floor before first settlement |
| Check-in upload (Phase 2) | 25 MB mobile photos stall on 4G, users abandon | Client-side compression in first upload implementation |
| Streak/settlement logic (Phase 2) | UTC resets break per-user local time windows | Store user timezone at signup; compute in local time |
| Photo proof integrity (Phase 2) | Reused/screenshot photos undermine social contract | Server-side upload token expiring in 10 minutes |
| Activity feed (Phase 3) | Supabase Realtime bottleneck at scale | Design for Broadcast migration; poll first if slow |
| Inactivity handling (Phase 3) | One member going quiet kills small group | Nudge notifications triggered by inactivity threshold |
| Public launch prep (future) | Private invite link leaking to strangers | Audit link expiry and group membership controls |

---

## Sources

- iOS PWA camera issues: [Camera Access Issues in iOS PWA — STRICH Knowledge Base](https://kb.strich.io/article/29-camera-access-issues-in-ios-pwa), [Navigating Safari/iOS PWA Limitations — Vinova](https://vinova.sg/2025/04/28/navigating-safari-ios-pwa-limitations/)
- Apple Sign In requirements and pitfalls: [Sign In with Apple — WorkOS](https://workos.com/blog/apple-app-store-authentication-sign-in-with-apple-2025), [Supabase Apple Auth docs](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- Points economy and debt spirals: [5 Common Mobile Game Economy Problems — Adrian Crook](https://adriancrook.com/5-common-mobile-game-economy-problems-solved/), [Game Economy Design — Unity](https://unity.com/how-to/design-balanced-in-game-economy-guide-part-3)
- Gamification in fitness apps: [Gamification Use in Health & Fitness Apps — PMC/PubMed](https://pmc.ncbi.nlm.nih.gov/articles/PMC6348030/), [Top 10 Gamification in Fitness — Yu-kai Chou](https://yukaichou.com/gamification-analysis/top-10-gamification-in-fitness/)
- Photo proof / social contract: [BeReal authenticity research — arXiv](https://arxiv.org/html/2408.02883v1), [ProveIt AI-verified accountability](https://useproveit.com/)
- Streak timezone handling: [How to Build a Streaks Feature — Trophy](https://trophy.so/blog/how-to-build-a-streaks-feature), [Falsehoods about time — GitHub Gist](https://gist.github.com/timvisee/fcda9bbdff88d45cc9061606b4b923ca)
- Supabase Realtime scale limits: [Supabase Realtime Limits](https://supabase.com/docs/guides/realtime/limits), [Postgres Changes docs](https://supabase.com/docs/guides/realtime/postgres-changes)
- Small group churn dynamics: [Small Group Accountability Apps Guide 2025 — Cohorty](https://www.cohorty.app/blog/small-group-accountability-apps-complete-guide-for-2025)
- Image upload performance: [Image Upload Best Practices — Catchpoint](https://www.catchpoint.com/blog/image-upload-best-practices), [Image Performance — web.dev](https://web.dev/learn/performance/image-performance)
- Fitness app retention research: [Retention Metrics for Fitness Apps — Lucid](https://www.lucid.now/blog/retention-metrics-for-fitness-apps-industry-insights/), [Why Fitness Apps Lose Users — Imaginovation](https://imaginovation.net/blog/why-fitness-apps-lose-users-ai-ar-gamification-fix/)
- Activity feed scaling: [Scalable Activity Feed Architecture — GetStream](https://getstream.io/blog/scalable-activity-feed-architecture/)
