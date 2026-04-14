---
phase: 05-dashboard-feed-polish
researched: 2026-04-14
status: ready_for_planning
confidence: HIGH
---

# Phase 5 Research — Dashboard, Feed & Polish

## Summary

Phase 5 closes out SweatStakes v1. The only genuinely new infrastructure is **Web Push notifications** (sw.js + VAPID + `web-push` + `push_subscriptions` table + 4 trigger sites + a new hourly reminder cron). Everything else is UI work that reuses patterns already established in Phases 1-4.

Recommended breakdown: **4 plans** (see bottom of doc), est. 7-10 days.

**Primary recommendation:** Follow the official Next.js 16 PWA guide verbatim for the push subscription + service worker plumbing — it maps 1:1 to our needs (`public/sw.js`, `web-push` inside Server Actions, VAPID in env). Don't pull in `next-pwa` or `@serwist/next`. For the avatars bucket, copy the exact folder-scoped RLS pattern Supabase docs show (`auth.uid()::text = (storage.foldername(name))[1]`). For pull-to-refresh, use `react-simple-pull-to-refresh` (2 KB, React 19 compatible). For relative timestamps, use `Intl.RelativeTimeFormat` (native, zero bundle cost) — do NOT add `date-fns`.

Key gotchas to plan around:
1. iOS Web Push **only fires when the PWA is installed to Home Screen** (iOS 16.4+). Settings UI must show an "Add to Home Screen" instruction card when `window.navigator.standalone !== true` on iOS.
2. `navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })` is required — without it, the browser caches `sw.js` forever.
3. `web-push` returns **410 Gone** when a subscription dies (user uninstalled PWA, revoked permission, etc.). Our send helper MUST delete the row in that case, or we'll burn through retry loops forever.
4. The existing hourly settle cron already maxes out a Pro-plan cron slot. Adding a second `/api/cron/reminders` cron is fine on Pro (40 crons/day) — no further upgrade needed.
5. Supabase `avatars` bucket has to be **public-read** (so other members can see your photo), but still needs an RLS INSERT/UPDATE/DELETE policy scoped to `auth.uid()` folder prefix.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Dashboard:**
- **DASH-01 (Active stakes display) = "Leader callout"**: Compute a motivational one-liner from `point_transactions` (e.g., `"Arnav leads with 12 pts — 3 behind Max"`). No new schema. Fallback to neutral placeholder when all balances are 0.
- **DASH-02 (Comparative progress) = Horizontal card scroll**: One card per member (avatar + name + 7-day dot row). User's own card pinned first, rest horizontally scrollable with snap. Reuse `DayDots` component.
- **DASH-03 (Photo gallery) = 2×2 or 3×2 grid**: Show 6 most recent check-in thumbnails for current challenge. Tap thumbnail navigates to `/feed` (no inline lightbox).

**Feed:**
- **FEED-01/02 = BeReal-style vertical card feed**. Each card: avatar + display name + relative timestamp ("2h ago") at top, then the composite photo. No actions (no likes/comments; Hype/Nudge deferred to v2).
- **Update model = Pull-to-refresh + `router.refresh()` on tab navigation**. No Supabase Realtime subscription in Feed for v1.
- **Pagination = load all rows for current challenge**, ordered by `created_at DESC`. Revisit when volume grows.

