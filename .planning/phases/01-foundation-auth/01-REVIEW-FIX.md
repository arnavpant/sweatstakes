---
phase: 01-foundation-auth
fixed_at: 2026-04-13T05:53:23Z
review_path: .planning/phases/01-foundation-auth/01-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-04-13T05:53:23Z
**Source review:** .planning/phases/01-foundation-auth/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5
- Fixed: 5
- Skipped: 0

## Fixed Issues

### CR-01: Open Redirect in OAuth Callback via Unvalidated `next` Parameter

**Files modified:** `src/app/auth/callback/route.ts`
**Commit:** 19693f7
**Applied fix:** Added validation that the `next` query parameter must start with `/` and must not start with `//` (protocol-relative). Invalid values fall back to `/dashboard`. This prevents an attacker from crafting a callback URL that redirects authenticated users to an external phishing domain.

### CR-02: Missing Environment Variable Guard -- Runtime Crash with Opaque Error

**Files modified:** `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `proxy.ts`
**Commit:** c6bba79
**Applied fix:** Added explicit early guards in all three Supabase client factories that check for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` at module load time. Missing values now throw a clear error message instructing the developer to copy `.env.local.example` to `.env.local`. Removed non-null assertion operators (`!`) in favor of the validated variables.

### WR-01: OAuth Redirect URI Built from `origin` Header -- Spoofable in Some Environments

**Files modified:** `src/lib/actions/auth.ts`, `.env.local.example`
**Commit:** dd9be93
**Applied fix:** Changed `signInWithGoogleAction` to use `NEXT_PUBLIC_SITE_URL` as the canonical origin for the OAuth redirect URI, falling back to the `origin` request header, then `http://localhost:3000`. Added the new env var to `.env.local.example` with documentation comments. This follows the Supabase Next.js quickstart recommended pattern.

### WR-02: `signOutAction` Ignores Supabase Sign-Out Error

**Files modified:** `src/lib/actions/auth.ts`
**Commit:** e2a95b6
**Applied fix:** Captured the `{ error }` return value from `supabase.auth.signOut()`. If sign-out fails, the user is now redirected to `/login?error=SignOutFailed` instead of silently proceeding as if sign-out succeeded. This prevents the redirect-loop scenario where the session cookie persists after a failed sign-out.

### WR-03: `proxy.ts` Route Matcher Does Not Exclude `/auth/callback`

**Files modified:** `proxy.ts`
**Commit:** 5daae96
**Applied fix:** Added `auth/` to the negative lookahead in the `config.matcher` regex pattern. OAuth callback requests now bypass the proxy entirely, eliminating the redundant `getUser()` network round-trip during the code exchange flow and reducing the risk of timeout-related callback failures.

---

_Fixed: 2026-04-13T05:53:23Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
