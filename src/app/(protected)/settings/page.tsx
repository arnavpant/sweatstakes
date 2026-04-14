import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { challengeMembers, challenges, pushSubscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { InviteLinkSection } from '@/components/connections/invite-link-section'
import { LeaveChallengeButton } from '@/components/connections/leave-challenge-button'
import { GoalStepper } from '@/components/settings/goal-stepper'
import { SettlementSettings } from '@/components/settings/settlement-settings'
import { NotificationsSection } from '@/components/settings/notifications-section'
import { ProfileSection } from '@/components/settings/profile-section'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if user is in a challenge and get their weekly goal + challenge settings
  // Extended for Phase 5 SETT-02: notifications_enabled + reminder_hour
  const membership = await db
    .select({
      challengeId: challengeMembers.challengeId,
      weeklyGoal: challengeMembers.weeklyGoal,
      displayName: challengeMembers.displayName,
      avatarUrl: challengeMembers.avatarUrl,
      timezone: challenges.timezone,
      settlementHour: challenges.settlementHour,
      notificationsEnabled: challengeMembers.notificationsEnabled,
      reminderHour: challengeMembers.reminderHour,
    })
    .from(challengeMembers)
    .innerJoin(challenges, eq(challenges.id, challengeMembers.challengeId))
    .where(eq(challengeMembers.userId, user.id))
    .limit(1)

  const isInChallenge = membership.length > 0

  // Phase 5 SETT-02: does the caller have any active push subscription?
  // Passed to <NotificationsSection /> so it can render the right state on first paint.
  const subRows = isInChallenge
    ? await db
        .select({ id: pushSubscriptions.id })
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, user.id))
        .limit(1)
    : []
  const hasActiveSubscription = subRows.length > 0

  // Phase 5 SETT-03: Google OAuth avatar_url is the fallback when the user
  // hasn't uploaded a custom photo. It's stored on auth.users.user_metadata
  // at signup.
  const googleAvatarUrl =
    (user.user_metadata as Record<string, unknown> | null)?.avatar_url as string | undefined ?? null

  return (
    <div className="flex flex-col px-4 pt-8 pb-8 space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">Settings</h1>

      {/* Profile section (SETT-03) -- Plan 04. Only shown when in a challenge
          since there's no challenge_members row (and therefore no display name
          to edit) until the user joins. */}
      {isInChallenge && (
        <ProfileSection
          userId={user.id}
          displayName={membership[0].displayName}
          customAvatarUrl={membership[0].avatarUrl}
          googleAvatarUrl={googleAvatarUrl}
        />
      )}

      {/* Invite Friends section (D-04: invite generation lives on Settings page) */}
      <InviteLinkSection />

      {/* Weekly Goal section -- only shown if user is in a challenge (D-08) */}
      {isInChallenge && (
        <GoalStepper currentGoal={membership[0].weeklyGoal} />
      )}

      {/* Notifications section (SETT-02) -- Phase 5 Plan 02 anchor.
          Plan 04 may later insert <ProfileSection /> between the greeting and InviteLinkSection;
          keep that area untouched so the two plans don't collide. */}
      {isInChallenge && (
        <NotificationsSection
          initialEnabled={membership[0].notificationsEnabled}
          initialReminderHour={membership[0].reminderHour}
          hasActiveSubscription={hasActiveSubscription}
          vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''}
        />
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
