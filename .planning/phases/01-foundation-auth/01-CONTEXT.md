# Phase 1: Foundation & Auth - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

The app is deployed and users can sign in with Google. Delivers: Next.js 16 project scaffold, Supabase project with Google OAuth, Vercel deployment, the Royale design system foundation, a login screen, an empty dashboard shell with functional bottom nav, and basic PWA manifest for Add to Home Screen.

</domain>

<decisions>
## Implementation Decisions

### Login screen look & feel
- **D-01:** Loose inspiration from Stitch design — use Royale colors and typography but lay out the login screen from scratch, not a pixel-perfect copy
- **D-02:** Login screen elements: app logo/name ("SweatStakes"), tagline (Claude's discretion), Google sign-in button, dark navy gradient background
- **D-03:** Google sign-in button styled to match Royale theme (emerald green or glass-style with Google icon) — NOT the official white Google button
- **D-04:** No animation on the login screen — everything renders immediately

### Post-login landing
- **D-05:** After sign-in, user lands on an empty dashboard shell with the bottom navigation bar visible
- **D-06:** Bottom nav is functional — tapping each icon navigates to a real route, but non-dashboard pages show a "Coming soon" or empty placeholder state
- **D-07:** Dashboard shows the user's Google profile name and avatar in a personalized greeting (e.g., "Welcome, Arnav!")
- **D-08:** Empty state card on dashboard: "No active challenge yet. Invite friends to get started."

### Auth error handling
- **D-09:** Google sign-in failure shows an inline error message below the sign-in button (e.g., "Sign-in failed. Try again."). User stays on the login screen and retries.
- **D-10:** Expired session triggers a silent redirect to the login screen — no error message shown

### Design system setup
- **D-11:** Full Royale token system wired up in Tailwind v4 @theme — all colors from the Stitch config (navy, emerald, surface hierarchy, etc.), Plus Jakarta Sans typography, border radius, spacing
- **D-12:** shadcn/ui initialized with core components (Button, Card, Input) restyled to Royale theme
- **D-13:** Claude picks placeholder icons for now. An icon/image inventory document must be created listing every icon and image used, so they can be replaced with Nano Banana assets later
- **D-14:** Loading indicators (spinners, etc.) should also be tracked in the icon inventory for potential Nano Banana replacement

### Loading states
- **D-15:** During Google OAuth processing, the sign-in button shows a small spinner and becomes disabled. Rest of the login screen stays visible.
- **D-16:** Page navigation loading indicator is Claude's discretion (top progress bar, none, etc.)

### Logout flow
- **D-17:** Sign-out button lives on the Settings placeholder page
- **D-18:** After signing out, user is redirected to the login screen with no confirmation message

### Mobile viewport
- **D-19:** Portrait orientation only — no special landscape handling
- **D-20:** Basic PWA manifest included: SweatStakes icon on home screen, standalone mode (no browser toolbar), dark navy status bar theme. Works on both iOS Safari and Android Chrome.
- **D-21:** Respect iPhone safe areas (notch, Dynamic Island, rounded corners) using CSS env(safe-area-inset-*)

### Deployment & environment
- **D-22:** Default Vercel URL (e.g., sweatstakes.vercel.app) — no custom domain for now
- **D-23:** Real Supabase project from day one — database, Google OAuth, and auth all wired up end-to-end. No mock/stub auth.

### Claude's Discretion
- Tagline text on the login screen
- Page navigation loading indicator style
- Loading skeleton/spinner design details
- Exact spacing, padding, and layout proportions
- Placeholder page content for non-dashboard routes
- PWA icon design (will be tracked in icon inventory for Nano Banana swap)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design reference
- `stitch-copy-paste-code-inspiration.txt` — Full Stitch Royale HTML with Tailwind config, color tokens, typography, and component patterns. Use as design inspiration (not production code).

### Project docs
- `.planning/PROJECT.md` — Project vision, constraints, key decisions (Google OAuth only for v1, no named groups)
- `.planning/REQUIREMENTS.md` — AUTH-01 (Google sign-in), AUTH-02 (session persistence) are this phase's requirements
- `CLAUDE.md` — Full technology stack specification (Next.js 16, Supabase, Drizzle, Tailwind v4, shadcn/ui, etc.)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `stitch-copy-paste-code-inspiration.txt`: Contains the complete Tailwind color token config for the Royale theme — can be extracted directly into Tailwind v4 @theme directives
- The Stitch HTML contains login screen markup that serves as structural reference for the layout

### Established Patterns
- None — greenfield project. Phase 1 establishes all patterns.

### Integration Points
- None — this is the first phase. All infrastructure (Next.js, Supabase, Vercel) is set up here.

</code_context>

<specifics>
## Specific Ideas

- User wants the app to feel like a real app on iPhones — PWA manifest is important because both Arnav and his girlfriend use iPhones
- Icons and images are temporary placeholders — Arnav will replace them with Nano Banana assets later. An inventory document is critical so nothing gets missed during the swap.
- Loading states (spinners, indicators) are also candidates for Nano Banana replacement — track them alongside icons

</specifics>

<deferred>
## Deferred Ideas

- Custom domain — revisit when ready to share more broadly
- Service worker for offline caching and push notifications — future phase (notifications are v2)
- Landscape orientation support — not needed for phone-first friend group use case
- Full PWA with service worker — add when push notifications are needed (v2)

</deferred>

---

*Phase: 01-foundation-auth*
*Context gathered: 2026-04-12*
