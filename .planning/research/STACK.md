# Technology Stack: SweatStakes

**Project:** SweatStakes — mobile-first fitness accountability web app
**Researched:** 2026-04-12
**Overall confidence:** HIGH (core stack verified via official docs and multiple sources)

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 16 (latest stable, released Oct 2025) | Full-stack React framework | App Router + Server Components + Server Actions give you SSR, auth-protected routes, and form handling without a separate API layer. Turbopack is now the default bundler (2-5x faster builds). The largest ecosystem, most Supabase + Tailwind examples, and Vercel deployment is zero-config. |
| React | 19.2 (ships with Next.js 16) | UI rendering | Required by Next.js 16. React Compiler (stable in v16) auto-memoizes components — no manual `useMemo`/`useCallback` for the points economy UI. |
| TypeScript | 5.x (min 5.1 per Next.js 16 requirement) | Type safety | Non-negotiable for a points economy with complex state. Type the Supabase schema with `supabase gen types typescript`. |

**Why Next.js 16 over alternatives:**
- SvelteKit has smaller bundle size, but Supabase's SSR helpers (`@supabase/ssr`) are Next.js App Router-first. All official Supabase tutorials and Vercel starter templates target Next.js.
- Remix is excellent for web-standard forms but offers no advantage here — Next.js Server Actions cover the same use case with better Supabase integration.
- **Do not start on Next.js 15.x** — Next.js 16 dropped support for sync `params`/`searchParams` and removed `middleware.ts` (renamed to `proxy.ts`). Starting on 16 avoids a breaking migration mid-project.

**Breaking change to know:** `middleware.ts` is deprecated in Next.js 16; use `proxy.ts`. Auth route protection must use `proxy.ts`.

---

### Backend & Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase | Latest (managed, no version to pin) | Database, Auth, Storage, Realtime | One platform covers everything SweatStakes needs: PostgreSQL for the points ledger and group data, Auth with Google + Apple OAuth built-in, Storage for photo check-ins with on-platform image transformation, and Realtime for the activity feed. Free tier is sufficient for a personal project (500 MB DB, 1 GB storage, 50K MAU). |
| `@supabase/ssr` | latest | Next.js 16 server-side auth | Required package for cookie-based session management in App Router. Replaces the deprecated `@supabase/auth-helpers-nextjs`. |
| `@supabase/supabase-js` | latest | Supabase JS client | Standard client library — used in both server components and client components. |

**Why Supabase over Firebase:**
- PostgreSQL relational model is the right fit for SweatStakes' data: users → groups → workouts → points transactions → redemptions. Modeling this in Firestore's document model requires denormalization hacks.
- Supabase Realtime uses Postgres changes (WebSocket over existing DB) vs Firebase requiring a separate NoSQL database structure designed around real-time.
- Apple Sign-In on the web works natively via Supabase Auth (critical: Apple requires re-generating the secret key every 6 months — calendar this).
- Supabase Storage has built-in image transformation (resize, WebP conversion) on the Pro plan; free tier supports direct upload up to 50 MB per file.

**Why not PlanetScale:** No free tier anymore ($34/month minimum), no auth, no storage, no realtime — you'd need to assemble the entire backend from separate services.

---

### ORM / Database Access

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Drizzle ORM | latest (`drizzle-orm`, `drizzle-kit`) | Type-safe SQL queries | Drizzle is SQL-first: schema defined in TypeScript files, queries look like SQL. ~90% smaller bundle than Prisma, no binary engine, critical for Next.js serverless/edge compatibility. Cold starts stay under 500ms vs 1-3s with Prisma. |

**Why Drizzle over Prisma:**
Prisma's engine binary adds significant cold-start latency on Vercel serverless functions. For SweatStakes (personal project, potentially going public on Vercel), Drizzle is the right default. Drizzle integrates natively with Zod for schema validation and generates types that match Supabase's PostgreSQL schema.

**Note:** Supabase also provides auto-generated TypeScript types via `supabase gen types typescript`. Use these for Supabase client operations (Realtime, Auth, Storage) and Drizzle for complex server-side queries (leaderboard calculations, ledger aggregations).

