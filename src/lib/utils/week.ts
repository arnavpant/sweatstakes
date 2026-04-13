/**
 * Week boundary utilities for Monday-Sunday fitness weeks (D-13).
 * Used by Server Components and Server Actions for progress/streak computation.
 */

import { db } from '@/db'
import { checkIns, challengeMembers } from '@/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'

/**
 * Get Monday 00:00:00 of the week containing `date`.
 * Week is Monday-Sunday per D-13.
 * For Sunday (getDay()===0), go back 6 days to get the previous Monday.
 */
export function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun, 1=Mon, 2=Tue, ...
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
 * Get the Monday-Sunday week bounds as YYYY-MM-DD strings.
 */
export function getWeekBounds(date: Date): { start: string; end: string } {
  const monday = getMonday(date)
  const sunday = getSunday(date)
  return {
    start: formatDate(monday),
    end: formatDate(sunday),
  }
}

/**
 * Format a Date as YYYY-MM-DD string.
 */
function formatDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get weekly progress for a user in a challenge.
 * Returns distinct check-in days for the Monday-Sunday week containing `date`,
 * and the user's weekly goal.
 * Per D-17: Multiple check-ins on the same day count as 1 toward the goal.
 */
export async function getWeeklyProgress(
  userId: string,
  challengeId: string,
  date: Date
): Promise<{ checkedInDays: string[]; goal: number }> {
  const { start, end } = getWeekBounds(date)

  // Query check-ins for this week
  const rows = await db
    .select({ checkedInDate: checkIns.checkedInDate })
    .from(checkIns)
    .where(
      and(
        eq(checkIns.userId, userId),
        eq(checkIns.challengeId, challengeId),
        gte(checkIns.checkedInDate, start),
        lte(checkIns.checkedInDate, end)
      )
    )

  // Deduplicate days in JS (D-17: multiple check-ins per day, only 1 counts)
  const uniqueDays = [...new Set(rows.map((r) => r.checkedInDate))]

  // Get the user's weekly goal
  const memberRows = await db
    .select({ weeklyGoal: challengeMembers.weeklyGoal })
    .from(challengeMembers)
    .where(eq(challengeMembers.userId, userId))
    .limit(1)

  const goal = memberRows.length > 0 ? memberRows[0].weeklyGoal : 3

  return { checkedInDays: uniqueDays, goal }
}

/**
 * Compute the user's consecutive completed-week streak.
 * Per D-16: Streak increments at end of week if user met their goal.
 * Per D-16 / Pitfall 5: Starts from the PREVIOUS completed week, never the current week.
 * Per D-15: Streak resets to 0 when a week is missed.
 * Limits backward search to 52 weeks (1 year max streak).
 */
export async function computeStreak(
  userId: string,
  challengeId: string,
  weeklyGoal: number
): Promise<number> {
  let streak = 0

  // Start from the previous week (never current week per D-16)
  const now = new Date()
  const currentMonday = getMonday(now)
  const previousMonday = new Date(currentMonday)
  previousMonday.setDate(previousMonday.getDate() - 7)

  // Walk backward week by week, up to 52 weeks
  for (let i = 0; i < 52; i++) {
    const weekStart = new Date(previousMonday)
    weekStart.setDate(weekStart.getDate() - i * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const startStr = formatDate(weekStart)
    const endStr = formatDate(weekEnd)

    // Count distinct check-in days for this week
    const rows = await db
      .select({ checkedInDate: checkIns.checkedInDate })
      .from(checkIns)
      .where(
        and(
          eq(checkIns.userId, userId),
          eq(checkIns.challengeId, challengeId),
          gte(checkIns.checkedInDate, startStr),
          lte(checkIns.checkedInDate, endStr)
        )
      )

    const uniqueDays = new Set(rows.map((r) => r.checkedInDate))

    if (uniqueDays.size >= weeklyGoal) {
      streak++
    } else {
      // D-15: Streak breaks on first missed week
      break
    }
  }

  return streak
}
