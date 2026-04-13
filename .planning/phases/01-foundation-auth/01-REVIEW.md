---
phase: 01-foundation-auth
reviewed: 2026-04-12T00:00:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - proxy.ts
  - src/app/(auth)/login/page.tsx
  - src/app/(protected)/dashboard/page.tsx
  - src/app/(protected)/feed/page.tsx
  - src/app/(protected)/layout.tsx
  - src/app/(protected)/settings/page.tsx
  - src/app/(protected)/streaks/page.tsx
  - src/app/auth/callback/route.ts
  - src/app/layout.tsx
  - src/app/manifest.ts
  - src/components/auth/google-sign-in-button.tsx
  - src/components/auth/sign-out-button.tsx
  - src/components/layout/bottom-nav.tsx
  - src/lib/actions/auth.ts
  - src/lib/supabase/client.ts
  - src/lib/supabase/server.ts
  - tests/auth.test.ts
findings:
  critical: 2
  warning: 3
  info: 4
  total: 9
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-12
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

This phase delivers the authentication foundation: Supabase-backed OAuth via Google, route protection in `proxy.ts`, a sign-out flow, the bottom navigation shell, and PWA manifest. The overall structure is sound — `getUser()` is used correctly instead of `getSession()`, the cookie-passing pattern in both `proxy.ts` and `server.ts` follows the `@supabase/ssr` spec, and the defense-in-depth auth check in the protected layout is a good practice.

Two critical issues need fixing before this goes live. The first is an open-redirect vulnerability in the OAuth callback route that allows an attacker to craft a link that redirects users to an arbitrary external domain. The second is a missing environment variable guard that will produce a confusing runtime crash rather than a clear startup error when `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are absent.

Three warnings cover: the `origin` header being the sole trust anchor for the OAuth redirect URI (spoofable in certain deployment contexts), an unhandled error path that silently swallows sign-out failures, and a `next` query parameter in the callback route that is accepted without validation, potentially redirecting users off-domain.

---

## Critical Issues

### CR-01: Open Redirect in OAuth Callback via Unvalidated `next` Parameter

**File:** `src/app/auth/callback/route.ts:7`

**Issue:** The `next` query parameter is read from the incoming URL and appended directly to `origin` to form the redirect destination after a successful OAuth code exchange. There is no validation that `next` starts with `/`. An attacker who crafts a link like:

```
https://sweatstakes.app/auth/callback?code=<valid>&next=//evil.com/phish
```

will redirect the authenticated user to `https://sweatstakes.app//evil.com/phish`. Many browsers treat `//evil.com` as protocol-relative (i.e., `https://evil.com`), making this a working open redirect that can be used for phishing after a legitimate Google OAuth flow. The comment says "generic error, no internals exposed" but the redirect destination is never validated at all.

**Fix:** Validate that `next` is a relative path (starts with `/`) and does not start with `//`. Reject anything that does not pass:

```typescript
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'

  // Validate: must be a relative path, must not be protocol-relative (//)
  const next =
    rawNext.startsWith('/') && !rawNext.startsWith('//')
      ? rawNext
      : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=AuthCallbackFailed`)
}
```

---

### CR-02: Missing Environment Variable Guard — Runtime Crash with Opaque Error

**Files:** `src/lib/supabase/client.ts:4-6`, `src/lib/supabase/server.ts:6-8`, `proxy.ts:10-11`

**Issue:** All three Supabase client factories use the non-null assertion operator (`!`) on `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`. When either variable is missing (missing `.env.local`, a Vercel deploy with misconfigured env vars, a fresh clone without setup), `createBrowserClient` or `createServerClient` receives `undefined` and throws a deeply nested error message that gives no hint about what went wrong. This will crash the entire app — including the login page — with a confusing stack trace pointing into `@supabase/ssr` internals.

**Fix:** Add an explicit early check at module load time in each factory, or in a shared `validate-env.ts` that is imported once at the app root. The simplest approach is to add guards to the two library files:

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Copy .env.local.example to .env.local and fill in the values.'
  )
}

export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey)
```

Apply the same guard in `src/lib/supabase/server.ts` and `proxy.ts`. This surfaces the configuration problem immediately with a human-readable message instead of a cryptic library crash.

---

## Warnings

### WR-01: OAuth Redirect URI Built from `origin` Header — Spoofable in Some Environments

**File:** `src/lib/actions/auth.ts:9-10`

**Issue:** The redirect URI passed to Supabase is assembled from the `origin` header of the incoming request:

```typescript
const origin = requestHeaders.get('origin')
// ...
redirectTo: `${origin}/auth/callback`,
```

In production on Vercel, the `origin` header is set by the browser and will normally be the app's real domain. However, if the app is ever placed behind a misconfigured proxy, or if an attacker can make a crafted server-to-server request, the `origin` header can be anything. If `origin` is `null` (e.g., same-origin form POSTs from certain browser contexts or non-browser clients), the redirect URI becomes `null/auth/callback`, which is a malformed URL that will cause a confusing OAuth failure.

Additionally, `origin` can be `null` for requests from opaque origins (e.g., a `data:` URL or `<iframe sandbox>`), producing a redirect URI of `"null/auth/callback"` as a literal string.

**Fix:** Use a hardcoded `NEXT_PUBLIC_SITE_URL` environment variable as the source of truth for the redirect URI, falling back to `origin` only in development:

```typescript
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  requestHeaders.get('origin') ||
  'http://localhost:3000'

// ...
redirectTo: `${siteUrl}/auth/callback`,
```

Add `NEXT_PUBLIC_SITE_URL=https://sweatstakes.app` to `.env.local.example` and Vercel env config. This is also the standard pattern recommended in the Supabase Next.js quickstart.