---

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | v4 (stable, released Jan 2025; v4.2 Feb 2026) | Utility-first CSS | Required by the Stitch/Royale design — the project already specifies Tailwind with a custom Material Design 3 color token system. Tailwind v4 moves config from `tailwind.config.js` into CSS `@theme` directives, which maps naturally to the dark navy + emerald green design tokens. v4's CSS-native config means defining `--color-navy: #001233` and `--color-emerald: #50C878` directly in CSS, no JavaScript config file needed. |
| shadcn/ui | Latest (December 2025 rebuild on Base UI) | Accessible component primitives | Provides the unstyled, accessible primitives (dialogs, sheets, bottom drawers, avatars) that you restyle to match the Royale theme. Components are copied into your project — full ownership. The December 2025 rebuild targets Base UI for better accessibility. Use this for structural components (modals, sheets, form fields), not for design-specific components (those come from the Stitch design). |

**Tailwind v4 key change:** No `tailwind.config.js`. All configuration lives in your main CSS file via `@import "tailwindcss"` and `@theme {}` blocks. The upgrade tool (`@tailwindcss/upgrade`) automates migration if you start with v3 templates.

**Browser support for Tailwind v4:** Safari 16.4+, Chrome 111+, Firefox 128+. This aligns with Next.js 16's own browser requirements and covers all modern mobile browsers.

---

### Component Library & UI

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| shadcn/ui | Latest | Accessible primitives | See above. |
| `lucide-react` | latest | Icons | Works well alongside Material Symbols (specified in Stitch design). Use Material Symbols for the 5 nav icons (per the Stitch design), Lucide for incidental UI icons. |
| `Plus Jakarta Sans` | Via Google Fonts / `next/font` | Typography | Specified in the Stitch Royale design. Load via `next/font/google` for zero layout shift. |

**Do not use:** MUI (Material UI), Chakra UI, Mantine, or any other full component library. These impose their own design systems that will conflict with the Royale theme. shadcn/ui's copy-paste model is the right fit because you own all the component code.

---

### Forms & Validation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `react-hook-form` | v7 | Form state management | Industry standard for React forms in 2025. Minimal re-renders (only affected fields), integrates with Zod via `@hookform/resolvers`. |
| `zod` | v3 | Schema validation | Single source of truth for TypeScript types AND runtime validation. Validate the same schema on both client (react-hook-form) and server (Server Actions). Critical for the points economy — validate workout submissions, goal stepper values, and reward costs. |
| `@hookform/resolvers` | latest | Bridge between react-hook-form and Zod | Required glue package. |

---

### Data Fetching & State

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TanStack Query (React Query) | v5 | Client-side data fetching and caching | Used for optimistic updates on the activity feed (Hype/Nudge reactions), activity feed pagination, and any UI that needs cache invalidation after mutations. 12.3M weekly downloads, growing 60% YoY. The activity feed is the core UI that needs client-side optimism, not full-page SSR reload. |
| Zustand | v4 | Global client-side state | For lightweight cross-component state: camera capture state, current group context, notification preferences. ~3KB bundle. Avoid Redux — this project has no enterprise-scale complexity that justifies Redux's boilerplate. |
| Next.js Server Actions | Built-in | Mutations (form submissions, reactions) | For all write operations: submitting a check-in, redeeming points, adding a reward menu item. Server Actions eliminate the need for a separate API routes layer for these operations. |

**Do not use:** Redux Toolkit — overkill for a personal-to-small-group app. The combination of Server Actions (writes) + TanStack Query (reads with cache) + Zustand (UI state) covers all state needs.

---

### Camera & Photo

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `MediaDevices.getUserMedia()` | Browser API | Camera access for check-ins | The native Web API — no library needed. Use `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })` to default to rear camera on mobile. Requires HTTPS (handled by Vercel). |
| `browser-image-compression` | latest | Client-side compression before upload | Compress photos to under 500KB before uploading to Supabase Storage. This prevents bloating the 1GB free storage tier. Uses the browser's native `HTMLCanvasElement.toBlob()` under the hood with OffscreenCanvas for non-blocking compression. |
| Supabase Storage | Built-in | Photo storage and serving | Upload compressed blobs directly from the browser client. Supabase Storage handles CDN delivery. Image transformation (resize to thumbnail, WebP conversion) is available on the Pro plan — defer until you exceed free tier. |

**Camera approach:** `getUserMedia` is the right choice over the `<input type="file" capture>` HTML approach because it gives you a live preview, the ability to retake, and in-browser capture without leaving the page — all aligned with the Stitch design's camera modal pattern.

