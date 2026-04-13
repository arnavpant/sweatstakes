# Phase 3: Check-ins & Goals - Research

**Researched:** 2026-04-13
**Domain:** Camera capture, photo upload, goal tracking, streak computation, Drizzle schema design
**Confidence:** HIGH

## Summary

Phase 3 delivers the core workout accountability loop: a BeReal-style dual-camera check-in flow, photo upload to Supabase Storage, personal weekly goal setting, a day-dots progress tracker, and a streak counter. The technical challenge divides into four distinct domains: (1) browser camera access via `getUserMedia` with front/rear switching and canvas compositing, (2) client-side photo compression and upload to Supabase Storage, (3) new Drizzle schema tables for check-ins and weekly goals, and (4) server-side streak/progress computation with Monday-Sunday week boundaries.

The codebase already has established patterns from Phase 2 -- Server Actions with auth gating, Drizzle ORM queries, client component loading states, and the Royale design system -- that Phase 3 should follow exactly. The bottom navigation needs restructuring to add a center FAB button, and both the Dashboard and Settings pages need new sections.

**Primary recommendation:** Build the camera capture as a dedicated full-screen client component (not a modal) using `getUserMedia`, composite the dual-camera images on a `<canvas>`, compress with `browser-image-compression`, and upload to a private Supabase Storage bucket via the browser client. Use Drizzle for all data queries with computed progress/streak values in Server Components.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Full-screen camera view opens when user taps the check-in button -- dedicated camera UI built with `getUserMedia` API, not native file picker
- **D-02:** BeReal-style dual camera -- rear camera photo first (workout), then auto-flips to front camera for selfie
- **D-03:** Front camera selfie auto-captures after a 3-second countdown (3... 2... 1...) -- no manual shutter tap needed for the selfie
- **D-04:** Composite preview shows large rear camera photo with small selfie thumbnail in the top-left corner (BeReal layout)
- **D-05:** Preview screen has Retake and Submit buttons -- Retake restarts the entire flow (both photos), Submit uploads and records the check-in
- **D-06:** Default to rear camera on open. Flip button available during the rear camera phase only (not during selfie countdown)
- **D-07:** Any photo is accepted as a check-in -- no AI validation or gym detection. Social accountability is the enforcement mechanism. The dual-camera selfie provides soft proof of presence.
- **D-08:** Weekly goal setting lives on the Settings page -- set once, change anytime
- **D-09:** Goal is changeable mid-week with immediate effect for the current week -- no restrictions on when you can change
- **D-10:** Default goal for new users is 3 days/week
- **D-11:** Stepper UI for goal picker: minus button, large number in center, plus button, "days per week" label. Range is 1-7.
- **D-12:** Day dots row on the dashboard -- 7 dots for M T W T F S S, filled dots = checked in, empty = remaining. Shows "2/4 days" count alongside.
- **D-13:** Week resets on Monday (Monday through Sunday is one fitness week)
- **D-14:** Streak counter displays as fire emoji + number: "fire 3 week streak" -- sits below or next to the day dots
- **D-15:** Streak silently resets to 0 when a week is missed -- no notification, no shame screen. User sees the reset on their dashboard.
- **D-16:** Streak increments at the end of a week (Sunday night) if the user met their goal. "Met goal" = checked in on >= goal number of distinct days that week.
- **D-17:** Unlimited check-ins per day, but only 1 counts toward the weekly goal per calendar day. Extra check-ins still appear in the activity feed.
- **D-18:** No deleting check-ins -- once submitted, it's permanent. Keeps accountability honest.
- **D-19:** Check-in button is a center FAB (floating action button) on the bottom navigation bar -- always accessible from any screen, like Instagram's + button
- **D-20:** The FAB replaces the middle nav item -- bottom nav becomes: Dashboard, Feed, [FAB], Streaks, Settings

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

