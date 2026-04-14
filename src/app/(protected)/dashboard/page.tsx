import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { challengeMembers, challenges } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { UserAvatar } from '@/components/dashboard/user-avatar'
import { MemberAvatarRow } from '@/components/connections/member-avatar-row'
import { WeeklyProgressGrid } from '@/components/dashboard/weekly-progress-grid'
import { PhotoGallery } from '@/components/dashboard/photo-gallery'
import { getWeeklyProgress, getMonday } from '@/lib/utils/week'
import {
  getMemberProgressRows,
  getRecentCheckInPhotos,
} from '@/lib/queries/dashboard'

interface MemberProgressEntry {
  userId: string
  displayName: string
  weeklyGoal: number
  checkedInDays: string[]
  isCurrentUser: boolean
}

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

  let weekStart = ''
  let timezone = 'America/New_York'
  let memberProgress: MemberProgressEntry[] = []
  let recentPhotos: { id: string; photoUrl: string; selfieUrl: string | null }[] = []

  if (userMembership.length > 0) {
    const now = new Date()
    const monday = getMonday(now)
    weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`

    const challengeId = userMembership[0].challengeId

    // Fetch the challenge row for its timezone (used by WeeklyProgressGrid).
    const [challengeRow] = await db
      .select({ timezone: challenges.timezone })
      .from(challenges)
      .where(eq(challenges.id, challengeId))
      .limit(1)
    if (challengeRow) timezone = challengeRow.timezone

    // DASH-03: recent check-in photos for the gallery grid
    recentPhotos = await getRecentCheckInPhotos(challengeId, 6)

    // Per-member weekly progress (every member, current user pinned first)
    const rawMembers = await getMemberProgressRows(challengeId)
    const progressPerMember = await Promise.all(
      rawMembers.map(async (m) => {
        const p = await getWeeklyProgress(m.userId, challengeId, now)
        return {
          userId: m.userId,
          displayName: m.displayName,
          weeklyGoal: m.weeklyGoal,
          checkedInDays: p.checkedInDays,
          isCurrentUser: m.userId === user.id,
        }
      })
    )
    memberProgress = progressPerMember.sort(
      (a, b) => Number(b.isCurrentUser) - Number(a.isCurrentUser)
    )
  }

  return (
    <div className="min-h-screen bg-[#050b1f]">
      <div className="max-w-md mx-auto px-4 pt-8 pb-8">
        <header className="flex items-center gap-3 mb-6">
          <UserAvatar avatarUrl={avatarUrl} name={firstName} />
          <div>
            <p className="text-sm text-slate-400">Welcome back,</p>
            <h1 className="text-xl font-bold text-white">{firstName}</h1>
          </div>
        </header>

        {isInChallenge ? (
          <div className="space-y-4">
            <MemberAvatarRow members={members} />
            <WeeklyProgressGrid
              members={memberProgress}
              weekStart={weekStart}
              timezone={timezone}
            />
            <PhotoGallery photos={recentPhotos} />
          </div>
        ) : (
          <div className="bg-[#0b1a3a] border border-white/10 rounded-md p-6">
            <div className="flex flex-col items-center text-center gap-3">
              <span className="material-symbols-outlined text-4xl text-emerald-400">
                group_add
              </span>
              <h2 className="text-lg font-semibold text-white">
                No active challenge yet
              </h2>
              <p className="text-sm text-slate-400">
                Invite friends to get started.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