**Security:** `getUserMedia` requires a secure context (HTTPS). Vercel provides HTTPS by default on all deployments, including preview branches.

---

### Authentication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase Auth | Built-in | Email/password + Google + Apple OAuth | All three auth methods are natively supported. Google OAuth works via standard web OAuth flow. Apple Sign-In requires a `.p8` signing key (critical: rotates every 6 months — set a calendar reminder). Session management via `@supabase/ssr` cookie-based sessions works seamlessly with Next.js App Router Server Components. |
| `@supabase/ssr` | latest | Session management in Next.js 16 | Handles the cookie-based session pattern required for App Router. The `proxy.ts` file (formerly `middleware.ts`) reads cookies to protect routes. |

**Apple Sign-In maintenance warning:** Apple's identity token does not include the user's full name. Collect the display name at first sign-in and save to your `users` table. The `.p8` signing key must be regenerated every 6 months — failure to do so will break Apple login for all users with no warning.

---

### Real-time

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase Realtime | Built-in | Activity feed updates | Supabase Realtime uses WebSockets to broadcast Postgres table changes. Subscribe to `INSERT` events on the `activity_feed` table to push new check-ins and reactions to group members. Free tier includes real-time; production pricing is $2.50/million messages and $10/1,000 peak connections — negligible at personal project scale. |

**Pattern:** Use Postgres Changes (subscribe to DB events) for the activity feed, not Broadcast (ephemeral messages). The data needs to persist in the database anyway; Postgres Changes gives you realtime delivery without duplicating data.

**Important:** Always query current state with a SELECT first, then subscribe to changes. This prevents missing updates that occur between page load and subscription establishment.

---

### Notifications

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Web Push API + Service Worker | Browser API | Push notifications for Hype/Nudge | PWA push notifications work on Android (any browser) and iOS 16.4+ (Safari, installed to home screen). For the initial personal-use version, in-app notifications via Supabase Realtime are sufficient. Add Web Push in a later phase when you want off-device nudges. |

**Note:** iOS push notifications for web apps require the PWA to be installed to the home screen (Add to Home Screen). For the initial version with known users (Arnav and friends), this is a manageable manual step. For going public, add a "Install this app" prompt.

---

### Infrastructure & Deployment

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | Hobby (free) → Pro ($20/month) | Hosting and deployment | Zero-config Next.js deployment. Automatic preview deployments per branch. Free tier is "personal and non-commercial" — fine for internal friend-group testing. Upgrade to Pro ($20/month) before any public launch (free tier ToS prohibits commercial/public use). |
| Vercel Hobby limits | — | Sufficient for v1 | 100GB bandwidth, 1M edge requests, 1M function invocations per month. More than enough for a friend group. |

**Alternative to consider:** Cloudflare Pages + Workers for cost optimization at scale. But for initial development, Vercel's DX advantage over any alternative is worth the simplicity. Revisit if you exceed Vercel's free tier or need lower latency globally.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 16 | SvelteKit 2 | Supabase SSR helpers and official templates are Next.js App Router-first. Smaller Svelte ecosystem means fewer examples for this exact auth + realtime + camera use case. |
| Framework | Next.js 16 | Remix | No advantage here — Server Actions cover Remix's form handling strength. Next.js has deeper Supabase integration docs. |
| Backend | Supabase | Firebase | PostgreSQL is the right model for relational points/ledger data. Firebase NoSQL requires denormalization workarounds for group-member-workout-points relationships. |
| Backend | Supabase | PlanetScale | PlanetScale has no free tier, no auth, no storage, no realtime. Would require 4+ additional services. |
| ORM | Drizzle | Prisma | Prisma's engine binary causes 1-3s cold starts on Vercel serverless. Drizzle is ~90% smaller with sub-500ms cold starts. Both work with Supabase PostgreSQL. |
| Styling | Tailwind v4 | Tailwind v3 | Project is greenfield — start on v4. The Stitch design's custom token system maps better to v4's CSS `@theme` approach than v3's JavaScript config. |
| Components | shadcn/ui | Radix UI directly | shadcn/ui wraps Radix with Tailwind-ready defaults. Same primitives, less manual wiring. |
| Components | shadcn/ui | MUI / Chakra | These impose their own design systems. Royale theme requires full design ownership. |
| State | Zustand | Redux Toolkit | Redux boilerplate is unjustified for a small-group app. Zustand is 3KB and handles all cross-component state needs. |
| State | Zustand | Jotai | Jotai's atom model is better for complex interdependencies. SweatStakes' state is simple enough for Zustand's store model. |
| Deployment | Vercel | Netlify | Vercel's Next.js integration is first-party. Netlify has Next.js support but edge cases occasionally break. |
| Deployment | Vercel | Railway / Fly.io | These are better for always-on servers. Vercel serverless is the right model for this app's traffic pattern. |

