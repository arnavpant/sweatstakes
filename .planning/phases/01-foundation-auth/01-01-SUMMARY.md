---
phase: 01-foundation-auth
plan: "01"
subsystem: scaffold
tags: [next.js, tailwind-v4, shadcn, vitest, design-system, royale-theme]
dependency_graph:
  requires: []
  provides: [next-js-scaffold, tailwind-v4-royale-tokens, shadcn-components, vitest-infrastructure]
  affects: [01-02, 01-03, 01-04]
tech_stack:
  added:
    - Next.js 16.2.3 (App Router, TypeScript, Turbopack)
    - React 19.2
    - Tailwind CSS v4
    - shadcn/ui (button, card, input — Base UI December 2025 rebuild)
    - "@supabase/supabase-js ^2.103.0"
    - "@supabase/ssr ^0.10.2"
    - drizzle-orm ^0.45.2
    - drizzle-kit (dev)
    - react-hook-form v7
    - zod v4
    - "@hookform/resolvers"
    - zustand v4
    - lucide-react v1.8.0
    - vitest v4.1.4
    - "@testing-library/react"
    - "@testing-library/jest-dom"
    - happy-dom (replaces jsdom — ESM compat fix for Node 22.11)
    - "@vitejs/plugin-react"
  patterns:
    - Tailwind v4 @theme for design tokens (CSS-native, no JS config)
    - Plus Jakarta Sans via next/font/google (zero layout shift)
    - viewport-fit cover + env(safe-area-inset-*) for iOS safe areas
    - shadcn CLI component generation into src/components/ui/
    - vitest.config.mts (ESM format) with happy-dom environment
key_files:
  created:
    - src/app/globals.css (Royale token system — 50+ color tokens, radius, font)
    - src/app/layout.tsx (root layout: Plus Jakarta Sans, viewport, Apple web app meta)
    - src/app/page.tsx (redirect to /login)
    - src/components/ui/button.tsx (shadcn Button)
    - src/components/ui/card.tsx (shadcn Card)
    - src/components/ui/input.tsx (shadcn Input)
    - src/lib/utils.ts (shadcn cn utility)
    - components.json (shadcn configuration)
    - vitest.config.mts (test config with happy-dom)
    - tests/setup.ts (@testing-library/jest-dom setup)
    - tests/smoke.test.ts (2 smoke tests — both passing)
    - .env.local.example (Supabase env var template)
    - .gitignore (protects .env.local — T-01-01 mitigation)
    - package.json
    - tsconfig.json
    - next.config.ts
    - postcss.config.mjs
    - eslint.config.mjs
  modified: []
decisions:
  - "Used happy-dom instead of jsdom: jsdom 27 pulls in @asamuzakjp/css-color which CJS-requires ESM-only @csstools/css-calc — crashes on Node 22.11. happy-dom has no such dependency and works cleanly with vitest 4.x."
  - "vitest.config.mts instead of vitest.config.ts: vitest 4.x ESM internals (std-env) require the config be loaded as ESM. Using .mts extension forces Vite to treat it as ES module."
  - "Removed shadcn default @theme inline block from globals.css: shadcn init appended oklch-based :root variables and an @theme inline block that would override the Royale color tokens. Kept only the shadcn imports (tw-animate-css) and our complete Royale @theme."
  - "Restored Plus Jakarta Sans after shadcn init overwrote layout.tsx with Geist font."
metrics:
  duration_minutes: 25
  completed_date: "2026-04-13"
  tasks_completed: 2
  tasks_total: 2
  files_created: 19
  files_modified: 2
---

# Phase 01 Plan 01: Next.js 16 Scaffold with Royale Design System Summary

**One-liner:** Next.js 16 bootstrapped with Tailwind v4 Royale token system (50+ Material Design 3 color tokens), shadcn/ui Button/Card/Input components, Plus Jakarta Sans typography, iOS safe area support, and vitest smoke test infrastructure — all passing build and test.

## What Was Built

A complete Next.js 16 project scaffold ready for authentication and feature development:

