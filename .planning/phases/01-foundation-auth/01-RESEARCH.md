# Phase 1: Foundation & Auth - Research

**Researched:** 2026-04-12
**Domain:** Next.js 16 App Router + Supabase Auth (Google OAuth) + Tailwind v4 + PWA
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Loose inspiration from Stitch design — use Royale colors and typography but lay out the login screen from scratch, not a pixel-perfect copy
- **D-02:** Login screen elements: app logo/name ("SweatStakes"), tagline (Claude's discretion), Google sign-in button, dark navy gradient background
- **D-03:** Google sign-in button styled to match Royale theme (emerald green or glass-style with Google icon) — NOT the official white Google button
- **D-04:** No animation on the login screen — everything renders immediately
- **D-05:** After sign-in, user lands on an empty dashboard shell with the bottom navigation bar visible
- **D-06:** Bottom nav is functional — tapping each icon navigates to a real route, but non-dashboard pages show a "Coming soon" or empty placeholder state
- **D-07:** Dashboard shows the user's Google profile name and avatar in a personalized greeting (e.g., "Welcome, Arnav!")
- **D-08:** Empty state card on dashboard: "No active challenge yet. Invite friends to get started."
- **D-09:** Google sign-in failure shows an inline error message below the sign-in button (e.g., "Sign-in failed. Try again."). User stays on the login screen and retries.
- **D-10:** Expired session triggers a silent redirect to the login screen — no error message shown
- **D-11:** Full Royale token system wired up in Tailwind v4 @theme — all colors from the Stitch config (navy, emerald, surface hierarchy, etc.), Plus Jakarta Sans typography, border radius, spacing
- **D-12:** shadcn/ui initialized with core components (Button, Card, Input) restyled to Royale theme
- **D-13:** Claude picks placeholder icons for now. An icon/image inventory document must be created listing every icon and image used, so they can be replaced with Nano Banana assets later
- **D-14:** Loading indicators (spinners, etc.) should also be tracked in the icon inventory for potential Nano Banana replacement
- **D-15:** During Google OAuth processing, the sign-in button shows a small spinner and becomes disabled. Rest of the login screen stays visible.
- **D-16:** Page navigation loading indicator is Claude's discretion (top progress bar, none, etc.)
- **D-17:** Sign-out button lives on the Settings placeholder page
- **D-18:** After signing out, user is redirected to the login screen with no confirmation message
- **D-19:** Portrait orientation only — no special landscape handling
- **D-20:** Basic PWA manifest included: SweatStakes icon on home screen, standalone mode (no browser toolbar), dark navy status bar theme. Works on both iOS Safari and Android Chrome.
- **D-21:** Respect iPhone safe areas (notch, Dynamic Island, rounded corners) using CSS env(safe-area-inset-*)
- **D-22:** Default Vercel URL (e.g., sweatstakes.vercel.app) — no custom domain for now
- **D-23:** Real Supabase project from day one — database, Google OAuth, and auth all wired up end-to-end. No mock/stub auth.

### Claude's Discretion

- Tagline text on the login screen
- Page navigation loading indicator style
- Loading skeleton/spinner design details
- Exact spacing, padding, and layout proportions
- Placeholder page content for non-dashboard routes
- PWA icon design (will be tracked in icon inventory for Nano Banana swap)

### Deferred Ideas (OUT OF SCOPE)

- Custom domain
- Service worker for offline caching and push notifications (v2)
- Landscape orientation support
- Full PWA with service worker (v2)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can sign up and log in with Google sign-in (one-tap OAuth) | Google OAuth via Supabase Auth → `signInWithOAuth({ provider: 'google' })` + auth/callback route; see Architecture Patterns section |
| AUTH-02 | User session persists across browser refresh | Cookie-based session management via `@supabase/ssr` + `proxy.ts` session refresh on every request; see Architecture Patterns section |
</phase_requirements>

---

## Summary

Phase 1 establishes the entire technical foundation: project scaffolding, design system, authentication, and deployment. The stack is fully locked in CLAUDE.md (Next.js 16, Supabase, Tailwind v4, shadcn/ui), so research focuses on the exact implementation patterns for each layer rather than technology selection.

The most critical technical path is the Supabase Auth + Next.js 16 integration. Three files form the security backbone: `lib/supabase/server.ts` (server-side client), `lib/supabase/client.ts` (browser client), and `proxy.ts` (session refresh on every request). Next.js 16 renamed `middleware.ts` to `proxy.ts` and changed the exported function from `middleware` to `proxy` — this is a breaking change from all existing tutorials written for Next.js 13-15. [VERIFIED: WebSearch via securestartkit.com 2026 article]

Tailwind v4 uses CSS-first configuration (`@theme` in `globals.css`) instead of a `tailwind.config.js` file. The Stitch Royale color tokens map directly into this system and can be extracted verbatim from `stitch-copy-paste-code-inspiration.txt`. [VERIFIED: WebSearch via tailwindcss.com]

**Primary recommendation:** Bootstrap with the Supabase Next.js template (`npx create-next-app -e with-supabase`) as a structural reference, then replace its default styles with the full Royale token system from the Stitch file.

---

## Project Constraints (from CLAUDE.md)

All directives are locked. Research does not explore alternatives to these choices.

| Directive | Requirement |
|-----------|-------------|
| Framework | Next.js 16 (NOT 15.x) — `proxy.ts` not `middleware.ts` |
| Backend | Supabase (real project from day one, D-23) |
| Auth | Google OAuth only for v1 (no email/password, no Apple) |
| ORM | Drizzle ORM (drizzle-orm + drizzle-kit) |
| Styling | Tailwind v4 with CSS `@theme` directive |
| Components | shadcn/ui (latest, December 2025 Base UI rebuild) |
| Fonts | Plus Jakarta Sans via `next/font/google` |
| Auth package | `@supabase/ssr` (NOT deprecated `@supabase/auth-helpers-nextjs`) |
| Deployment | Vercel Hobby tier |
| Auth session | Cookie-based via `@supabase/ssr`, NOT localStorage |

---

## Standard Stack

### Core — Verified Versions

| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| next | 16.2.3 | Full-stack React framework | [VERIFIED: npm registry] |
| react | 19.2.5 | UI rendering | [VERIFIED: npm registry] |
| typescript | 5.x | Type safety | [VERIFIED: CLAUDE.md] |
| @supabase/supabase-js | 2.103.0 | Supabase JS client | [VERIFIED: npm registry] |
| @supabase/ssr | 0.10.2 | Next.js 16 server-side auth | [VERIFIED: npm registry] |
| tailwindcss | 4.2.2 | Utility-first CSS | [VERIFIED: npm registry] |
| drizzle-orm | 0.45.2 | Type-safe SQL queries | [VERIFIED: npm registry] |
| drizzle-kit | 0.31.10 | Drizzle schema + migrations CLI | [VERIFIED: npm registry] |

### UI & Forms — Verified Versions

| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| shadcn (CLI) | 4.2.0 | Accessible component primitives | [VERIFIED: npm registry] |
| lucide-react | 1.8.0 | Utility icons (non-nav) | [VERIFIED: npm registry] |
| react-hook-form | 7.72.1 | Form state management | [VERIFIED: npm registry] |
| zod | 4.3.6 | Schema validation | [VERIFIED: npm registry] |
| @hookform/resolvers | 5.2.2 | react-hook-form + Zod bridge | [VERIFIED: npm registry] |
| zustand | 5.0.12 | Global client-side state | [VERIFIED: npm registry] |

> Note: Phase 1 uses only Button, Card, Input from shadcn/ui. react-hook-form, zod, and zustand are installed now to avoid churn in later phases.

### Installation

```bash
# Step 1: Bootstrap Next.js 16 project
npx create-next-app@latest sweatstakes --typescript --tailwind --app --src-dir --import-alias "@/*"

# Step 2: Supabase packages
npm install @supabase/supabase-js @supabase/ssr

# Step 3: ORM (schema defined in Phase 1, migrations run when tables are needed)
npm install drizzle-orm
npm install -D drizzle-kit

# Step 4: shadcn/ui init (detects Tailwind v4 automatically)
npx shadcn@latest init -t next

# Step 5: Core shadcn components for Phase 1
npx shadcn@latest add button card input

# Step 6: Remaining stack (install now, use in later phases)
npm install react-hook-form zod @hookform/resolvers zustand lucide-react
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          # Login screen (Google button only)
│   ├── (protected)/
│   │   ├── layout.tsx            # Auth gate — redirects to /login if no session
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard shell with greeting + empty state
│   │   ├── streaks/
│   │   │   └── page.tsx          # Placeholder: "Coming soon"
│   │   ├── feed/
│   │   │   └── page.tsx          # Placeholder: "Coming soon"
│   │   └── settings/
│   │       └── page.tsx          # Settings placeholder with sign-out button
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          # Google OAuth code exchange
│   ├── globals.css               # Tailwind v4 @theme directives (Royale tokens)
│   ├── layout.tsx                # Root layout: font loading, metadata, viewport
│   └── manifest.ts               # PWA manifest (Next.js built-in)
├── components/
│   ├── ui/                       # shadcn/ui components (Button, Card, Input)
│   ├── layout/
│   │   └── bottom-nav.tsx        # Bottom navigation bar component
│   └── auth/
│       └── google-sign-in-button.tsx
├── lib/
│   ├── supabase/
│   │   ├── server.ts             # createServerClient (Server Components, Server Actions)
│   │   └── client.ts             # createBrowserClient (Client Components)
│   └── actions/
│       └── auth.ts               # signInWithGoogleAction, signOutAction (Server Actions)
├── proxy.ts                      # Session refresh + route protection (NOT middleware.ts)
└── docs/
    └── icon-inventory.md         # Tracks all icons/images/spinners for Nano Banana swap
```

### Pattern 1: Supabase SSR Client Setup

**What:** Two Supabase client factories — one for server contexts, one for browser contexts. Never use the same client in both environments.

**`lib/supabase/server.ts`** (Server Components, Server Actions, Route Handlers):
```typescript
// Source: supabase.com/docs/guides/auth/server-side/creating-a-client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignored in Server Components — proxy.ts handles cookie writes
          }
        },
      },
    }
  )
}
```

**`lib/supabase/client.ts`** (Client Components only):
```typescript
// Source: supabase.com/docs/guides/auth/server-side/creating-a-client
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
```

### Pattern 2: proxy.ts (Session Refresh + Route Protection)

**What:** Next.js 16 renamed `middleware.ts` to `proxy.ts` and `export function middleware` to `export function proxy`. This file runs on every request, refreshes the session cookie, and redirects unauthenticated users away from protected routes.

**Critical:** Return `supabaseResponse`, not a new `NextResponse.next()` — the response object carries the refreshed cookie. [VERIFIED: securestartkit.com 2026]

```typescript
// Source: securestartkit.com/blog/nextjs-proxy-ts-authentication (2026)
// proxy.ts — at project root (next to src/)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: use getUser(), not getSession() — getUser() validates JWT server-side
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  const protectedRoutes = ['/dashboard', '/streaks', '/feed', '/settings']
  const isProtected = protectedRoutes.some(r => path.startsWith(r))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (path === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### Pattern 3: Google OAuth Server Action + Callback Route

**What:** Two-step OAuth flow. Server Action initiates the redirect to Google. Callback route handler exchanges the one-time code for a session cookie.

**`lib/actions/auth.ts`** (Server Action):
```typescript
// Source: dev.to/mohamed3on — Google OAuth Next.js App Router (2025)
'use server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signInWithGoogleAction() {
  const supabase = await createClient()
  const requestHeaders = await headers()
  const origin = requestHeaders.get('origin')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error || !data.url) {
    return redirect('/login?error=OAuthSigninFailed')
  }

  redirect(data.url)
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

