import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { challengeMembers, pointTransactions, checkIns, rewards } from '@/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { getMonday, computeStreak } from '@/lib/utils/week'
import { computePersonalBest } from '@/lib/utils/settlement'
import { StreakSection } from '@/components/streaks/streak-section'
import { MemberLeaderboard } from '@/components/streaks/member-leaderboard'
import { RewardsMenu } from '@/components/streaks/rewards-menu'

function formatDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default async function StreaksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get user's challenge membership
  const userMembership = await db
    .select({
      challengeId: challengeMembers.challengeId,
      weeklyGoal: challengeMembers.weeklyGoal,
    })
    .from(challengeMembers)
    .where(eq(challengeMembers.userId, user.id))
    .limit(1)

  if (userMembership.length === 0) {
    return (
      <div className="px-4 pt-6 pb-32 space-y-8">
        <h1 className="text-2xl font-bold text-on-surface">Streaks & Balance</h1>
        <div className="bg-surface-container rounded-xl p-6 text-center space-y-2">
          <p className="text-base text-on-surface-variant">
            Join a challenge to see your streaks and balance.
          </p>
        </div>
      </div>
    )
  }

  const challengeId = userMembership[0].challengeId
  const weeklyGoal = userMembership[0].weeklyGoal

  // Compute current streak
  const streak = await computeStreak(user.id, challengeId, weeklyGoal)

  // Walk 52 completed weeks for personal best
  const now = new Date()
  const currentMonday = getMonday(now)
  const weekResults: boolean[] = []

  for (let i = 1; i <= 52; i++) {
    const weekStart = new Date(currentMonday)
    weekStart.setDate(weekStart.getDate() - i * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const startStr = formatDate(weekStart)
    const endStr = formatDate(weekEnd)

    const rows = await db
      .select({ checkedInDate: checkIns.checkedInDate })
      .from(checkIns)
      .where(and(
        eq(checkIns.userId, user.id),
        eq(checkIns.challengeId, challengeId),
        gte(checkIns.checkedInDate, startStr),
        lte(checkIns.checkedInDate, endStr)
      ))
    const uniqueDays = new Set(rows.map(r => r.checkedInDate))
    weekResults.unshift(uniqueDays.size >= weeklyGoal) // oldest first
  }

  const personalBest = computePersonalBest(weekResults)

  // Get all challenge members with their balances
  const membersRaw = await db
    .select({
      userId: challengeMembers.userId,
      displayName: challengeMembers.displayName,
      avatarUrl: challengeMembers.avatarUrl,
    })
    .from(challengeMembers)
    .where(eq(challengeMembers.challengeId, challengeId))

  // Get balances from point transactions
  const balancesRaw = await db
    .select({
      userId: pointTransactions.userId,
      balance: sql<number>`COALESCE(SUM(${pointTransactions.delta}), 0)`,
    })
    .from(pointTransactions)
    .where(eq(pointTransactions.challengeId, challengeId))
    .groupBy(pointTransactions.userId)

  // Merge — members with no transactions get balance 0
  const balanceMap = new Map(balancesRaw.map(b => [b.userId, Number(b.balance)]))
  const members = membersRaw.map(m => ({
    ...m,
    balance: balanceMap.get(m.userId) ?? 0,
  })).sort((a, b) => b.balance - a.balance)

  const userBalance = balanceMap.get(user.id) ?? 0

  // Get rewards for the challenge
  const rewardsData = await db
    .select({
      id: rewards.id,
      name: rewards.name,
      pointCost: rewards.pointCost,
    })
    .from(rewards)
    .where(eq(rewards.challengeId, challengeId))

  return (
    <div className="px-4 pt-6 pb-32 space-y-8">
      <h1 className="text-2xl font-bold text-on-surface">Streaks & Balance</h1>

      <StreakSection streak={streak} personalBest={personalBest} />

      <MemberLeaderboard members={members} currentUserId={user.id} />

      <RewardsMenu rewards={rewardsData} userBalance={userBalance} challengeId={challengeId} />
    </div>
  )
}