- **Design system:** Full Royale color token set in `globals.css` via Tailwind v4 `@theme` directive — dark navy (`#001233`) background, emerald green (`#66dd8b`) accent, blue-lavender (`#b3c5ff`) primary, plus glass-panel and emerald-glow utilities
- **Root layout:** Plus Jakarta Sans at weights 400/700 via `next/font/google`, viewport-fit cover for iOS safe areas, Apple web app metadata, `min-h-dvh` body
- **shadcn/ui:** Button, Card, and Input components initialized in `src/components/ui/` using the official shadcn CLI
- **Test infrastructure:** vitest 4.x with happy-dom environment, @testing-library/jest-dom matchers, 2 smoke tests passing in ~1.5s
- **Security:** `.gitignore` covering `.env*.local`, `.env.local.example` with placeholder-only values (T-01-01 mitigated)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] shadcn init overwrote globals.css and layout.tsx**
- **Found during:** Task 2
- **Issue:** `npx shadcn@latest init` appended its default shadcn token system (oklch-based `:root` variables + `@theme inline` block) to globals.css, overriding Royale color tokens. It also replaced Plus Jakarta Sans with Geist in layout.tsx.
- **Fix:** After shadcn init completed, restored globals.css with Royale @theme (kept `@import "tw-animate-css"` that shadcn added). Restored layout.tsx to use only Plus Jakarta Sans.
- **Files modified:** `src/app/globals.css`, `src/app/layout.tsx`
- **Commit:** ceebcb7

**2. [Rule 3 - Blocking] jsdom 27 ESM incompatibility on Node 22.11**
- **Found during:** Task 2
- **Issue:** jsdom 27 depends on `@asamuzakjp/css-color` which CJS-requires `@csstools/css-calc` (an ESM-only `.mjs` file). Node 22.11 does not support `require()` of ESM modules (this was fixed in Node 22.13). vitest crashed before running a single test.
- **Fix:** Replaced `jsdom` with `happy-dom` in vitest config. happy-dom has no such dependency chain and works cleanly with vitest 4.x on Node 22.11.
- **Files modified:** `vitest.config.mts`
- **Commit:** ceebcb7

**3. [Rule 3 - Blocking] vitest.config.ts → vitest.config.mts (ESM format)**
- **Found during:** Task 2
- **Issue:** vitest 4.x internals (specifically `std-env`) are ESM-only. When Vite tries to load `vitest.config.ts` in CJS mode, it hits `require()` of an ESM package and crashes immediately.
- **Fix:** Renamed config to `vitest.config.mts` — the `.mts` extension signals to Vite that this is an ES module. Replaced `path.resolve(__dirname, ...)` with `fileURLToPath(new URL('./src', import.meta.url))`.
- **Files modified:** `vitest.config.mts` (replaces `vitest.config.ts`)
- **Commit:** ceebcb7

**4. [Rule 2 - Missing critical] Created .gitignore**
- **Found during:** Task 1
- **Issue:** The `.gitignore` was not present in the project root (the create-next-app ran in a subdirectory, so its auto-generated .gitignore was not moved over). T-01-01 threat model requires `.env.local` be protected from accidental commits.
- **Fix:** Created standard Next.js `.gitignore` including `.env*.local` patterns.
- **Files modified:** `.gitignore`
- **Commit:** 8d06c7d

## Known Stubs

None — this plan delivers infrastructure only. No UI rendering or data display.

## Threat Flags

None — all threat model items from the plan were addressed:
- T-01-01: `.env.local.example` contains placeholder values only; `.env.local` is in `.gitignore`
- T-01-02: `NEXT_PUBLIC_` prefix documented for client-safe anon key; no server secrets in example file

## Self-Check: PASSED

All 12 key files exist on disk. Both task commits verified in git log:
- `8d06c7d` — scaffold commit
- `ceebcb7` — shadcn + vitest commit

Key content verified:
- `--color-background: #001233` present in globals.css
- `Plus_Jakarta_Sans` present in layout.tsx
- `viewportFit: 'cover'` present in layout.tsx
- `redirect('/login')` present in page.tsx
- `happy-dom` environment in vitest.config.mts
- `npx vitest run` exits 0 (2/2 tests pass)
- `npm run build` exits 0 (static build succeeds)