**`app/auth/callback/route.ts`** (Route Handler):
```typescript
// Source: dev.to/mohamed3on — Google OAuth Next.js App Router (2025)
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Exchange failed — return to login with error indicator
  return NextResponse.redirect(`${origin}/login?error=AuthCallbackFailed`)
}
```

### Pattern 4: Tailwind v4 Royale Theme Setup

**What:** All Royale design tokens go into `globals.css` using `@theme` directive. No `tailwind.config.js` needed. Tokens extracted from `stitch-copy-paste-code-inspiration.txt`.

```css
/* src/app/globals.css */
/* Source: stitch-copy-paste-code-inspiration.txt + tailwindcss.com/blog/tailwindcss-v4 */
@import "tailwindcss";

@theme {
  /* Colors — extracted verbatim from Stitch Royale config */
  --color-background: #001233;
  --color-surface: #001233;
  --color-surface-dim: #001233;
  --color-surface-container-lowest: #000d29;
  --color-surface-container-low: #071a3b;
  --color-surface-container: #0c1f40;
  --color-surface-container-high: #18294b;
  --color-surface-container-highest: #243456;
  --color-surface-variant: #243456;
  --color-surface-bright: #28395b;
  --color-primary: #b3c5ff;
  --color-primary-container: #002366;
  --color-primary-fixed: #dbe1ff;
  --color-primary-fixed-dim: #b3c5ff;
  --color-on-primary: #0d2c6e;
  --color-on-primary-container: #758dd5;
  --color-on-primary-fixed: #00174a;
  --color-on-primary-fixed-variant: #2a4386;
  --color-inverse-primary: #435b9f;
  --color-secondary: #66dd8b;
  --color-secondary-container: #25a55a;
  --color-secondary-fixed: #83fba5;
  --color-secondary-fixed-dim: #66dd8b;
  --color-on-secondary: #003919;
  --color-on-secondary-container: #003115;
  --color-on-secondary-fixed: #00210c;
  --color-on-secondary-fixed-variant: #005227;
  --color-tertiary: #66dd8b;
  --color-tertiary-container: #003014;
  --color-tertiary-fixed: #83fba5;
  --color-tertiary-fixed-dim: #66dd8b;
  --color-on-tertiary: #003919;
  --color-on-tertiary-container: #24a459;
  --color-on-tertiary-fixed: #00210c;
  --color-on-tertiary-fixed-variant: #005227;
  --color-on-background: #d8e2ff;
  --color-on-surface: #d8e2ff;
  --color-on-surface-variant: #c5c6d2;
  --color-inverse-surface: #d8e2ff;
  --color-inverse-on-surface: #1f3051;
  --color-surface-tint: #b3c5ff;
  --color-outline: #8e909c;
  --color-outline-variant: #444650;
  --color-error: #ffb4ab;
  --color-error-container: #93000a;
  --color-on-error: #690005;
  --color-on-error-container: #ffdad6;

  /* Border radius */
  --radius: 1rem;
  --radius-lg: 2rem;
  --radius-xl: 3rem;
  --radius-full: 9999px;

  /* Typography */
  --font-sans: 'Plus Jakarta Sans', sans-serif;
  --font-headline: 'Plus Jakarta Sans', sans-serif;
}

/* Glass panel utility */
@layer utilities {
  .glass-panel {
    background: rgba(12, 31, 64, 0.8);
    backdrop-filter: blur(20px);
  }
  .emerald-glow {
    box-shadow: 0 0 20px rgba(80, 200, 120, 0.15);
  }
}
```

