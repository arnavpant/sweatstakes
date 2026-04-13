---
phase: 01-foundation-auth
plan: 03
subsystem: ui
tags: [nextjs, supabase, tailwind, pwa, vitest]

# Dependency graph
requires:
  - phase: 01-foundation-auth/01-02
    provides: Supabase auth actions (signInWithGoogleAction, signOutAction), server/client Supabase factories, proxy.ts route protection, login page with GoogleSignInButton

provides:
  - Protected app shell with 4 authenticated routes (dashboard, streaks, feed, settings)
  - Floating pill bottom navigation (BottomNav client component)
  - Dashboard with personalized Google greeting and avatar
  - SignOutButton client component with loading state
  - PWA manifest in standalone mode
  - Icon inventory for Nano Banana asset tracking

affects: [all future phases — establishes app shell pattern for authenticated pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Protected layout defense-in-depth: proxy.ts handles primary redirect, (protected)/layout.tsx calls getUser() as fallback"
    - "Client component loading pattern: useState(false) + aria-busy + disabled:opacity-60 (established in GoogleSignInButton, reused in SignOutButton)"
    - "Placeholder page pattern: Construction icon + heading + 'coming in a future update' copy on surface-container card"
    - "Bottom nav active state: gradient pill + filled icon via fontVariationSettings FILL 1 + emerald glow shadow"

key-files:
  created:
    - src/app/(protected)/layout.tsx
    - src/app/(protected)/dashboard/page.tsx
    - src/app/(protected)/streaks/page.tsx
    - src/app/(protected)/feed/page.tsx
    - src/app/(protected)/settings/page.tsx
    - src/components/auth/sign-out-button.tsx
    - src/components/layout/bottom-nav.tsx
    - src/app/manifest.ts
    - public/icon-192.png
    - public/icon-512.png
    - src/docs/icon-inventory.md
    - tests/auth.test.ts
  modified: []

key-decisions:
  - "ICON-13 placeholder icons are 1x1 navy pixel PNGs — valid for manifest without 404, tracked for Nano Banana replacement"
  - "test regex for getSession() excludes comment lines — proxy.ts contains a comment explaining what NOT to use"

patterns-established:
  - "Protected route layout: createClient() + getUser() + redirect if null + pb-32 main + BottomNav"
  - "Placeholder page: pt-24 px-6 wrapper + surface-container card + Construction icon + heading + body copy"

requirements-completed: [AUTH-01, AUTH-02]

# Metrics
duration: ~20min
completed: 2026-04-13
---

# Phase 01 Plan 03: App Shell & PWA Summary

**Authenticated app shell with floating pill bottom nav, personalized dashboard, placeholder pages, sign-out flow, PWA manifest, and 18-test integration suite**

## Status: COMPLETE

Tasks 1 and 2 auto-executed. Task 3 (human-verify checkpoint) approved by user after manual testing of full OAuth flow.

## Performance

- **Duration:** ~20 min
- **Started:** 2026-04-13T00:20:00Z
- **Completed (tasks 1-2):** 2026-04-13T00:25:00Z
- **Tasks completed:** 2 of 3
- **Files created:** 12

## Accomplishments

- Protected layout with getUser() defense-in-depth auth (T-01-09 mitigation)
- Dashboard page with Google name + avatar (referrerPolicy="no-referrer") and empty state card with exact copy ("No active challenge yet." / "Invite friends to get started.")
- Floating pill bottom nav with 4 tabs, emerald gradient active state, filled icon via fontVariationSettings, safe area insets, 44px touch targets
- SignOutButton client component with Loader2 spinner, aria-busy, disabled state — same loading pattern as GoogleSignInButton
- Settings page (Server Component) renders SignOutButton (Client Component) for the complete sign-out flow
- PWA manifest in standalone mode with dark navy theme, portrait orientation, placeholder icons
- Icon inventory (src/docs/icon-inventory.md) tracking all 13 icons + 2 loaders across Phase 1 for Nano Banana swaps
- 18-test integration suite validating the full auth infrastructure (proxy.ts, Supabase clients, auth actions, callback route, pages)

## Task Commits

1. **Task 1: Build protected layout, dashboard, bottom nav, placeholder pages, and settings** - `020fbab` (feat)
2. **Task 2: Create PWA manifest, placeholder icons, icon inventory, and integration tests** - `d5a5ead` (feat)
3. **Task 3: Verify end-to-end Google OAuth flow and app shell** - APPROVED (checkpoint:human-verify, user-verified 2026-04-13)

## Files Created/Modified

- `src/components/layout/bottom-nav.tsx` - Floating pill nav, 4 tabs, emerald active state, safe area insets
- `src/app/(protected)/layout.tsx` - Auth gate layout with getUser() + BottomNav
- `src/app/(protected)/dashboard/page.tsx` - Personalized greeting with Google avatar
- `src/app/(protected)/streaks/page.tsx` - Placeholder with Construction icon
- `src/app/(protected)/feed/page.tsx` - Placeholder with Construction icon
- `src/app/(protected)/settings/page.tsx` - Placeholder + SignOutButton
- `src/components/auth/sign-out-button.tsx` - Client component with Loader2 loading state
- `src/app/manifest.ts` - PWA manifest (standalone, portrait, dark navy)
- `public/icon-192.png` - Placeholder app icon (ICON-13)
- `public/icon-512.png` - Placeholder app icon (ICON-13, maskable)
- `src/docs/icon-inventory.md` - Complete icon tracking for Nano Banana swaps
- `tests/auth.test.ts` - 18-test integration suite for auth infrastructure

## Decisions Made

- ICON-13 placeholder icons are minimal 1x1 navy pixel PNGs — valid PNG format prevents 404s in manifest, marked for Nano Banana replacement
- Test regex for `getSession()` excludes comment lines — proxy.ts has a comment explaining what NOT to use, which would cause a false-positive match

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed overly strict getSession() regex in integration test**
- **Found during:** Task 2 (running npx vitest run)
- **Issue:** The test `expect(content).not.toMatch(/getSession\(\)/)` matched a comment in proxy.ts: `// IMPORTANT: use getUser(), NOT getSession()`. The comment explains what NOT to use — not an actual getSession() call. Test was a false positive.
- **Fix:** Changed regex to filter out comment lines before matching: `content.split('\n').filter(line => !line.trim().startsWith('//')).join('\n')`
- **Files modified:** tests/auth.test.ts
- **Verification:** All 20 tests pass with exit code 0
- **Committed in:** d5a5ead (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug in generated test)
**Impact on plan:** Test now correctly validates that proxy.ts doesn't call getSession() in executable code. No scope creep.

## Issues Encountered

None beyond the regex false-positive documented above.

## Known Stubs

- `public/icon-192.png` and `public/icon-512.png` — 1x1 pixel placeholder PNGs, tracked as ICON-13. Must be replaced with real Nano Banana app icons before any public sharing or App Store submission.
- `src/app/(protected)/dashboard/page.tsx` — Empty state card ("No active challenge yet. / Invite friends to get started.") is intentional for Phase 1. The group/challenge feature is out of scope for this plan. Wired in a future plan.
- Streaks, Feed, and Settings pages — Construction icon placeholders, intentional per plan. Future plans will implement each feature.

## Next Phase Readiness

- Complete auth shell is ready for Task 3 human verification
- After user approves checkpoint: Phase 1 (Foundation & Auth) is complete
- Phase 2 can build on the established patterns: protected layout, bottom nav, client component loading pattern, Supabase server/client factories

---
*Phase: 01-foundation-auth*
*Completed: 2026-04-13*
