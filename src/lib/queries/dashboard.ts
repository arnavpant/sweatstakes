import 'server-only'
import { db } from '@/db'
import { challengeMembers, checkIns } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

/**
 * Phase 5 Plan 03 — Dashboard server query helpers.
 *
 * All helpers are challenge-scoped and must be called with a challengeId
 * derived from the authenticated user's membership (never from client input).
 */

/**
 * Most recent check-in photos for the 2×3/3×2 Dashboard gallery.
 * Default limit = 6 per DASH-03.
 */
export async function getRecentCheckInPhotos(challengeId: string, limit = 6) {
  return db
    .select({
      id: checkIns.id,
      photoUrl: checkIns.photoUrl,
      selfieUrl: checkIns.selfieUrl,
      createdAt: checkIns.createdAt,
    })
    .from(checkIns)
    .where(eq(checkIns.challengeId, challengeId))
    .orderBy(desc(checkIns.createdAt))
    .limit(limit)
}

/**
 * One row per challenge member: userId, displayName, avatarUrl, weeklyGoal.
 * Used by the DASH-02 horizontal member card row; the caller joins
 * each row's weekly progress via getWeeklyProgress.
 */
export async function getMemberProgressRows(challengeId: string) {
  return db
    .select({
      userId: challengeMembers.userId,
      displayName: challengeMembers.displayName,
      avatarUrl: challengeMembers.avatarUrl,
      weeklyGoal: challengeMembers.weeklyGoal,
    })
    .from(challengeMembers)
    .where(eq(challengeMembers.challengeId, challengeId))
}