### Pattern 5: PWA Manifest (Next.js Built-in)

**What:** Next.js App Router has a built-in `manifest.ts` convention — no plugin needed. Place `manifest.ts` in `src/app/`. [VERIFIED: nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest]

```typescript
// src/app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SweatStakes',
    short_name: 'SweatStakes',
    description: 'Hold your friends accountable to their fitness goals',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#001233',
    theme_color: '#001233',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
```

**Viewport and safe area setup in root layout:**
```typescript
// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',           // Enables env(safe-area-inset-*) on iOS
  themeColor: '#001233',
}

export const metadata: Metadata = {
  title: 'SweatStakes',
  description: 'Hold your friends accountable to their fitness goals',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',  // Lets app color show behind iOS status bar
    title: 'SweatStakes',
  },
}
```

**CSS safe area usage:**
```css
/* Apply to bottom-nav and any fixed bottom elements */
.bottom-nav {
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
}

/* Apply to page content that must not overlap bottom nav */
.page-content {
  padding-bottom: calc(5rem + env(safe-area-inset-bottom));
}
```

### Pattern 6: Bottom Nav (5 Routes)

The Stitch design defines 5 nav items. In Phase 1, only Dashboard is functional — the others show placeholder pages.

| Nav Label | Icon (Material Symbols) | Route | Phase 1 state |
|-----------|------------------------|-------|---------------|
| Sanctuary | `home` | `/dashboard` | Functional (greeting + empty state) |
| Streaks | `local_fire_department` | `/streaks` | Placeholder |
| Feed | `explore` | `/feed` | Placeholder |
| [Check-in] | `photo_camera` | `/check-in` (future) | Not shown in nav yet |
| Settings | `settings` | `/settings` | Placeholder with sign-out |

