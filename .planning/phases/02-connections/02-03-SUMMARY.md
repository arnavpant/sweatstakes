---
phase: 02-connections
plan: 03
subsystem: ui-components, settings, dashboard
tags: [client-components, invite-link, web-share-api, avatar-row, settings-page, dashboard]
dependency_graph:
  requires: [db-client, challenges-table, challenge-members-table, invite-links-table, generateInviteLinkAction, joinChallengeAction, leaveChallengeAction]
  provides: [invite-link-section, share-invite-button, leave-challenge-button, member-avatar-row, settings-ui, dashboard-avatar-row]
  affects: []
tech_stack:
  added: []
  patterns: [use-client-loading-pattern, web-share-api-with-clipboard-fallback, server-component-avatar-row, drizzle-query-in-page]
key_files:
  created:
    - src/components/connections/invite-link-section.tsx
    - src/components/connections/share-invite-button.tsx
    - src/components/connections/leave-challenge-button.tsx
    - src/components/connections/member-avatar-row.tsx
  modified:
    - src/app/(protected)/settings/page.tsx
    - src/app/(protected)/dashboard/page.tsx
    - tests/connections.test.ts
decisions:
  - ShareInviteButton uses useEffect+useState for navigator.share detection to avoid TypeScript error with direct navigator.share truthiness check in JSX
  - MemberAvatarRow is a Server Component (no use client) since it receives data as props from the Server Component dashboard page
  - Settings page queries challengeMembers directly via Drizzle (same pattern as dashboard) to conditionally show leave button
metrics:
  duration: 4m
  completed: 2026-04-13T08:41:09Z
  tasks_completed: 3
  tasks_total: 4
  tests_added: 27
  tests_total: 91
  files_changed: 7
---

# Phase 02 Plan 03: Connections UI Components Summary

Settings page with invite link generation/sharing (Web Share API + clipboard fallback), leave challenge with confirmation dialog, and Dashboard with member avatar row showing first 5 + overflow count.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Build connection UI components and update Settings page | fa18539 | src/components/connections/invite-link-section.tsx, share-invite-button.tsx, leave-challenge-button.tsx, src/app/(protected)/settings/page.tsx |
| 2 | Build member avatar row and update Dashboard page | f2c7411 | src/components/connections/member-avatar-row.tsx, src/app/(protected)/dashboard/page.tsx |
| 3 | Add UI component tests to connections test file | 69531e6 | tests/connections.test.ts |
| 4 | Verify end-to-end invite and join flow | -- | CHECKPOINT: human-verify (not yet executed) |

## What Was Built

### Settings Page (src/app/(protected)/settings/page.tsx)
- Replaced placeholder Construction icon with real content
- Now an async Server Component that queries challengeMembers via Drizzle
- Renders InviteLinkSection (always), LeaveChallengeButton (conditionally when in challenge), SignOutButton (always)
- Follows D-04: invite link generation lives on Settings page

### InviteLinkSection (src/components/connections/invite-link-section.tsx)
- Client component with loading state (Loader2, aria-busy, disabled:opacity-60)
- Calls generateInviteLinkAction and displays the generated URL
- D-05: one link at a time, "Generate New Link" resets state
- Shows invite URL in monospace font with ShareInviteButton below
- Error handling with role="alert" for accessibility

### ShareInviteButton (src/components/connections/share-invite-button.tsx)
- Client component implementing D-06: Web Share API with clipboard fallback
- Uses useEffect to detect navigator.share availability (avoids TypeScript truthiness error)
- Shows Share2 icon (mobile) or Copy icon (desktop) based on API availability
- "Copied!" feedback with Check icon for 2 seconds after clipboard copy

### LeaveChallengeButton (src/components/connections/leave-challenge-button.tsx)
- Client component with two-step confirmation flow (D-13)
- First shows "Leave Challenge" button with LogOut icon
- On click, shows "Are you sure?" confirmation with Cancel/Confirm buttons
- Calls leaveChallengeAction and router.refresh() on success
- Error state styled in error color (text-error, bg-error/20)

### MemberAvatarRow (src/components/connections/member-avatar-row.tsx)
- Server Component (no 'use client') receiving members as props
- D-15: shows first 5 avatars with overlapping circles (-space-x-2), +N overflow
- Avatar circles: 32px, rounded-full, border-2 border-background for overlap separation
- Letter fallback for members without avatar URL (charAt(0).toUpperCase())
- D-16: "Challenge active -- N members" text with singular/plural handling
- referrerPolicy="no-referrer" on all Google avatar img tags

### Dashboard Page (src/app/(protected)/dashboard/page.tsx)
- Now queries challengeMembers twice: once for user membership, once for all challenge members
- Conditionally renders MemberAvatarRow (active challenge) or empty state card (no challenge)
- Empty state preserved: "No active challenge yet." / "Invite friends to get started." / group_add icon
- Greeting margin tightened from mb-8 to mb-6 for avatar row spacing

### Tests (tests/connections.test.ts)
- 27 new tests across 2 describe blocks:
  - Settings UI (CONN-01): 16 tests covering all 3 client components and settings page structure
  - Dashboard UI (CONN-03): 11 tests covering avatar row component and dashboard page updates
- Full suite: 91 tests passing (20 auth + 71 connections)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error with navigator.share truthiness check in JSX**
- **Found during:** Task 1
- **Issue:** TypeScript reported "This condition will always return true since this function is always defined" when checking `navigator.share` directly in JSX render path
- **Fix:** Replaced inline `typeof navigator !== 'undefined' && navigator.share` check in JSX with `useEffect`-based `canShare` state that detects Web Share API availability after mount
- **Files modified:** src/components/connections/share-invite-button.tsx
- **Commit:** fa18539

## Known Stubs

None -- all components are fully wired to their data sources (Server Actions and Drizzle queries).

## Verification Results

| Check | Status |
|-------|--------|
| TypeScript compilation | PASS |
| npx vitest run tests/connections.test.ts | PASS (71/71) |
| npx vitest run (full suite) | PASS (91/91) |
| invite-link-section.tsx calls generateInviteLinkAction | PASS |
| share-invite-button.tsx has Web Share + clipboard | PASS |
| leave-challenge-button.tsx has confirmation flow | PASS |
| member-avatar-row.tsx has MAX_VISIBLE=5 + overflow | PASS |
| Settings page has InviteLinkSection + LeaveChallengeButton | PASS |
| Dashboard has MemberAvatarRow + empty state | PASS |
| Human verification (Task 4) | PENDING CHECKPOINT |

## Self-Check: PASSED

All 7 created/modified files verified on disk. All 3 commits verified in git log.
