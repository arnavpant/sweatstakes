---
phase: 05-dashboard-feed-polish
plan: 04
subsystem: profile-editor
tags: [profile, settings, avatar, display-name, supabase-auth, supabase-storage, drizzle, ssrf-defense, image-compression]

requires:
  - phase: 05
    plan: 01
    provides: avatars bucket + folder-scoped RLS, createAdminClient (service-role)
  - phase: 05
    plan: 02
    provides: Settings page extended with NotificationsSection (this plan mounts alongside it)
provides:
  - updateDisplayNameAction — dual-layer write (challenge_members + auth.users.user_metadata.full_name)
  - updateAvatarUrlAction — cache-busted URL write to challenge_members.avatar_url, SSRF-guarded
  - ProfileSection / AvatarUploader / DisplayNameEditor components
  - Settings page mounts ProfileSection above InviteLinkSection
affects: [settings, dashboard, feed, profile, avatar-cdn]

tech-stack:
  patterns:
    - "Dual-layer name sync: drizzle for app-facing display name + admin API for auth.users metadata, preserving other metadata keys via spread"
    - "Cache-bust via ?v=<timestamp> query param on public Storage URLs so fresh avatars render immediately for other members"
    - "SSRF/open-redirect defense: URL must start with NEXT_PUBLIC_SUPABASE_URL before DB write"
    - "EXIF stripping via browser-image-compression canvas re-encode (free byproduct of fileType: 'image/jpeg' + canvas.toBlob)"
    - "Folder-scoped avatar path: <uid>/avatar.jpg — matches Plan 01 RLS policy that keys on storage.foldername(name)[1]"

key-files:
  created:
    - src/lib/actions/profile.ts
    - src/components/settings/profile-section.tsx
    - src/components/settings/avatar-uploader.tsx
    - src/components/settings/display-name-editor.tsx
    - tests/profile-actions.test.ts
  modified:
    - src/app/(protected)/settings/page.tsx

key-decisions:
  - "Display name writes to challenge_members first, then auth.users.user_metadata; auth.users failure is logged but NOT rolled back — app-facing display name (Dashboard, Feed) is the authoritative source"
  - "Spread existing user_metadata before overwriting full_name so downstream keys (avatar_url, email, etc.) are preserved (T-05-04-05)"
  - "Avatar upload path is <uid>/avatar.jpg with upsert:true — exactly one photo per user, bucket size stays flat under rapid re-uploads (T-05-04-07)"
  - "Cache-bust applied server-side (in updateAvatarUrlAction) rather than client-side so every write is guaranteed to invalidate the CDN entry"
  - "URL validation is zod-url + hard prefix match on NEXT_PUBLIC_SUPABASE_URL — prevents an action-call poisoning the DB with an external image URL"
  - "Profile section only renders for users in a challenge — no challenge_members row means no display_name exists, so there's nothing meaningful to edit"
  - "Client compression target is 512px/~100 KB, smaller than check-ins' 1920px/500 KB — avatars render at ~64×64 in UI, so 512 is already retina-ready"

requirements-completed: [SETT-03, DSGN-01, DSGN-02]

duration: ~15 min
completed: 2026-04-14
---

# Phase 5 Plan 04: Profile Editor Summary

Settings Profile card with inline display-name editor (writing to both challenge_members AND auth.users.user_metadata.full_name) and avatar photo upload (compressed to 512px JPEG, stored at avatars/<uid>/avatar.jpg, cache-busted on DB write, with Google OAuth avatar as fallback). Completes SETT-03 and closes out Phase 5 requirement coverage.

## Performance

- **Duration:** ~15 minutes
- **Completed:** 2026-04-14
- **Tasks:** 3 of 3 (all autonomous, TDD flow on Task 1)
- **Files created:** 5
- **Files modified:** 1

## Accomplishments