> The Stitch design shows 4 nav items + an active state pattern. The check-in button appears as a floating pill above the nav on the Feed screen, not as a 5th nav icon. Follow this pattern — bottom nav has 4 icons (Sanctuary, Streaks, Feed, Settings).

### Anti-Patterns to Avoid

- **Using `getSession()` server-side:** `getSession()` does NOT validate the JWT — it trusts the cookie without cryptographic verification. Always use `getUser()` on the server. [VERIFIED: Supabase docs warning]
- **Using `middleware.ts` instead of `proxy.ts`:** Next.js 16 renamed this file. Using the old name will cause the proxy to be silently ignored. [VERIFIED: WebSearch 2026]
- **Using `@supabase/auth-helpers-nextjs`:** This package is deprecated. Use `@supabase/ssr` only. [VERIFIED: CLAUDE.md]
- **Hard-coding `localhost` in redirectTo:** OAuth redirect URIs must be dynamic — use `origin` from request headers so both local dev and Vercel URLs work.
- **Tailwind v3 JS config pattern:** `tailwind.config.js` with `theme.extend.colors` does not work in Tailwind v4. All tokens go in `globals.css` via `@theme`.
- **Creating two Supabase client instances per request:** Each Server Component call to `createClient()` should share a single request scope. The `cookies()` function from `next/headers` is request-scoped.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session management | Custom JWT storage | `@supabase/ssr` cookie sessions | HttpOnly cookies, CSRF protection, automatic refresh |
| Route protection | Manual auth check in every page | `proxy.ts` + `(protected)` layout | Single enforcement point, never skipped |
| OAuth flow | Custom OAuth code | `supabase.auth.signInWithOAuth` | PKCE, token rotation, Supabase handles the complexity |
| Form validation | Custom validation logic | zod + react-hook-form | Type inference, re-render optimization, server-side reuse |
| Font loading | `<link>` tags in HTML | `next/font/google` | Zero layout shift, self-hosted automatically |
| PWA manifest | Static `public/manifest.json` | `app/manifest.ts` | Next.js validates the shape, TypeScript types |
| Accessible components | Custom dialog/button primitives | shadcn/ui | ARIA roles, keyboard nav, focus trapping done correctly |

