'use server'

import { db } from '@/db'
import { checkIns, challengeMembers } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'
import { eq, and, gte, lte } from 'drizzle-orm'
import { z } from 'zod'
import { sendPushToUsers } from '@/lib/push/send'

/**
 * Submit a workout check-in with a photo.
 * Auth gate: requires authenticated user with active challenge membership.
 * Validates photoUrl and checkedInDate before inserting.
 * Per D-17: No deduplication on insert -- unlimited check-ins per day.
 * Per D-18: No delete action -- once submitted, permanent.
 */
export async function submitCheckInAction(
  photoUrl: string,
  checkedInDate: string,
  selfieUrl: string | null = null,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // T-03-02: Validate photoUrl is a valid URL
  const urlResult = z.string().url().safeParse(photoUrl)
  if (!urlResult.success) return { error: 'Invalid photo URL' }

  // Optionally verify it starts with the Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl && !photoUrl.startsWith(supabaseUrl)) {
    return { error: 'Invalid photo URL' }
  }

  // Validate selfieUrl the same way when present.
  if (selfieUrl !== null) {
    const selfieResult = z.string().url().safeParse(selfieUrl)
    if (!selfieResult.success) return { error: 'Invalid selfie URL' }
    if (supabaseUrl && !selfieUrl.startsWith(supabaseUrl)) {
      return { error: 'Invalid selfie URL' }
    }
  }

  // T-03-03: Validate checkedInDate format YYYY-MM-DD
  const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateFormatRegex.test(checkedInDate)) {
    return { error: 'Invalid date' }
  }

  // Validate date is not in the future and not more than 1 day in the past
  const parsedDate = new Date(checkedInDate + 'T00:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (parsedDate > today) return { error: 'Invalid date' }
  if (parsedDate < yesterday) return { error: 'Invalid date' }

  // T-03-05: Verify user has challenge membership before inserting
  const membership = await db
    .select({ challengeId: challengeMembers.challengeId })
    .from(challengeMembers)
    .where(eq(challengeMembers.userId, user.id))
    .limit(1)

  if (membership.length === 0) {
    return { error: 'Not in a challenge' }
  }

  // Insert check-in row (no deduplication per D-17)
  await db.insert(checkIns).values({
    userId: user.id,
    challengeId: membership[0].challengeId,
    photoUrl,
    selfieUrl,
    checkedInDate,
  })

  // Phase 5 SETT-02 — Fire push to other challenge members (fire-and-forget,
  // never block the response; sendPushToUsers self-handles errors + dead subs).
  try {
    const members = await db
      .select({
        userId: challengeMembers.userId,
        enabled: challengeMembers.notificationsEnabled,
        displayName: challengeMembers.displayName,
      })
      .from(challengeMembers)
      .where(eq(challengeMembers.challengeId, membership[0].challengeId))

    const recipients = members
      .filter((m) => m.userId !== user.id && m.enabled)
      .map((m) => m.userId)
    const senderName = members.find((m) => m.userId === user.id)?.displayName ?? 'A friend'

    void sendPushToUsers(recipients, {
      title: `${senderName} just checked in`,
      body: 'Tap to see their workout photo.',
      url: '/feed',
    })
  } catch (err) {
    console.error('[push] check-in trigger failed', err)
  }

  return { success: true }
}

/**
 * Update the user's weekly workout goal.
 * Auth gate: requires authenticated user.
 * Validates goal is 1-7 via Zod.
 * Per D-09: immediate effect, no restrictions on when you can change.
 */
export async function updateWeeklyGoalAction(goal: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // T-03-04: Validate goal range
  const goalResult = z.number().int().min(1).max(7).safeParse(goal)
  if (!goalResult.success) {
    return { error: 'Goal must be between 1 and 7' }
  }

  // Update the member's weekly goal
  await db
    .update(challengeMembers)
    .set({ weeklyGoal: goal })
    .where(eq(challengeMembers.userId, user.id))

  return { success: true }
}