---

## Installation

```bash
# Bootstrap
npx create-next-app@latest sweatstakes --typescript --tailwind --eslint --app --src-dir --turbopack

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# ORM
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Forms and validation
npm install react-hook-form zod @hookform/resolvers

# Data fetching and state
npm install @tanstack/react-query zustand

# UI
npx shadcn@latest init
npm install lucide-react

# Image compression
npm install browser-image-compression
```

---

## Confidence Assessment

| Area | Confidence | Source | Notes |
|------|------------|--------|-------|
| Next.js 16 as framework | HIGH | Official nextjs.org/blog/next-16 (Oct 2025) | Stable release, breaking changes documented |
| Supabase for backend | HIGH | Official supabase.com docs + multiple community sources | Free tier limits verified: 500MB DB, 1GB storage, 50K MAU |
| Tailwind v4 stability | HIGH | Official tailwindcss.com/blog (Jan 2025, v4.2 Feb 2026) | Stable production release, v4.2 adds webpack plugin |
| Drizzle over Prisma | MEDIUM | Multiple community sources (makerkit.dev, bytebase.com) | Cold-start advantage is well-documented; Prisma Accelerate can mitigate but adds cost |
| TanStack Query v5 | HIGH | Official tanstack.com docs + 12.3M weekly downloads | Industry standard, v5 TypeScript inference is much improved |
| Zustand for state | HIGH | Multiple community sources, ~90% ecosystem consensus | "Default choice for 90% of React apps" per multiple 2025 sources |
| Supabase Realtime for feed | HIGH | Official supabase.com/docs/guides/realtime | Postgres Changes pattern is documented and production-ready |
| Apple OAuth 6-month rotation | HIGH | Official supabase.com/docs/guides/auth/social-login/auth-apple | This is a real operational requirement — do not skip |
| shadcn/ui December 2025 rebuild | MEDIUM | ui.shadcn.com/docs/changelog (Dec 2025) | Recent rebuild, may have minor rough edges; Base UI migration is noted as stable |
| Vercel free tier ToS | HIGH | vercel.com/pricing | Non-commercial use restriction is explicit; upgrade to Pro before public launch |

---

## Key Operational Warnings

1. **Apple Sign-In secret key expires every 6 months.** Set a calendar reminder on day 1. Failure = all Apple users locked out with no warning.

2. **Vercel Hobby plan prohibits commercial use.** Fine for personal testing. Upgrade to Pro ($20/month) before public launch.

3. **Supabase image transformations (resize/WebP) require Pro plan.** The free tier supports raw upload and serving only. Implement client-side compression via `browser-image-compression` from day 1 to stay within the 1GB free storage limit.

4. **Next.js 16 requires Node.js 20.9+.** Verify your local environment and any CI/CD pipelines before starting.

5. **`middleware.ts` is deprecated in Next.js 16** — create `proxy.ts` instead for auth route protection.

---

## Sources

- [Next.js 16 Release Blog](https://nextjs.org/blog/next-16) — Official, October 2025
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — Official breaking changes list
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs) — Official
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime) — Official
- [Supabase Storage Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations) — Official
- [Login with Apple — Supabase](https://supabase.com/docs/guides/auth/social-login/auth-apple) — Official, 6-month key rotation requirement
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) — Official, January 2025
- [shadcn/ui December 2025 Changelog](https://ui.shadcn.com/docs/changelog/2025-12-shadcn-create) — Official
- [TanStack Query Comparison](https://tanstack.com/query/v5/docs/react/comparison) — Official
- [Drizzle vs Prisma (makerkit.dev)](https://makerkit.dev/blog/tutorials/drizzle-vs-prisma) — MEDIUM confidence, community source
- [Vercel Pricing](https://vercel.com/pricing) — Official
- [MDN: MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) — Official
- [browser-image-compression on npm](https://www.npmjs.com/package/browser-image-compression) — Official package
