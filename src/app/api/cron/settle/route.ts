import type { NextRequest } from 'next/server'
import { db } from '@/db'
import { challenges, challengeMembers, pointTransactions } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { settleWeekForChallenge } from '@/lib/actions/settlement'
import { sendPushToUsers } from '@/lib/push/send'

/**
 * Timezone-aware weekday check using Intl API.
 * Returns the full weekday name (e.g., 'Monday') for the given date in the specified timezone.
 */
function getWeekdayInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'long' }).format(date)
}

/**
 * Get the current hour (0-23) in the specified timezone.
 */
function getHourInTimezone(date: Date, timezone: string): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).format(date),
    10
  )
}

/**
 * Determine if a challenge should be settled right now.
 * Settlement happens on Monday at or after the configured settlement hour in the challenge's timezone.
 */
function shouldSettle(now: Date, timezone: string, settlementHour: number): boolean {
  return getWeekdayInTimezone(now, timezone) === 'Monday'
    && getHourInTimezone(now, timezone) >= settlementHour
}

/**
 * Get the Monday of the PREVIOUS week (the week that just ended).
 * This is the week we want to settle, since settlement runs on the following Monday.
 */
function getPreviousMonday(now: Date, timezone: string): string {
  // Get "today" in the challenge's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(now)
  const year = parts.find(p => p.type === 'year')!.value
  const month = parts.find(p => p.type === 'month')!.value
  const day = parts.find(p => p.type === 'day')!.value
  const localDate = new Date(`${year}-${month}-${day}T00:00:00`)

  // Go back 7 days to get to the previous week's Monday
  const dayOfWeek = localDate.getDay() // 0=Sun, 1=Mon
  const daysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // days since Monday
  localDate.setDate(localDate.getDate() - daysBack - 7) // previous Monday

  return localDate.toISOString().split('T')[0] // YYYY-MM-DD
}

/**
 * Vercel Cron handler for weekly settlement.
 * Scheduled: hourly (0 * * * *) via vercel.json so every timezone's
 * Monday settlementHour can be matched exactly once per week.
 * NOTE: hourly cron requires Vercel Pro — Hobby allows only 2 cron/day.
 * Protected by CRON_SECRET Bearer token.
 *
 * For each challenge, checks if it's Monday in the challenge's timezone
 * and if the settlement hour has passed. If so, settles the previous week.
 * The settled_weeks unique constraint prevents double-settlement during the
 * remaining hours of the same Monday.
 */
export async function GET(request: NextRequest) {
  // T-04-01: Verify CRON_SECRET
  // Guard against misconfiguration: if CRON_SECRET is missing/empty, refuse to run.
  // Otherwise the expected header becomes a guessable literal like "Bearer undefined".
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('CRON_SECRET is not configured')
    return new Response('Server misconfigured', { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const now = new Date()
  const allChallenges = await db.select().from(challenges)

  let settled = 0
  let skipped = 0
  let washed = 0

  for (const challenge of allChallenges) {
    if (!shouldSettle(now, challenge.timezone, challenge.settlementHour)) {
      skipped++
      continue
    }

    const weekStart = getPreviousMonday(now, challenge.timezone)
    const result = await settleWeekForChallenge(challenge.id, weekStart)

    if (result === 'settled') {
      settled++

      // Phase 5 SETT-02 — Personalized settlement push per member with their own delta.
      // Gated by notifications_enabled; fire-and-forget, swallows its own failures.
      try {
        const weekTx = await db
          .select({ userId: pointTransactions.userId, delta: pointTransactions.delta })
          .from(pointTransactions)
          .where(
            and(
              eq(pointTransactions.challengeId, challenge.id),
              eq(pointTransactions.weekStart, weekStart),
            )
          )
        const members = await db
          .select({ userId: challengeMembers.userId, enabled: challengeMembers.notificationsEnabled })
          .from(challengeMembers)
          .where(eq(challengeMembers.challengeId, challenge.id))
        const enabledSet = new Set(members.filter((m) => m.enabled).map((m) => m.userId))

        // Sum per user (one settlement may produce earned + redemption rows for the same user).
        const deltaByUser = new Map<string, number>()
        for (const tx of weekTx) {
          deltaByUser.set(tx.userId, (deltaByUser.get(tx.userId) ?? 0) + tx.delta)
        }

        for (const [userId, delta] of deltaByUser) {
          if (!enabledSet.has(userId)) continue
          const sign = delta >= 0 ? '+' : ''
          void sendPushToUsers([userId], {
            title: 'Weekly stakes settled',
            body: `You ${delta >= 0 ? 'earned' : 'owe'} ${sign}${delta} pts this week.`,
            url: '/stakes',
          })
        }
      } catch (err) {
        console.error('[push] settlement trigger failed', err)
      }
    } else if (result === 'already_settled') {
      skipped++
    } else {
      washed++
    }
  }

  return Response.json({ settled, skipped, washed, timestamp: now.toISOString() })
}
