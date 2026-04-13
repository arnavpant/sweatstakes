import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { challengeMembers, challenges } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { InviteLinkSection } from '@/components/connections/invite-link-section'
import { LeaveChallengeButton } from '@/components/connections/leave-challenge-button'
import { GoalStepper } from '@/components/settings/goal-stepper'
import { SettlementSettings } from '@/components/settings/settlement-settings'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if user is in a challenge and get their weekly goal + challenge settings
  const membership = await db
    .select({
      challengeId: challengeMembers.challengeId,
      weeklyGoal: challengeMembers.weeklyGoal,
      timezone: challenges.timezone,
      settlementHour: challenges.settlementHour,
    })
    .from(challengeMembers)
    .innerJoin(challenges, eq(challenges.id, challengeMembers.challengeId))
    .where(eq(challengeMembers.userId, user.id))
    .limit(1)

  const isInChallenge = membership.length > 0

  return (
    <div className="flex flex-col px-4 pt-8 pb-8 space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">Settings</h1>

      {/* Invite Friends section (D-04: invite generation lives on Settings page) */}
      <InviteLinkSection />

      {/* Weekly Goal section -- only shown if user is in a challenge (D-08) */}
      {isInChallenge && (
        <GoalStepper currentGoal={membership[0].weeklyGoal} />
      )}

      {/* Settlement Settings section -- timezone and settlement hour pickers */}
      {isInChallenge && (
        <SettlementSettings
          currentTimezone={membership[0].timezone}
          currentHour={membership[0].settlementHour}
        />
      )}

      {/* Leave Challenge section -- only shown if user is in a challenge (D-13) */}
      {isInChallenge && (
        <div className="bg-surface-container rounded-xl p-5 w-full space-y-3">
          <h2 className="text-base font-bold text-on-surface">Challenge</h2>
          <p className="text-sm text-on-surface-variant">
            You are currently in an active challenge.
          </p>
          <LeaveChallengeButton />
        </div>
      )}

      {/* Sign-out button */}
      <div className="pt-4">
        <SignOutButton />
      </div>
    </div>
  )
}
