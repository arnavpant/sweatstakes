---
phase: 01-foundation-auth
plan: "02"
subsystem: auth
tags: [supabase, auth, google-oauth, login-screen, proxy, server-actions, tailwind, shadcn]
dependency_graph:
  requires: [01-01]
  provides: [supabase-client-factories, proxy-session-management, google-oauth-server-actions, login-screen-ui]
  affects: [01-03, 01-04]
tech_stack:
  added:
    - "@supabase/ssr createServerClient (server-side Supabase client)"
    - "@supabase/ssr createBrowserClient (browser-side Supabase client)"
    - "proxy.ts (Next.js 16 session middleware — replaces middleware.ts)"
    - "Next.js Server Actions ('use server' auth.ts)"
    - "lucide-react Loader2 + AlertCircle (loading and error icons)"
    - "Material Symbols Outlined (Google Fonts — nav + placeholder icons)"
  patterns:
    - "Server-side Supabase client factory (async, cookie-based)"
    - "Browser-side Supabase client factory (singleton pattern)"
    - "proxy.ts exports `proxy` function (not `middleware`) — Next.js 16 naming"
    - "getUser() for JWT server-side validation (not getSession())"
    - "Dynamic OAuth redirect origin from request headers (not hard-coded)"
    - "Suspense boundary wrapping useSearchParams() client component"
    - "emerald gradient button: from-secondary to-on-tertiary-container"
    - "Glass panel card: glass-panel utility + border-outline-variant/15"
key_files:
  created:
    - src/lib/supabase/server.ts
    - src/lib/supabase/client.ts
    - src/lib/actions/auth.ts
    - src/app/auth/callback/route.ts
    - proxy.ts
    - src/app/(auth)/login/page.tsx
    - src/components/auth/google-sign-in-button.tsx
  modified:
    - src/app/layout.tsx
decisions:
  - "Used getUser() not getSession() in proxy.ts: getUser() validates JWT server-side — forged session cookies cannot bypass auth (T-01-03)"
  - "Dynamic origin from request headers in signInWithGoogleAction: works on both localhost and Vercel without hard-coding any URL"
  - "Suspense boundary around GoogleSignInButton: required because useSearchParams() causes dynamic rendering in Next.js App Router — without Suspense the page would fail to static render"
  - "proxy.ts not middleware.ts: Next.js 16 renamed the middleware file; using the correct name avoids silent breakage"
  - "Return supabaseResponse not new NextResponse.next(): supabaseResponse carries the refreshed session cookie set by @supabase/ssr — returning a fresh NextResponse would drop it"
metrics:
  duration_minutes: 2
  completed_date: "2026-04-13"
  tasks_completed: 2
  tasks_total: 2
  files_created: 7
  files_modified: 1
---

# Phase 01 Plan 02: Supabase Auth with Google OAuth and Login Screen Summary

**One-liner:** Supabase Auth wired with Google OAuth via cookie-based sessions in proxy.ts (getUser JWT validation), Server Actions for sign-in/sign-out with dynamic origin, and the Royale-themed login screen with emerald gradient button, loading spinner, and inline error handling.

## What Was Built

### Task 1: Auth Infrastructure

Five files delivering the complete authentication layer:

- **`src/lib/supabase/server.ts`** — Async server-side client factory using `createServerClient` with full cookie get/set handling. The `setAll` catch block intentionally ignores errors in Server Components (proxy.ts handles writes).
- **`src/lib/supabase/client.ts`** — Synchronous browser-side client factory using `createBrowserClient` — a singleton-safe pattern for client components.
- **`proxy.ts`** (project root, not `src/`) — Next.js 16's renamed middleware file. Exports `proxy` (not `middleware`). On every request: refreshes the Supabase session cookie, redirects unauthenticated users from `/dashboard`, `/streaks`, `/feed`, `/settings` silently to `/login` (D-10), and redirects authenticated users from `/login` to `/dashboard`. Uses `getUser()` for server-side JWT validation (T-01-03).
- **`src/lib/actions/auth.ts`** — Two Server Actions: `signInWithGoogleAction` reads `origin` from request headers dynamically (works on localhost and Vercel), initiates Google OAuth via `signInWithOAuth`, redirects to `${origin}/auth/callback`; `signOutAction` calls `signOut()` and redirects to `/login` with no confirmation (D-18).
- **`src/app/auth/callback/route.ts`** — GET route handler that exchanges the OAuth `code` for a session via `exchangeCodeForSession`, redirects to `/dashboard` on success, or `/login?error=AuthCallbackFailed` on failure (generic error — T-01-06).

