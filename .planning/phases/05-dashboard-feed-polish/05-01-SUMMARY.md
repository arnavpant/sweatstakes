---
phase: 05-dashboard-feed-polish
plan: 01
subsystem: infra
tags: [web-push, service-worker, vapid, supabase-storage, drizzle, rls, pwa]

requires:
  - phase: 01-foundation-auth
    provides: Supabase auth wiring + challengeMembers table (extended here)
  - phase: 03-check-ins-goals
    provides: check-in-photos bucket RLS pattern (templated for avatars bucket)
  - phase: 04-points-stakes
    provides: Phase-4 migration runner pattern (scripts/push-0002-phase04-fixes.mjs)
provides:
  - push_subscriptions table (unique endpoint, user_id index)
  - challenge_members.reminder_hour (smallint, nullable) + notifications_enabled (boolean, default false)
  - Supabase Storage avatars bucket (public-read + folder-scoped RLS write)
  - sendPushToUsers helper with 410/404 cleanup semantics
  - urlBase64ToUint8Array + detectPushEnvironment client utilities
  - createAdminClient (service-role Supabase wrapper, server-only)
  - public/sw.js service worker with push + notificationclick handlers
  - web-push + react-simple-pull-to-refresh installed
affects: [05-02, 05-03, 05-04, notifications, avatars, profile-editor, feed, dashboard]

tech-stack:
  added: [web-push@3.6.7, react-simple-pull-to-refresh@1.3.4, @types/web-push]
  patterns:
    - "Server-only push fan-out via Promise.allSettled with 404/410 row cleanup"
    - "Idempotent DDL migrations via sql.unsafe(fileContents) against postgres driver"
    - "Client-safe PWA env detection isolating iOS standalone quirks from support checks"

key-files:
  created:
    - public/sw.js
    - src/lib/push/send.ts
    - src/lib/push/client-util.ts
    - src/lib/supabase/admin.ts
    - drizzle/0003_phase05_foundation.sql
    - scripts/push-0003-phase05-foundation.mjs
    - tests/push-send.test.ts
    - tests/pwa-detection.test.ts
    - tests/stubs/server-only.ts
    - vitest.config.mts
  modified:
    - src/db/schema.ts
    - package.json
    - package-lock.json
    - .env.local.example

key-decisions:
  - "Service worker lives in public/sw.js (registered at /sw.js so scope covers the whole origin), not routed through Next.js — matches Next 16 PWA guidance"
  - "Push fan-out uses Promise.allSettled so one dead subscription never blocks others; 410 Gone + 404 trigger row delete by endpoint"
  - "notifications_enabled defaults to false (explicit opt-in per SETT-02 locked CONTEXT.md decision)"
  - "Migration applied via sql.unsafe(fileContents) rather than drizzle-kit push — STATE.md documents drizzle-kit's incompatibility with Supabase check constraints"
  - "avatars bucket folder convention: <uid>/avatar.* — mirrors check-in-photos RLS from Phase 3"
  - "CONTACT_EMAIL added as required env var so VAPID mailto: stays configurable"

patterns-established:
  - "Server-only modules: any file touching VAPID or service-role keys starts with `import 'server-only'` to block accidental client-bundle inclusion"
  - "PWA detection: detectPushEnvironment returns {isIOS, isStandalone, isSupported} so call sites can render iOS Add-to-Home-Screen copy without duplicating UA sniffing"
  - "tests/stubs/server-only.ts stub lets vitest import server-only modules without the build-time guard firing"

requirements-completed: [SETT-02, SETT-03]

duration: ~1h
completed: 2026-04-14
---

# Phase 05 Plan 01: Foundation Summary

**Push primitives + avatar storage foundation — push_subscriptions table, sendPushToUsers with 410 cleanup, public/sw.js, Supabase avatars bucket with folder-scoped RLS, VAPID + service-role env plumbing — unblocks Plans 02/03/04.**

## Performance

- **Duration:** ~1 hour (orchestrator + 2 executor tasks + checkpoint wait)
- **Completed:** 2026-04-14
- **Tasks:** 3 (Task 1 + Task 2 auto, Task 3 human-verify — approved)
- **Files created:** 10
- **Files modified:** 4

## Accomplishments

