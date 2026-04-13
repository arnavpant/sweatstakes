import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { challengeMembers } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { MemberAvatarRow } from '@/components/connections/member-avatar-row'
import { DayDots } from '@/components/dashboard/day-dots'
import { StreakCounter } from '@/components/dashboard/streak-counter'
import { getWeeklyProgress, computeStreak, getMonday } from '@/lib/utils/week'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const firstName = user.user_metadata.full_name?.split(' ')[0] || 'there'
  const avatarUrl = user.user_metadata.avatar_url

  // Query challenge membership
  const userMembership = await db
    .select({ challengeId: challengeMembers.challengeId })
    .from(challengeMembers)
    .where(eq(challengeMembers.userId, user.id))
    .limit(1)

  let members: { displayName: string; avatarUrl: string | null; userId: string }[] = []

  if (userMembership.length > 0) {
    members = await db
      .select({
        displayName: challengeMembers.displayName,
        avatarUrl: challengeMembers.avatarUrl,
        userId: challengeMembers.userId,
      })
      .from(challengeMembers)
      .where(eq(challengeMembers.challengeId, userMembership[0].challengeId))
  }

  const isInChallenge = members.length > 0

  // Compute weekly progress and streak when user is in a challenge
  let weeklyProgress = { checkedInDays: [] as string[], goal: 3 }
  let streak = 0
  let weekStart = ''

  if (userMembership.length > 0) {
    const now = new Date()
    const monday = getMonday(now)
    weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`

    weeklyProgress = await getWeeklyProgress(user.id, userMembership[0].challengeId, now)
    streak = await computeStreak(user.id, userMembership[0].challengeId, weeklyProgress.goal)
  }

  return (
    <div className="px-4 pt-8">
      {/* Header: greeting with Google avatar */}
      <div className="flex items-center gap-3 mb-6">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${firstName}'s avatar`}
            className="w-10 h-10 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
            <span className="text-on-surface text-sm font-bold">
              {firstName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <h1 className="text-2xl font-bold text-on-surface">
          Welcome, {firstName}!
        </h1>
      </div>

      {/* Challenge state: avatar row OR empty state (D-15, D-16) */}
      {isInChallenge ? (
        <div className="mb-6 space-y-3">
          <MemberAvatarRow members={members} />
          <DayDots
            checkedInDays={weeklyProgress.checkedInDays}
            goal={weeklyProgress.goal}
            weekStart={weekStart}
          />
          <StreakCounter streak={streak} />
        </div>
      ) : (
        <div className="bg-surface-container rounded-xl p-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">
              group_add
            </span>
            <h2 className="text-base font-bold text-on-surface">
              No active challenge yet.
            </h2>
            <p className="text-base text-on-surface-variant">
              Invite friends to get started.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