- Two Server Actions with full zod validation, auth gating, and explicit SSRF defense
- 9 unit tests covering: trim + dual-layer write, whitespace-empty rejection, 41-char overflow, metadata key preservation, URL validation, SSRF prefix check, unauthenticated gate on both actions
- Three UI components shipped: AvatarUploader (client, handles compression + upload + action call), DisplayNameEditor (client, inline with dirty-check), ProfileSection (server, composes both)
- Settings page now renders ProfileSection at the top, above InviteLinkSection, without disturbing Plan 02's NotificationsSection
- Type-check passes clean, 9 new profile-actions tests pass, full suite has 281 passing (1 pre-existing connections.test.ts failure — see Deferred Issues)

## Task Commits

1. **Task 1 RED** — `e852247` test(05-04): add failing tests for profile server actions
2. **Task 1 GREEN** — `b9551b8` feat(05-04): implement updateDisplayNameAction + updateAvatarUrlAction
3. **Task 2** — `4580f38` feat(05-04): add ProfileSection + AvatarUploader + DisplayNameEditor
4. **Task 3** — `56b4545` feat(05-04): mount ProfileSection above InviteLinkSection in Settings

## Files Created/Modified

**Created**
- `src/lib/actions/profile.ts` — `updateDisplayNameAction`, `updateAvatarUrlAction` (server-only; uses createAdminClient for auth.users.user_metadata write)
- `src/components/settings/profile-section.tsx` — server component composing the uploader + name editor; fallback-aware (customAvatarUrl || googleAvatarUrl)
- `src/components/settings/avatar-uploader.tsx` — client component; validates MIME+size, compresses via browser-image-compression (512px / ~100 KB / JPEG / useWebWorker), uploads to `avatars/<uid>/avatar.jpg` with upsert:true, calls Server Action, `router.refresh()` on success
- `src/components/settings/display-name-editor.tsx` — client component; trimmed dirty-check + maxLength=40 input + inline Save with spinner state
- `tests/profile-actions.test.ts` — 9 tests (5 display-name, 4 avatar-url)

**Modified**
- `src/app/(protected)/settings/page.tsx` — imports ProfileSection, extends membership select to include `displayName` + `avatarUrl`, derives `googleAvatarUrl` from `user.user_metadata.avatar_url`, renders `<ProfileSection />` above `<InviteLinkSection />` when `isInChallenge`

## Decisions Made

See frontmatter `key-decisions`. Highlights:
- auth.users.user_metadata.full_name failure is logged-not-rollback — Dashboard/Feed rely on challenge_members.display_name, which is the authoritative user-visible source.
- Cache-bust happens server-side (inside updateAvatarUrlAction), guaranteeing every successful write invalidates the CDN entry regardless of whether the client forgot to append `?v=`.
- SSRF defense is a hard `startsWith(NEXT_PUBLIC_SUPABASE_URL)` check rather than a regex allowlist — project-pinned bucket URL prefix is unambiguous and the check is one line.

## Threat Model Coverage

Per the plan's `<threat_model>`:

| Threat ID | Mitigation in code |
|-----------|-------------------|
| T-05-04-01 (EoP: cross-user avatar overwrite) | Client writes `${userId}/avatar.jpg`; Supabase Storage RLS (Plan 01) enforces `auth.uid()::text = (storage.foldername(name))[1]`. Defense in depth. |
| T-05-04-02 (Info Disclosure: service-role leak) | `createAdminClient` is in `src/lib/supabase/admin.ts` which starts with `import 'server-only'`. Env var is `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix). |
| T-05-04-03 (Tampering: arbitrary URL stored) | `updateAvatarUrlAction` zod-validates URL shape AND enforces `url.startsWith(process.env.NEXT_PUBLIC_SUPABASE_URL)`. Test covers both reject paths. |
| T-05-04-04 (Tampering: oversized/non-image) | Client rejects `!file.type.startsWith('image/')` and `file.size > 5MB`. browser-image-compression re-encodes as JPEG regardless of source type. |
| T-05-04-05 (Info Disclosure: user_metadata clobber) | Server action spreads `{ ...(user.user_metadata ?? {}), full_name: name }`. Test 4 asserts avatar_url is preserved across name update. |
| T-05-04-06 (Spoofing: display-name impersonation) | Accepted per plan — friend-group trust model. |
| T-05-04-07 (DoS: rapid re-uploads) | Accepted — upsert:true means storage footprint stays constant per user. |
| T-05-04-08 (Info Disclosure: EXIF leak) | browser-image-compression uses canvas `toBlob` internally, which does not transfer EXIF. `fileType: 'image/jpeg'` forces re-encode on any source format. |

## Deviations from Plan

None — the plan was executed as written. The only fit-and-finish additions were:

- Added `?? 'Upload failed.'` / `?? 'Failed to save name.'` nullish fallbacks in the client components because `z.ZodError.issues[0].message` is `string | undefined` at the type level (Rule 3: blocking TS error). This matches the pattern used in Plan 01's goal-stepper fix.
- Added `if (fileRef.current) fileRef.current.value = ''` in AvatarUploader's `finally` so the same file can be re-selected after a failed upload (Rule 2: correctness — without this, the onChange fires only once per unique file).
- Added `// eslint-disable-next-line @next/next/no-img-element` on the avatar `<img>` since we're intentionally rendering external/Storage URLs without next/image optimization (avatars are already compressed client-side).

