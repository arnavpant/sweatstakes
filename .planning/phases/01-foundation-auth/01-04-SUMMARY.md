---
phase: 01-foundation-auth
plan: 04
subsystem: deployment
tags: [vercel, oauth, deployment]

# Dependency graph
requires:
  - phase: 01-foundation-auth/01-03
    provides: Complete app shell with auth, dashboard, bottom nav, PWA manifest

provides:
  - Live production deployment at https://sweatstakes.vercel.app
  - Google OAuth working end-to-end on deployed URL
  - Session persistence on deployed URL
  - iPhone-verified PWA experience
---

# Phase 01 Plan 04: Vercel Deployment Summary

**App deployed to production at https://sweatstakes.vercel.app with working Google OAuth, verified on iPhone**

## Status: COMPLETE

Task 1 (auto): Deployed to Vercel, set environment variables for production.
Task 2 (human-verify checkpoint): User verified full OAuth flow works on iPhone — login, dashboard, navigation, sign-out, session persistence all confirmed.

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-13
- **Completed:** 2026-04-13
- **Tasks completed:** 2 of 2

## Accomplishments

- Vercel CLI authenticated and project created as "sweatstakes"
- Production environment variables set: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- Production deployment at https://sweatstakes.vercel.app (Next.js 16.2.3 + Turbopack)
- Supabase Auth redirect URI configured for production callback
- .env.local.example created with deployment documentation notes
- Full OAuth flow verified on iPhone Safari — login, dashboard greeting, bottom nav, sign-out, session persistence

## Task Commits

1. **Task 1: Deploy to Vercel and set environment variables** - `ca7bab1` (feat)
2. **Task 2: Verify OAuth works on deployed Vercel URL** - APPROVED (checkpoint:human-verify, user-verified on iPhone 2026-04-13)

## Files Created/Modified

- `.env.local.example` — Environment variable template with deployment notes

## Decisions Made

- Used Vercel Hobby tier with default sweatstakes.vercel.app URL (per D-22)
- Production env vars only (preview env vars skipped due to CLI plugin limitations — not needed for v1)

## Deviations from Plan

None — deployed and verified as planned.

## Issues Encountered

- Vercel CLI `--name` flag deprecated but still functional
- Preview environment variable setup blocked by Vercel CLI plugin requiring git branch — skipped since production is the only target that matters for v1

## Known Stubs

None.

## Next Phase Readiness

- Phase 1 (Foundation & Auth) is fully complete
- All 4 ROADMAP success criteria verified:
  1. User can open the app on a phone browser and see the Login screen
  2. User can tap "Sign in with Google" and complete OAuth
  3. User lands on the dashboard after a successful sign-in
  4. User is still logged in after refreshing the browser tab

---
*Phase: 01-foundation-auth*
*Completed: 2026-04-13*