### Deferred Ideas (OUT OF SCOPE)
- AI-powered workout detection / photo validation
- Workout type categorization (cardio, strength, etc.)
- Check-in captions or notes
- Streak milestones or achievements (badges at 4 weeks, 8 weeks, etc.)
- Push notification reminders to check in

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHKN-01 | User can take a photo to log a workout (browser camera API) | getUserMedia API with facingMode, canvas compositing for dual-camera, browser-image-compression for compression, Supabase Storage upload |
| CHKN-02 | Photo is uploaded and visible in the activity feed | Supabase Storage bucket with RLS policies, public URL generation for feed display, check-ins table with photo_url column |
| CHKN-03 | User sets their personal weekly goal (1-7 days per week) | Stepper UI component on Settings page, Server Action to persist goal in challenge_members or dedicated weekly_goals table, default value 3 |
| CHKN-04 | Weekly progress tracker shows days completed vs goal | Day dots component on Dashboard, query check-ins for current week (Monday-Sunday boundary), computed server-side |
| CHKN-05 | Streak counter tracks consecutive weeks of hitting goal | Weekly streak computation: count distinct check-in days per week vs goal, consecutive weeks backward from current/last complete week |

</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.103.0 | Browser-side Storage upload | Already installed; Supabase Storage client for uploading compressed photos directly from the browser [VERIFIED: package.json] |
| `@supabase/ssr` | ^0.10.2 | Server-side auth for Server Actions | Already installed; cookie-based session management [VERIFIED: package.json] |
| `drizzle-orm` | ^0.45.2 | Schema definition and queries for check-ins, goals | Already installed; SQL-first ORM used throughout the project [VERIFIED: package.json] |
| `zod` | ^4.3.6 | Validation for goal values, check-in submissions | Already installed; validates server action inputs [VERIFIED: package.json] |
| `zustand` | ^5.0.12 | Camera state management (capture phase, countdown, preview) | Already installed; lightweight cross-component state [VERIFIED: package.json] |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `browser-image-compression` | 2.0.2 | Client-side photo compression before upload | Compress captured photos to < 500KB before Supabase Storage upload [VERIFIED: npm registry] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| browser-image-compression | Manual canvas.toBlob() quality param | browser-image-compression handles OffscreenCanvas, web workers, and iterative size reduction automatically; hand-rolling misses edge cases |
| Canvas compositing for dual photo | CSS overlay on preview only | Canvas produces a single composite image file to upload; CSS overlay would require uploading two separate images and compositing on display |
| getUserMedia | `<input type="file" capture>` | Native file picker doesn't support the BeReal dual-camera flow; getUserMedia is required for programmatic camera switching |

**Installation:**
```bash
npm install browser-image-compression
```

