# Phase 2: Connections - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-13
**Phase:** 02-connections
**Areas discussed:** Invite link mechanics, Joining flow, Challenge structure, Member visibility

---

## Invite Link Mechanics

| Option | Description | Selected |
|--------|-------------|----------|
| Reusable link (Recommended) | One permanent link per challenge. Anyone with the link can join anytime. | |
| One-time use links | Each link works for one person only. More controlled. | ✓ |
| Expiring links | Link works for a set time then dies. | |

**User's choice:** One-time use links
**Notes:** User prefers more controlled approach over convenience.

| Option | Description | Selected |
|--------|-------------|----------|
| Short code (Recommended) | e.g., sweatstakes.vercel.app/join/A7X9K2 | ✓ |
| UUID in URL | Longer but guaranteed unique. | |
| You decide | Claude picks. | |

**User's choice:** Short code
**Notes:** Clean, texting-friendly format.

| Option | Description | Selected |
|--------|-------------|----------|
| No expiry (Recommended) | Link stays valid until used once. | |
| Expire after 7 days | Auto-expires after a week. | |
| Expire after 24 hours | Very short window. | ✓ |

**User's choice:** Expire after 24 hours
**Notes:** User wants tighter security window despite recommendations.

| Option | Description | Selected |
|--------|-------------|----------|
| Dashboard button | Prominent invite CTA on dashboard. | |
| Settings page | Invite link lives in Settings. | ✓ |
| Both places | Dashboard primary, Settings secondary. | |

**User's choice:** Settings page
**Notes:** Keeps dashboard clean.

| Option | Description | Selected |
|--------|-------------|----------|
| One at a time (Recommended) | Generate, send, generate another. | ✓ |
| Batch generate | Generate multiple links at once. | |
| You decide | Claude picks simpler approach. | |

**User's choice:** One at a time

---

## Joining Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Sign in first, auto-join after (Recommended) | Redirect to login, auto-join after sign-in. | ✓ |
| Show challenge preview, then sign in | Preview page before sign-in. | |
| You decide | Claude picks smoothest flow. | |

**User's choice:** Sign in first, auto-join after

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-join immediately (Recommended) | Instantly join, redirect to dashboard. | ✓ |
| Confirmation screen | Show Accept/Decline before joining. | |
| You decide | Claude picks. | |

**User's choice:** Auto-join immediately

| Option | Description | Selected |
|--------|-------------|----------|
| Simple error message | Show error with link back to dashboard. | |
| Explain + suggest | Error message plus suggestion to ask friend for new link. | ✓ |
| You decide | Claude picks error handling. | |

**User's choice:** Explain + suggest

---

## Challenge Structure

| Option | Description | Selected |
|--------|-------------|----------|
| One challenge only (Recommended) | Each user belongs to exactly one group. | ✓ |
| Multiple challenges | User can be in several groups. | |
| You decide | Claude picks for v1 simplicity. | |

**User's choice:** One challenge only

| Option | Description | Selected |
|--------|-------------|----------|
| Implicit on first invite (Recommended) | Auto-created when first invite link is generated. | ✓ |
| Explicit creation step | User taps 'Create Challenge' first. | |
| You decide | Claude picks simpler flow. | |

**User's choice:** Implicit on first invite

| Option | Description | Selected |
|--------|-------------|----------|
| No limit for v1 (Recommended) | Any number can join. | ✓ |
| Cap at 10 | Small group cap. | |
| Cap at 20 | Generous cap. | |

**User's choice:** No limit for v1

| Option | Description | Selected |
|--------|-------------|----------|
| Can leave, no special creator role (Recommended) | Anyone can leave anytime, no owner. | ✓ |
| Can leave, creator transfers | Ownership passes on leave. | |
| No leaving in v1 | Defer to v2. | |

**User's choice:** Can leave, no special creator role

---

## Member Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Avatar row + count | Row of avatar circles at dashboard top. | ✓ |
| Member list card | Card listing all members by name. | |
| You decide | Claude picks visual treatment. | |

**User's choice:** Avatar row + count

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, update to show members (Recommended) | Replace empty state with member avatars. | ✓ |
| Keep it the same until check-ins start | Dashboard stays empty until Phase 3. | |
| You decide | Claude picks evolution. | |

**User's choice:** Yes, update to show members

| Option | Description | Selected |
|--------|-------------|----------|
| Dashboard avatars only for v1 (Recommended) | No dedicated members page. | ✓ |
| Dedicated members page | Full member list under a tab. | |
| You decide | Claude picks what's needed. | |

**User's choice:** Dashboard avatars only for v1

---

## Claude's Discretion

- Avatar row styling and overflow behavior
- Invite link generation UI on Settings page
- Error page layout for invalid/expired links
- Database schema design
- Invite code storage and validation

## Deferred Ideas

- Named groups / group renaming (out of scope per PROJECT.md)
- Group management UI (kick members, transfer ownership) — v2
- Multiple challenges per user — v2
- Invite link analytics — not needed for v1
