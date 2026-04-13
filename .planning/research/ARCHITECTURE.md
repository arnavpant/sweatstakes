# Architecture Patterns

**Domain:** Fitness accountability / social group challenge web app
**Project:** SweatStakes
**Researched:** 2026-04-12

---

## Recommended Architecture

SweatStakes maps cleanly onto a **monolithic Next.js full-stack app** with a few well-separated subsystems. At this scale (personal project growing to small public launch), a distributed microservices setup introduces unnecessary operational cost. The right architecture is: one deployable unit, clear internal module boundaries, and two external async processes (settlement job + media storage).

```
Browser (Mobile Web)
     |
     | HTTPS
     v
+----------------------------+
|   Next.js App (App Router) |
|                            |
|  [Page Routes / RSC]       |
|  [API Routes / Server Actions] |
|                            |
|  +----------+  +---------+ |
|  | Auth     |  | Feed    | |
|  | Module   |  | Module  | |
|  +----------+  +---------+ |
|  +----------+  +---------+ |
|  | Group    |  | Points  | |
|  | Module   |  | Ledger  | |
|  +----------+  +---------+ |
|  +----------+              |
|  | Checkin  |              |
|  | Module   |              |
|  +----------+              |
+----------------------------+
     |            |
     v            v
PostgreSQL     Cloudflare R2 / AWS S3
(Neon)         (photo storage + CDN)
     |
     v
Weekly Settlement Cron Job
(Vercel Cron or external scheduler)
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Auth Module** | Sign-up, login, session management, OAuth (Google/Apple), invite-token resolution | All other modules (identity provider); PostgreSQL for user records |
| **Group Module** | Create group ("sanctuary"), generate invite links, manage membership, group settings | Auth Module (who is calling); PostgreSQL for group/membership tables |
| **Checkin Module** | Camera capture in browser, presigned URL generation, photo upload to object storage, create check-in record | Object Storage (presigned URL PUT); PostgreSQL (check-in records); Feed Module (publish event) |
| **Points Ledger Module** | Track per-user running balance per group, record point transactions, expose balance history (The Ledger) | Settlement Job (writes transactions); PostgreSQL (append-only transactions table) |
| **Feed Module** | Build activity feed per group (check-in posts, hype/nudge reactions), real-time-ish updates via polling or SSE | PostgreSQL (feed_items, reactions); Checkin Module (consumes new check-ins) |
| **Settlement Job** | Runs weekly per group, evaluates who hit their goal, calculates points owed, writes to Ledger, resets weekly state | PostgreSQL (reads goals + check-ins, writes point transactions); Notification service (optional push) |
| **Rewards Module** | Group-curated stakes menu CRUD, point redemption requests, redemption history | PostgreSQL (rewards, redemptions); Points Ledger (balance check before redemption) |

---

## Data Flow

### 1. Workout Check-in Flow (most frequent, latency-sensitive)

```
User taps "Log Workout"
  -> Browser Camera API captures photo
  -> Client calls POST /api/checkin/presign  (server action)
     -> Server validates auth + daily limit
     -> Generates presigned PUT URL (R2/S3, 5min TTL)
     -> Returns {presignedUrl, checkInId}
  -> Client PUTs photo directly to R2/S3 (bypasses server)
  -> Client calls POST /api/checkin/confirm {checkInId, photoKey}
     -> Server marks check-in as confirmed in DB
     -> Server writes feed_item record
     -> Server updates today's workout streak cache (or derives from DB)
  -> Feed reflects new check-in for group members