**Version verification:** browser-image-compression 2.0.2 confirmed as latest via npm registry on 2026-04-13. [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure
```
src/
├── db/
│   └── schema.ts                        # Add checkIns + weeklyGoals tables
├── lib/
│   ├── actions/
│   │   └── check-ins.ts                 # Server Actions: submitCheckIn, updateWeeklyGoal
│   └── utils/
│       └── week.ts                      # Week boundary helpers (getMonday, getSunday, getWeekKey)
├── components/
│   ├── check-in/
│   │   ├── camera-view.tsx              # Full-screen camera UI (client component)
│   │   ├── countdown-overlay.tsx        # 3-2-1 countdown animation
│   │   ├── photo-preview.tsx            # Composite preview with Retake/Submit
│   │   └── capture-button.tsx           # Shutter button
│   ├── dashboard/
│   │   ├── day-dots.tsx                 # M T W T F S S progress dots
│   │   └── streak-counter.tsx           # Fire emoji + week streak
│   ├── settings/
│   │   └── goal-stepper.tsx             # +/- stepper for weekly goal
│   └── layout/
│       └── bottom-nav.tsx               # Modified: center FAB added
└── app/
    └── (protected)/
        ├── check-in/
        │   └── page.tsx                 # Full-screen camera page route
        ├── dashboard/
        │   └── page.tsx                 # Extended: day dots + streak
        └── settings/
            └── page.tsx                 # Extended: goal stepper section
```

### Pattern 1: Camera Capture State Machine
**What:** The BeReal dual-camera flow is a multi-step state machine: idle -> rear-capture -> selfie-countdown -> selfie-capture -> preview -> submitting -> done.
**When to use:** Whenever the camera UI is active.
**Example:**
```typescript
// Source: [ASSUMED based on getUserMedia API patterns]
type CameraPhase =
  | 'rear-capture'      // Showing rear camera, waiting for shutter tap
  | 'selfie-countdown'  // 3-2-1 countdown, front camera active
  | 'selfie-capture'    // Auto-capturing selfie
  | 'preview'           // Showing composite, Retake/Submit buttons
  | 'submitting'        // Upload in progress
  | 'done'              // Success, redirect back

interface CameraState {
  phase: CameraPhase
  rearPhoto: Blob | null
  selfiePhoto: Blob | null
  compositeBlob: Blob | null
  countdown: number // 3, 2, 1
  error: string | null
}
```

### Pattern 2: getUserMedia with Camera Switching
**What:** Open rear camera, capture frame to canvas, stop tracks, open front camera, auto-capture after countdown.
**When to use:** During the check-in flow.
**Example:**
```typescript
// Source: [CITED: developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia]
// Step 1: Open rear camera
const rearStream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
})
videoRef.current.srcObject = rearStream

// Step 2: Capture rear frame to canvas
const canvas = document.createElement('canvas')
canvas.width = videoRef.current.videoWidth
canvas.height = videoRef.current.videoHeight
const ctx = canvas.getContext('2d')!
ctx.drawImage(videoRef.current, 0, 0)
const rearBlob = await new Promise<Blob>((resolve) =>
  canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9)
)

// Step 3: Stop rear tracks, open front camera
rearStream.getTracks().forEach(track => track.stop())
const frontStream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
})
```

### Pattern 3: Canvas Composite for BeReal Layout
**What:** Draw rear photo full-size, then overlay selfie as small rounded thumbnail in top-left corner.
**When to use:** After both photos are captured, before compression and upload.
**Example:**
```typescript
// Source: [CITED: developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Using_images]
async function createComposite(rearBlob: Blob, selfieBlob: Blob): Promise<Blob> {
  const rearImg = await createImageBitmap(rearBlob)
  const selfieImg = await createImageBitmap(selfieBlob)

  const canvas = document.createElement('canvas')
  canvas.width = rearImg.width
  canvas.height = rearImg.height
  const ctx = canvas.getContext('2d')!

  // Draw rear photo full-size
  ctx.drawImage(rearImg, 0, 0)

  // Draw selfie in top-left with rounded corners (clip path)
  const selfieSize = Math.round(canvas.width * 0.25) // 25% of width
  const margin = 16
  const radius = 12

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(margin, margin, selfieSize, selfieSize, radius)
  ctx.clip()
  ctx.drawImage(selfieImg, margin, margin, selfieSize, selfieSize)
  ctx.restore()

  // Add border around selfie
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(margin, margin, selfieSize, selfieSize, radius)
  ctx.stroke()

  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.92)
  )
}
```

### Pattern 4: Server Action with File Upload (via Supabase Storage)
**What:** Upload compressed photo to Supabase Storage from the browser client, then call a Server Action to record the check-in in the database with the photo URL.
**When to use:** On Submit button tap in the preview screen.
**Example:**
```typescript
// Source: [CITED: supabase.com/docs/reference/javascript/storage-from-upload]
// Client-side: upload photo, then call server action
import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'

async function uploadAndSubmit(compositeBlob: Blob) {
  // Compress
  const file = new File([compositeBlob], 'check-in.jpg', { type: 'image/jpeg' })
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  })

  // Upload to Supabase Storage
  const supabase = createClient()
  const fileName = `${Date.now()}-${crypto.randomUUID()}.jpg`
  const { data, error } = await supabase.storage
    .from('check-in-photos')
    .upload(fileName, compressed, {
      cacheControl: '31536000', // 1 year (immutable photos)
      contentType: 'image/jpeg',
      upsert: false,
    })
  if (error) throw error

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('check-in-photos')
    .getPublicUrl(data.path)

  // Call server action to record in DB
  await submitCheckInAction(urlData.publicUrl)
}
```

### Pattern 5: Week Boundary Computation
**What:** Utility functions to compute Monday-Sunday week boundaries for progress and streak tracking.
**When to use:** In Server Components and Server Actions for querying check-ins.
**Example:**
```typescript
// Source: [CITED: developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getDay]
/**
 * Get Monday 00:00:00 of the week containing `date`.
 * Week is Monday-Sunday per D-13.
 */
export function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun, 1=Mon, ...
  const diff = (day === 0 ? -6 : 1) - day // If Sunday, go back 6 days
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get Sunday 23:59:59.999 of the week containing `date`.
 */
export function getSunday(date: Date): Date {
  const monday = getMonday(date)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return sunday
}

/**
 * Generate a stable week key like "2026-W16" for grouping.
 */
export function getWeekKey(date: Date): string {
  const monday = getMonday(date)
  const year = monday.getFullYear()
  const jan1 = new Date(year, 0, 1)
  const days = Math.floor((monday.getTime() - jan1.getTime()) / 86400000)
  const weekNum = Math.ceil((days + jan1.getDay() + 1) / 7)
  return `${year}-W${String(weekNum).padStart(2, '0')}`
}
```

### Anti-Patterns to Avoid
- **Client-side streak computation:** Streaks must be computed server-side to prevent manipulation. Never trust the client to report streak counts.
- **Storing composite in state as base64:** Base64 strings are ~33% larger than binary. Always use Blob/File objects and `URL.createObjectURL()` for preview display.
- **Using `facingMode: { exact: 'environment' }` constraint:** The `exact` keyword causes `OverconstrainedError` on desktop and devices without labeled cameras. Use `facingMode: 'environment'` as a preference, not an exact constraint.
- **Querying all check-ins for streak computation:** Always filter by user and use date ranges. Use SQL date truncation to count distinct days efficiently.
- **Uploading uncompressed photos:** Mobile camera photos can be 5-10MB. Always compress to under 500KB before upload to stay within Supabase free tier (1GB storage).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image compression | Manual canvas quality iteration | `browser-image-compression` | Handles OffscreenCanvas, web workers, iterative quality reduction, and EXIF preservation. Canvas.toBlob quality parameter alone can't target a specific file size. |
| File upload to cloud storage | Custom API route with multipart parsing | Supabase Storage client `upload()` | Handles CDN, access control, and serves files with proper headers. Building your own file storage is unnecessary. |
| Week number calculation | Custom ISO week algorithm | Simple Monday-offset math | ISO 8601 week numbers have edge cases at year boundaries. For this app, only the Monday date matters for grouping, not the ISO week number. |
| Camera permission handling | Custom permission check flow | Browser's built-in `getUserMedia` permission prompt | The browser handles permission dialogs, remembering choices, and showing the camera icon in the address bar. |

**Key insight:** The camera capture flow is the most complex part of this phase -- but the complexity is in the state machine (rear -> countdown -> selfie -> preview -> submit), not in the individual APIs. Each API call is simple; orchestrating them correctly is the challenge.

## Common Pitfalls

### Pitfall 1: Camera Stream Not Released
**What goes wrong:** Camera indicator stays on after leaving the check-in page, or subsequent `getUserMedia` calls fail because the previous stream is still active.
**Why it happens:** Navigating away from the camera page without stopping tracks, or opening the front camera before stopping the rear camera stream.
**How to avoid:** Always call `stream.getTracks().forEach(track => track.stop())` in a cleanup function. Use a `useEffect` return function or `beforeunload` event to ensure cleanup on navigation.
**Warning signs:** Camera light stays on after closing the camera view, or a "Could not start video source" error appears.

### Pitfall 2: getUserMedia Fails Silently on HTTP
**What goes wrong:** `navigator.mediaDevices` is `undefined` and the app shows no useful error.
**Why it happens:** `getUserMedia` requires a secure context (HTTPS or localhost). Development on `http://` will fail.
**How to avoid:** Next.js dev server runs on `http://localhost:3000` which is considered a secure context. For testing on mobile devices over the network, use `ngrok` or similar HTTPS tunnel. Display a clear error message when `navigator.mediaDevices` is unavailable.
**Warning signs:** `navigator.mediaDevices` is `undefined` in the browser console.

### Pitfall 3: Mobile Camera Orientation / Mirror Issues
**What goes wrong:** Front camera selfie appears mirrored, or photo dimensions are swapped on some mobile devices.
**Why it happens:** Front cameras traditionally mirror the video preview (like a mirror), but captured photos should not be mirrored. Canvas captures what the video element shows, which may be CSS-mirrored.
**How to avoid:** Apply CSS `transform: scaleX(-1)` to the `<video>` element for front camera preview (so user sees a mirror), but do NOT apply this transform to the canvas when capturing. The canvas reads the raw video frame, not the CSS-transformed version.
**Warning signs:** Selfie in the composite looks flipped compared to the preview.

### Pitfall 4: Supabase Storage RLS Blocks Upload
**What goes wrong:** Upload returns a 403 error or "new row violates row-level security policy" error.
**Why it happens:** Supabase Storage enforces RLS by default. Without explicit INSERT policies on `storage.objects`, authenticated users cannot upload.
**How to avoid:** Create an RLS policy that allows authenticated users to upload to the `check-in-photos` bucket. The policy should restrict uploads to the correct bucket and optionally to user-specific folders.
**Warning signs:** Upload works in Supabase Dashboard but fails from the browser client.

### Pitfall 5: Streak Computation Off-by-One at Week Boundaries
**What goes wrong:** Streak shows 0 on Monday morning even though the user met their goal last week, or streak increments prematurely.
**Why it happens:** Timezone confusion between server time and user's local time, or treating the current (incomplete) week as part of the streak calculation.
**How to avoid:** Always compute streaks using completed weeks only (never the current week). The current week contributes to progress display but not streak count. Use the user's timezone for day boundary calculations, or simplify by using UTC and documenting the behavior.
**Warning signs:** Streak changes unexpectedly around midnight or on Monday mornings.

### Pitfall 6: Multiple Check-ins on Same Day Counting Multiple Times
**What goes wrong:** User checks in 3 times on Wednesday, and progress shows 3/4 instead of 1/4.
**Why it happens:** Counting rows instead of counting distinct dates.
**How to avoid:** Use `COUNT(DISTINCT DATE(created_at))` or equivalent in queries. The schema should store each check-in as a row (for the feed), but progress queries must deduplicate by calendar day per D-17.
**Warning signs:** Progress exceeds 7/7 days in a week, or jumps when multiple check-ins happen on the same day.

## Code Examples

### Drizzle Schema: Check-ins Table
```typescript
// Source: [CITED: orm.drizzle.team/docs/column-types/pg] + [CITED: orm.drizzle.team/docs/indexes-constraints]
import { pgTable, uuid, text, timestamp, smallint, date, index } from 'drizzle-orm/pg-core'

export const checkIns = pgTable('check_ins', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  photoUrl: text('photo_url').notNull(),
  checkedInDate: date('checked_in_date', { mode: 'string' }).notNull(), // Calendar date (YYYY-MM-DD)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('check_ins_user_date_idx').on(t.userId, t.checkedInDate),
  index('check_ins_challenge_idx').on(t.challengeId, t.createdAt),
])
```

### Drizzle Schema: Weekly Goals (extend challengeMembers or separate table)
```typescript
// Option A: Add weeklyGoal column to challengeMembers (simpler, recommended)
// In the existing challengeMembers table, add:
//   weeklyGoal: smallint('weekly_goal').notNull().default(3),

// Option B: Separate table (if goal history tracking needed later)
export const weeklyGoals = pgTable('weekly_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  goal: smallint('goal').notNull().default(3),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
```

### Server Action: Submit Check-in
```typescript
// Source: Pattern from src/lib/actions/connections.ts [VERIFIED: codebase]
'use server'

import { db } from '@/db'
import { checkIns } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'

export async function submitCheckInAction(photoUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get user's challenge membership
  const membership = await db
    .select({ challengeId: challengeMembers.challengeId })
    .from(challengeMembers)
    .where(eq(challengeMembers.userId, user.id))
    .limit(1)

  if (membership.length === 0) return { error: 'Not in a challenge' }

  // Use local date (could also accept from client with validation)
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  await db.insert(checkIns).values({
    userId: user.id,
    challengeId: membership[0].challengeId,
    photoUrl,
    checkedInDate: today,
  })

  return { success: true }
}
```

### browser-image-compression Usage
```typescript
// Source: [CITED: npmjs.com/package/browser-image-compression]
import imageCompression from 'browser-image-compression'

const options = {
  maxSizeMB: 0.5,           // Target max 500KB
  maxWidthOrHeight: 1920,    // Scale down if larger
  useWebWorker: true,        // Non-blocking compression
  fileType: 'image/jpeg',    // Output format
}

const compressedFile = await imageCompression(originalFile, options)
// compressedFile is a File object ready for upload
```

### Supabase Storage RLS Policy (SQL to run in Supabase Dashboard)
```sql
-- Source: [CITED: supabase.com/docs/guides/storage/security/access-control]
-- Create the bucket (run once in Supabase Dashboard or via SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('check-in-photos', 'check-in-photos', true);
-- Public bucket: anyone can READ (view photos in feed)
-- But uploads/deletes still require auth via RLS

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload check-in photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'check-in-photos');

-- Allow anyone to view (public bucket handles this, but explicit policy for clarity)
CREATE POLICY "Anyone can view check-in photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'check-in-photos');

-- Prevent deletion (D-18: no deleting check-ins)
-- Simply don't create a DELETE policy
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `navigator.getUserMedia()` (deprecated) | `navigator.mediaDevices.getUserMedia()` | 2017+ | Must use the Promise-based API via `mediaDevices` |
| Canvas `toDataURL()` for image capture | Canvas `toBlob()` + `createImageBitmap()` | 2020+ | `toBlob()` is async and more memory-efficient; `createImageBitmap()` avoids loading `<img>` elements |
| Supabase `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | Already using the correct package in this project |
| Tailwind v3 `tailwind.config.js` | Tailwind v4 CSS `@theme` directives | Jan 2025 | Project already uses v4; new design tokens go in `globals.css` |

**Deprecated/outdated:**
- `navigator.getUserMedia()`: Replaced by `navigator.mediaDevices.getUserMedia()`. The old API is removed from modern browsers.
- `ImageCapture.takePhoto()`: Available in Chrome but not in Safari/Firefox as of 2025. Do not rely on it; use canvas-based capture for cross-browser compatibility. [ASSUMED]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `ImageCapture.takePhoto()` is not reliable cross-browser (Safari/Firefox) | State of the Art | If it works everywhere, could simplify capture code; but canvas approach works universally so risk is low |
| A2 | Supabase free tier handles the upload volume for a friend-group app | Architecture Patterns | If uploads are throttled or storage fills up, need to increase compression or upgrade plan |
| A3 | `canvas.roundRect()` is supported in all target mobile browsers | Code Examples (composite) | If not supported, fall back to manual arc-based rounded clipping path |
| A4 | Front camera video is NOT mirrored in canvas drawImage (CSS mirror is separate) | Pitfall 3 | If canvas captures the CSS-mirrored version, selfie will appear flipped in composite |

## Open Questions

1. **Timezone handling for day boundaries**
   - What we know: D-13 specifies Monday-Sunday weeks. Check-ins need a calendar date.
   - What's unclear: Should the "day" be based on UTC, the server's timezone, or the user's local timezone? A user checking in at 11:30 PM local time should see it count for that day, not the next day.
   - Recommendation: Use the client's local date (computed in the browser via `new Date().toISOString().split('T')[0]` adjusted for local timezone) and pass it to the server action. Validate server-side that it's within a reasonable range (not in the future, not more than 1 day in the past).

2. **Photo storage path structure**
   - What we know: Photos go to `check-in-photos` bucket in Supabase Storage.
   - What's unclear: Should photos be organized in folders (e.g., `{userId}/{date}/{filename}`) or flat with UUID filenames?
   - Recommendation: Use flat structure with `{timestamp}-{uuid}.jpg` naming. Simpler, no need for folder-based RLS policies. The check-in database row links to the URL.

3. **Streak initialization for existing users**
   - What we know: Streak counts consecutive weeks of meeting goals.
   - What's unclear: When a user first joins, do they start at streak 0? What happens the first week?
   - Recommendation: Streak starts at 0. First complete week where goal is met increments to 1. Current (incomplete) week never counts toward streak.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase Storage | Photo uploads (CHKN-01, CHKN-02) | Requires Supabase project setup | Managed service | -- |
| HTTPS / localhost | getUserMedia API (CHKN-01) | localhost in dev | -- | ngrok for mobile testing |
| browser-image-compression | Photo compression (CHKN-01) | Not yet installed | 2.0.2 | Manual canvas.toBlob() with quality param |

**Missing dependencies with no fallback:**
- Supabase Storage bucket must be created and RLS policies configured before photo uploads work. This is a one-time setup step.

**Missing dependencies with fallback:**
- `browser-image-compression` needs to be installed via `npm install browser-image-compression`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | `vitest.config.mts` |
| Quick run command | `npx vitest run tests/check-ins.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHKN-01 | Schema has checkIns table with required columns | unit (file content) | `npx vitest run tests/check-ins.test.ts -t "schema"` | Wave 0 |
| CHKN-01 | Server Action submitCheckInAction exists with auth gate | unit (file content) | `npx vitest run tests/check-ins.test.ts -t "submitCheckIn"` | Wave 0 |
| CHKN-01 | Camera view component exists as client component | unit (file content) | `npx vitest run tests/check-ins.test.ts -t "camera"` | Wave 0 |
| CHKN-02 | checkIns table has photoUrl column | unit (file content) | `npx vitest run tests/check-ins.test.ts -t "photoUrl"` | Wave 0 |
| CHKN-02 | Check-in has challengeId FK for feed association | unit (file content) | `npx vitest run tests/check-ins.test.ts -t "challengeId"` | Wave 0 |
| CHKN-03 | Goal stepper component exists on Settings page | unit (file content) | `npx vitest run tests/check-ins.test.ts -t "goal stepper"` | Wave 0 |
| CHKN-03 | updateWeeklyGoal Server Action exists with validation | unit (file content) | `npx vitest run tests/check-ins.test.ts -t "updateWeeklyGoal"` | Wave 0 |
| CHKN-04 | Day dots component renders 7 dots for M-S | unit (file content) | `npx vitest run tests/check-ins.test.ts -t "day dots"` | Wave 0 |
| CHKN-04 | Dashboard page imports day dots component | unit (file content) | `npx vitest run tests/check-ins.test.ts -t "dashboard"` | Wave 0 |
| CHKN-05 | Streak counter component exists | unit (file content) | `npx vitest run tests/check-ins.test.ts -t "streak"` | Wave 0 |
| CHKN-05 | Week utility functions exist (getMonday, getSunday) | unit (logic) | `npx vitest run tests/check-ins.test.ts -t "week utils"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/check-ins.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/check-ins.test.ts` -- covers CHKN-01 through CHKN-05 (schema, actions, components, week utils)
- [ ] Framework install: `npm install browser-image-compression` -- new dependency

*(Existing test infrastructure from Phase 2 covers framework setup, vitest config, and setup file.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | All Server Actions use `createClient()` + `getUser()` auth gate (established pattern) |
| V3 Session Management | Yes | Cookie-based sessions via `@supabase/ssr` (already implemented) |
| V4 Access Control | Yes | Supabase Storage RLS policies restrict uploads to authenticated users; Server Actions verify challenge membership before recording check-ins |
| V5 Input Validation | Yes | Zod validation for goal values (1-7 range), photo URL format, and date strings |
| V6 Cryptography | No | No custom crypto needed; Supabase handles token signing |

### Known Threat Patterns for Camera + Storage

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Uploading non-image files disguised as photos | Tampering | Validate `contentType: 'image/jpeg'` on upload; server action validates URL points to expected bucket |
| Uploading excessively large files to exhaust storage | Denial of Service | Client-side compression to 500KB max; Supabase Storage has per-file size limits |
| Forging check-in photo URLs from external sources | Spoofing | Server Action validates that `photoUrl` starts with the expected Supabase Storage base URL |
| Submitting check-ins for other users | Elevation of Privilege | Server Action always uses `getUser()` to determine the acting user; userId comes from auth, never from client input |
| Manipulating goal value to invalid range | Tampering | Zod schema validates goal is integer between 1-7 inclusive |
| Submitting check-ins with future dates | Tampering | Server-side date validation: reject dates in the future or more than 1 day in the past |

## Project Constraints (from CLAUDE.md)

These directives from CLAUDE.md constrain implementation choices:

1. **Server Actions for mutations** -- all write operations (submitCheckIn, updateWeeklyGoal) must use Server Actions, not API routes
2. **Drizzle ORM for database access** -- not Supabase JS client for data tables
3. **Supabase Auth via `createClient()` + `getUser()`** -- every Server Action must auth-gate
4. **Protected routes under `src/app/(protected)/`** -- camera route must be under this layout
5. **Client components use `'use client'` directive** -- camera view, goal stepper, day dots (if interactive)
6. **`browser-image-compression`** -- specified in CLAUDE.md tech stack for client-side compression
7. **`getUserMedia` with `facingMode: 'environment'`** -- specified in CLAUDE.md for rear camera default
8. **Supabase Storage** -- specified for photo storage; upload compressed blobs from browser client
9. **Zustand** -- for cross-component state like camera capture state
10. **Royale design tokens** -- all new UI must use tokens from `globals.css` (dark navy + emerald green)
11. **`next/font` for Plus Jakarta Sans** -- typography requirement
12. **Material Symbols for nav icons, Lucide for incidental icons** -- icon library split

## Sources

### Primary (HIGH confidence)
- [MDN: MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) -- Camera API, facingMode constraint
- [MDN: MediaTrackConstraints.facingMode](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/facingMode) -- Front/rear camera switching
- [MDN: Canvas API - Using images](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Using_images) -- drawImage, compositing
- [MDN: Taking still photos](https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Taking_still_photos) -- Canvas frame capture from video
- [Supabase Storage: Upload](https://supabase.com/docs/reference/javascript/storage-from-upload) -- upload() method signature
- [Supabase Storage: Access Control](https://supabase.com/docs/guides/storage/security/access-control) -- RLS policies for storage
- [Supabase Storage: Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals) -- Public vs private buckets
- [Drizzle ORM: PostgreSQL column types](https://orm.drizzle.team/docs/column-types/pg) -- smallint, date, text, uuid types
- [Drizzle ORM: Indexes & Constraints](https://orm.drizzle.team/docs/indexes-constraints) -- Composite index syntax
- [browser-image-compression npm](https://www.npmjs.com/package/browser-image-compression) -- API, options, version 2.0.2

### Secondary (MEDIUM confidence)
- [DigitalOcean: Front and Rear Camera Access](https://www.digitalocean.com/community/tutorials/front-and-rear-camera-access-with-javascripts-getusermedia) -- Camera switching pattern
- [jsdev.space: Combine Two Images Using Canvas](https://jsdev.space/howto/javascript-canvas-image-merge/) -- Canvas compositing patterns
- [Twilio: Choosing cameras with mediaDevices API](https://www.twilio.com/en-us/blog/choosing-cameras-javascript-mediadevices-api-html) -- Track stopping before camera switch

### Tertiary (LOW confidence)
- None -- all claims verified with primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed except browser-image-compression (verified on npm registry)
- Architecture: HIGH -- follows established codebase patterns from Phase 2, well-documented browser APIs
- Camera capture: HIGH -- getUserMedia and Canvas APIs are stable and well-documented
- Streak computation: MEDIUM -- week boundary math is straightforward but timezone handling needs care
- Pitfalls: HIGH -- well-known issues with camera APIs and storage RLS

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (stable APIs, no fast-moving dependencies)