**Settings:**
- **SETT-01** = already implemented (Phase 3 `goal-stepper.tsx`). No work.
- **SETT-02 = Real Web Push via iOS PWA (primary) + Android (free add-on)**. Scope as its own plan.
  - Service worker `public/sw.js` with `push` + `notificationclick` handlers
  - VAPID key pair in env (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`)
  - New `push_subscriptions` table: `(user_id, endpoint, p256dh, auth, created_at)`
  - Settings UI: permission-request button + iOS "Add to Home Screen" instruction card
  - Fire push at **4 trigger points**:
    1. Member check-in → notify all OTHER challenge members
    2. Weekly settlement (inside cron handler) → notify everyone in the challenge with their own delta
    3. Reward redemption → notify all OTHER challenge members
    4. Daily no-check-in reminder → new hourly cron scans users with a `reminder_hour` matching current hour in challenge timezone AND no check-in today
  - `notifications_enabled boolean` master switch on `challenge_members`
  - New nullable `challenge_members.reminder_hour smallint` column
  - New cron entry in `vercel.json`: `"path": "/api/cron/reminders", "schedule": "0 * * * *"`
- **SETT-03 = Profile editing**: Name (updates both `challenge_members.display_name` AND `auth.users.user_metadata.full_name` via Supabase admin API) + Photo upload (new Supabase Storage `avatars` bucket, fall back to Google OAuth avatar when no custom set).

**Design Polish (DSGN-01, DSGN-02, DSGN-03):**
- Scope = **new screens only**, not retroactive audit. Do NOT attempt app-wide polish inside this phase. `ui_polish_notes.md` tracks the broader backlog for `/gsd-ui-review` AFTER Phase 5 completes.

### Claude's Discretion
- VAPID generation approach (CLI vs code — researcher recommends CLI for one-time keygen)
- Service worker implementation details (plain `public/sw.js` vs `next-pwa` — researcher recommends plain, matches official Next.js 16 docs)
- Pull-to-refresh library pick (researcher recommends `react-simple-pull-to-refresh`)
- Relative-timestamp implementation (researcher recommends native `Intl.RelativeTimeFormat`)
- Query structure for leader callout (single SQL aggregate vs two queries)
- Avatar image dimensions (researcher recommends 256×256 compressed to ~50 KB)

### Deferred Ideas (OUT OF SCOPE)
- Hype/Nudge reactions on feed posts (v2 SOCL-01, SOCL-02)
- Comments/likes on check-ins
- Journal/text notes on check-ins (v2 SOCL-03)
- Privacy toggles
- Multiple challenges per user
- Feed realtime subscriptions (pull-to-refresh + `router.refresh()` is enough for v1)
- App-wide polish pass (ui_polish_notes.md — run `/gsd-ui-review` after Phase 5)
- Email notifications (Web Push covers the use case)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FEED-01 | Activity feed shows check-in photos from all connections | Query pattern § Feed Query |
| FEED-02 | Feed entries show who posted, when, and the photo | Feed card layout + Intl.RelativeTimeFormat for "Xh ago" |
| DASH-01 | Dashboard shows the active bet/stakes description | Leader callout aggregate over `point_transactions` |
| DASH-02 | Dashboard shows your weekly progress vs others' progress | Horizontal member cards reusing `DayDots` |
| DASH-03 | Dashboard shows a workout photo gallery (recent check-ins) | 6-thumbnail query on `check_ins` |
| SETT-01 | User can change weekly goal | Already done in Phase 3 — no work |
| SETT-02 | User can toggle notifications on/off | Full Web Push implementation (sw.js + VAPID + `web-push` + 4 triggers + hourly reminder cron) |
| SETT-03 | User can set profile name and picture | Supabase admin API for name; `avatars` bucket + RLS for photo |
| DSGN-01 | Screens follow Stitch Royale design | Reuse existing `@theme` tokens in globals.css; Plus Jakarta Sans + Material Symbols/Lucide already wired |
| DSGN-02 | Mobile-first responsive with bottom nav | Bottom nav already in `src/components/layout/bottom-nav.tsx` |
| DSGN-03 | All 5 screens working | Login (P1), Dashboard (extended here), Streaks (P4), Feed (built here), Settings (extended here) |

## Project Constraints (from CLAUDE.md)

- **Platform**: mobile web app (responsive website) — must feel native on phone browsers
- **Design**: must closely follow Stitch Royale theme (dark navy `#001233` + emerald `#50C878` / `#66dd8b`; Plus Jakarta Sans; Material Symbols for nav, Lucide for incidental UI)
- **Stack is locked**: Next.js 16 App Router + React 19.2 + TypeScript; Tailwind v4 `@theme` tokens; Drizzle ORM + Supabase Postgres; Supabase Auth (Google OAuth only); `browser-image-compression` for client-side image compression; Server Actions (not REST) for mutations
- **GSD workflow enforcement**: no direct edits outside a GSD command
- **No email/password, no Apple OAuth** — Google OAuth only (locked from Phase 1)

## Architecture Decisions

### Web Push infrastructure

**Service worker placement** — use `public/sw.js` (plain, no build step). Official Next.js 16 PWA guide [CITED: https://nextjs.org/docs/app/guides/progressive-web-apps] is explicit: `navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })`. Do NOT use `next-pwa` or `@serwist/next` — both add webpack config and a second manifest-generation pipeline that fights our existing `src/app/manifest.ts`.

**VAPID key generation** — one-time CLI command, copy output to env [CITED: https://nextjs.org/docs/app/guides/progressive-web-apps]:
```bash
npx web-push generate-vapid-keys
```
Output two keys: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (browser-readable, URL-safe base64) and `VAPID_PRIVATE_KEY` (server-only). **No rotation needed** — VAPID keys don't expire; only rotate if private key leaks. [VERIFIED: npm view web-push version → 3.6.7]

**Web-push library on Vercel** — standard `web-push` (v3.6.7) works on Vercel Node.js runtime [CITED: https://vercel.com/docs/functions/runtimes/node-js — "all Node.js APIs supported"]. Fluid Compute is enabled by default for new projects (since April 2025) [CITED: https://vercel.com/docs/fluid-compute]. No special flags needed. Import inside Server Actions: `import webpush from 'web-push'`.

**Server Action pattern** — set VAPID details once at module load:
```ts
// src/lib/push/send.ts
'use server'
import webpush from 'web-push'

webpush.setVapidDetails(
  `mailto:${process.env.CONTACT_EMAIL || 'arnav@sweatstakes.app'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)
```

**Service worker body** [CITED: Next.js 16 docs, adapted]:
```js
// public/sw.js
self.addEventListener('push', function (event) {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin))
      if (existing) {
        existing.focus()
        existing.navigate(targetUrl)
      } else {
        clients.openWindow(targetUrl)
      }
    })
  )
})
```

**`push_subscriptions` schema** (Drizzle):
```ts
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  endpoint: text('endpoint').notNull().unique(),   // unique = dedupe by endpoint
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('push_subs_user_idx').on(t.userId),
])
```
`endpoint` is the primary dedupe key because the browser regenerates the full subscription object each time — but `endpoint` is stable per install. Index `user_id` for fast lookup when sending a push to a specific user.

**Triggering push from Server Actions** — use **fire-and-forget** (`void sendPushToUsers(...)` without `await`) so we don't block the check-in response on flaky push service network. Catch errors inside the helper; log but don't throw. Log-and-delete on 410 Gone:
```ts
// src/lib/push/send.ts
export async function sendPushToUsers(userIds: string[], payload: { title: string; body: string; url?: string }) {
  const subs = await db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.userId, userIds))

  await Promise.allSettled(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        // Subscription is dead — remove from DB
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint))
      } else {
        console.error('Push send failed:', err?.statusCode, err?.body)
      }
    }
  }))
}
```

### iOS PWA install flow

**Detection** — use BOTH `window.matchMedia('(display-mode: standalone)').matches` AND `window.navigator.standalone === true` [CITED: https://nextjs.org/docs/app/guides/progressive-web-apps, https://web.dev/learn/pwa/detection]. Safari on iOS only started honoring `display-mode: standalone` in 15.4+; `navigator.standalone` is the old iOS-specific property but remains supported. Combined check:
```ts
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as any).standalone === true
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
```
Show the "Add to Home Screen" instruction card **only when `isIOS && !isStandalone`**.

**iOS 16.4+ Web Push requirements** [CITED: https://academy.insiderone.com/docs/web-push-support-for-mobile-safari, https://www.mobiloud.com/blog/progressive-web-apps-ios]:
1. App MUST be installed to Home Screen (standalone display mode). Push is silently unsupported in a regular Safari tab.
2. `manifest.webmanifest` MUST have `display: 'standalone'` — we already have this in `src/app/manifest.ts` [VERIFIED: read file].
3. Permission prompt MUST be triggered by a user gesture (button tap). Don't auto-prompt on page load — Safari rejects silently.
4. After install-to-home-screen, user must **launch the installed PWA, then tap the Settings → Enable Notifications button**, then grant permission. Pre-grant in the Safari tab doesn't carry over.
5. iOS 16.3 and below: push is NOT supported. Gracefully show "Notifications require iOS 16.4 or later. Update your iPhone to enable." when the feature flag API is unavailable.

**Permission prompt UX** — in Settings, button says "Enable notifications". On tap, flow:
1. Check `'serviceWorker' in navigator && 'PushManager' in window` → if false, show unsupported message
2. Check `isStandalone` → if iOS and not standalone, show "Add to Home Screen" instruction card instead of prompt button
3. If standalone, call `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` (Notification.requestPermission() is called implicitly by `subscribe`)
4. POST subscription to Server Action `subscribeUserPush(sub)` → insert into `push_subscriptions` on conflict(endpoint) do nothing
5. If user revokes permission later, `pushManager.getSubscription()` returns null — surface a "Re-enable" button

### Daily reminder cron

**Architecture** — **NEW** endpoint `/api/cron/reminders`. Do NOT multiplex with `/api/cron/settle` — separation keeps each cron's failure mode isolated (a crashed reminder scan must never block settlement, and vice versa). Vercel Pro plan allows up to 40 crons/day [CITED: https://vercel.com/pricing], so two hourly crons is fine.

**vercel.json update**:
```json
{
  "crons": [
    { "path": "/api/cron/settle", "schedule": "0 * * * *" },
    { "path": "/api/cron/reminders", "schedule": "0 * * * *" }
  ]
}
```

**Reminder query pattern** — for each challenge, use the challenge's timezone to compute "current local hour". For each member of that challenge whose `reminder_hour` matches AND `notifications_enabled = true` AND no `check_ins` row for `user_id = ... AND checked_in_date = $localDate`, fire a push. Reuse the `getHourInTimezone()` and `getWeekdayInTimezone()` helpers from [src/app/api/cron/settle/route.ts].

Pseudocode:
```ts
// For each challenge
for (const challenge of allChallenges) {
  const localHour = getHourInTimezone(now, challenge.timezone)
  const localDate = getLocalDateInTz(now, challenge.timezone) // YYYY-MM-DD

  const dueMembers = await db
    .select({ userId: challengeMembers.userId })
    .from(challengeMembers)
    .leftJoin(checkIns, and(
      eq(checkIns.userId, challengeMembers.userId),
      eq(checkIns.challengeId, challenge.id),
      eq(checkIns.checkedInDate, localDate),
    ))
    .where(and(
      eq(challengeMembers.challengeId, challenge.id),
      eq(challengeMembers.reminderHour, localHour),
      eq(challengeMembers.notificationsEnabled, true),
      isNull(checkIns.id), // hasn't checked in today
    ))

  if (dueMembers.length > 0) {
    await sendPushToUsers(dueMembers.map(m => m.userId), {
      title: 'Don\'t break the streak',
      body: 'You haven\'t logged today yet — tap to check in.',
      url: '/check-in',
    })
  }
}
```

**Reminder time column placement** — store `reminder_hour smallint` (0-23, nullable) on `challenge_members` [decided per CONTEXT.md, no separate `user_preferences` table]. Rationale: tied to challenge membership lifecycle (leaving the challenge drops the reminder setting too), and schema stays flat. Add sibling column `notifications_enabled boolean NOT NULL DEFAULT true` — master switch gating all 4 push triggers at send time.

**Migration** — include both new columns + `push_subscriptions` table + `avatars` bucket + RLS policies in a single migration file for Phase 5. Apply via direct SQL push (same pattern Phase 3 used for the `check-ins` bucket, per STATE.md decision log). Drizzle-kit introspection still crashes on Supabase check constraints.

### Supabase Storage avatars bucket

**Bucket provisioning via SQL** — yes, we can script the bucket creation + policies in SQL, same as Phase 3 did for `check-in-photos`. [CITED: https://supabase.com/docs/guides/storage/security/access-control]. Pattern:
```sql
-- Create public-read bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Read: anyone (public bucket bypasses SELECT RLS anyway, but explicit is nice)
CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