---

## Common Pitfalls

### Pitfall 1: Google OAuth Redirect URI Mismatch

**What goes wrong:** Supabase rejects the OAuth callback with "redirect_uri_mismatch."
**Why it happens:** Supabase Dashboard → Authentication → URL Configuration only has `localhost:3000` registered. When deployed to Vercel, `sweatstakes.vercel.app/auth/callback` is not in the allowed list.
**How to avoid:** In Supabase Dashboard, add both:
- `http://localhost:3000/auth/callback` (local dev)
- `https://sweatstakes.vercel.app/auth/callback` (Vercel)
**Warning signs:** OAuth flow initiates but returns error on the callback URL.

### Pitfall 2: proxy.ts Not Matching the Right Routes

**What goes wrong:** Auth check never runs — users can access `/dashboard` without being logged in.
**Why it happens:** The `matcher` config in `proxy.ts` accidentally excludes routes (e.g., if it only matches `/api/*`).
**How to avoid:** Use the broad matcher pattern shown in Pattern 2. Always test a fresh incognito window after deploy.

### Pitfall 3: iOS Safari PWA — standalone Mode Not Activating

**What goes wrong:** After "Add to Home Screen," the app still opens in Safari with the browser toolbar visible.
**Why it happens:** `display: 'standalone'` requires the manifest to be served over HTTPS and linked in the HTML `<head>`. Next.js `manifest.ts` convention handles linking automatically, but only when the route returns a valid response.
**How to avoid:** Verify `/manifest.webmanifest` (not `/manifest.json`) returns a 200 with correct content-type. Next.js serves it at this path automatically.
**Warning signs:** Checking Chrome DevTools → Application → Manifest shows manifest not found.

### Pitfall 4: Tailwind v4 Class Not Applying

