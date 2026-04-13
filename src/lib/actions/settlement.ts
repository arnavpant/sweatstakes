'use server'

import { db } from '@/db'
import { challenges, challengeMembers, checkIns, settledWeeks, pointTransactions } from '@/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { computeSettlement } from '@/lib/utils/settlement'

/**
 * Settle a specific week for a challenge. Idempotent via settledWeeks unique constraint.
 * Returns 'settled', 'already_settled', or 'wash_rule'.
 *
 * weekStart: YYYY-MM-DD string for the Monday of the week to settle.
 */
export async function settleWeekForChallenge(
  challengeId: string,
  weekStart: string
): Promise<'settled' | 'already_settled' | 'wash_rule'> {
  // Get all challenge members
  const members = await db
    .select({
      userId: challengeMembers.userId,
      weeklyGoal: challengeMembers.weeklyGoal,
      joinedAt: challengeMembers.joinedAt,
    })
    .from(challengeMembers)
    .where(eq(challengeMembers.challengeId, challengeId))

  // Compute week end (Sunday) as YYYY-MM-DD
  const weekStartDate = new Date(weekStart + 'T00:00:00Z')
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekEndDate.getDate() + 6)
  const weekEnd = weekEndDate.toISOString().split('T')[0]

  // Pitfall 7: Exclude mid-week joiners — if joinedAt is after weekStart Monday 00:00 UTC
  const weekStartTimestamp = new Date(weekStart + 'T00:00:00Z')
  const eligibleMembers = members.filter(m => m.joinedAt <= weekStartTimestamp)

  if (eligibleMembers.length === 0) return 'wash_rule'

  // Count check-in days per eligible member for this week
  const memberProgress = await Promise.all(
    eligibleMembers.map(async (member) => {
      const rows = await db
        .select({ checkedInDate: checkIns.checkedInDate })
        .from(checkIns)
        .where(
          and(
            eq(checkIns.userId, member.userId),
            eq(checkIns.challengeId, challengeId),
            gte(checkIns.checkedInDate, weekStart),
            lte(checkIns.checkedInDate, weekEnd)
          )
        )
      const uniqueDays = new Set(rows.map(r => r.checkedInDate))
      return {
        userId: member.userId,
        checkedInCount: uniqueDays.size,
        weeklyGoal: member.weeklyGoal,
      }
    })
  )

  // Run pure settlement math
  const result = computeSettlement(memberProgress)

  if (result.washRule) return 'wash_rule'

  // Filter out zero-delta transactions (hitters when no missers get delta=0)
  const nonZeroTransactions = result.transactions.filter(t => t.delta !== 0)

  if (nonZeroTransactions.length === 0) return 'wash_rule'

  // Idempotent insert: settledWeeks unique constraint prevents double-settlement
  return await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(settledWeeks)
      .values({ challengeId, weekStart })
      .onConflictDoNothing()
      .returning()

    if (inserted.length === 0) return 'already_settled' as const

    await tx.insert(pointTransactions).values(
      nonZeroTransactions.map(t => ({
        challengeId,
        userId: t.userId,
        weekStart,
        delta: t.delta,
        reason: t.reason,
      }))
    )

    return 'settled' as const
  })
}