## Self-Check: PASSED

- `src/lib/actions/profile.ts` — FOUND
- `src/components/settings/profile-section.tsx` — FOUND
- `src/components/settings/avatar-uploader.tsx` — FOUND
- `src/components/settings/display-name-editor.tsx` — FOUND
- `tests/profile-actions.test.ts` — FOUND
- `src/app/(protected)/settings/page.tsx` — MODIFIED (ProfileSection import + membership select extension + ProfileSection render)
- Commits e852247, b9551b8, 4580f38, 56b4545 — all FOUND in git log
- `npx tsc --noEmit` — clean
- `npx vitest run tests/profile-actions.test.ts` — 9/9 passing
- `npx vitest run` — 281 passing, 1 failing (pre-existing, unrelated — see Deferred Issues)

## Deferred Issues

- `tests/connections.test.ts` > `leaveChallengeAction deletes membership row` is failing on the base commit (`966b5f5`, verified via `git stash` + re-run). The test reads `src/lib/actions/connections.ts` as a string and asserts the literal `db.delete(challengeMembers)` is present. The current actions file uses a slightly different call shape and the string assertion is stale. This is a pre-existing scope boundary violation and NOT touched by this plan. File a follow-up to rewrite the test against behavior rather than file content.

## Manual Verification (recommended before merging to main)

- [ ] Change display name in Settings → reload → greeting on Dashboard updates; feed attribution on any of your check-in cards updates
- [ ] `SELECT display_name FROM challenge_members WHERE user_id = <you>` reflects the new name
- [ ] Supabase Dashboard → Authentication → Users → your row → `user_metadata` shows `full_name` updated AND `avatar_url` (Google) still present
- [ ] Upload a custom avatar → reload → dashboard member card + feed post avatars update (first load bypasses CDN via `?v=<timestamp>`)
- [ ] Sign in as a second user → confirm their view of your avatar updated (public bucket + cache-bust)
- [ ] Delete `challenge_members.avatar_url` (SQL) → reload → fallback to Google photo
- [ ] Upload a 10 MB image → client shows "Image is too large. Pick one under 5 MB."
- [ ] Upload a `.txt` rename to `.png` → MIME check catches it; shows "Please pick an image file."
- [ ] Inspect uploaded avatar in the Storage dashboard → download → run `exiftool` → confirm no GPS/camera EXIF

## Next Phase Readiness

Phase 5 is now requirement-complete. All SETT / DASH / FEED / DSGN requirements are closed. Plans 05-05+ (if any) can assume:
- `updateDisplayNameAction` and `updateAvatarUrlAction` importable from `@/lib/actions/profile`
- `ProfileSection` mountable anywhere — already in Settings; could be reused in onboarding or a dedicated profile route
- `challenge_members.avatar_url` and `challenge_members.display_name` are the canonical per-member identity columns; any new surface reading member identity should prefer these over `auth.users.user_metadata`

---
*Phase: 05-dashboard-feed-polish*
*Completed: 2026-04-14*