**What goes wrong:** Custom color classes like `bg-primary-container` render as transparent.
**Why it happens:** Tailwind v4 uses `--color-*` CSS custom property naming convention. A token named `--color-primary-container` generates the class `bg-primary-container`. If you accidentally use `--primary-container` (without `color-` prefix), no class is generated.
**How to avoid:** All color tokens in `@theme` must follow the pattern `--color-[name]: [value]`.
**Warning signs:** Class appears in the HTML but has no effect in browser dev tools.

### Pitfall 5: Safe Area Inset Not Applying

**What goes wrong:** Bottom nav is hidden behind the iPhone home indicator bar.
**Why it happens:** `env(safe-area-inset-bottom)` only works when `viewport-fit=cover` is set in the viewport meta tag.
**How to avoid:** Set `viewportFit: 'cover'` in the `viewport` export in `layout.tsx` (Pattern 5). Verify on a real iPhone or Safari's responsive design mode with a device that has a home indicator.

### Pitfall 6: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` vs `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**What goes wrong:** Auth calls fail in production because the wrong env var name is used.
**Why it happens:** Supabase recently introduced a new key type (`publishable key` with `sb_publishable_` prefix) alongside the legacy `anon key`. Both work, but variable names in tutorials are inconsistent.
**How to avoid:** Use whatever key name Supabase Dashboard provides. The Supabase Next.js quickstart now shows `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The `proxy.ts` example above uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` — ensure both patterns work or standardize on one. [VERIFIED: Supabase docs note both are supported during transition period]

---

## Code Examples

### Protecting a Server Component page
```typescript
// src/app/(protected)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // proxy.ts should prevent unauthenticated access, but defense-in-depth:
  if (!user) redirect('/login')

  return (
    <main>
      <h1>Welcome, {user.user_metadata.full_name?.split(' ')[0]}!</h1>
      {/* user.user_metadata.avatar_url for Google profile picture */}
    </main>
  )
}
```

### Google Sign-In Button (Client Component)
```typescript
// src/components/auth/google-sign-in-button.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { signInWithGoogleAction } from '@/lib/actions/auth'

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false)

  return (
    <form action={async () => {
      setLoading(true)
      await signInWithGoogleAction()
      // Note: signInWithGoogleAction calls redirect() — this line never runs on success
      setLoading(false)
    }}>
      <Button type="submit" disabled={loading} className="w-full ...royale styles...">
        {loading ? <Spinner /> : <GoogleIcon />}
        {loading ? 'Signing in...' : 'Continue with Google'}
      </Button>
    </form>
  )
}
```

