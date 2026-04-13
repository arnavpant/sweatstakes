---
phase: 03-check-ins-goals
plan: 02
subsystem: ui
tags: [camera, getUserMedia, canvas, browser-image-compression, supabase-storage, photo-upload, bereal]

# Dependency graph
requires:
  - phase: 03-check-ins-goals
    plan: 01
    provides: "submitCheckInAction Server Action, checkIns table, Supabase client"
provides:
  - "CameraView component with dual-camera state machine (rear -> selfie -> composite)"
  - "PhotoPreview component with compress -> upload -> submit flow"
  - "CaptureButton and CountdownOverlay sub-components"
  - "Check-in page route at /check-in under protected layout"
  - "browser-image-compression dependency installed"
affects: [03-03, 03-04, 04-points-stakes]

# Tech tracking
tech-stack:
  added: [browser-image-compression@^2.0.2]
  patterns:
    - "Dual-camera state machine pattern: rear-capture -> selfie-countdown -> selfie-capture -> preview -> submitting -> done"
    - "Canvas compositing with createImageBitmap and roundRect for thumbnail overlay"
    - "Client-side Supabase Storage upload with server action for DB record"
    - "getUserMedia with facingMode switching and stream cleanup on unmount/visibility-change"

key-files:
  created:
    - src/components/check-in/camera-view.tsx
    - src/components/check-in/countdown-overlay.tsx
    - src/components/check-in/capture-button.tsx
    - src/components/check-in/photo-preview.tsx
    - src/app/(protected)/check-in/page.tsx
  modified:
    - tests/check-ins.test.ts
    - package.json

key-decisions:
  - "Used local useState for camera state machine instead of Zustand -- state is component-local with no cross-component sharing needed"
  - "Canvas composite uses createImageBitmap for drawable images and roundRect for selfie thumbnail border-radius clipping"
  - "Front camera preview mirrored with CSS scaleX(-1) but canvas capture reads raw un-mirrored video data"
  - "Photo compression forced to image/jpeg with maxSizeMB 0.5 before Supabase Storage upload (T-03-06, T-03-08)"

patterns-established:
  - "Camera state machine: type CameraPhase union with phase-driven rendering, stream cleanup on unmount and visibilitychange"
  - "Storage upload pattern: compress client-side -> upload to Supabase Storage -> get public URL -> call server action with URL"

requirements-completed: [CHKN-01, CHKN-02]

# Metrics
duration: 5min
completed: 2026-04-13
---

# Phase 3 Plan 02: Camera Capture & Photo Upload Summary

**BeReal-style dual-camera check-in with getUserMedia state machine, canvas composite selfie overlay, browser-image-compression to 500KB, and Supabase Storage upload flow**

## Performance

- **Duration:** 5 minutes
- **Started:** 2026-04-13T10:57:11Z
- **Completed:** 2026-04-13T11:02:35Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Built full dual-camera state machine: rear camera capture -> auto-flip to front -> 3-2-1 countdown -> selfie auto-capture -> canvas composite with selfie thumbnail overlay
- Created PhotoPreview with complete upload pipeline: browser-image-compression (maxSizeMB 0.5) -> Supabase Storage upload to check-in-photos bucket -> submitCheckInAction server action call
- Added 22 new component tests (87 total passing) covering all camera/upload components, imports, and patterns
- Installed browser-image-compression dependency

## Task Commits

Each task was committed atomically:

1. **Task 1: Build camera capture components with dual-camera state machine** - `79e19a0` (feat)
2. **Task 2: Build photo preview with upload flow and check-in page route** - `3cb6462` (feat)

## Files Created/Modified
- `src/components/check-in/camera-view.tsx` - Full-screen camera orchestrator with dual-camera state machine, getUserMedia, canvas compositing, stream cleanup
- `src/components/check-in/countdown-overlay.tsx` - 3-2-1 countdown animation overlay with CSS pulse effect
- `src/components/check-in/capture-button.tsx` - Circular shutter button with accessibility label
- `src/components/check-in/photo-preview.tsx` - Composite preview with compress -> upload -> submit flow, Retake/Submit buttons
- `src/app/(protected)/check-in/page.tsx` - Check-in page route under protected layout rendering CameraView
- `tests/check-ins.test.ts` - Extended with 22 new camera/upload component tests, updated stubs
- `package.json` - Added browser-image-compression dependency

## Decisions Made
- Used local useState for the camera state machine instead of Zustand. The state is entirely component-local (phase, blobs, countdown) with no need for cross-component sharing. Zustand would add unnecessary indirection.
- Canvas composite draws rear photo full-size with selfie thumbnail at 25% width in top-left corner (16px margin, 12px border-radius, 3px white border) using createImageBitmap and roundRect.
- Front camera video element uses CSS scaleX(-1) for natural mirror preview, but canvas.drawImage reads the raw un-mirrored video data for the actual capture.
- Photo compression uses browser-image-compression with maxSizeMB 0.5 and useWebWorker for non-blocking compression before Supabase Storage upload.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type narrowing for submitCheckInAction result**
- **Found during:** Task 2 (build step)
- **Issue:** `result.error` has type `string | undefined` from the server action return type, but `setError` expects `string | null`. TypeScript rejected `setError(result.error)`.
- **Fix:** Changed `if ('error' in result)` to `if ('error' in result && result.error)` to narrow the type to `string`.
- **Files modified:** src/components/check-in/photo-preview.tsx
- **Verification:** `npx tsc --noEmit` passes (excluding pre-existing invite-link-section error)
- **Committed in:** 3cb6462 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential TypeScript fix for type safety. No scope creep.

## Issues Encountered
- Pre-existing TypeScript error in `src/components/connections/invite-link-section.tsx:18` causes `npm run build` to fail at type-check stage. Not caused by this plan's changes. Already documented in 03-01-SUMMARY.md and logged to deferred-items.md.
- Pre-existing CRLF test failure in `tests/connections.test.ts` for `leaveChallengeAction deletes membership row`. Not caused by this plan's changes. Already documented in 03-01-SUMMARY.md.

## User Setup Required

**External services require manual configuration.** From plan frontmatter:
- Create `check-in-photos` public bucket in Supabase Dashboard > Storage
- Add upload RLS policy for authenticated users (INSERT, WITH CHECK bucket_id = 'check-in-photos')
- Add select RLS policy for public access (SELECT, USING bucket_id = 'check-in-photos')

## Next Phase Readiness
- Camera capture flow complete, ready for Plan 03 (day dots, streak counter, goal stepper on Dashboard/Settings)
- Plan 03 will use getWeeklyProgress and computeStreak from week.ts on the Dashboard
- Plan 04 will update bottom-nav with center FAB linking to /check-in
- Supabase Storage bucket and RLS policies must be configured before live testing

## Self-Check: PASSED

All 7 created/modified files verified present. Both commit hashes (79e19a0, 3cb6462) verified in git log.

---
*Phase: 03-check-ins-goals*
*Completed: 2026-04-13*
