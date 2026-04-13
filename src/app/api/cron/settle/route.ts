import type { NextRequest } from 'next/server'
import { db } from '@/db'
import { challenges } from '@/db/schema'
import { settleWeekForChallenge } from '@/lib/actions/settlement'

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
 * Scheduled: Monday 10:00 AM UTC (via vercel.json).
 * Protected by CRON_SECRET Bearer token.
 *
 * For each challenge, checks if it's Monday in the challenge's timezone
 * and if the settlement hour has passed. If so, settles the previous week.
 */
export async function GET(request: NextRequest) {
  // T-04-01: Verify CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

    if (result === 'settled') settled++
    else if (result === 'already_settled') skipped++
    else washed++
  }

  return Response.json({ settled, skipped, washed, timestamp: now.toISOString() })
}