### Supabase Dashboard Configuration Checklist (Manual Steps)
```
Supabase Dashboard → Authentication → Providers → Google:
  - Enable Google provider
  - Add Client ID (from Google Cloud Console)
  - Add Client Secret (from Google Cloud Console)

Supabase Dashboard → Authentication → URL Configuration:
  - Site URL: https://sweatstakes.vercel.app
  - Redirect URLs (add both):
    - http://localhost:3000/auth/callback
    - https://sweatstakes.vercel.app/auth/callback

Google Cloud Console → OAuth 2.0 → Authorized redirect URIs:
  - https://[your-supabase-project-ref].supabase.co/auth/v1/callback
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js 16 dev server | Yes | v22.11.0 | — |
| npm | Package installation | Yes | 10.9.0 | — |
| Supabase project | Auth, DB | Needs creation | Managed (no version) | No fallback — required |
| Vercel account | Deployment | Needs creation | Managed | No fallback — required |
| Google Cloud OAuth credentials | Google sign-in | Needs creation | — | No fallback — required for AUTH-01 |

**Missing dependencies with no fallback:**

All three external service setups (Supabase project, Vercel deployment, Google Cloud OAuth credentials) are human-performed one-time setup steps. They are not automated. The plan must include a wave that documents these steps and waits for credentials before code that depends on them can be tested end-to-end.

---

## Icon & Image Inventory (Required by D-13, D-14)

The plan must include creating `docs/icon-inventory.md` that tracks:

| Asset | Location | Type | Placeholder Source | Nano Banana Ready? |
|-------|----------|------|-------------------|-------------------|
| App logo/icon | Login screen branding area | Icon | Material Symbols: `fitness_center` | No |
| PWA icon 192x192 | `public/icon-192.png` | Image | Generated placeholder | No |
| PWA icon 512x512 | `public/icon-512.png` | Image | Generated placeholder | No |
| Google sign-in button icon | Login screen | SVG (Google logo) | Google SVG (from Stitch reference) | Possibly not — Google branding rules |
| Bottom nav: Sanctuary | Bottom nav bar | Icon | Material Symbols: `home` | No |
| Bottom nav: Streaks | Bottom nav bar | Icon | Material Symbols: `local_fire_department` | No |
| Bottom nav: Feed | Bottom nav bar | Icon | Material Symbols: `explore` | No |
| Bottom nav: Settings | Bottom nav bar | Icon | Material Symbols: `settings` | No |
| Sign-in spinner | Google sign-in button loading state | CSS/SVG spinner | CSS animation | No (D-14) |
| Dashboard avatar | User profile greeting | Image | `user.user_metadata.avatar_url` (Google) | No |

> Note: Google OAuth profile avatar comes from Google directly — no placeholder needed. But track it in the inventory so Nano Banana can replace it if a custom avatar is added later.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Not yet detected (greenfield project) |
| Config file | Wave 0: create `jest.config.ts` or use Next.js built-in with Vitest |
| Quick run command | `npx vitest run` (recommended) or `npx jest --passWithNoTests` |
| Full suite command | `npx vitest run` |

> Recommendation: Use Vitest — it integrates with Vite's bundling which Next.js 16 uses internally, and has first-class TypeScript support without babel transforms.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Google sign-in button triggers OAuth redirect | Manual (OAuth requires browser + real Google session) | — | N/A |
| AUTH-01 | `signInWithGoogleAction` builds correct `redirectTo` URL | Unit | `vitest run src/lib/actions/auth.test.ts` | Wave 0 |
| AUTH-01 | `auth/callback` route exchanges code for session | Unit (mock Supabase) | `vitest run src/app/auth/callback/route.test.ts` | Wave 0 |
| AUTH-02 | `proxy.ts` redirects unauthenticated request to /login | Unit (mock cookies) | `vitest run src/proxy.test.ts` | Wave 0 |
| AUTH-02 | `proxy.ts` allows authenticated request to pass through | Unit (mock cookies) | `vitest run src/proxy.test.ts` | Wave 0 |
| AUTH-02 | Authenticated user on /login redirected to /dashboard | Unit (mock cookies) | `vitest run src/proxy.test.ts` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose` (unit tests only, < 10s)
- **Per wave merge:** `npx vitest run` (full unit suite)
- **Phase gate:** Full suite green + manual Google OAuth smoke test in a browser

### Wave 0 Gaps

- [ ] `src/lib/actions/auth.test.ts` — covers AUTH-01 server action URL construction
- [ ] `src/app/auth/callback/route.test.ts` — covers AUTH-01 callback exchange
- [ ] `src/proxy.test.ts` — covers AUTH-02 route protection logic
- [ ] `vitest.config.ts` — Vitest configuration for Next.js
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Supabase Auth (OAuth 2.0 + PKCE) |
| V3 Session Management | Yes | `@supabase/ssr` HttpOnly cookie sessions |
| V4 Access Control | Yes | `proxy.ts` route protection + RLS on Supabase |
| V5 Input Validation | Minimal (Phase 1 has no forms beyond OAuth) | zod (available, not heavily used in this phase) |
| V6 Cryptography | Delegated | Supabase handles JWT signing and token rotation |