-- Write: user can INSERT/UPDATE/DELETE only files under their own user_id folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```
File path convention: `<user_id>/avatar.jpg` — one avatar per user, overwrite on upload (`upsert: true`).

**Upload pattern** — reuses [src/components/check-in/photo-preview.tsx] pattern exactly:
1. Client picks file from `<input type="file" accept="image/*">`
2. `browser-image-compression` with `{ maxSizeMB: 0.05, maxWidthOrHeight: 256, fileType: 'image/jpeg' }` — aim ~50 KB
3. Supabase client upload to `avatars/<user_id>/avatar.jpg` with `upsert: true`
4. `getPublicUrl()` to get the serving URL
5. Server Action `updateProfilePhotoAction(url)` updates `challenge_members.avatar_url`

**Public vs private bucket** — use **public**. Other challenge members must be able to load your avatar without presenting a signed URL. Signed URLs would require every dashboard/feed render to mint a URL per avatar per user, which is pointless complexity for non-sensitive profile photos. [CITED: https://supabase.com/docs/guides/storage/buckets/fundamentals]

**Cache invalidation on photo update** — file path stays the same (`<user_id>/avatar.jpg`), so Supabase CDN + browser will serve stale. Two options:
1. Append `?v=<timestamp>` query string to the stored `avatar_url` (simpler, ~0 cost)
2. Use timestamped filenames like `<user_id>/avatar-<ts>.jpg` (more work — must delete old files)

**Recommendation: option 1.** Store `<publicUrl>?v=<Date.now()>` in `challenge_members.avatar_url`. Bust the cache for free; CDN honors query-string cache keys.

### Pull-to-refresh

**Library pick — `react-simple-pull-to-refresh`** (v1.3.4) [VERIFIED: npm view]. Peer dep accepts React 19 [VERIFIED: `react: '^16.10.2 || ^17.0.0 || ^18.0.0 || ^19.0.0'`]. Usage:
```tsx
import PullToRefresh from 'react-simple-pull-to-refresh'

<PullToRefresh onRefresh={async () => { router.refresh() }}>
  <FeedList items={checkIns} />
</PullToRefresh>
```

**Why not a custom hook** — the native browser pull-to-refresh conflicts with custom implementations on iOS Safari when the page is scrolled to the top. `react-simple-pull-to-refresh` handles the `overscroll-behavior: contain` trick and the touch event cascade correctly. Writing it from scratch is ~100 lines for something that's a commodity.

**Why not `framer-motion` gesture-based** — we don't have `framer-motion` in the dependency tree and it would add ~40 KB gzipped just for this one interaction. Not worth it.

**Revalidation on tab navigation** — use Next.js 16's `router.refresh()` [CITED: https://nextjs.org/docs/app/api-reference/functions/use-router]. Two places:
1. Top of the Feed page in a `useEffect` that watches `pathname` — call `router.refresh()` when user lands on `/feed`
2. Inside `onRefresh` of `<PullToRefresh>` — manual trigger

Feed page becomes a **Server Component** (fetches data server-side), wrapping a Client Component `<FeedList>` that owns the pull-to-refresh. `router.refresh()` re-runs the Server Component and streams fresh data into the client tree without a full navigation.

### Feed / Dashboard query patterns

**Feed query** — single query, inner join for display metadata:
```ts
const feedItems = await db
  .select({
    id: checkIns.id,
    photoUrl: checkIns.photoUrl,
    createdAt: checkIns.createdAt,
    displayName: challengeMembers.displayName,
    avatarUrl: challengeMembers.avatarUrl,
    userId: checkIns.userId,
  })
  .from(checkIns)
  .innerJoin(challengeMembers, and(
    eq(challengeMembers.userId, checkIns.userId),
    eq(challengeMembers.challengeId, checkIns.challengeId),
  ))
  .where(eq(checkIns.challengeId, challengeId))
  .orderBy(desc(checkIns.createdAt))
```
Index coverage: **existing `check_ins_challenge_idx` on `(challengeId, createdAt)`** already handles this. No new index needed. [VERIFIED: read src/db/schema.ts line 41]

**Dashboard photo gallery** — same query with `.limit(6)`. Covered by the same index.

**Leader callout query** — single SQL aggregate:
```ts
const balances = await db
  .select({
    userId: pointTransactions.userId,
    balance: sql<number>`COALESCE(SUM(${pointTransactions.delta}), 0)::int`,
    displayName: challengeMembers.displayName,
  })
  .from(pointTransactions)
  .innerJoin(challengeMembers, and(
    eq(challengeMembers.userId, pointTransactions.userId),
    eq(challengeMembers.challengeId, pointTransactions.challengeId),
  ))
  .where(eq(pointTransactions.challengeId, challengeId))
  .groupBy(pointTransactions.userId, challengeMembers.displayName)
  .orderBy(desc(sql`SUM(${pointTransactions.delta})`))