---

### WR-02: `signOutAction` Ignores Supabase Sign-Out Error

**File:** `src/lib/actions/auth.ts:27-30`

**Issue:** The sign-out Server Action calls `supabase.auth.signOut()` and discards the result entirely before redirecting to `/login`:

```typescript
export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()   // error is silently dropped
  redirect('/login')
}
```

If the sign-out request fails (e.g., network error, Supabase is unreachable), the session cookie is NOT cleared but the user is still redirected to `/login`. From `/login`, the proxy will redirect them back to `/dashboard` because their session cookie is still valid. The user appears stuck in a redirect loop with no error shown. The client-side `SignOutButton` catch block also swallows the error silently (`catch { setLoading(false) }`), so the user sees the button return to its default state with no feedback.

**Fix:** Capture and surface the error. Since `redirect()` cannot be called in a try-catch in Server Actions (it throws an internal `NEXT_REDIRECT` error), check the result before redirecting:

```typescript
export async function signOutAction() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) {
    redirect('/login?error=SignOutFailed')
  }
  redirect('/login')
}
```

Also update `SignOutButton` to display the error query param similarly to how `GoogleSignInButton` already shows `errorParam`.

---

### WR-03: `proxy.ts` Route Matcher Does Not Exclude `/auth/callback`

**File:** `proxy.ts:57-59`

**Issue:** The `config.matcher` regexp matches all routes except static assets. This means `/auth/callback` runs through `proxy()` on every OAuth callback request. Inside `proxy()`, `supabase.auth.getUser()` is called, which makes a network request to Supabase to validate the JWT. At the point the callback is hit, the session cookie has not yet been set (that happens inside `route.ts` via `exchangeCodeForSession`), so `getUser()` will return `user: null`. The proxy then sees a null user on a non-protected, non-login path and falls through to `return supabaseResponse` — which is correct behavior. However, this adds a redundant Supabase network round-trip on every OAuth callback, and if the JWT validation latency causes a timeout, it can silently fail the callback before the session is established.

This is not a security issue (the redirect logic is correct), but it is a reliability concern in latency-sensitive callback flows.

**Fix:** Exclude `/auth/` from the proxy matcher explicitly:

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## Info

### IN-01: `<img>` Tag Used for User Avatar Instead of `next/image`

**File:** `src/app/(protected)/dashboard/page.tsx:18-23`

**Issue:** The avatar image uses a plain `<img>` tag with an external URL from Google's CDN. Next.js recommends `next/image` (`<Image>`) for external images because it handles lazy loading, prevents layout shift, and respects the image optimization pipeline. Using a bare `<img>` tag for external URLs also bypasses the `next.config` `images.remotePatterns` allowlist, which means there is no declarative record of which external image domains are trusted.

**Fix:**

```tsx
import Image from 'next/image'

// ...
<Image
  src={avatarUrl}
  alt={`${firstName}'s avatar`}
  width={40}
  height={40}
  className="rounded-full object-cover"
  referrerPolicy="no-referrer"
/>
```

Add `lh3.googleusercontent.com` to `images.remotePatterns` in `next.config.ts`.

---

### IN-02: Hardcoded Hex Color in `bottom-nav.tsx`

**File:** `src/components/layout/bottom-nav.tsx:21`

**Issue:** The nav background uses `bg-[#002366]/80` — a hardcoded hex value. The project's design token system (Tailwind v4 `@theme` with CSS variables) exists specifically to avoid this. If the brand color changes, this will be missed.

**Fix:** Define a semantic token in the CSS theme (e.g., `--color-navy: #002366`) and use `bg-navy/80` instead of the inline arbitrary value.

---

### IN-03: Test Reads Files by Relative Path — Fragile When Run from Non-Root CWD

**File:** `tests/auth.test.ts:7-8` (and throughout)

**Issue:** Every test uses `fs.readFileSync('proxy.ts', 'utf-8')` and similar relative paths. These paths resolve relative to `process.cwd()`, which is the directory Vitest was launched from. If the test runner is invoked from a subdirectory (e.g., inside a monorepo or a CI matrix step that `cd`s into a sub-path), all tests will fail with `ENOENT`. More importantly, the tests are testing file content by string-matching, which is a brittle pattern — a comment change or whitespace refactor will not break behavior but could trip these tests.

**Fix:** Use `path.resolve(__dirname, '../proxy.ts')` (or `import.meta.url` with `fileURLToPath` for ESM) to construct absolute paths. This is safe regardless of working directory:

```typescript
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// then:
fs.readFileSync(path.join(ROOT, 'proxy.ts'), 'utf-8')
```

---

### IN-04: `GoogleSignInButton` Error State Persists Across Page Navigations

**File:** `src/components/auth/google-sign-in-button.tsx:23`

**Issue:** The error state is read from `useSearchParams()` — the `?error=` query param. This means if a user lands on `/login?error=AuthCallbackFailed`, clicks "Sign in with Google" (which triggers a redirect away from the page), and then returns, the `?error=` param will still be in the URL and the error message will re-appear even if the last sign-in attempt was fine. This is a minor UX issue, not a security issue, but it can confuse users.

**Fix:** After the user initiates sign-in (in `handleSubmit`), use `router.replace('/login')` to strip the error param from the URL before navigating to Google:

```typescript
import { useRouter } from 'next/navigation'

const router = useRouter()

const handleSubmit = async () => {
  setLoading(true)
  router.replace('/login') // clear error param
  try {
    await signInWithGoogleAction()
  } catch {
    setLoading(false)
  }
}
```

---

_Reviewed: 2026-04-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