### Known Threat Patterns for Next.js + Supabase Auth

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Session fixation | Elevation of Privilege | Supabase invalidates old tokens on sign-in; `@supabase/ssr` manages rotation |
| CSRF on sign-out | Tampering | Use Server Actions (include CSRF protection via Next.js form action binding) |
| Open redirect after OAuth | Tampering | Validate `next` param — only accept paths starting with `/`, reject `//` or external URLs |
| JWT validation bypass | Spoofing | Use `getUser()` not `getSession()` on server (getUser validates signature) |
| Stale session in Server Component | Spoofing | `proxy.ts` refreshes session on every request before Server Components run |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` + `export function middleware` | `proxy.ts` + `export function proxy` | Next.js 16 (Oct 2025) | All pre-2025 Supabase/Next.js tutorials are broken for Next.js 16 |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | Supabase 2024 | Legacy package still installs but is deprecated |
| `tailwind.config.js` theme.extend.colors | `globals.css` `@theme {}` | Tailwind v4 (Jan 2025) | No config file needed; v3 config pattern doesn't work in v4 |
| `supabase.auth.getSession()` server-side | `supabase.auth.getUser()` | Supabase 2024 | `getSession()` doesn't validate JWT on server; security gap |
| shadcn/ui on Radix UI | shadcn/ui on Base UI | December 2025 | Better accessibility primitives; install command is still `npx shadcn@latest` |
| `manifest.json` in `/public` | `app/manifest.ts` TypeScript convention | Next.js 13.3+ | Type-safe, auto-linked in HTML head |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `proxy.ts` + `export function proxy` is the correct Next.js 16 pattern (not `middleware.ts`) | Architecture Patterns | If wrong, session refresh silently fails; all protected routes accessible without auth |
| A2 | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the env var name for new Supabase projects | Pattern 1 | Auth calls fail at runtime; fixable but requires env var rename |
| A3 | Vitest works with Next.js 16 without special configuration | Validation Architecture | Tests don't run; would switch to Jest with babel |

> A1 is HIGH confidence — verified from a 2026-dated article citing the Next.js 16 changelog. A2 is MEDIUM confidence — Supabase docs mention both old and new key names are supported. A3 is MEDIUM confidence — Vitest + Next.js is well-documented for v15 but v16 hasn't been explicitly verified.

---

## Open Questions

1. **Which Supabase env var name to standardize on?**
   - What we know: Both `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy) and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (new) work during a transition period
   - What's unclear: New Supabase projects — which key does the Dashboard present by default?
   - Recommendation: When creating the Supabase project, check the Dashboard → Settings → API and use whatever key name is shown. Document in `.env.local.example`.

2. **PWA icons for phase 1**
   - What we know: `manifest.ts` requires 192x192 and 512x512 PNG files in `/public`
   - What's unclear: What placeholder to use before Nano Banana assets are ready
   - Recommendation: Generate simple navy/emerald placeholder PNGs (even a solid color square) to satisfy the manifest. Track in icon inventory.

---

## Sources

### Primary (HIGH confidence)
- `stitch-copy-paste-code-inspiration.txt` — Royale color tokens, component patterns, bottom nav HTML structure [VERIFIED: local file]
- npm registry — All package versions verified via `npm view [package] version` [VERIFIED: npm registry]
- `supabase.com/docs/guides/auth/server-side/creating-a-client` — Server/browser client patterns, `getClaims()` usage [CITED: Supabase official docs]
- `nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest` — PWA manifest.ts convention [CITED: Next.js official docs]
- `ui.shadcn.com/docs/installation/next` — `npx shadcn@latest init -t next` command [CITED: shadcn/ui official docs]
- `tailwindcss.com/blog/tailwindcss-v4` — `@theme` directive, CSS-first config [CITED: Tailwind official blog]

### Secondary (MEDIUM confidence)
- `securestartkit.com/blog/nextjs-proxy-ts-authentication-how-to-protect-routes-with-supabase-2026` — Complete `proxy.ts` code pattern for Next.js 16 [WebSearch verified, 2026 article]
- `dev.to/mohamed3on` — Google OAuth Server Action + callback route pattern [WebSearch, community source, matches official Supabase patterns]

### Tertiary (LOW confidence)
- Medium article (securestartkit) on Next.js 16 middleware → proxy.ts rename [WebSearch only, corroborated by multiple sources]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry
- Authentication patterns: HIGH — verified against official Supabase docs + 2026 Next.js 16 article
- Tailwind v4 setup: HIGH — verified against official Tailwind docs and extracted tokens from project file
- proxy.ts pattern: MEDIUM-HIGH — key structural pattern confirmed, exact code from community source (not official docs)
- PWA setup: HIGH — native Next.js convention, official docs verified
- Testing framework: MEDIUM — Vitest recommendation based on ecosystem patterns, not Next.js 16 specific verification

**Research date:** 2026-04-12
**Valid until:** 2026-07-12 (90 days — stable stack, but verify proxy.ts pattern if Next.js releases a patch)
