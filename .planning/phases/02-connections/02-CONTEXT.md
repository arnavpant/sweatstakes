# Phase 2: Connections - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can bring their friends into a shared challenge via an invite link. Delivers: invite link generation, join-via-link flow, challenge group data model in Supabase, member avatar display on dashboard, and updated dashboard state. No named groups, no group management UI, no chat.

</domain>

<decisions>
## Implementation Decisions

### Invite link mechanics
- **D-01:** One-time use invite links — each link works for exactly one person, then becomes invalid
- **D-02:** Short code format (6-8 alphanumeric characters) — e.g., sweatstakes.vercel.app/join/A7X9K2
- **D-03:** Links expire after 24 hours if unused
- **D-04:** Invite link generation lives on the Settings page (not dashboard)
- **D-05:** One link generated at a time — user generates, sends, then generates another when needed
- **D-06:** Share via native Web Share API if available, fallback to copy-to-clipboard

### Joining flow
- **D-07:** Unauthenticated recipient tapping an invite link is redirected to login first, then auto-joins the challenge after Google sign-in — no extra confirmation step
- **D-08:** Authenticated recipient tapping an invite link auto-joins immediately and is redirected to the dashboard — tapping the link IS the intent
- **D-09:** Invalid/expired/used links show an error page: "This invite link has expired or already been used" with a suggestion to "Ask your friend to send a new invite link" and a link back to the dashboard

### Challenge structure
- **D-10:** One challenge per user — each user belongs to exactly one challenge group at a time
- **D-11:** Challenge is created implicitly when a user generates their first invite link — no explicit "create challenge" step
- **D-12:** No member limit for v1 — any number of people can join
- **D-13:** Any member can leave a challenge at any time (from Settings). No special creator/owner role — the challenge continues as long as 1+ members remain
- **D-14:** If a user is already in a challenge and taps a different invite link, they must leave their current challenge first (or show an error explaining they're already in one)

### Member visibility
- **D-15:** Dashboard shows a row of member avatar circles at the top (like a group chat header) — first 5 avatars + "+N more" overflow
- **D-16:** Dashboard empty state ("No active challenge yet. Invite friends to get started.") is replaced with member avatars and "Challenge active — N members" once friends are connected
- **D-17:** No dedicated members page for v1 — the dashboard avatar row is sufficient

### Claude's Discretion
- Exact avatar row styling and overflow behavior
- Invite link generation UI component design on Settings page
- Error page layout for invalid/expired links
- Database schema design for challenges and memberships (Supabase tables, RLS policies)
- How the invite code is stored and validated server-side

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design reference
- `stitch-copy-paste-code-inspiration.txt` — Full Stitch Royale HTML with Tailwind config, color tokens, typography, and component patterns. Use as design inspiration.

### Project docs
- `.planning/PROJECT.md` — Project vision, constraints, key decisions (no named groups, flat connection model)
- `.planning/REQUIREMENTS.md` — CONN-01 (invite link), CONN-02 (join via link), CONN-03 (shared challenge) are this phase's requirements
- `CLAUDE.md` — Full technology stack specification (Supabase, Drizzle, etc.)

### Phase 1 artifacts
- `.planning/phases/01-foundation-auth/01-CONTEXT.md` — Phase 1 decisions (design system, auth patterns, dashboard structure)
- `src/lib/supabase/server.ts` — Server-side Supabase client factory (reuse for database operations)
- `src/lib/actions/auth.ts` — Server Action patterns established in Phase 1 (signInWithGoogleAction pattern)
- `proxy.ts` — Route protection patterns (protected routes, auth redirects)
- `src/app/(protected)/dashboard/page.tsx` — Current dashboard to be updated with member avatars
- `src/app/(protected)/settings/page.tsx` — Settings page where invite link generation will be added

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase/server.ts`: Server-side Supabase client — use for all database operations (challenges table, memberships table, invite links table)
- `src/lib/supabase/client.ts`: Browser-side Supabase client — use for realtime subscriptions if needed
- `src/lib/actions/auth.ts`: Server Action pattern — follow same pattern for invite actions (generateInviteLink, joinChallenge, leaveChallenge)
- `src/components/ui/button.tsx`, `card.tsx`, `input.tsx`: shadcn/ui components restyled to Royale theme
- `src/app/auth/callback/route.ts`: OAuth callback pattern — similar pattern needed for invite link route handler

### Established Patterns
- Server Actions for mutations (not API routes) — established in Phase 1
- Cookie-based auth via proxy.ts — all protected routes use getUser() guard
- Protected layout at `src/app/(protected)/layout.tsx` — auth gate pattern
- Royale design tokens in globals.css via @theme — all new UI must use these tokens

### Integration Points
- `src/app/(protected)/dashboard/page.tsx` — needs avatar row and updated empty state
- `src/app/(protected)/settings/page.tsx` — needs invite link generation section and leave challenge option
- `proxy.ts` — may need to handle /join/[code] route specially (public route, not protected)
- New route: `src/app/join/[code]/route.ts` or `page.tsx` — public invite link handler

</code_context>

<specifics>
## Specific Ideas

- The invite flow should feel effortless — generate link, share it, friend taps it and they're in. No extra screens or confirmations.
- The 24-hour expiry + one-time-use combo keeps things secure without being annoying for a small friend group.
- Dashboard should feel "alive" once members join — the avatar row makes it feel like a real group even before workouts start.
- D-14 (already in a challenge) is an edge case but important — prevents confusion if someone gets invited to two groups.

</specifics>

<deferred>
## Deferred Ideas

- Named groups / group renaming — out of scope per PROJECT.md, future version
- Group management UI (kick members, transfer ownership) — v2
- Multiple challenges per user — v2, once the single-group model is proven
- Invite link analytics (who clicked, when) — not needed for v1

</deferred>

---

*Phase: 02-connections*
*Context gathered: 2026-04-13*
