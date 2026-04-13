# Icon & Image Inventory

> Source of truth for Nano Banana asset swaps.
> Updated each phase as new icons are introduced.

## Phase 1 — Foundation & Auth

| ID | Type | Current Asset | Location | Component File | Nano Banana Swap |
|----|------|---------------|----------|---------------|-----------------|
| ICON-01 | Material Symbol | `fitness_center` | Login screen — logo container | `src/app/(auth)/login/page.tsx` | Pending |
| ICON-02 | SVG | Google "G" logo (brand SVG) | Sign-in button | `src/components/auth/google-sign-in-button.tsx` | Keep as-is (brand requirement) |
| ICON-03 | lucide-react | `AlertCircle` | Sign-in error message | `src/components/auth/google-sign-in-button.tsx` | Pending |
| ICON-04 | lucide-react | `Loader2` (animated) | Sign-in button loading state | `src/components/auth/google-sign-in-button.tsx` | Pending |
| ICON-05 | lucide-react | `Loader2` (animated) | Sign-out button loading state | `src/components/auth/sign-out-button.tsx` | Pending |
| ICON-06 | Material Symbol | `group_add` | Dashboard empty state card | `src/app/(protected)/dashboard/page.tsx` | Pending |
| ICON-07 | Google profile picture | Dynamic (user's Google avatar) | Dashboard header | `src/app/(protected)/dashboard/page.tsx` | N/A — user data |
| ICON-08 | Material Symbol | `home` | Bottom nav — Home tab | `src/components/layout/bottom-nav.tsx` | Pending |
| ICON-09 | Material Symbol | `local_fire_department` | Bottom nav — Streaks tab | `src/components/layout/bottom-nav.tsx` | Pending |
| ICON-10 | Material Symbol | `explore` | Bottom nav — Feed tab | `src/components/layout/bottom-nav.tsx` | Pending |
| ICON-11 | Material Symbol | `settings` | Bottom nav — Settings tab | `src/components/layout/bottom-nav.tsx` | Pending |
| ICON-12 | lucide-react | `Construction` | Streaks/Feed/Settings placeholder pages | `src/app/(protected)/streaks/page.tsx`, `feed/page.tsx`, `settings/page.tsx` | Pending |
| ICON-13 | PNG | Placeholder app icon (1x1 navy pixel) | PWA manifest + home screen | `public/icon-192.png`, `public/icon-512.png` | Pending |

## Loading Indicators

| ID | Type | Current Asset | Location | Component File | Nano Banana Swap |
|----|------|---------------|----------|---------------|-----------------|
| LOADER-01 | lucide-react + CSS | `Loader2` with `animate-spin` | Sign-in button | `src/components/auth/google-sign-in-button.tsx` | Pending |
| LOADER-02 | lucide-react + CSS | `Loader2` with `animate-spin` | Sign-out button | `src/components/auth/sign-out-button.tsx` | Pending |

## Notes

- ICON-02 (Google "G" logo) must remain the official Google brand SVG — not a Nano Banana swap candidate
- ICON-07 (Google avatar) is dynamic user data — not swappable
- ICON-13 is a minimal placeholder — needs a real designed icon before any public sharing
- All "Pending" items are candidates for Nano Banana asset replacement
