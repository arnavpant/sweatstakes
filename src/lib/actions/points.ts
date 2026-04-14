'use server'

import { z } from 'zod'
import { db } from '@/db'
import { rewards, redemptions, pointTransactions, challengeMembers, challenges } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'
import { eq, and, sql } from 'drizzle-orm'

// --- Schemas ---

const addRewardSchema = z.object({
  name: z.string().min(1, 'Reward name is required.').max(60, 'Name must be 60 characters or less.'),
  pointCost: z.number({ error: 'Enter a whole number.' })
    .int('Enter a whole number.')
    .min(1, 'Cost must be at least 1 point.'),
})

const settlementSettingsSchema = z.object({
  timezone: z.string().min(1),
  settlementHour: z.number().int().min(0).max(23),
})

// --- Helper: get authenticated user + challenge membership ---

async function getAuthAndMembership() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }

  const membership = await db
    .select({ challengeId: challengeMembers.challengeId })
    .from(challengeMembers)
    .where(eq(challengeMembers.userId, user.id))
    .limit(1)

  if (membership.length === 0) return { error: 'Not in a challenge' as const }

  return { user, challengeId: membership[0].challengeId }
}

// --- Actions ---

/**
 * Add a reward to the challenge's rewards menu.
 * Per D-14: name + pointCost only. Per D-15: any member can add. Per D-17: min cost 1.
 */
export async function addRewardAction(input: { name: string; pointCost: number }) {
  const auth = await getAuthAndMembership()
  if ('error' in auth) return { error: auth.error }

  const parsed = addRewardSchema.safeParse(input)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Invalid input'
    return { error: firstError }
  }

  await db.insert(rewards).values({
    challengeId: auth.challengeId,
    name: parsed.data.name,
    pointCost: parsed.data.pointCost,
    createdBy: auth.user.id,
  })

  return { success: true }
}

/**
 * Delete a reward from the challenge's rewards menu.
 * Per D-15: any member can remove any reward. Trust-based.
 */
export async function deleteRewardAction(rewardId: string) {
  const auth = await getAuthAndMembership()
  if ('error' in auth) return { error: auth.error }

  // Validate rewardId is a UUID
  const uuidResult = z.string().uuid().safeParse(rewardId)
  if (!uuidResult.success) return { error: 'Invalid reward ID' }

  // Verify reward belongs to user's challenge
  const reward = await db
    .select({ id: rewards.id, challengeId: rewards.challengeId })
    .from(rewards)
    .where(and(eq(rewards.id, rewardId), eq(rewards.challengeId, auth.challengeId)))
    .limit(1)

  if (reward.length === 0) return { error: 'Reward not found' }

  await db.delete(rewards).where(eq(rewards.id, rewardId))

  return { success: true }
}

/**
 * Redeem a reward: deduct pointCost from user's balance.
 * Per D-19: confirmation happens in UI before calling this.
 * Per D-20: must have sufficient balance (balance >= cost).
 * Per D-21: silent — no notifications, no feed entry.
 */
export async function redeemRewardAction(rewardId: string) {
  const auth = await getAuthAndMembership()
  if ('error' in auth) return { error: auth.error }

  const uuidResult = z.string().uuid().safeParse(rewardId)
  if (!uuidResult.success) return { error: 'Invalid reward ID' }

  // Get reward details
  const reward = await db
    .select({ id: rewards.id, pointCost: rewards.pointCost, name: rewards.name, challengeId: rewards.challengeId })
    .from(rewards)
    .where(and(eq(rewards.id, rewardId), eq(rewards.challengeId, auth.challengeId)))
    .limit(1)

  if (reward.length === 0) return { error: 'Reward not found' }

  // WR-01: Read balance + write inside a single transaction guarded by an
  // advisory lock keyed on (challengeId, userId). Without the lock, two
  // concurrent redeem calls can both observe the same balance and both
  // succeed, overspending the user's points.
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(
        hashtext(${auth.challengeId}::text || ':' || ${auth.user.id}::text)
      )`)

      const balanceResult = await tx
        .select({ balance: sql<number>`COALESCE(SUM(${pointTransactions.delta}), 0)` })
        .from(pointTransactions)
        .where(and(
          eq(pointTransactions.challengeId, auth.challengeId),
          eq(pointTransactions.userId, auth.user.id)
        ))

      const currentBalance = Number(balanceResult[0]?.balance ?? 0)

      if (currentBalance < reward[0].pointCost) {
        throw new Error(`You need ${reward[0].pointCost - currentBalance} more points.`)
      }

      await tx.insert(pointTransactions).values({
        challengeId: auth.challengeId,
        userId: auth.user.id,
        weekStart: new Date().toISOString().split('T')[0], // current date as reference
        delta: -reward[0].pointCost,
        reason: 'redemption',
      })

      await tx.insert(redemptions).values({
        challengeId: auth.challengeId,
        userId: auth.user.id,
        rewardId: reward[0].id,
        pointCost: reward[0].pointCost,
      })
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Redemption failed' }
  }

  return { success: true }
}

/**
 * Update the challenge's settlement timezone and hour.
 * Per D-07: any member can change. Per D-06: IANA timezone + hour 0-23.
 */
export async function updateSettlementSettingsAction(input: { timezone: string; settlementHour: number }) {
  const auth = await getAuthAndMembership()
  if ('error' in auth) return { error: auth.error }

  const parsed = settlementSettingsSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid settings' }

  // Validate timezone is a real IANA timezone
  try {
    Intl.DateTimeFormat(undefined, { timeZone: parsed.data.timezone })
  } catch {
    return { error: 'Invalid timezone' }
  }

  await db
    .update(challenges)
    .set({
      timezone: parsed.data.timezone,
      settlementHour: parsed.data.settlementHour,
    })
    .where(eq(challenges.id, auth.challengeId))

  return { success: true }
}
