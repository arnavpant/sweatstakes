import 'server-only'
import { db } from '@/db'
import { challengeMembers, checkIns, pointTransactions } from '@/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'

/**
 * Phase 5 Plan 03 — Dashboard server query helpers.
 *
 * All helpers are challenge-scoped and must be called with a challengeId
 * derived from the authenticated user's membership (never from client input).
 */

/**
 * Aggregate per-user point balance across all settlements and redemptions
 * for a single challenge. Joins challenge_members so the display name is
 * available for the leader callout phrasing.
 */
export async function getBalancesForChallenge(challengeId: string) {
  return db
    .select({
      userId: pointTransactions.userId,
      displayName: challengeMembers.displayName,
      balance: sql<number>`COALESCE(SUM(${pointTransactions.delta}), 0)::int`,
    })
    .from(pointTransactions)
    .innerJoin(
      challengeMembers,
      and(
        eq(challengeMembers.userId, pointTransactions.userId),
        eq(challengeMembers.challengeId, pointTransactions.challengeId)
      )
    )
    .where(eq(pointTransactions.challengeId, challengeId))
    .groupBy(pointTransactions.userId, challengeMembers.displayName)
}

/**
 * Most recent check-in photos for the 2×3/3×2 Dashboard gallery.
 * Default limit = 6 per DASH-03.
 */
export async function getRecentCheckInPhotos(challengeId: string, limit = 6) {
  return db
    .select({
      id: checkIns.id,
      photoUrl: checkIns.photoUrl,
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