### Task 2: Login Screen UI

Two files delivering the login screen:

- **`src/components/auth/google-sign-in-button.tsx`** — `'use client'` component. Emerald gradient button (`from-secondary to-on-tertiary-container`, `text-on-secondary-fixed`, `rounded-full`). Loading state: Loader2 spinner replaces Google "G" icon, text changes to "Signing in...", button disabled at `opacity-60`, `aria-busy={true}`. Error state: inline `role="alert"` paragraph with AlertCircle icon and "Sign-in failed. Please try again." appears when `?error=` query param is present. Touch target: `min-h-[44px]` (iOS HIG).
- **`src/app/(auth)/login/page.tsx`** — Full-height login screen (`min-h-dvh flex flex-col items-center justify-center`). Two decorative blur blobs (50vw, `blur-[120px]`): top-left `bg-secondary/10`, bottom-right `bg-primary-container/30`. Logo: 80x80 `rounded-xl bg-primary-container emerald-glow` with `fitness_center` Material Symbol placeholder (ICON-01). Heading: "SweatStakes" at `text-5xl font-bold`. Tagline: "Your friends are watching. Are you?" Glass panel card (`glass-panel rounded-xl border-outline-variant/15`) wrapping GoogleSignInButton in a Suspense boundary. No animations (D-04).

**`src/app/layout.tsx` updated** — Material Symbols Outlined font loaded via Google Fonts `<link>` in `<head>` for nav icons and placeholder icons.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| `fitness_center` Material Symbol icon | `src/app/(auth)/login/page.tsx` | 17 | Intentional placeholder (ICON-01). Will be replaced with Nano Banana asset in a future plan per icon inventory tracking. |

## Threat Flags

None — all threat model items from the plan were addressed:
- T-01-03: `getUser()` used in proxy.ts (JWT server-side validation, not cookie trust)
- T-01-04: Dynamic `origin` from request headers — no hard-coded URLs
- T-01-05: proxy.ts protects all 4 routes (/dashboard, /streaks, /feed, /settings)
- T-01-06: Generic error messages only — no internal error details exposed
- T-01-07: `@supabase/ssr` sets httpOnly/secure/sameSite=lax cookies; proxy.ts returns `supabaseResponse` (not new NextResponse) to preserve cookie writes

## Self-Check: PASSED

All 7 created files verified on disk:
- `src/lib/supabase/server.ts` — FOUND
- `src/lib/supabase/client.ts` — FOUND
- `src/lib/actions/auth.ts` — FOUND
- `src/app/auth/callback/route.ts` — FOUND
- `proxy.ts` — FOUND
- `src/app/(auth)/login/page.tsx` — FOUND
- `src/components/auth/google-sign-in-button.tsx` — FOUND

Both task commits verified in git log:
- `ebef649` — feat(01-02): create Supabase client factories, proxy.ts, and auth server actions
- `6764535` — feat(01-02): build login screen with themed Google sign-in button

Key content verified:
- `createServerClient` present in server.ts
- `createBrowserClient` present in client.ts
- `export async function proxy` present in proxy.ts (not `middleware`)
- `getUser()` present in proxy.ts (not `getSession()`)
- `'use server'` present in actions/auth.ts
- `signInWithOAuth` + `provider: 'google'` present in actions/auth.ts
- `exchangeCodeForSession` present in callback/route.ts
- `SweatStakes` + `Your friends are watching` present in login/page.tsx
- `glass-panel` + `emerald-glow` + `blur-[120px]` present in login/page.tsx
- `from-secondary to-on-tertiary-container` + `text-on-secondary-fixed` present in google-sign-in-button.tsx
- `Loader2` + `AlertCircle` + `aria-busy` + `role="alert"` present in google-sign-in-button.tsx
- `Material+Symbols+Outlined` present in layout.tsx
- No `animate`/`transition`/`motion` in login/page.tsx
- `vitest run` exits 0 (2/2 tests pass)
