# Phase 1: Foundation & Auth - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-12
**Phase:** 01-foundation-auth
**Areas discussed:** Login screen look & feel, Post-login landing, Auth error handling, Design system setup, Loading states, Logout flow, Mobile viewport behavior, Deployment & environment

---

## Login screen look & feel

| Option | Description | Selected |
|--------|-------------|----------|
| Pixel-perfect match | Recreate the Stitch login screen faithfully | |
| Loose inspiration | Use Royale colors and typography but lay out from scratch | :heavy_check_mark: |
| Minimal functional | Just a centered Google sign-in button on dark background | |

**User's choice:** Loose inspiration
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| App logo/name | "SweatStakes" branding | :heavy_check_mark: |
| Tagline | Short motivational text | :heavy_check_mark: |
| Google sign-in button | Styled sign-in button (required) | :heavy_check_mark: |
| Background art/gradient | Dark navy gradient or subtle pattern | :heavy_check_mark: |

**User's choice:** All four elements
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Official Google style | White button with Google logo, follows branding guidelines | |
| Royale-themed button | Emerald green or glass-style button with Google icon | :heavy_check_mark: |

**User's choice:** Royale-themed button
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| You decide | Claude picks tagline | :heavy_check_mark: |
| I have one in mind | User provides specific tagline | |

**User's choice:** You decide
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle entrance animation | Logo and card fade/slide in on page load | |
| No animation | Everything renders immediately | :heavy_check_mark: |
| You decide | Claude picks | |

**User's choice:** No animation
**Notes:** None

---

## Post-login landing

| Option | Description | Selected |
|--------|-------------|----------|
| Empty dashboard shell | Styled but mostly empty dashboard with bottom nav | :heavy_check_mark: |
| Welcome screen | One-time onboarding screen | |
| Straight to invite flow | Skip dashboard, go to invite link generation | |

**User's choice:** Empty dashboard shell
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Functional with placeholder pages | Nav icons navigate to real routes with "Coming soon" states | :heavy_check_mark: |
| Visual only | Nav bar renders but taps don't navigate | |
| No nav bar yet | Dashboard only, no bottom nav | |

**User's choice:** Functional with placeholder pages
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, name and avatar | Pull user's name and profile photo from Google OAuth | :heavy_check_mark: |
| Name only | Show name but skip avatar | |
| No personalization yet | Generic welcome text | |

**User's choice:** Yes, name and avatar
**Notes:** None

---

## Auth error handling

| Option | Description | Selected |
|--------|-------------|----------|
| Inline error on login page | Short error message below sign-in button | :heavy_check_mark: |
| Toast notification | Brief toast/snackbar at bottom of screen | |
| You decide | Claude picks | |

**User's choice:** Inline error on login page
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Silent redirect to login | Redirect with no error message | :heavy_check_mark: |
| Redirect with message | Redirect with "Your session expired" message | |
| You decide | Claude picks | |

**User's choice:** Silent redirect to login
**Notes:** None

---

## Design system setup

| Option | Description | Selected |
|--------|-------------|----------|
| Full token system | All Royale color tokens, typography, spacing in Tailwind v4 @theme | :heavy_check_mark: |
| Login-only tokens | Only tokens needed for login screen | |
| Bare minimum | Just dark navy and font | |

**User's choice:** Full token system
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Init now with core components | Set up shadcn/ui with Button, Card, Input restyled to Royale | :heavy_check_mark: |
| Init now, components later | Set up scaffold only, add components per-phase | |
| Defer entirely | Don't touch shadcn/ui until Phase 2+ | |

**User's choice:** Init now with core components
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Material Symbols for nav, Lucide for UI | Match Stitch design for nav, Lucide for general icons | |
| Lucide only | Single icon library for everything | |
| You decide | Claude picks | |

**User's choice:** Other — Claude picks icons, user will replace with Nano Banana later. Must create an icon/image inventory document.
**Notes:** "yeah just pick the icons urself for now, ill use nano banana for things later so make sure u make a document of all icons and images u use for now that i will later replace with nano banana"

---

## Loading states

| Option | Description | Selected |
|--------|-------------|----------|
| Disabled button + spinner | Button shows spinner and becomes unclickable during OAuth | :heavy_check_mark: |
| Full-screen overlay | Dark overlay with centered spinner | |
| You decide | Claude picks | |

**User's choice:** Disabled button + spinner
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Top progress bar | Thin colored bar at top during page transitions | |
| No indicator | Pages swap instantly | |
| You decide | Claude picks based on perceived performance | :heavy_check_mark: |

**User's choice:** You decide
**Notes:** User also noted loading spinners/indicators could be Nano Banana candidates — include in icon inventory

---

## Logout flow

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, on Settings placeholder page | Sign-out button on settings page | :heavy_check_mark: |
| Yes, in nav or header | Logout accessible from any page | |
| No logout yet | No sign-out in Phase 1 | |

**User's choice:** On Settings placeholder page
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Back to login screen | Simple redirect, clean slate | :heavy_check_mark: |
| Login screen with confirmation | Redirect with "You've been signed out" message | |

**User's choice:** Back to login screen
**Notes:** None

---

## Mobile viewport behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Portrait only | Design and test for portrait exclusively | :heavy_check_mark: |
| Support both | Responsive layout for landscape too | |
| You decide | Claude decides | |

**User's choice:** Portrait only
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, basic manifest | Home screen install, standalone mode, dark status bar | :heavy_check_mark: |
| Full PWA with offline + push | Home screen + offline caching + push notifications | |
| Skip for now | No home screen install | |
| You decide | Claude picks | |

**User's choice:** Yes, basic manifest
**Notes:** User was initially unfamiliar with PWA concepts. After explanation of what "Add to Home Screen" does (creates a fancy bookmark that opens without browser toolbar), was very enthusiastic. Key motivation: "yes yes yes i want this very much perfect because my gf and i use iphones"

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, respect safe areas | Content stays inside safe area for notch/Dynamic Island | :heavy_check_mark: |
| You decide | Claude handles as needed | |

**User's choice:** Respect safe areas
**Notes:** None

---

## Deployment & environment

| Option | Description | Selected |
|--------|-------------|----------|
| Default Vercel URL for now | e.g., sweatstakes.vercel.app | :heavy_check_mark: |
| Custom domain from the start | e.g., sweatstakes.app | |
| You decide | Claude picks | |

**User's choice:** Default Vercel URL
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Real Supabase from day one | Create Supabase project, wire up Google OAuth, connect DB | :heavy_check_mark: |
| Mock auth first | Fake sign-in with stub, wire real auth later | |

**User's choice:** Real Supabase from day one
**Notes:** None

---

## Claude's Discretion

- Tagline text on login screen
- Page navigation loading indicator style
- Loading skeleton/spinner design details
- Exact spacing, padding, and layout proportions
- Placeholder page content for non-dashboard routes
- PWA icon design

## Deferred Ideas

- Custom domain — revisit when sharing more broadly
- Service worker for offline/push — future phase (v2 notifications)
- Landscape orientation support — not needed for phone-first use
- Full PWA with service worker — add with push notifications (v2)
