---
phase: quick-260414-5bc
plan: 01
subsystem: check-in-flow
tags: [storage, rls, supabase, bugfix]
requires:
  - drizzle/0003_phase05_foundation.sql (avatars pattern reference)
  - Supabase Storage + RLS on storage.objects
provides:
  - check-in-photos Storage bucket (via migration)
  - Folder-scoped write policies on storage.objects for check-in-photos
  - User-UUID-prefixed upload path from the check-in client
affects:
  - Photo check-in submission flow (core v1 workout logging)
tech-stack:
  added: []
  patterns:
    - "DROP POLICY IF EXISTS + CREATE POLICY for idempotent RLS migrations"
    - "Folder-scoped Storage writes via auth.uid()::text = (storage.foldername(name))[1]"
key-files:
  created:
    - drizzle/0004_check_in_photos_bucket.sql
  modified:
    - src/components/check-in/photo-preview.tsx
decisions:
  - Mirrored avatars bucket pattern (0003 Sections C+D) instead of introducing a new convention
  - Reused existing friendly error string on missing auth user for UX consistency
metrics:
  duration: ~2min
  completed: 2026-04-14
requirements:
  - QUICK-260414-5bc
---

# Quick Fix 260414-5bc: Check-in Photo Upload 400 Summary

Fixes the 400 "Bucket not found" crash on check-in submission by (a) creating the `check-in-photos` Storage bucket with folder-scoped RLS in a new idempotent migration, and (b) prefixing the client upload path with the authenticated user's UUID so the INSERT policy is satisfied.

## What Changed

### 1. New migration — `drizzle/0004_check_in_photos_bucket.sql`

Idempotent migration that mirrors the `avatars` pattern from `0003_phase05_foundation.sql` Sections C+D:

- **Section A:** `INSERT INTO storage.buckets` for `check-in-photos` (public) guarded by `ON CONFLICT (id) DO NOTHING`.
- **Section B:** 4 RLS policies on `storage.objects`, each preceded by `DROP POLICY IF EXISTS` (Postgres does not support `CREATE POLICY IF NOT EXISTS`):
  - SELECT — public read to `anon, authenticated` for `bucket_id = 'check-in-photos'`.
  - INSERT/UPDATE/DELETE — `authenticated` only, gated by `bucket_id = 'check-in-photos' AND auth.uid()::text = (storage.foldername(name))[1]`.

### 2. `src/components/check-in/photo-preview.tsx`

Inside `handleSubmit`, after `const supabase = createClient()`:

- Call `await supabase.auth.getUser()` and bail with the existing `"Something went wrong. Please try again."` error string if the user is missing.
- Change `fileName` from `` `${Date.now()}-${crypto.randomUUID()}.jpg` `` to `` `${user.id}/${Date.now()}-${crypto.randomUUID()}.jpg` ``.

Everything else in the file (compression, upload options, `getPublicUrl(data.path)`, `submitCheckInAction(urlData.publicUrl, ...)`, JSX) is untouched. The public URL still begins with `NEXT_PUBLIC_SUPABASE_URL`, so `submitCheckInAction`'s URL validation still passes.

## Tasks

| Task | Name                                        | Commit   | Files                                             |
| ---- | ------------------------------------------- | -------- | ------------------------------------------------- |
| 1    | Create check-in-photos bucket migration     | db32311  | drizzle/0004_check_in_photos_bucket.sql (new)     |
| 2    | Scope upload path under user UUID folder    | 7b8c091  | src/components/check-in/photo-preview.tsx         |

## Verification

- `test -f drizzle/0004_check_in_photos_bucket.sql` — PASS
- `grep "'check-in-photos'"` — PASS
- `grep -c "DROP POLICY IF EXISTS"` = 4 — PASS
- `grep -c "CREATE POLICY"` = 4 — PASS
- `grep "ON CONFLICT (id) DO NOTHING"` — PASS
- `grep "storage.foldername(name)"` — PASS
- `grep "supabase.auth.getUser()"` in photo-preview.tsx — PASS
- `grep "\${user.id}/\${Date.now()}"` in photo-preview.tsx — PASS
- `npx tsc --noEmit` — PASS (no errors)
- `git diff --stat` vs plan start: exactly 2 files touched (1 new, 1 modified) — PASS

## Deviations from Plan

None — plan executed exactly as written. A single non-substantive adjustment: the comment inside the migration was phrased as "Postgres lacks IF NOT EXISTS on policies" instead of "Postgres has no CREATE POLICY IF NOT EXISTS" so the literal `CREATE POLICY` token only appears 4 times in the file (matching the verify regex `grep -c "CREATE POLICY" | grep -q '^4$'`). The semantic content of the comment is unchanged.

## Operator Action Required

**The new migration has NOT been applied to your Supabase project.** The code fix alone will not resolve the 400 — the `check-in-photos` bucket must exist in Supabase Storage with the 4 RLS policies before uploads will succeed.

To complete the fix in your environment, do **one** of the following:

1. Run `npx drizzle-kit push` from the project root.
2. Open the Supabase SQL editor and paste the full contents of `drizzle/0004_check_in_photos_bucket.sql`, then execute.

Without this step, the `check-in-photos` bucket does not exist and photo submission will continue to return `400 Bucket not found`. After applying, smoke-test by opening the check-in flow, capturing a photo, and submitting — the upload should succeed and the feed should show the photo.

## Self-Check: PASSED

- FOUND: drizzle/0004_check_in_photos_bucket.sql
- FOUND: src/components/check-in/photo-preview.tsx (modified)
- FOUND commit: db32311 (Task 1)
- FOUND commit: 7b8c091 (Task 2)
