# Phase 2: Connections - Research

**Researched:** 2026-04-12
**Domain:** Drizzle ORM schema + Supabase RLS + invite token generation + join-via-link flow
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** One-time use invite links — each link works for exactly one person, then becomes invalid
- **D-02:** Short code format (6-8 alphanumeric characters) — e.g., sweatstakes.vercel.app/join/A7X9K2
- **D-03:** Links expire after 24 hours if unused
- **D-04:** Invite link generation lives on the Settings page (not dashboard)
- **D-05:** One link generated at a time — user generates, sends, then generates another when needed
- **D-06:** Share via native Web Share API if available, fallback to copy-to-clipboard
- **D-07:** Unauthenticated recipient tapping an invite link is redirected to login first, then auto-joins the challenge after Google sign-in — no extra confirmation step
- **D-08:** Authenticated recipient tapping an invite link auto-joins immediately and is redirected to the dashboard — tapping the link IS the intent
- **D-09:** Invalid/expired/used links show an error page: "This invite link has expired or already been used" with a suggestion to "Ask your friend to send a new invite link" and a link back to the dashboard
- **D-10:** One challenge per user — each user belongs to exactly one challenge group at a time
- **D-11:** Challenge is created implicitly when a user generates their first invite link — no explicit "create challenge" step
- **D-12:** No member limit for v1 — any number of people can join
- **D-13:** Any member can leave a challenge at any time (from Settings). No special creator/owner role — the challenge continues as long as 1+ members remain
- **D-14:** If a user is already in a challenge and taps a different invite link, they must leave their current challenge first (or show an error explaining they're already in one)
- **D-15:** Dashboard shows a row of member avatar circles at the top (like a group chat header) — first 5 avatars + "+N more" overflow
- **D-16:** Dashboard empty state replaced with member avatars and "Challenge active — N members" once friends are connected
- **D-17:** No dedicated members page for v1 — the dashboard avatar row is sufficient

### Claude's Discretion

- Exact avatar row styling and overflow behavior
- Invite link generation UI component design on Settings page
- Error page layout for invalid/expired links
- Database schema design for challenges and memberships (Supabase tables, RLS policies)
- How the invite code is stored and validated server-side

### Deferred Ideas (OUT OF SCOPE)

- Named groups / group renaming
- Group management UI (kick members, transfer ownership)
- Multiple challenges per user
- Invite link analytics (who clicked, when)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONN-01 | User can invite others via a secure shareable link | nanoid for code generation; `invite_links` table with `code`, `expires_at`, `used_at`; `generateInviteLinkAction` Server Action pattern; Web Share API + clipboard fallback |
| CONN-02 | Recipient taps invite link and joins the shared group | Public `/join/[code]` route; proxy.ts passes unauthenticated requests through; auth callback `next` param preserves join URL; `joinChallengeAction` Server Action validates and consumes code |
| CONN-03 | All connected users are in one shared challenge together | `challenges` + `challenge_members` tables; RLS policies so members only see their group; dashboard avatar row queries `challenge_members` joined with user profiles |
</phase_requirements>

---

## Summary

Phase 2 adds the social layer: invite link generation, a join flow that works for both authenticated and unauthenticated recipients, and a challenge group data model that powers the dashboard member row. The technical scope touches four layers: database schema (Drizzle ORM), security (Supabase RLS), routing (a new public `/join/[code]` route and proxy.ts update), and UI (Settings invite section + dashboard avatar row).

The most complex piece is the **unauthenticated join flow** (D-07): a recipient who is not logged in taps an invite link, gets redirected to Google OAuth, completes login, and then must still end up joining the right challenge. This requires threading the join intent through the OAuth round-trip using the existing `next` query parameter in `auth/callback/route.ts` — the pattern is already used in Phase 1's callback route.

The database design (Claude's Discretion) is the foundation for everything else in the project. Phases 3-5 (check-ins, points, feed) all need to know which challenge a user belongs to. Getting the schema right now — with proper RLS — prevents schema refactors later.

**Primary recommendation:** Three Drizzle tables (`challenges`, `challenge_members`, `invite_links`), nanoid for code generation, a public Next.js route at `/join/[code]`, and a Server Action `joinChallengeAction` that handles all validation (expired, used, already-in-challenge) before creating the membership row.

---

## Project Constraints (from CLAUDE.md)

| Constraint | Directive |
|------------|-----------|
| Framework | Next.js 16 (App Router, `proxy.ts` not `middleware.ts`) |
| Database | Supabase PostgreSQL via Drizzle ORM (already installed: `drizzle-orm@0.45.2`, `drizzle-kit@0.31.10`) |
| Auth | Supabase Auth via `@supabase/ssr` cookie sessions |
| Mutations | Server Actions only — no separate API routes for write operations |
| Styling | Tailwind v4 `@theme` tokens only — no hardcoded colors |
| Components | shadcn/ui primitives restyled to Royale theme |
| Icons | Placeholder icons tracked in `src/docs/icon-inventory.md` for Nano Banana swap |

---

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `drizzle-orm` | 0.45.2 [VERIFIED: npm list] | Type-safe SQL queries + schema definition | Already installed; defines `challenges`, `challenge_members`, `invite_links` tables |
| `drizzle-kit` | 0.31.10 [VERIFIED: npm list] | Schema migrations via `drizzle-kit push` | Already installed; pushes schema changes to Supabase PostgreSQL |
| `@supabase/ssr` | 0.10.2 [VERIFIED: npm list] | Cookie-based auth sessions | Established in Phase 1 — all server operations use `createClient()` from `src/lib/supabase/server.ts` |
| `zod` | 4.3.6 [VERIFIED: npm list] | Validation in Server Actions | Validate invite code format, join requests |

### New Dependencies

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `nanoid` | 5.1.7 [VERIFIED: npm view] | Cryptographically secure short code generation | Uses Web Crypto API internally (not `Math.random()`). Node.js crypto-backed. Custom alphabet support for uppercase alphanumeric codes. ~130 bytes. Note: nanoid v3.3.11 is available as a transitive dep via postcss but it's CJS-only — install v5 as a direct project dep for ESM. |
| `postgres` | 3.4.9 [VERIFIED: npm view] | postgres.js driver for Drizzle | Drizzle's recommended driver for Supabase PostgreSQL. Required alongside drizzle-orm. Not yet installed — must be added. |

**Installation (new packages only):**
```bash
npm install nanoid postgres
```

**Version verification:**
- `nanoid@5.1.7` — confirmed via `npm view nanoid version` [VERIFIED: npm registry]
- `postgres@3.4.9` — confirmed via `npm view postgres version` [VERIFIED: npm registry]
- `drizzle-orm@0.45.2` — confirmed via `npm list drizzle-orm` [VERIFIED: npm list]

### Alternatives Considered

| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| `nanoid` custom | `crypto.randomBytes(4).toString('hex')` | nanoid's custom alphabet avoids ambiguous chars (0, O, I, l) that are hard to read if user ever sees raw code |
| `postgres` driver | `pg` (node-postgres) | Drizzle official Supabase guide uses `postgres` (postgres.js); `pg` works too but requires different Drizzle init syntax |
| Drizzle RLS policies in schema | Supabase Dashboard SQL editor | Drizzle-managed RLS keeps policies in version control alongside schema |

---

## Architecture Patterns

### Recommended Project Structure (new files this phase)

```
src/
├── db/
│   ├── index.ts              # Drizzle client (postgres.js connection)
│   └── schema.ts             # challenges, challenge_members, invite_links tables
├── lib/
│   └── actions/
│       └── connections.ts    # generateInviteLinkAction, joinChallengeAction, leaveChallengeAction
└── app/
    ├── join/
    │   └── [code]/
    │       └── page.tsx       # Public join route (unauthenticated allowed)
    └── (protected)/
        ├── dashboard/
        │   └── page.tsx       # UPDATE: add member avatar row
        └── settings/
            └── page.tsx       # UPDATE: add invite link section + leave challenge
```

### Pattern 1: Drizzle Schema with RLS

Three tables cover the full data model. Drizzle supports Supabase's `auth.uid()` in RLS policies via `drizzle-orm/supabase` helpers. [VERIFIED: orm.drizzle.team/docs/rls]

```typescript
// src/db/schema.ts
import { pgTable, uuid, text, timestamp, pgPolicy } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { authenticatedRole, authUid } from 'drizzle-orm/supabase'

// A challenge group — implicitly created when first invite is generated (D-11)
export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Many-to-many: user belongs to a challenge (one-to-one per D-10)
export const challengeMembers = pgTable('challenge_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),           // references auth.users.id
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  // Members can only see other members in their own challenge
  pgPolicy('members can view their challenge members', {
    for: 'select',
    to: authenticatedRole,
    using: sql`(select auth.uid()) in (
      select user_id from challenge_members
      where challenge_id = ${t.challengeId}
    )`,
  }),
  // A user can only insert themselves
  pgPolicy('members can join a challenge', {
    for: 'insert',
    to: authenticatedRole,
    withCheck: sql`auth.uid() = ${t.userId}`,
  }),
  // A user can only delete their own membership (for leave challenge)
  pgPolicy('members can leave a challenge', {
    for: 'delete',
    to: authenticatedRole,
    using: sql`auth.uid() = ${t.userId}`,
  }),
])

// One-time use invite codes with 24-hour expiry (D-01, D-02, D-03)
export const inviteLinks = pgTable('invite_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),          // 8 uppercase alphanumeric chars
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull(),        // auth.users.id of generator
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),        // null = unused
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  // Only the challenge creator can see their invite links
  pgPolicy('members can view own invite links', {
    for: 'select',
    to: authenticatedRole,
    using: sql`auth.uid() = ${t.createdBy}`,
  }),
  // Authenticated user can create invite for their own challenge
  pgPolicy('members can create invite links', {
    for: 'insert',
    to: authenticatedRole,
    withCheck: sql`auth.uid() = ${t.createdBy}`,
  }),
])
```

**Note on `userId` in `challengeMembers`:** Drizzle cannot reference `auth.users` directly in a foreign key (it's in the `auth` schema, not `public`). The column stores the same UUID but without a DB-enforced FK. RLS policies enforce user-scoping instead. This is the standard Supabase pattern. [VERIFIED: Supabase docs examples consistently skip FK to auth.users]

### Pattern 2: Drizzle Client Setup

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Supabase uses connection pooling (Transaction mode) — must disable prepared statements
const client = postgres(process.env.DATABASE_URL!, { prepare: false })
export const db = drizzle(client, { schema })
```

`DATABASE_URL` is the Supabase connection string in **Transaction mode** (port 6543), not Session mode. This must be added to `.env.local.example` and Vercel env vars.

```
# Supabase Transaction mode connection string (port 6543) — for Drizzle ORM
# Get from: Supabase Dashboard > Project Settings > Database > Connection string > Transaction
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Pattern 3: Invite Code Generation (Server Action)

```typescript
// src/lib/actions/connections.ts
'use server'

import { nanoid } from 'nanoid'
import { db } from '@/db'
import { challenges, challengeMembers, inviteLinks } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'
import { eq, and, isNull, gt } from 'drizzle-orm'

const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous: 0/O, I/1
const INVITE_CODE_LENGTH = 8

export async function generateInviteLinkAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Find or create the user's challenge (D-11: implicit creation)
  let challengeId: string

  const existingMembership = await db
    .select({ challengeId: challengeMembers.challengeId })
    .from(challengeMembers)
    .where(eq(challengeMembers.userId, user.id))
    .limit(1)

  if (existingMembership.length > 0) {
    challengeId = existingMembership[0].challengeId
  } else {
    // Create challenge and add self as first member (implicit creation)
    const [newChallenge] = await db.insert(challenges).values({}).returning()
    await db.insert(challengeMembers).values({
      challengeId: newChallenge.id,
      userId: user.id,
      displayName: user.user_metadata.full_name || user.email || 'Member',
      avatarUrl: user.user_metadata.avatar_url || null,
    })
    challengeId = newChallenge.id
  }

  // Generate unique code — retry on collision (extremely unlikely with 8-char codes)
  const code = nanoid.customAlphabet(INVITE_CODE_ALPHABET, INVITE_CODE_LENGTH)()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h from now

  await db.insert(inviteLinks).values({
    code,
    challengeId,
    createdBy: user.id,
    expiresAt,
  })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return { url: `${siteUrl}/join/${code}` }
}
```

### Pattern 4: Join Flow — Public Route Handler

The `/join/[code]` route must be **public** (no auth required). The `proxy.ts` currently only protects `/dashboard`, `/streaks`, `/feed`, `/settings` — so `/join/*` is already public by default. No proxy.ts changes needed.

**For authenticated users (D-08):**
```typescript
// src/app/join/[code]/page.tsx
// Rendered as a Server Component — reads params, calls joinChallengeAction
import { joinChallengeAction } from '@/lib/actions/connections'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function JoinPage({ params }: { params: { code: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Unauthenticated: send to login, preserve join intent via ?next param (D-07)
    redirect(`/login?next=/join/${params.code}`)
  }

  // Authenticated: attempt join immediately
  const result = await joinChallengeAction(params.code)
  if (result.error) {
    redirect(`/join/${params.code}/error?reason=${encodeURIComponent(result.error)}`)
  }
  redirect('/dashboard')
}
```

**For unauthenticated users — threading intent through OAuth (D-07):**

The existing `auth/callback/route.ts` already handles the `next` query param:
```typescript
const rawNext = searchParams.get('next') ?? '/dashboard'
const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'
// ... after exchangeCodeForSession:
return NextResponse.redirect(`${origin}${next}`)
```

This means: redirect unauthenticated user to `/login?next=/join/A7X9K2`. The login page must pass `next` into the Supabase OAuth redirect chain so `auth/callback` gets it back. The `signInWithGoogleAction` needs a `next` parameter:

```typescript
// Updated signInWithGoogleAction signature:
export async function signInWithGoogleAction(next: string = '/dashboard') {
  // ...
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })
}
```

The login page reads `next` from `searchParams` and passes it to the action. [VERIFIED: pattern confirmed by auth/callback/route.ts which already reads `next` param]

### Pattern 5: Join Validation Server Action

```typescript
export async function joinChallengeAction(code: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if user is already in a challenge (D-14)
  const existingMembership = await db
    .select()
    .from(challengeMembers)
    .where(eq(challengeMembers.userId, user.id))
    .limit(1)

  if (existingMembership.length > 0) {
    return { error: 'already_in_challenge' }
  }

  // Validate invite code
  const [invite] = await db
    .select()
    .from(inviteLinks)
    .where(eq(inviteLinks.code, code))
    .limit(1)

  if (!invite) return { error: 'invalid' }
  if (invite.usedAt) return { error: 'used' }
  if (invite.expiresAt < new Date()) return { error: 'expired' }

  // Mark as used and add member — should be atomic
  // Note: Drizzle with Supabase pooler (Transaction mode) supports transactions
  // but be aware: drizzle db.transaction() may need the admin client with service role key
  // for tables protected by RLS. See Pitfall 1 below.
  await db.update(inviteLinks)
    .set({ usedAt: new Date() })
    .where(eq(inviteLinks.id, invite.id))

  await db.insert(challengeMembers).values({
    challengeId: invite.challengeId,
    userId: user.id,
    displayName: user.user_metadata.full_name || user.email || 'Member',
    avatarUrl: user.user_metadata.avatar_url || null,
  })

  return { success: true }
}
```

### Pattern 6: Web Share API with Clipboard Fallback (D-06)

Must be a Client Component (accesses browser APIs).

```typescript
// Client component for share button
'use client'

async function handleShare(url: string) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: 'Join my SweatStakes challenge',
        text: 'I\'m holding you accountable to your workouts. Join here:',
        url,
      })
      return
    } catch (err) {
      // User cancelled or share failed — fall through to clipboard
      if ((err as Error).name === 'AbortError') return
    }
  }
  // Fallback: copy to clipboard
  await navigator.clipboard.writeText(url)
  // Show "Copied!" toast/feedback
}
```

`navigator.share` requires HTTPS (Vercel handles this) and a user gesture. [VERIFIED: MDN Web Share API docs]

Browser support: Chrome (mobile + desktop), Safari iOS/macOS, Edge — all support it. Firefox desktop does not. Since this is a mobile-first PWA, Web Share API will be available for the target audience (iPhone + Android). [VERIFIED: MDN Web Share API]

### Pattern 7: Dashboard Avatar Row (D-15, D-16)

Rendered server-side from `challenge_members` table. First 5 avatars shown, overflow counted.

```typescript
// In dashboard/page.tsx — after existing user fetch:
const membership = await db
  .select({ challengeId: challengeMembers.challengeId })
  .from(challengeMembers)
  .where(eq(challengeMembers.userId, user.id))
  .limit(1)

if (membership.length > 0) {
  const members = await db
    .select({
      displayName: challengeMembers.displayName,
      avatarUrl: challengeMembers.avatarUrl,
      userId: challengeMembers.userId,
    })
    .from(challengeMembers)
    .where(eq(challengeMembers.challengeId, membership[0].challengeId))
}
// Pass members to UI: show first 5, "+N" if more
```

**Avatar circle pattern:** 32px circles, overlapping stack (negative margin `-ml-2`), stacked left-to-right, overflow count as a grey circle. All avatar fallback: first letter of display name on `surface-container-high` background (same pattern as dashboard greeting).

### Anti-Patterns to Avoid

- **Using Supabase JS client for Drizzle mutations:** The Supabase JS client (`@supabase/supabase-js`) queries through the PostgREST API. Drizzle connects directly via `postgres.js` to the DB connection string. Do not mix them for the same tables — pick one. For Phase 2, use Drizzle for all database operations on the new tables; Supabase client is only for auth.
- **Running Drizzle queries from `route.ts` files instead of Server Actions:** Established pattern (Phase 1) is Server Actions for mutations. Route handlers (`route.ts`) are for special cases like OAuth callbacks and external webhooks.
- **Storing user profile data in a separate `profiles` table in Phase 2:** Store `display_name` and `avatar_url` directly on `challenge_members` row at join time (denormalized). This is appropriate for v1 — avoids adding another table and join.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cryptographically secure random code | `Math.random()` or base64 tricks | `nanoid` with custom alphabet | nanoid uses Web Crypto API — unguessable codes with no ambiguous characters |
| Code collision detection | Loop with retry logic | Single insert with UNIQUE constraint | PostgreSQL UNIQUE on `invite_links.code` causes insert to fail on collision; catch the error and retry. Statistically near-zero with 8-char code from 32-char alphabet (32^8 = 1 trillion combinations) |
| RLS bypass for admin operations | Custom auth checks in Server Actions | Supabase service role client (if truly needed) | For operations that genuinely need to bypass RLS (e.g., marking invite as used, which belongs to `createdBy` but is being written by the joiner), use a Supabase Admin client initialized with `SUPABASE_SERVICE_ROLE_KEY` — never expose this key to the browser |

**Key insight:** The "mark invite as used" operation (joiner writes to a row they didn't create) is the one place where RLS gets complex. The cleanest solution: drop the RLS `UPDATE` policy on `invite_links` and allow the update via the service role client in the Server Action, or write a Postgres function that runs with `SECURITY DEFINER`. See Pitfall 2 below.

---

## Common Pitfalls

### Pitfall 1: Drizzle + Supabase RLS — User Context Missing

**What goes wrong:** Drizzle queries via the `postgres` driver run as the `postgres` role by default, bypassing all RLS policies. RLS is only enforced when the query runs as the `authenticated` role with the user's JWT set.

**Why it happens:** Unlike the Supabase JS client (which sends the user's JWT in headers and PostgREST enforces RLS), `postgres.js` connects directly as the database user — no JWT context.

**How to avoid:** For Phase 2, the simplest approach is to NOT rely on RLS enforcement in Drizzle queries — instead validate user identity in the Server Action using Supabase Auth (`getUser()`), then use the Drizzle client to run queries. This is safe because Server Actions run server-side, users can't call them directly without going through the auth check you add manually.

RLS policies in the schema still matter for any queries that might run through the PostgREST layer (Supabase JS client), but Drizzle bypasses them. Design Server Actions as the RLS layer.

**Warning signs:** If a user can see or modify another user's challenge data despite RLS policies existing.

**Alternative (advanced):** Use `drizzle-supabase-rls` library which threads JWT into Drizzle transactions — but this adds complexity not needed for Phase 2.

### Pitfall 2: The Joiner Can't UPDATE invite_links (RLS Conflict)

**What goes wrong:** The `invite_links` table has an RLS policy that only `createdBy` can update the row. But the person joining (`joinChallengeAction`) is a different user — so their Drizzle query to mark `used_at` will be blocked.

**Why it happens:** One-time-use logic requires writing to a row you don't own.

**How to avoid:** Since Drizzle bypasses RLS anyway (Pitfall 1), the `joinChallengeAction` Server Action can safely call `db.update(inviteLinks)` without hitting RLS. The auth check in the action itself provides security. No service role key needed for this specific use case — Drizzle already runs with elevated DB credentials.

**If using Supabase JS client instead:** Create a Postgres function `SECURITY DEFINER` that validates and consumes an invite code atomically, then call it via `supabase.rpc()`.

### Pitfall 3: Race Condition on One-Time-Use Codes

**What goes wrong:** Two people tap the same invite link simultaneously; both pass the `usedAt IS NULL` check; both join; the link is used twice.

**Why it happens:** Read-then-write without locking.

**How to avoid:** Use a database-level atomic update:
```sql
UPDATE invite_links
SET used_at = NOW()
WHERE code = $1 AND used_at IS NULL AND expires_at > NOW()
RETURNING id, challenge_id
```
If zero rows are returned, the link was already used or expired. In Drizzle:
```typescript
const updated = await db
  .update(inviteLinks)
  .set({ usedAt: new Date() })
  .where(and(
    eq(inviteLinks.code, code),
    isNull(inviteLinks.usedAt),
    gt(inviteLinks.expiresAt, new Date())
  ))
  .returning()

if (updated.length === 0) return { error: 'invalid_or_used' }
// Then insert challengeMembers
```
This is the correct pattern — the DB enforces atomicity. [VERIFIED: standard SQL pattern for one-time tokens]

### Pitfall 4: Losing Join Intent During OAuth Round-Trip

**What goes wrong:** Unauthenticated user taps `/join/A7X9K2`, gets redirected to Google OAuth, completes login, lands on `/dashboard` — but never actually joined the challenge.

**Why it happens:** The `next` parameter must be threaded from the original URL → login page → OAuth initiator → Supabase's `redirectTo` → `auth/callback` → final redirect. Breaking any link loses the intent.

**How to avoid:**
1. `/join/[code]` page: redirects to `/login?next=/join/A7X9K2`
2. Login page: reads `next` from `searchParams`, passes it to `signInWithGoogleAction(next)`
3. `signInWithGoogleAction`: appends `?next=${encodeURIComponent(next)}` to the `redirectTo` URL
4. `auth/callback/route.ts`: already reads `next` param and redirects there after session exchange
5. `/join/[code]` page: now user is authenticated, calls `joinChallengeAction` immediately

Security: `auth/callback/route.ts` already validates the `next` param must start with `/` and not be `//`. This prevents open redirect attacks. [VERIFIED: existing code in `src/app/auth/callback/route.ts`]

### Pitfall 5: `drizzle-kit push` Requires DATABASE_URL Env Var

**What goes wrong:** Running `npx drizzle-kit push` fails because `DATABASE_URL` is not set.

**Why it happens:** Drizzle kit reads connection from `drizzle.config.ts` which needs `DATABASE_URL`.

**How to avoid:** Create `drizzle.config.ts` before running migrations:
```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```
And add `DATABASE_URL` to `.env.local`. [VERIFIED: orm.drizzle.team/docs/get-started/supabase-new]

---

## Code Examples

### Generate invite code with nanoid custom alphabet

```typescript
// Source: nanoid docs (github.com/ai/nanoid#custom-alphabet-or-size)
import { customAlphabet } from 'nanoid'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 32 chars, no 0/O/I/1
const generateCode = customAlphabet(ALPHABET, 8)

const code = generateCode() // e.g. "A7X9K2MP"
```

### drizzle-kit push workflow

```bash
# Add DATABASE_URL to .env.local first, then:
npx drizzle-kit push
# Output: changes applied to Supabase PostgreSQL
```

### Drizzle query returning type inference

```typescript
// Source: orm.drizzle.team/docs/get-started/supabase-new
type ChallengeInsert = typeof challenges.$inferInsert
type ChallengeMemberSelect = typeof challengeMembers.$inferSelect
```

### Web Share API with feature detection

```typescript
// Source: MDN Web Share API (developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)
async function shareInviteLink(url: string): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare({ url })) {
    try {
      await navigator.share({ title: 'Join SweatStakes', url })
      return 'shared'
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'failed' // user cancelled
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Middleware.ts + export middleware function | proxy.ts + export proxy function (Next.js 16) | Already established in Phase 1 — no change needed |
| Prisma for DB schema | Drizzle ORM (already in project) | Already installed — continue using |
| PostgREST (Supabase JS) for all DB ops | Drizzle direct postgres.js connection | Drizzle is the pattern for this project; Supabase JS only for auth |
| `Math.random()` for token generation | `nanoid` with Web Crypto | Security requirement |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `challenge_members` stores `display_name` + `avatar_url` from Google at join time rather than fetching live from `auth.users` metadata | Architecture Patterns (Pattern 1 schema) | If user changes Google avatar later, stored copy goes stale — acceptable for v1 |
| A2 | Drizzle bypasses RLS when using postgres.js directly (auth check in Server Action substitutes) | Common Pitfalls (Pitfall 1) | If Supabase adds row-level enforcement at the DB driver level, Drizzle queries could break — unlikely, not currently documented |
| A3 | The `next` param threading approach through OAuth round-trip works with Google OAuth specifically (some providers strip custom params from callback) | Architecture Patterns (Pattern 4) | Google OAuth passes the `next` param through `state` via Supabase Auth — Supabase handles this; confirmed pattern in existing auth/callback/route.ts |

---

## Open Questions

1. **Drizzle transaction atomicity for mark-used + insert-member**
   - What we know: Supabase connection pooler (Transaction mode, port 6543) supports transactions. `drizzle-orm` `db.transaction()` should work.
   - What's unclear: Whether `db.transaction()` with the pooler Connection string reliably handles the atomic update + insert pattern.
   - Recommendation: Use the atomic `UPDATE ... WHERE used_at IS NULL RETURNING` pattern (Pitfall 3) which achieves the same result without needing a transaction block.

2. **User profile data freshness in `challenge_members`**
   - What we know: Google avatar URLs in `user_metadata` can change when users update their Google profile.
   - What's unclear: Whether to store avatar at join time (simpler) or fetch live from `auth.users` on each dashboard render (fresh but more joins).
   - Recommendation: Store at join time (denormalized) — appropriate for v1, group is small and personal.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase project | Database, Auth | ✓ | Managed (Supabase cloud) | — |
| `drizzle-orm` | Schema and queries | ✓ | 0.45.2 [VERIFIED] | — |
| `drizzle-kit` | Migrations (`push`) | ✓ | 0.31.10 [VERIFIED] | — |
| `nanoid` (as direct dep) | Invite code generation | ✗ | — (v3 transitive only, CJS) | Install v5: `npm install nanoid` |
| `postgres` driver | Drizzle DB connection | ✗ | — | Install: `npm install postgres` |
| `DATABASE_URL` env var | Drizzle connection | ✗ | — (not in .env.local.example) | Add Supabase Transaction mode string |
| Web Share API | Share invite link | ✓ on mobile targets | Browser API | navigator.clipboard fallback (also implemented) |

**Missing dependencies with no fallback:**
- `nanoid` (v5 as direct dep) — must be installed before coding `generateInviteLinkAction`
- `postgres` driver — must be installed before Drizzle client can connect
- `DATABASE_URL` — must be added to `.env.local` and Vercel env vars before `drizzle-kit push`

**Missing dependencies with fallback:**
- Web Share API — clipboard fallback implemented per D-06

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 with @testing-library/react |
| Config file | `vitest.config.mts` |
| Quick run command | `npx vitest run tests/connections.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONN-01 | `generateInviteLinkAction` generates a valid invite URL with 8-char code | unit | `npx vitest run tests/connections.test.ts` | ❌ Wave 0 |
| CONN-01 | Invite code uses only uppercase alphanumeric chars (no ambiguous: 0, O, I, 1) | unit | `npx vitest run tests/connections.test.ts` | ❌ Wave 0 |
| CONN-01 | `invite_links` table row has `expires_at` 24h in the future | unit | `npx vitest run tests/connections.test.ts` | ❌ Wave 0 |
| CONN-02 | `joinChallengeAction` returns error for expired code | unit | `npx vitest run tests/connections.test.ts` | ❌ Wave 0 |
| CONN-02 | `joinChallengeAction` returns error for already-used code | unit | `npx vitest run tests/connections.test.ts` | ❌ Wave 0 |
| CONN-02 | `joinChallengeAction` returns error for user already in a challenge | unit | `npx vitest run tests/connections.test.ts` | ❌ Wave 0 |
| CONN-02 | `/join/[code]` page file exists at correct path | file-existence | `npx vitest run tests/connections.test.ts` | ❌ Wave 0 |
| CONN-03 | Dashboard page queries `challenge_members` for avatar row | unit | `npx vitest run tests/connections.test.ts` | ❌ Wave 0 |
| CONN-03 | Dashboard shows empty state when no membership | unit | `npx vitest run tests/connections.test.ts` | ❌ Wave 0 |
| CONN-03 | Schema file defines all 3 tables: `challenges`, `challenge_members`, `invite_links` | unit | `npx vitest run tests/connections.test.ts` | ❌ Wave 0 |

**Established test pattern from Phase 1:** Tests in `tests/*.test.ts` use file-system checks (reading source files and asserting on content/structure) and unit tests of pure functions. Database integration tests are out of scope (no test DB). Pattern: mock the Drizzle `db` module; test action logic with mocked returns.

### Sampling Rate

- **Per task commit:** `npx vitest run tests/connections.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/connections.test.ts` — covers CONN-01, CONN-02, CONN-03
- [ ] `src/db/schema.ts` — Drizzle schema (Wave 0 prerequisite for all other tasks)
- [ ] `src/db/index.ts` — Drizzle client
- [ ] `drizzle.config.ts` — migration configuration
- [ ] `DATABASE_URL` added to `.env.local.example`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth `getUser()` called at top of every Server Action |
| V3 Session Management | yes | `@supabase/ssr` cookie sessions (established Phase 1) |
| V4 Access Control | yes | Server Action validates user identity before any DB operation; `challenge_members` RLS for PostgREST queries |
| V5 Input Validation | yes | Invite code validated: format check (alphanumeric, length), existence check, expiry check, used-at check |
| V6 Cryptography | yes | `nanoid` uses Web Crypto API (not Math.random) — satisfies unpredictability requirement |

### Known Threat Patterns for Invite Links

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Brute-force invite code guessing | Tampering | 32^8 = ~1 trillion combos; rate-limit `/join/[code]` route via Vercel Edge or Supabase row-level throttle |
| Open redirect via `next` param | Elevation of Privilege | Already mitigated in `auth/callback/route.ts`: `next` must start with `/` and not `//` |
| Replay attack on used codes | Tampering | `usedAt` timestamp set atomically on first use; subsequent uses return error |
| Joining someone else's challenge while already in one | Elevation of Privilege | `joinChallengeAction` checks existing membership before proceeding (D-14) |
| Exposing service role key | Information Disclosure | Never import `SUPABASE_SERVICE_ROLE_KEY` in client components; only in Server Actions/Route Handlers |

**Rate limiting note:** Vercel Hobby tier has no built-in rate limiting. For v1 friend-group use, this is acceptable. If needed, add middleware rate limiting in `proxy.ts` using a simple in-memory counter or Upstash Redis. [ASSUMED — Vercel Hobby rate limiting capabilities]

---

## Sources

### Primary (HIGH confidence)
- [Drizzle ORM Supabase setup](https://orm.drizzle.team/docs/get-started/supabase-new) — schema definition, drizzle-kit push workflow
- [Drizzle ORM Row Level Security docs](https://orm.drizzle.team/docs/rls) — pgPolicy syntax, Supabase helpers (`authenticatedRole`, `authUid`)
- [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — `auth.uid()` pattern, team membership policy template
- [MDN Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API) — browser support, `navigator.share`, `navigator.canShare()`
- [nanoid npm](https://www.npmjs.com/package/nanoid) — `customAlphabet` API, Web Crypto backing
- Codebase: `src/app/auth/callback/route.ts` — confirms `next` param threading pattern [VERIFIED: read directly]
- Codebase: `src/lib/actions/auth.ts` — Server Action pattern to follow [VERIFIED: read directly]
- Codebase: `proxy.ts` — confirms `/join/*` is not in protected routes list [VERIFIED: read directly]
- `npm list drizzle-orm`, `npm list drizzle-kit`, `npm view nanoid version`, `npm view postgres version` [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)
- [Next.js redirecting guide](https://nextjs.org/docs/app/guides/redirecting) — `redirect()` function in Server Actions and Route Handlers
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs) — `next` param in OAuth flow

### Tertiary (LOW confidence)
- None — all critical claims verified via official sources or codebase inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified via npm registry and codebase
- Architecture: HIGH — patterns verified against existing Phase 1 code and official Drizzle/Supabase docs
- Pitfalls: HIGH — RLS bypass is documented behavior; race condition is standard DB concurrency issue; OAuth param threading is code-verified

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (30 days — stable APIs)