```

Key: Photo bytes never pass through the Next.js server. This keeps the API route fast and prevents memory pressure.

### 2. Weekly Settlement Flow (async, scheduled)

```
Cron trigger (Sunday midnight, group's timezone)
  -> Settlement Job queries all active groups
  -> For each group:
     -> Fetch member goals + check-in counts for the week
     -> Apply rule: member hit goal? -> earns points from each member who missed
     -> Special case: all members missed -> zero-sum wash, no points move
     -> Write point_transaction rows (append-only, immutable)
     -> Increment/reset weekly_progress counters
     -> Update streak records (consecutive weeks of hitting goal)
  -> Job completes; Ledger balances auto-derive from transaction history
```

Key: Point transactions are **append-only**. The Ledger balance is always `SUM(transactions WHERE user_id = X AND group_id = Y)`. Never mutate a balance directly — this makes audit history trivially correct.

### 3. Feed / Social Reactions Flow

```
Member opens Feed
  -> GET /api/feed/{groupId}
     -> Query feed_items for group, ordered by created_at DESC
     -> Hydrate with reaction counts
     -> Return paginated list
  -> Member taps Hype or Nudge
     -> POST /api/reactions {feedItemId, type}
     -> Upsert reaction record (one per user per item per type)
     -> Return updated counts
```

For SweatStakes at launch scale (groups of 2-20), **pull-based polling** (refresh every 30s or on tab focus) is sufficient. True WebSocket fanout is unnecessary complexity until groups exceed ~100 members.

### 4. Group Invite Flow

```
Group creator taps "Invite"
  -> POST /api/groups/{id}/invite
     -> Server generates cryptographically random token (24-byte, base64url)
     -> Stores: {token_hash, group_id, created_by, expires_at (7 days), used: false}
     -> Returns shareable URL: https://sweatstakes.app/join/{rawToken}
  -> Recipient opens link
     -> GET /join/{token} -> server validates hash, checks expiry
     -> If authenticated: immediately add to group membership
     -> If not authenticated: redirect to sign-up, token persisted in session
     -> After auth: resolve token, add to group, mark token used
```

Store only the **hash** of the token in the database, not the raw token. Raw token lives only in the URL (same pattern as password reset links). This prevents database leaks from exposing working invite links.

---

## Database Schema: Key Tables

These are not exhaustive but define the load-bearing entities:

```sql
-- Identity
users (id, email, name, avatar_url, created_at)

-- Groups ("sanctuaries")
groups (id, name, created_by, created_at)
group_members (group_id, user_id, weekly_goal, joined_at, role)
group_invites (id, group_id, token_hash, created_by, expires_at, used_at)

-- Check-ins (immutable log)
checkins (id, user_id, group_id, photo_url, note, checked_in_at, week_number, year)

-- Points (append-only ledger)
point_transactions (id, group_id, from_user_id, to_user_id, amount, reason, settled_week, created_at)
-- reason: 'weekly_settlement' | 'redemption'

-- Rewards menu
rewards (id, group_id, name, description, point_cost, created_by, active)
redemptions (id, group_id, redeemed_by, reward_id, points_spent, created_at)

-- Feed
feed_items (id, group_id, user_id, type, checkin_id, body, created_at)
-- type: 'checkin' | 'streak_milestone' | 'goal_hit' | 'redemption'
reactions (id, feed_item_id, user_id, type, created_at)
-- type: 'hype' | 'nudge'

-- Streaks (cached, derived from checkins)
streaks (user_id, group_id, current_week_streak, longest_week_streak, current_day_streak, longest_day_streak, last_updated)
```

---

## Patterns to Follow

### Pattern 1: Append-Only Ledger
**What:** Never UPDATE point balances. Write immutable transaction rows. Derive current balance via SUM at query time (or maintain a cached balance column, refreshed after each transaction write).
**When:** Any time a points value changes.
**Why it matters:** Audit trail is automatic. Bugs in settlement logic can be corrected by replaying/reversing transactions, not trying to reconstruct lost mutable state.

### Pattern 2: Presigned URL for Media
**What:** Client requests a short-lived presigned URL from the server, then uploads directly to object storage. Server only stores the resulting URL key.
**When:** Every check-in photo upload.
**Why it matters:** Next.js serverless functions have memory/time limits. A 5MB photo through the API route is fragile under concurrent load.

### Pattern 3: Weekly State via Derived Query
**What:** Weekly progress (e.g., "3 of 5 days logged this week") is always calculated by querying `checkins WHERE week_number = current AND user_id = X`. Do not store `days_this_week` as a mutable counter.
**When:** Dashboard loading, settlement job input.
**Why it matters:** Avoids drift between counter and source of truth. Counter can always be reconstructed.

### Pattern 4: Token Hash for Invites
**What:** Store `SHA-256(token)` in DB. Return raw token in URL only.
**When:** Generating invite links.
**Why it matters:** SQL dump or inadvertent logging of invite table does not expose working links.

### Pattern 5: Fanout-on-Read for Feed
**What:** At query time, fetch all check-ins for the group from the last N days and render as feed. Do not pre-write fan-out copies to each member's inbox.
**When:** Groups are small (2-50 members). Revert to fanout-on-write if groups exceed ~500.
**Why it matters:** For small groups, the join cost is negligible. Simpler write path means fewer bugs and no consistency issues.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Mutable Balance Column
**What:** Storing `user.points_balance` as a single integer and doing `UPDATE users SET points_balance = points_balance + N`.
**Why bad:** Race conditions under concurrent settlement. Lost audit trail. Impossible to debug wrong balances post-hoc.
**Instead:** Append-only `point_transactions` table, derive balance via SUM.

### Anti-Pattern 2: Storing Photos on the Next.js Server
**What:** Writing uploaded photo bytes to `/tmp` or passing them through API routes to S3.
**Why bad:** Serverless function memory limits (typically 50-500MB). Sequential bottleneck. Fails at modest concurrency.
**Instead:** Presigned URL pattern — client uploads direct to R2/S3.

### Anti-Pattern 3: Mutable `days_this_week` Counter
**What:** A column incremented each time a check-in is recorded.
**Why bad:** If check-ins are deleted or a bug double-counts, the counter drifts. Settlement job reads stale data.
**Instead:** Derive weekly count from check-in records at settlement time.

### Anti-Pattern 4: Running Settlement in a Request Handler
**What:** Triggering the weekly points calculation inside a user-facing API route (e.g., "when anyone loads the dashboard, check if settlement is due").
**Why bad:** Race conditions if two users load simultaneously. Settlement runs multiple times. User sees slow load.
**Instead:** Dedicated cron job with idempotency key (e.g., `settlement_runs` table recording each group's last settled week — skip if already run).

### Anti-Pattern 5: WebSocket for Small Groups
**What:** Building real-time WebSocket infrastructure at launch.
**Why bad:** Significant infrastructure complexity (stateful connections, connection management, reconnect logic) for a problem solvable by polling every 30 seconds.
**Instead:** SWR/React Query with `refreshInterval` or `refetchOnWindowFocus`. Revisit if product demands true real-time.

---

## Build Order (Dependency-Driven)

The components have a clear dependency graph that dictates safe build order:

```
1. Auth Module
   (Everything depends on identity — build first)

2. Group Module
   (Needs users to exist; defines the core social unit)

3. Checkin Module
   (Needs groups + users; the primary user action)

4. Points Ledger Module
   (Needs check-in data to be queryable; settlement reads it)

5. Settlement Job
   (Needs complete check-in + ledger infrastructure)

6. Feed Module
   (Needs check-ins to exist; reactions need feed items)

7. Rewards Module
   (Needs ledger balances to be accurate; redemption is downstream of points)
```

**Phase implication:** Auth and Group are Phase 1 blockers. Check-in is Phase 2 (the core mechanic). Points/Settlement is Phase 3 (the stakes). Feed and Rewards are Phase 4 (the social layer and payoff).

---

## Scalability Considerations

| Concern | At 10 users (launch) | At 1K users | At 10K users |
|---------|----------------------|-------------|--------------|
| Feed queries | Simple SQL join, no cache | Add DB index on `(group_id, created_at)` | Consider materialized feed or Redis cache |
| Photo storage | R2/S3 + CDN from day 1 | No change | No change |
| Settlement job | Single Node.js cron | Add idempotency check | Shard by group, parallel workers |
| Point balance reads | SUM query on transactions | Add cached `current_balance` column (refresh on write) | Same, ensure index on `(user_id, group_id)` |
| Streaks | Derived from checkins | Add index on `(user_id, group_id, year, week_number)` | Consider denormalized streak cache table |
| Auth | NextAuth/Clerk handles it | No change | No change |

---

## Sources

- [Fitness App Async Architecture (DEV.to)](https://dev.to/wellallytech/fitness-app-architecture-how-asynchronous-processing-creates-a-smoother-user-experience-2pih) — HIGH confidence
- [Scalable Activity Feed Architecture (GetStream)](https://getstream.io/blog/scalable-activity-feed-architecture/) — HIGH confidence
- [Daily Streak System Implementation (Tiger Abrodi)](https://tigerabrodi.blog/implementing-a-daily-streak-system-a-practical-guide) — HIGH confidence
- [Presigned URL Pattern for Next.js + S3 (Neon Guide)](https://neon.com/guides/next-upload-aws-s3) — HIGH confidence
- [Group Invite System Design (Medium)](https://medium.com/@itayeylon/system-design-inviting-users-to-a-group-98b1e0967b06) — MEDIUM confidence
- [Double-Entry Ledger Design (Medium)](https://medium.com/@altuntasfatih42/how-to-build-a-double-entry-ledger-f69edcea825d) — HIGH confidence (adapted for points, not currency)
- [Fan-Out Explained (GetStream Glossary)](https://getstream.io/glossary/fan-out/) — HIGH confidence
