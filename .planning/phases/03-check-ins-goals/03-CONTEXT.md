# Phase 3: Check-ins & Goals - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can log workouts via photo and track their weekly progress toward personal goals with streaks. Delivers: full-screen dual-camera (BeReal-style) photo check-in flow, personal weekly goal setting (1-7 days) on Settings, day-dots progress tracker on Dashboard, streak counter, check-in database schema, photo upload to Supabase Storage, and a center FAB button on the bottom nav for quick access to check-ins.

</domain>

<decisions>
## Implementation Decisions

### Camera & photo capture flow
- **D-01:** Full-screen camera view opens when user taps the check-in button — dedicated camera UI built with `getUserMedia` API, not native file picker
- **D-02:** BeReal-style dual camera — rear camera photo first (workout), then auto-flips to front camera for selfie
- **D-03:** Front camera selfie auto-captures after a 3-second countdown (3... 2... 1...) — no manual shutter tap needed for the selfie
- **D-04:** Composite preview shows large rear camera photo with small selfie thumbnail in the top-left corner (BeReal layout)
- **D-05:** Preview screen has Retake and Submit buttons — Retake restarts the entire flow (both photos), Submit uploads and records the check-in
- **D-06:** Default to rear camera on open. Flip button available during the rear camera phase only (not during selfie countdown)
- **D-07:** Any photo is accepted as a check-in — no AI validation or gym detection. Social accountability is the enforcement mechanism. The dual-camera selfie provides soft proof of presence.

### Goal setting experience
- **D-08:** Weekly goal setting lives on the Settings page — set once, change anytime
- **D-09:** Goal is changeable mid-week with immediate effect for the current week — no restrictions on when you can change
- **D-10:** Default goal for new users is 3 days/week
- **D-11:** Stepper UI for goal picker: minus button, large number in center, plus button, "days per week" label. Range is 1-7.

### Progress & streak display
- **D-12:** Day dots row on the dashboard — 7 dots for M T W T F S S, filled dots = checked in, empty = remaining. Shows "2/4 days" count alongside.
- **D-13:** Week resets on Monday (Monday through Sunday is one fitness week)
- **D-14:** Streak counter displays as fire emoji + number: "🔥 3 week streak" — sits below or next to the day dots
- **D-15:** Streak silently resets to 0 when a week is missed — no notification, no shame screen. User sees the reset on their dashboard.
- **D-16:** Streak increments at the end of a week (Sunday night) if the user met their goal. "Met goal" = checked in on >= goal number of distinct days that week.

### Check-in constraints & rules
- **D-17:** Unlimited check-ins per day, but only 1 counts toward the weekly goal per calendar day. Extra check-ins still appear in the activity feed.
- **D-18:** No deleting check-ins — once submitted, it's permanent. Keeps accountability honest.
- **D-19:** Check-in button is a center FAB (floating action button) on the bottom navigation bar — always accessible from any screen, like Instagram's + button
- **D-20:** The FAB replaces the middle nav item — bottom nav becomes: Dashboard, Feed, [FAB], Streaks, Settings

### Claude's Discretion
- Camera UI styling (shutter button design, countdown animation, flip button style)
- Composite image generation approach (canvas overlay vs CSS positioning)
- Photo compression settings before upload
- Day dots visual design (colors, size, spacing, today highlight)
- Stepper button styling on Settings
- Database schema for check-ins (table structure, columns, indexes)
- Supabase Storage bucket configuration for photos
- How "today" is highlighted in the day dots row
- FAB button visual design (size, color, icon, elevation)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design reference
- `stitch-copy-paste-code-inspiration.txt` — Full Stitch Royale HTML with Tailwind config, color tokens, typography, and component patterns. Use as design inspiration.

### Project docs
- `.planning/PROJECT.md` — Project vision, constraints, key decisions
- `.planning/REQUIREMENTS.md` — CHKN-01 through CHKN-05 are this phase's requirements
- `CLAUDE.md` — Full technology stack specification (Next.js 16, Supabase, browser-image-compression, getUserMedia API)

### Phase 2 artifacts (dependencies)
- `.planning/phases/02-connections/02-CONTEXT.md` — Phase 2 decisions (challenge structure, member model)
- `src/db/schema.ts` — Existing Drizzle schema (challenges, challengeMembers, inviteLinks) — new check-in tables extend this
- `src/db/index.ts` — Drizzle client (reuse for all check-in queries)
- `src/lib/actions/connections.ts` — Server Action patterns with auth gating (follow same pattern for check-in actions)
- `src/app/(protected)/dashboard/page.tsx` — Dashboard to be updated with day dots progress tracker and streak counter
- `src/app/(protected)/settings/page.tsx` — Settings page where goal stepper will be added
- `src/components/layout/bottom-nav.tsx` — Bottom nav to be updated with center FAB button

### Browser APIs
- MDN: `MediaDevices.getUserMedia()` — Camera access for check-in photos
- `browser-image-compression` npm package — Client-side photo compression before upload (already in CLAUDE.md tech stack)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/db/schema.ts`: Drizzle schema — add check-ins table here alongside existing tables
- `src/db/index.ts`: Drizzle client with `prepare: false` for Supabase pooler — reuse for all check-in queries
- `src/lib/actions/connections.ts`: Server Action pattern with `createClient()` + `getUser()` auth gate — follow identical pattern for check-in actions
- `src/components/auth/sign-out-button.tsx`: Client component loading state pattern (useState, Loader2, disabled:opacity-60)
- `src/components/connections/share-invite-button.tsx`: Client component with browser API interaction pattern (navigator.share)
- `src/app/globals.css`: Royale design tokens — all new UI must use these tokens

### Established Patterns
- Server Actions for mutations (not API routes)
- Drizzle ORM for all database queries (not Supabase JS client for data tables)
- Supabase Auth via `createClient()` + `getUser()` for auth checks in every Server Action
- Protected routes under `src/app/(protected)/` with auth guard in layout
- Client components use `'use client'` directive with useState for loading/error states

### Integration Points
- `src/app/(protected)/dashboard/page.tsx` — add day dots tracker + streak counter below member avatar row
- `src/app/(protected)/settings/page.tsx` — add goal stepper section
- `src/components/layout/bottom-nav.tsx` — replace middle nav item with FAB button
- New route needed for camera UI (likely a full-screen page or modal)
- Supabase Storage — new bucket for check-in photos

</code_context>

<specifics>
## Specific Ideas

- The BeReal dual-camera flow is a core differentiator — the selfie overlay adds fun and soft proof-of-workout without requiring AI validation
- The 3-second countdown for the selfie creates urgency and excitement, matching BeReal's vibe
- Day dots are preferred over a progress ring because they show WHICH days you worked out, not just a percentage
- The center FAB on the bottom nav makes check-ins feel like the primary action of the app — always one tap away
- Unlimited check-ins but only 1 counts per day supports people who work out twice a day without letting them game the system

</specifics>

<deferred>
## Deferred Ideas

- AI-powered workout detection / photo validation — v2, if needed (social accountability is v1's enforcement)
- Workout type categorization (cardio, strength, etc.) — not in scope for v1
- Check-in captions or notes — not in scope, photos speak for themselves
- Streak milestones or achievements (badges at 4 weeks, 8 weeks, etc.) — future phase
- Push notification reminders to check in — v2 (notifications are a separate concern)

</deferred>

---

*Phase: 03-check-ins-goals*
*Context gathered: 2026-04-13*