```
Returns `[{ userId, balance, displayName }, ...]` sorted. Take `[0]` and `[1]` to compute the callout:
- If `balances[0].balance <= 0` → "No stakes settled yet — keep checking in"
- If only 1 person has points → `"{name} leads with {n} pts"`
- Else → `"{name1} leads with {n1} pts — {n1 - n2} ahead of {name2}"`

Phrase from CONTEXT.md was `"Arnav leads with 12 pts — 3 behind Max"` (from Max's POV?); confirm with planner whether callout is always from leader's perspective (`ahead of` second place) or from viewer's perspective (`behind` leader). Recommendation: **always leader-POV** for consistency — same callout for everyone viewing the dashboard.

Index coverage: **existing `pt_challenge_user_idx` on `(challengeId, userId)`** [VERIFIED: read schema]. For GROUP BY aggregate over ~3 months × 5 members × ~10 settlements = ~150 rows, even a full seq scan is fine. No new index.

### Profile photo upload flow

**Name update** — needs BOTH DB writes to keep identity consistent:
```ts
// Server Action: updateProfileAction({ name: string })
// 1. Update challenge_members.display_name
await db.update(challengeMembers)
  .set({ displayName: parsed.name })
  .where(eq(challengeMembers.userId, user.id))

// 2. Update auth.users.user_metadata.full_name via admin API
const supabaseAdmin = createAdminClient() // uses SUPABASE_SERVICE_ROLE_KEY
await supabaseAdmin.auth.admin.updateUserById(user.id, {
  user_metadata: { ...user.user_metadata, full_name: parsed.name }
})
```
Needs `SUPABASE_SERVICE_ROLE_KEY` env var (server-only) — likely already set since Phase 4 cron uses it. Verify in planning step; add to env if missing.

**Photo update flow** (end-to-end):
1. User taps photo in Settings → opens native `<input type="file" accept="image/*" capture>` (the `capture` hint lets mobile offer camera)
2. `browser-image-compression` downsizes to 256×256 at 0.05 MB
3. Supabase client uploads to `avatars/<user_id>/avatar.jpg` with `upsert: true`
4. Server Action `updateAvatarAction({ url })` updates `challenge_members.avatar_url = url + '?v=' + Date.now()`
5. `router.refresh()` revalidates Dashboard + Settings server components

**Round-trip latency** — compressed 50 KB upload on a mobile 4G connection is <1 second. No perceived latency concerns.

### Relative timestamps

**Library pick — native `Intl.RelativeTimeFormat`** [CITED: MDN Intl.RelativeTimeFormat]. Zero bundle cost, available in all modern browsers, built into Node.js. Usage:
```ts
// src/lib/utils/relative-time.ts
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function formatRelative(date: Date): string {
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000)
  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second')
  const diffMin = Math.round(diffSec / 60)
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')
  const diffHr = Math.round(diffMin / 60)
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour')
  const diffDay = Math.round(diffHr / 24)
  return rtf.format(diffDay, 'day')
}
```
Output: `"2 hours ago"`, `"5 minutes ago"`, `"yesterday"`, `"3 days ago"`. Good enough for v1.

**Rejection of `date-fns`** — `date-fns` is 4.1.0 [VERIFIED: npm view], but adds ~6 KB gzipped even with tree-shaking. We don't need locale-aware edge cases, and we're not doing other date math that would justify the import. Stick with native.

### Design fidelity — Royale token reuse

**Existing tokens** (from [src/app/globals.css]): all Material Design 3 surface/primary/secondary/error tokens are in place, plus `--radius-full: 9999px`, `Plus Jakarta Sans` as `--font-sans`, and two utilities: `.glass-panel` (backdrop-blur 20px on rgba surface-container) and `.emerald-glow` (box-shadow 0 0 20px emerald).

**Patterns Phase 5 components should reuse**:
- Card containers: `bg-surface-container rounded-xl p-4` (from DayDots)
- Body text: `text-on-surface` (main) / `text-on-surface-variant` (muted)
- Accent actions: `bg-secondary text-on-secondary` (for primary CTAs), e.g. "Enable notifications" button
- Avatars: `w-10 h-10 rounded-full object-cover` with fallback to initial letter in `bg-surface-container-high`
- Empty-state cards: `bg-surface-container rounded-xl p-6` with centered icon + heading + body (from dashboard page)
- Section headings: `text-base font-bold text-on-surface`
- Pull-to-refresh "loading" spinner: `Loader2` from `lucide-react` with `animate-spin`, color `text-on-surface-variant`

**Material Symbols vs Lucide**:
- **Material Symbols** (via Google Fonts stylesheet already in `layout.tsx`): bottom nav icons ONLY, and the handful of dashboard empty-state icons (`group_add`, etc.) [VERIFIED: read dashboard page.tsx]
- **Lucide** (v1.8.0): everything else incidental — `Loader2`, `ArrowLeft`, `SwitchCamera`, `Construction`. New Phase 5 needs: `Camera` (for avatar upload), `Bell` (notifications section header), `ChevronDown` (reminder time picker), `Image` (photo gallery empty state), optionally `RefreshCw` for pull-to-refresh indicator.

**No new fonts or icon libraries** — everything we need is already loaded.

## Reusable Patterns From Prior Phases

| Phase | Pattern | Reuse In Phase 5 |
|-------|---------|------------------|
| **Phase 3** | `browser-image-compression` → Supabase Storage upload → Server Action (photo-preview.tsx lines 36-90) | **Avatar upload flow** — identical shape, swap bucket name and compression target dims |
| **Phase 3** | `DayDots` Server Component taking `(checkedInDays, goal, weekStart)` as props | **Horizontal member progress cards** — one `DayDots` per member card, pass each member's own week data |
| **Phase 3** | Server Action returning `{ success: true } \| { error: string }` shape | **All new Server Actions** in Phase 5 (push subscribe, update profile, set reminder hour) |
| **Phase 3** | `getWeeklyProgress(userId, challengeId, now)` from `lib/utils/week.ts` | **Per-member weekly progress** — call for each challenge member in the horizontal card |
| **Phase 4** | `/api/cron/settle` with CRON_SECRET Bearer auth + `getHourInTimezone()` / `getWeekdayInTimezone()` helpers | **`/api/cron/reminders`** — copy the auth pattern and timezone helpers verbatim |
| **Phase 4** | `settleWeekForChallenge` → trigger point for weekly-settlement push | Wrap existing call with `sendPushToUsers(memberIds, { title, body })` after successful settlement |
| **Phase 4** | `redeemRewardAction` success path | Append `void sendPushToUsers(otherMemberIds, { title, body })` fire-and-forget |
| **Phase 3** | `submitCheckInAction` success path | Append `void sendPushToUsers(otherMemberIds, { title, body })` fire-and-forget |
| **Phase 1** | `public/icon-192.png` + `public/icon-512.png` + `src/app/manifest.ts` with `display: 'standalone'` | **iOS PWA install requirements** — already satisfied, no work needed on manifest |
| **Phase 1** | Plus Jakarta Sans + Royale token system + glass-panel utility | **All Phase 5 UI** — no new design tokens |
| **Phase 2** | `InviteLinkSection` pattern for Settings card layout | **Settings notifications card, profile card** — same card shell (`bg-surface-container rounded-xl p-5 w-full space-y-3`) |
| **Phase 3** | SQL migration applied directly (not drizzle-kit push) due to v0.31.10 check-constraint crash [STATE.md decision log] | **Phase 5 migration** — same SQL-direct approach for `push_subscriptions`, `avatars` bucket, `reminder_hour` + `notifications_enabled` columns |
| **Phase 3** | `check-in-photos` bucket + RLS policies via SQL | **`avatars` bucket + RLS** — exact same pattern, different folder-scope expression |

**Zero redundant work** if these are actively reused. Flag in plans explicitly: "reuse pattern from Phase N, file path Z".

## Runtime State Inventory

Not applicable — Phase 5 is additive (new columns, new table, new bucket, new cron, new UI). No renames, no refactors, no data migration of existing rows. `challenge_members.reminder_hour` and `challenge_members.notifications_enabled` are added as nullable/defaulted columns that don't require backfill.

**Categorical confirmation**:
- Stored data: none to migrate (new table + new columns only)
- Live service config: Vercel cron config gets ONE new entry (`/api/cron/reminders`) in `vercel.json` — checked into git, deploys automatically
- OS-registered state: none (no Task Scheduler, no launchd, no systemd)
- Secrets/env vars: TWO new env vars required (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`); `SUPABASE_SERVICE_ROLE_KEY` + `CRON_SECRET` already exist from Phase 4
- Build artifacts: none

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Vercel Pro plan | Hourly crons (2 now) | Yes (per STATE.md) | — | — |
| Node.js runtime on Vercel Functions | `web-push` library | Yes (default for Server Actions) | 24.x | — |
| `SUPABASE_SERVICE_ROLE_KEY` env var | Admin API for updating `auth.users.user_metadata` | Likely yes (Phase 4 cron uses it) | — | Verify during planning; add to env if missing |
| `CRON_SECRET` env var | New reminder cron auth | Yes (Phase 4) | — | — |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` env var | Client subscription | No — must generate | — | **Blocking** — first plan task is `npx web-push generate-vapid-keys` + add to Vercel env |
| `VAPID_PRIVATE_KEY` env var | Server send | No — must generate | — | **Blocking** — same as above |
| `CONTACT_EMAIL` env var | `webpush.setVapidDetails()` mailto: | Not set | — | Use literal `mailto:arnav@sweatstakes.app` or similar hardcoded fallback |
| `web-push` npm package | Server send | No — must install | latest 3.6.7 [VERIFIED] | — |
| `react-simple-pull-to-refresh` npm package | Feed pull-to-refresh | No — must install | latest 1.3.4 [VERIFIED] | Custom touchstart/touchmove/touchend implementation (~100 lines) if we want to avoid the dep |

**Missing blocking items** — VAPID keys must be generated and added to env BEFORE the push subscribe flow can be tested end-to-end. Make this the first task in the Web Push plan.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 + happy-dom 20.8.9 |
| Config file | `vitest.config.mts` (ESM, happy-dom env) |
| Quick run command | `npx vitest run --reporter=default` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FEED-01 | Feed query returns all check-ins for current challenge, ordered desc | unit | `npx vitest run tests/feed.test.ts` | ❌ Wave 0 |
| FEED-02 | Relative timestamp util produces "2 hours ago", "yesterday", etc. | unit | `npx vitest run tests/relative-time.test.ts` | ❌ Wave 0 |
| DASH-01 | Leader callout computes correct phrasing from balances (leader tied, empty, single, standard) | unit | `npx vitest run tests/leader-callout.test.ts` | ❌ Wave 0 |
| DASH-02 | Dashboard renders one member progress card per challenge member | component | `npx vitest run tests/components/dashboard.test.tsx` | ❌ Wave 0 |
| DASH-03 | Photo gallery query returns up to 6 most recent check-ins | unit | `npx vitest run tests/photo-gallery.test.ts` | ❌ Wave 0 |
| SETT-02 | `sendPushToUsers` deletes dead subscriptions on 410 Gone | unit (mocked web-push) | `npx vitest run tests/push-send.test.ts` | ❌ Wave 0 |
| SETT-02 | Reminder cron skips users who already checked in today | unit (mocked DB) | `npx vitest run tests/reminder-cron.test.ts` | ❌ Wave 0 |
| SETT-02 | iOS detection returns correct `{ isIOS, isStandalone }` tuple for UA strings | unit | `npx vitest run tests/pwa-detection.test.ts` | ❌ Wave 0 |
| SETT-03 | `updateProfileAction` rejects empty name; `updateAvatarAction` rejects non-URL | unit | `npx vitest run tests/profile-actions.test.ts` | ❌ Wave 0 |
| SETT-02 | Push subscription endpoint is unique (DB dedupe) | integration | manual-only (requires real browser subscribe) | N/A |
| FEED-01 | Pull-to-refresh triggers `router.refresh()` on gesture | manual | UAT on real mobile device | N/A |
| SETT-02 | iOS 16.4+ push actually arrives to installed PWA | manual | UAT on physical iPhone | N/A |
| DSGN-01/02/03 | Visual fidelity to Royale theme | manual | UAT visual inspection | N/A |

### Sampling Rate

- **Per task commit**: `npx vitest run <specific test file>` for the module being touched (< 10s)
- **Per wave merge**: `npx vitest run` — full suite (< 30s at current size)
- **Phase gate**: Full suite green + manual UAT on iOS/Android devices for push, pull-to-refresh, and design fidelity

### Wave 0 Gaps

- [ ] `tests/feed.test.ts` — covers FEED-01 (query shape + ordering)
- [ ] `tests/relative-time.test.ts` — covers FEED-02 (formatRelative util)
- [ ] `tests/leader-callout.test.ts` — covers DASH-01 (4 phrasing cases: empty, single, standard, tied)
- [ ] `tests/components/dashboard.test.tsx` — covers DASH-02 (member card rendering + pinning user first)
- [ ] `tests/photo-gallery.test.ts` — covers DASH-03 (limit 6, order desc)
- [ ] `tests/push-send.test.ts` — covers SETT-02 `sendPushToUsers` (mock web-push, assert DB delete on 410)
- [ ] `tests/reminder-cron.test.ts` — covers SETT-02 reminder logic (mock DB, assert skip-if-checked-in)
- [ ] `tests/pwa-detection.test.ts` — covers SETT-02 iOS detection for 4 UA strings (iOS Safari tab, iOS standalone, Android Chrome, Desktop)
- [ ] `tests/profile-actions.test.ts` — covers SETT-03 validation (empty name, bad URL)

Framework install: none needed — vitest is already wired from Phase 1.

## Known Pitfalls

### 1. iOS Safari Service Worker scope gotcha
**What goes wrong:** Registering `sw.js` at `/sw.js` with scope `/` is mandatory — registering at `/some/path/sw.js` restricts scope to `/some/path/*` and push events won't fire for other routes.
**Why it happens:** Service worker scope defaults to its own path. Explicit `{ scope: '/' }` overrides.
**Prevention:** Copy the official Next.js pattern verbatim — `navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })`. Place the file literally at `public/sw.js`.
**Warning signs:** `pushManager.subscribe()` hangs with no error; Network tab shows no `/sw.js` fetch.

### 2. VAPID key format (URL-safe base64 vs standard base64)
**What goes wrong:** `pushManager.subscribe({ applicationServerKey: rawBase64 })` throws `InvalidAccessError` if the key isn't URL-safe base64 decoded to a Uint8Array.
**Why it happens:** `web-push generate-vapid-keys` outputs URL-safe base64 (`-`/`_` instead of `+`/`/`, no padding). The browser's `applicationServerKey` parameter requires a Uint8Array, not a string.
**Prevention:** Use the `urlBase64ToUint8Array` helper from the official Next.js docs [CITED]:
```ts
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}
```
**Warning signs:** Subscribe call throws `InvalidAccessError`; subscription object is null.

### 3. iOS Web Push requires Home Screen install (not just Safari)
**What goes wrong:** User taps "Enable notifications" in regular Safari tab on iOS, gets no permission prompt, gets no push.
**Why it happens:** iOS Web Push ONLY works inside an installed PWA, gated on `display: 'standalone'` being active AND the app being launched from the Home Screen icon.
**Prevention:** Before calling `pushManager.subscribe`, check `window.navigator.standalone === true` (iOS-specific). If false, show the "Add to Home Screen" instruction card instead of the subscribe button.
**Warning signs:** iOS user reports "I tapped enable but nothing happens"; no Notification prompt appears.

### 4. Web Push subscription expiration (410 Gone)
**What goes wrong:** User uninstalls the PWA or revokes notification permission. Their `push_subscriptions` row is still in DB; every subsequent `webpush.sendNotification` call to that endpoint returns 410 Gone. If we don't clean up, the DB grows with dead rows and every check-in triggers 410 errors.
**Why it happens:** Push subscriptions are one-way — the server never gets notified when a user revokes; it finds out when sending fails.
**Prevention:** In `sendPushToUsers`, catch errors. If `err.statusCode === 404 || err.statusCode === 410`, `DELETE FROM push_subscriptions WHERE endpoint = ?`. Wrap all sends in `Promise.allSettled` so one dead subscription doesn't block others.
**Warning signs:** Logs flooded with 410 errors; send latency increases.

### 5. Service worker update flow (skipWaiting / clients.claim)
**What goes wrong:** Developer deploys a new `sw.js`; existing PWA installs keep serving the old version until the user fully closes and reopens the app. On iOS especially, this can mean days of stale behavior.
**Why it happens:** By default, a new service worker stays in the "waiting" state until all clients controlled by the old one are gone. iOS standalone PWAs never truly close, so the old SW persists indefinitely.
**Prevention:** The official Next.js PWA pattern doesn't use `skipWaiting`/`clients.claim`, which is fine for our case because our push handler doesn't change often. If we need to ship a critical SW fix, bump `sw.js` contents to force the browser to see a byte difference and re-fetch (guaranteed by `updateViaCache: 'none'` + `Cache-Control: no-cache` header [CITED: https://nextjs.org/docs/app/guides/progressive-web-apps]). We configure this header in `next.config.ts`.
**Warning signs:** User reports "notifications stopped working" after a deploy; browser devtools shows old SW still active.

### 6. Next.js 16 sync params/searchParams removed
**What goes wrong:** Any new Phase 5 page component that does `export default function Page({ params }) { return ... }` synchronously will break — Next.js 16 removed sync access.
**Why it happens:** Next.js 16 breaking change (Oct 2025) — params is now a Promise.
**Prevention:** All Phase 5 pages must await params:
```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // ...
}
```
**Warning signs:** Build-time type error; runtime "params is a Promise" error.
**Note:** Phase 1-4 pages don't use dynamic segments; Phase 5 mostly doesn't either (Dashboard/Feed/Settings are all static paths). Main risk is if any new route introduces a segment.

### 7. Next.js 16 middleware.ts → proxy.ts rename
**What goes wrong:** If we need middleware-level logic for Phase 5 (e.g., protecting `/api/cron/reminders` at edge), creating a `src/middleware.ts` file does nothing.
**Why it happens:** Next.js 16 renamed the convention to `proxy.ts`.
**Prevention:** Not applicable for Phase 5 since cron auth uses Bearer-token inside the route handler, not middleware. Just flag so nobody tries to add middleware.ts.

### 8. Supabase Storage image transformation unavailable on free tier
**What goes wrong:** Someone assumes we can use `supabase.storage.from('avatars').getPublicUrl(path, { transform: { width: 128, height: 128 } })` to server-side resize avatars.
**Why it happens:** Transformations are a Pro-plan-only feature [CITED: https://supabase.com/docs/guides/storage/serving/image-transformations].
**Prevention:** All resizing happens client-side via `browser-image-compression` before upload. Storage just hosts the compressed file as-is.
**Warning signs:** URL with `?width=...&height=...` serves the original, not a resized variant.

### 9. Push subscription replacement (not supersession)
**What goes wrong:** User disables and re-enables notifications. New subscription has a new endpoint — old endpoint is orphaned but still in DB.
**Why it happens:** Each `pushManager.subscribe()` call can produce a fresh subscription if the prior one was unsubscribed. Endpoint is stable per subscription lifecycle but not per user.
**Prevention:** On subscribe, `INSERT ... ON CONFLICT (endpoint) DO NOTHING`. Separately, when the user taps "disable notifications" in Settings, explicitly call `subscription.unsubscribe()` AND `DELETE FROM push_subscriptions WHERE endpoint = ?`. Accept that some orphaned rows may accumulate; the 410-cleanup in the send path eventually GCs them.
**Warning signs:** One user has 3+ subscription rows; old ones error 410 on send.

### 10. `router.refresh()` doesn't refetch page component's data if Server Component isn't top-level
**What goes wrong:** Feed page wraps the whole tree in a Client `<PullToRefresh>`. Inside, a static child doesn't re-render on `router.refresh()`.
**Why it happens:** `router.refresh()` re-runs the route segment's Server Components, but only at the topmost Server boundary.
**Prevention:** Keep the Feed page itself as a Server Component that fetches all data, pass data down to a Client Component `<FeedList>` via props. The Server Component wraps `<PullToRefresh onRefresh={...}><FeedList items={items} /></PullToRefresh>` — `router.refresh()` from inside `<PullToRefresh>` re-runs the Server page, which streams fresh items as new props.
**Warning signs:** Pull-to-refresh animates but no new check-ins appear.

### 11. `upsert: true` on Supabase Storage doesn't version cache
**What goes wrong:** User uploads a new avatar. File at `avatars/<uid>/avatar.jpg` is overwritten, but CDN + browser cache still serve the old bytes for ~1 hour (default Supabase cache-control).
**Why it happens:** The storage URL is identical, so browsers/CDNs don't re-fetch.
**Prevention:** Append `?v=<Date.now()>` to the URL stored in `challenge_members.avatar_url`. Query string busts cache for free.
**Warning signs:** User's new photo doesn't show until they force-reload.

### 12. Material Symbols icons don't work until Google Fonts stylesheet loads
**What goes wrong:** On slow networks, new Material Symbols icons render as text of the icon name (e.g., `notifications_active`) until the Google Fonts stylesheet finishes downloading.
**Why it happens:** The stylesheet is loaded in `<head>` of `layout.tsx` but not preloaded.
**Prevention:** Acceptable FOUT (same tradeoff already accepted in Phase 1). If Phase 5 introduces icons that are visible before first paint, consider adding `<link rel="preload" as="style" ...>`. Not worth it for internal use.
**Warning signs:** Text labels briefly visible where icons should be.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `SUPABASE_SERVICE_ROLE_KEY` is already in Vercel env (used by Phase 4 cron's admin API calls) | Profile photo upload flow | Would need to add env var; one extra setup step in first plan |
| A2 | Leader callout is always shown from leader's POV (`"X leads with N pts — M ahead of Y"`) rather than viewer-relative | Leader callout query | Product UX choice — confirm with user in planning if they want viewer-relative phrasing instead |
| A3 | 256×256 at 50 KB is a good avatar target (larger thumbnails render crisp on 2x retina avatar sizes up to ~40 px) | Supabase Storage avatars | Images would be too grainy — bump target to 512×512 @ 100 KB if quality issue |
| A4 | Fire-and-forget `void sendPushToUsers(...)` on check-in/redemption is acceptable latency tradeoff (user-facing action returns immediately, push may fail silently) | Push triggering | If push is business-critical (it isn't for v1), would need to `await` and surface errors in the action response |
| A5 | User-gesture-triggered `Notification.requestPermission()` via `pushManager.subscribe()` works on iOS 16.4+ Safari standalone | iOS PWA install flow | iOS bug could break the flow — backup plan is a two-step UI (explicit "Grant permission" step before "Subscribe") |
| A6 | Reminder UX: user picks one `reminder_hour` (0-23, local to challenge timezone) per account; no "every day at 9am + 6pm" multi-time support | Reminder cron | Single-time is simpler and matches UX scope; if users ask for multiple times, Phase 5 defers to v2 |
| A7 | No quiet-hours / DND feature for notifications in v1 — if user has `notifications_enabled = true`, all 4 trigger types fire | Web Push master switch | Could annoy users who don't want settlement notifications but want reminders; would require per-trigger-type boolean if we need finer control |

## Recommended Plan Breakdown

**4 plans**, roughly in this order:

### Plan 01 — Schema, Storage, Scaffold (foundation)
**One-liner:** SQL migration for `push_subscriptions` table + `challenge_members.reminder_hour` + `challenge_members.notifications_enabled` + `avatars` Supabase Storage bucket with RLS; package installs (`web-push`, `react-simple-pull-to-refresh`); VAPID key generation + env setup; `/sw.js` service worker file; `src/lib/push/send.ts` helper with 410 cleanup.

**Outputs:**
- Schema changes applied (SQL direct, not drizzle-kit push per Phase 3 decision)
- `avatars` bucket exists with correct RLS
- `web-push` + `react-simple-pull-to-refresh` installed
- VAPID keys generated, added to `.env.local.example` and deployed to Vercel env
- `public/sw.js` with push + notificationclick handlers
- `next.config.ts` security headers for `/sw.js`
- `src/lib/push/send.ts` helper (`sendPushToUsers`)
- Drizzle schema updated in `src/db/schema.ts`
- Unit test `push-send.test.ts` with mocked web-push

**Estimate:** 1.5-2 days

### Plan 02 — Web Push subscribe flow + Settings notifications UI + 4 trigger wires
**One-liner:** Client-side push subscription flow; Settings UI (enable/disable toggle + iOS install card + reminder-time picker); wire push triggers into `submitCheckInAction`, `redeemRewardAction`, and `settleWeekForChallenge`; new `/api/cron/reminders` endpoint.

**Outputs:**
- Settings page: notifications card (toggle, permission button, iOS install instructions, reminder-time dropdown)
- `subscribeUserPush` / `unsubscribeUserPush` / `setReminderHour` / `setNotificationsEnabled` server actions
- `utils/pwa-detection.ts` — `{ isIOS, isStandalone }`
- Trigger wires: after check-in / settlement / redemption → `void sendPushToUsers(...)`
- `src/app/api/cron/reminders/route.ts` (Bearer-auth, scans users per challenge, sends pushes)
- `vercel.json` updated with new cron entry
- Tests: `reminder-cron.test.ts`, `pwa-detection.test.ts`

**Estimate:** 2-3 days

### Plan 03 — Dashboard additions (leader callout + member cards + photo gallery) + Feed build
**One-liner:** Extend Dashboard with leader callout, horizontal member progress cards, and 6-thumbnail photo gallery. Build Feed from scratch with pull-to-refresh + revalidation on nav. Add `Intl.RelativeTimeFormat` util.

**Outputs:**
- `src/components/dashboard/leader-callout.tsx` (Server Component fed by aggregate query)
- `src/components/dashboard/member-progress-cards.tsx` (horizontal scroll + snap, reuses `DayDots`)
- `src/components/dashboard/photo-gallery.tsx` (6-thumbnail grid, links to `/feed`)
- Extended `src/app/(protected)/dashboard/page.tsx`
- `src/components/feed/feed-list.tsx` (Client Component with `<PullToRefresh>`)
- `src/components/feed/feed-card.tsx` (avatar + name + relative timestamp + composite photo)
- `src/app/(protected)/feed/page.tsx` (replaces placeholder)
- `src/lib/utils/relative-time.ts` + test
- `src/lib/utils/leader-callout.ts` (pure function producing the phrase) + test
- Tests: `feed.test.ts`, `relative-time.test.ts`, `leader-callout.test.ts`, `photo-gallery.test.ts`, `components/dashboard.test.tsx`

**Estimate:** 2-3 days

### Plan 04 — Profile editing (name + photo)
**One-liner:** Settings UI for editing display name and uploading profile photo. Reuse Phase 3 browser-image-compression upload pattern targeting the new `avatars` bucket.

**Outputs:**
- `src/components/settings/profile-editor.tsx` (name input + photo upload button, using browser-image-compression)
- `updateProfileAction({ name })` → updates `challenge_members.display_name` + `auth.users.user_metadata.full_name` via admin client
- `updateAvatarAction({ url })` → updates `challenge_members.avatar_url` with cache-busting `?v=<ts>`
- Extended `src/app/(protected)/settings/page.tsx`
- Test: `profile-actions.test.ts` (validation)
- Manual UAT: upload photo on mobile, verify other members see update after `router.refresh()`

**Estimate:** 1 day

### Dependencies / Wave Grouping

```
Wave 1:
  Plan 01 (schema + scaffold + sw.js + send helper) — must finish first; nothing else compiles without these

Wave 2 (parallel):
  Plan 02 (push flow + settings toggle + triggers + reminder cron) — depends on Plan 01
  Plan 03 (dashboard + feed) — does NOT depend on Plan 01/02 (pure UI + existing tables); can start in parallel to Plan 02
  Plan 04 (profile editor) — depends on Plan 01 for avatars bucket; otherwise independent of Plan 02/03

Wave 3:
  Integration UAT on real iOS device (push), Android device (push), Desktop (feed, dashboard)
```

Realistic timeline: **7-9 days** if Plan 02 & 03 run in parallel across two working days + buffer for UAT and design-fidelity tweaks.

## Open Questions For The Planner (RESOLVED)

All 7 questions were answered during `/gsd-discuss-phase` follow-up — authoritative answers now live in `05-CONTEXT.md`. The resolutions below are mirrored here for traceability:

1. **Leader callout phrasing:** RESOLVED → **viewer-POV** (user selected "Viewer-POV (recommended)" post-research). Caller passes `viewerUserId` to `computeLeaderCallout`; string personalizes per viewer. Overrides research's leader-POV recommendation.

2. **Reminder UX:** RESOLVED → **single hour per user** (0-23 picker). `challenge_members.reminder_hour smallint`. Multi-time deferred to v2.

3. **Settings toggle granularity:** RESOLVED → **single master switch** (`notifications_enabled` boolean). Per-trigger granularity deferred to v2.

4. **Avatar dimensions:** RESOLVED → **512×512** (retina-safe).

5. **Initial notifications state:** RESOLVED → **default `false`** (opt-in). User explicitly opts in via Settings toggle AFTER install-to-home-screen on iOS; prevents surprise notifications on first use.

6. **Feed cards — selfie thumbnail:** RESOLVED → **composite rendered as-is** (single image, Phase 3 canvas already embedded selfie overlay). No separate layout logic.

7. **Leader callout empty state:** RESOLVED → copy is `"No stakes settled yet — keep checking in"`. Trigger: `balances.length === 0` OR all balances are zero (sorted.every(b => b.balance === 0)).

## Sources

### Primary (HIGH confidence)
- [Next.js 16 PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) — official, Nov 2025 / last-updated 2026-04-10; full service worker + VAPID + web-push pattern for App Router
- [Next.js 16 manifest.json API reference](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest) — confirms `display: 'standalone'`
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) — folder-scoped RLS pattern
- [Supabase Storage Helper Functions](https://supabase.com/docs/guides/storage/schema/helper-functions) — `storage.foldername()` documentation
- [Supabase Storage Buckets Fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals) — public vs private bucket tradeoff
- [Supabase Storage Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations) — Pro-plan-only feature
- [Vercel Fluid Compute](https://vercel.com/docs/fluid-compute) — enabled by default since April 2025
- [Vercel Node.js Runtime](https://vercel.com/docs/functions/runtimes/node-js) — all Node APIs supported
- [Vercel Pricing / Cron Limits](https://vercel.com/pricing) — Pro plan = 40 crons/day
- [MDN `Intl.RelativeTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat) — native relative-time API
- [web.dev: PWA Detection](https://web.dev/learn/pwa/detection) — display-mode + navigator.standalone detection patterns
- `npm view web-push version` → 3.6.7 [VERIFIED in session]
- `npm view react-simple-pull-to-refresh version` → 1.3.4 [VERIFIED]
- `npm view date-fns version` → 4.1.0 [VERIFIED — not recommended for this phase]
- Local codebase: [src/db/schema.ts, src/app/globals.css, src/app/manifest.ts, src/components/check-in/photo-preview.tsx, src/components/dashboard/day-dots.tsx, src/lib/actions/settlement.ts, src/app/api/cron/settle/route.ts] — verified existing patterns and index coverage

### Secondary (MEDIUM confidence, verified against official sources)
- [Insider Academy: Web Push Support for Mobile Safari](https://academy.insiderone.com/docs/web-push-support-for-mobile-safari) — iOS 16.4+ requirements (cross-verified with Apple)
- [MobiLoud: PWAs on iOS 2026 Guide](https://www.mobiloud.com/blog/progressive-web-apps-ios) — standalone-mode requirement
- [firt.dev: iOS PWA Compatibility](https://firt.dev/notes/pwa-ios/) — Maximiliano Firtman's canonical reference
- [MagicBell: PWA iOS Limitations 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)

### Tertiary (LOW confidence, community sources — validate at execution)
- [Medium: Implementing Push Notifications in Next.js using Server Actions (Jan 2026)](https://medium.com/@amirjld/implementing-push-notifications-in-next-js-using-web-push-and-server-actions-f4b95d68091f) — confirms the server-actions pattern we adopt
- [jQueryScript: 7 Best Pull-To-Refresh Plugins 2025](https://www.jqueryscript.net/blog/best-pull-to-refresh.html)

## Metadata

**Confidence breakdown:**
- Standard stack (web-push, react-simple-pull-to-refresh, Intl.RelativeTimeFormat): **HIGH** — npm-verified versions, official docs reference
- Architecture (sw.js placement, Server Action + webpush pattern, RLS folder-scope): **HIGH** — directly from Next.js + Supabase official docs
- iOS PWA requirements: **HIGH** — multiple independent sources (Apple + community) agree on 16.4+, standalone-mode, user-gesture requirements
- Vercel Node.js compatibility for web-push: **MEDIUM** — no explicit "web-push works on Fluid Compute" docs, but `web-push` uses only standard Node APIs which Vercel fully supports; several community posts confirm working Vercel deployments
- Leader callout phrasing assumption (A2): **LOW** — UX choice, needs user confirmation
- Avatar dimension target (A3): **LOW** — design judgment, not verified

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (30 days — Next.js 16, Supabase, and iOS web-push specs are stable; re-verify only if a library publishes a major version)
