---
phase: 05-dashboard-feed-polish
plan: 02
subsystem: notifications
tags: [web-push, server-actions, settings, cron, pwa, ios]

requires:
  - phase: 05
    plan: 01
    provides: push_subscriptions schema, sendPushToUsers helper, sw.js, client-util, admin client
  - phase: 04
    provides: settle cron route extended with push fan-out
provides:
  - subscribeUserPush / unsubscribeUserPush / setNotificationsEnabled / setReminderHour server actions
  - Settings → Notifications card with iOS PWA detection ("Add to Home Screen" hint vs Enable button)
  - ReminderHourPicker (0–23) bound to challenge_members.reminder_hour
  - Push triggers wired into 4 events: check-in, redemption, weekly settlement, hourly reminder cron
  - /api/cron/reminders endpoint (hourly) — TZ-aware, gated by reminder_hour, notifications_enabled, and "no check-in today"
  - notifications_enabled master switch enforced at every send site
affects: [settings, notifications, push-subscriptions, vercel-cron, dashboard-feed]

tech-stack:
  patterns:
    - "Push fan-out at every mutation site via sendPushToUsers([...others])"
    - "iOS PWA detection: window.matchMedia('(display-mode: standalone)') + navigator.standalone"
    - "Hourly cron + per-member tz/hour eligibility — single endpoint scans all challenges"
    - "VAPID/CRON_SECRET split — public key in NEXT_PUBLIC_, private key + cron secret server-only"

key-files:
  created:
    - src/lib/actions/push.ts
    - src/components/settings/notifications-section.tsx
    - src/components/settings/reminder-hour-picker.tsx
    - src/app/api/cron/reminders/route.ts
    - tests/push-actions.test.ts
    - tests/reminder-cron.test.ts
    - vercel.json
  modified:
    - src/lib/actions/check-ins.ts          # added sendPushToUsers fan-out on success
    - src/lib/actions/points.ts             # added sendPushToUsers fan-out on redemption
    - src/app/api/cron/settle/route.ts      # personalized push per member with point delta
    - src/app/(protected)/settings/page.tsx # mounted NotificationsSection
    - src/lib/actions/auth.ts               # siteUrl helper uses VERCEL_URL fallback (post-fix)
    - src/lib/actions/connections.ts        # siteUrl helper uses VERCEL_URL fallback (post-fix)

verification:
  manual:
    - User confirmed in-session: "notifications work" (2026-04-14)
    - Tested on installed iOS PWA — push received end-to-end after VAPID env vars added in Vercel
  automated:
    - tests/push-actions.test.ts (subscribeUserPush validation + endpoint dedupe)
    - tests/reminder-cron.test.ts (eligibility logic: skip-if-checked-in, skip-if-disabled, skip-on-wrong-hour)

commits:
  - 231718d  test(05-02): add failing tests for push server actions
  - ea32913  feat(05-02): implement push subscription server actions
  - ea0cd27  feat(05-02): add Notifications section to Settings with iOS PWA awareness
  - 37730eb  test(05-02): add failing tests for /api/cron/reminders
  - 402e19b  feat(05-02): wire 4 push triggers + new reminder cron + vercel.json
  - 909c3e9  fix(05): use VERCEL_URL fallback for siteUrl so previews work without per-deploy env

operator-actions-required:
  - VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / NEXT_PUBLIC_VAPID_PUBLIC_KEY env vars must be set in Vercel (one-time, manual — Claude cannot write to Vercel secret store)
  - CRON_SECRET env var must be set in Vercel and matched in the cron requests
  - End user must install the PWA to iOS Home Screen for push to work on iOS Safari (16.4+)
  - vercel.json declares 2 cron entries (settle, reminders) — requires Vercel Pro plan (Hobby allows only 2 cron/day)
---

# Plan 05-02 — Web Push wiring (post-hoc summary)

This SUMMARY was generated retroactively. The plan's 4 tasks were all implemented and committed
during the original execution, but the executor stopped at the user-action checkpoint
(VAPID env vars + iOS PWA install) without writing this file. All code is in `master` and the
feature has been confirmed working by the user.

## What shipped

**Server actions** (`src/lib/actions/push.ts`) — `subscribeUserPush`, `unsubscribeUserPush`,
`setNotificationsEnabled`, `setReminderHour`. Push subscribe upserts into `push_subscriptions`
keyed by endpoint (handles re-subscribe gracefully). All write actions are auth-gated and
write through `createAdminClient` for service-role access where needed.

**Settings UI** (`src/components/settings/notifications-section.tsx` + `reminder-hour-picker.tsx`)
— renders the master toggle, the reminder-hour dropdown, and on iOS Safari (non-standalone)
swaps the Enable button for the "Add to Home Screen" instruction card via
`detectPushEnvironment()` from Plan 01. Uses `urlBase64ToUint8Array` to convert
`NEXT_PUBLIC_VAPID_PUBLIC_KEY` for `pushManager.subscribe`.

**Push trigger fan-out** — `sendPushToUsers` from Plan 01 is invoked at four sites:

| Trigger | File | Audience |
|---|---|---|
| Check-in submit (success) | `src/lib/actions/check-ins.ts` | every other member of the challenge |
| Reward redemption (success) | `src/lib/actions/points.ts` | every other member of the challenge |
| Weekly settlement (cron) | `src/app/api/cron/settle/route.ts` | each member, personalized with their delta |
| Hourly reminder (cron) | `src/app/api/cron/reminders/route.ts` | members whose tz-local hour == reminder_hour AND no check-in today AND notifications_enabled |

Every send site re-reads `notifications_enabled` on the recipient row before pushing, so the
master switch is the single source of truth — toggling off immediately silences all 4 triggers.

**Cron** (`vercel.json`) — declares `/api/cron/settle` (existing) and the new `/api/cron/reminders`
(hourly: `0 * * * *`). The hourly cadence is required because reminder-hour is per-user and
must respect each challenge's timezone — Hobby tier's 2-cron/day limit is incompatible, so the
project requires Vercel Pro (already noted in STATE.md Phase 04 Pending Todos).

**Tests** — `tests/push-actions.test.ts` covers subscribeUserPush input validation + endpoint
dedupe (re-subscribe on same endpoint no-ops). `tests/reminder-cron.test.ts` covers the
eligibility logic in isolation (skip-if-checked-in, skip-if-disabled, skip-if-wrong-hour).

## Known follow-ups

- Operator must keep VAPID keys + CRON_SECRET in sync between local `.env.local` and Vercel envs
  on every redeploy. No automated drift detection.
- The `reminder_hour` matching rounds to whole hours in challenge tz. Sub-hour granularity
  was explicitly out of scope per 05-CONTEXT.md.
- iOS push only works inside the installed PWA — Safari tab will permanently show the install
  hint. This is a platform constraint, not a bug.
