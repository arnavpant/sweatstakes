import type { NextRequest } from 'next/server'
import { db } from '@/db'
import { challenges, challengeMembers, checkIns } from '@/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { sendPushToUsers } from '@/lib/push/send'

/**
 * Phase 5 SETT-02 — Hourly daily-reminder cron.
 *
 * For each challenge, finds members whose:
 *   - reminder_hour == current hour in the challenge's timezone
 *   - notifications_enabled == true
 *   - have NOT checked in today (in their challenge's local date)
 * and sends them a "Don't break the streak" push.
 *
 * Threat mitigation T-05-02-01: CRON_SECRET Bearer-token gate matches /api/cron/settle.
 * Refuses to run when CRON_SECRET is unset (returns 500 rather than running with weak auth).
 *
 * Schedule: hourly (0 * * * *) — matches existing settlement cron, which already
 * requires Vercel Pro (Hobby plan caps at 2 cron/day).
 */

/** Current hour (0-23) in the given IANA timezone. */
function getHourInTimezone(date: Date, timezone: string): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).format(date),
    10
  )
}

/** Local date YYYY-MM-DD in the given IANA timezone. */
function getLocalDateInTz(date: Date, timezone: string): string {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = fmt.formatToParts(date)
  const y = parts.find(p => p.type === 'year')!.value
  const m = parts.find(p => p.type === 'month')!.value
  const d = parts.find(p => p.type === 'day')!.value
  return `${y}-${m}-${d}`
}

export async function GET(request: NextRequest) {
  // T-05-02-01: Verify CRON_SECRET (mirrors /api/cron/settle pattern)
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
  let reminded = 0

  for (const challenge of allChallenges) {
    const localHour = getHourInTimezone(now, challenge.timezone)
    const localDate = getLocalDateInTz(now, challenge.timezone)

    const dueMembers = await db
      .select({ userId: challengeMembers.userId })
      .from(challengeMembers)
      .leftJoin(
        checkIns,
        and(
          eq(checkIns.userId, challengeMembers.userId),
          eq(checkIns.challengeId, challenge.id),
          eq(checkIns.checkedInDate, localDate),
        )
      )
      .where(
        and(
          eq(challengeMembers.challengeId, challenge.id),
          eq(challengeMembers.reminderHour, localHour),
          eq(challengeMembers.notificationsEnabled, true),
          isNull(checkIns.id),
        )
      )

    if (dueMembers.length > 0) {
      await sendPushToUsers(
        dueMembers.map((m) => m.userId),
        {
          title: "Don't break the streak",
          body: "You haven't logged today yet — tap to check in.",
          url: '/check-in',
        }
      )
      reminded += dueMembers.length
    }
  }

  return Response.json({ reminded, timestamp: now.toISOString() })
}