- Extended Drizzle schema with `pushSubscriptions` table and two new `challengeMembers` columns
- Shipped one idempotent SQL migration covering schema + avatars bucket + 4 RLS policies, plus a postgres-driver runner
- Installed `web-push` + `react-simple-pull-to-refresh` and wrote the server-only `sendPushToUsers` helper
- Service worker (`public/sw.js`) with push + notificationclick handlers that focus-existing-or-open-new
- Two Vitest suites: 5 push-send tests + 7 PWA-detection tests, all green
- Documented 3 new env vars (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CONTACT_EMAIL`) in `.env.local.example`
- Human checkpoint passed: VAPID keys generated + added to Vercel, migration applied to Supabase, bucket + policies verified in dashboard, `/sw.js` confirmed served

## Task Commits

1. **Task 1: Schema + SQL migration + runner script** — `df11101` (feat)
2. **Task 2: Packages + sw.js + send.ts + client-util + admin + vitest files + env example** — `9382fc6` (feat)
3. **Task 3: Human-verify checkpoint** — no code commit; user replied "approved" after completing 5 verification steps (VAPID gen, migration run, Supabase dashboard spot-check, build smoke, /sw.js served)

**Incidental fix committed alongside:** `9bc4912` — closed two pre-existing TypeScript regressions (`generateInviteLinkAction` fall-through + `goal-stepper` narrowing) that surfaced when running `npm run build` as part of the checkpoint.

## Files Created/Modified

- `src/db/schema.ts` — added `pushSubscriptions` + `reminder_hour` + `notifications_enabled`
- `drizzle/0003_phase05_foundation.sql` — idempotent migration: push_subscriptions, column additions, avatars bucket, 4 RLS policies
- `scripts/push-0003-phase05-foundation.mjs` — postgres-driver runner (mirrors Phase 4 pattern)
- `public/sw.js` — push + notificationclick handlers; focus-existing-or-open fallback
- `src/lib/push/send.ts` — sendPushToUsers fan-out with 410/404 row cleanup (server-only)
- `src/lib/push/client-util.ts` — urlBase64ToUint8Array + detectPushEnvironment
- `src/lib/supabase/admin.ts` — createAdminClient (service-role, server-only)
- `tests/push-send.test.ts` — 5 tests (200 ok, 410 deletes row, 404 deletes row, non-410 swallowed, empty-ids no-op)
- `tests/pwa-detection.test.ts` — 7 tests (iOS safari tab, iOS standalone, Android standalone, desktop Chrome, etc.)
- `tests/stubs/server-only.ts` + `vitest.config.mts` — test-env shim for server-only
- `package.json` — added `db:push-phase5` script, 3 new deps
- `.env.local.example` — documented 3 new env vars

## Decisions Made

See frontmatter `key-decisions`. Highlights:
- Explicit opt-in (`notifications_enabled default false`) wins over implicit-enable for privacy.
- `sql.unsafe(fileContents)` over drizzle-kit push — keeps compatibility with Supabase check constraints.
- Folder-scoped avatar RLS (`auth.uid()::text = (storage.foldername(name))[1]`) — copied from the Phase 3 check-in-photos pattern.

## Deviations from Plan

None for Task 1 or Task 2 (executed as written). During the checkpoint verification, two pre-existing type errors (`connections.ts` fall-through, `goal-stepper.tsx` narrowing widen) blocked `npm run build`. Fixed minimally in commit `9bc4912` and flagged as a cross-phase regression from Phases 2/3 rather than Phase-5-introduced.

## Issues Encountered

- Pre-existing build-time type errors in `src/lib/actions/connections.ts` and `src/components/settings/goal-stepper.tsx` blocked Step 4 of the checkpoint verification. Both were narrow-scope fixes (replace fall-through loop with post-loop return; nullish-coalesce the narrowed `result.error`). Committed as `9bc4912`.

## User Setup Required

Completed during Task 3 checkpoint:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CONTACT_EMAIL` added to `.env.local` and Vercel (Production + Preview + Development)
- `npm run db:push-phase5` executed successfully against Supabase — `push_subscriptions` table, `challenge_members` new columns, `avatars` bucket + 4 RLS policies all verified in dashboard

## Next Phase Readiness

Plan 02 (push wiring + settings UI + cron reminders) can proceed:
- `sendPushToUsers` importable from `@/lib/push/send`
- `urlBase64ToUint8Array` + `detectPushEnvironment` importable from `@/lib/push/client-util`
- `push_subscriptions` ready to accept rows from the subscribe Server Action
- `notifications_enabled` column gates triggers at send time

Plan 04 (profile editor) can proceed:
- `avatars` bucket ready; uploads to `<uid>/avatar.*` allowed for owner, public-read for everyone

---
*Phase: 05-dashboard-feed-polish*
*Completed: 2026-04-14*
