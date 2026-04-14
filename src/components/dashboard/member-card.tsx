import { DayDots } from './day-dots'

/**
 * MemberCard — DASH-02 single horizontally-scrollable member card.
 * Server Component. Shows the member's avatar, display name (with "(you)" tag
 * for the viewer's own card), and their 7-day DayDots row for the current week.
 */
interface MemberCardProps {
  userId: string
  displayName: string
  avatarUrl: string | null
  weeklyGoal: number
  checkedInDays: string[]
  weekStart: string
  isCurrentUser: boolean
}

export function MemberCard({
  displayName,
  avatarUrl,
  weeklyGoal,
  checkedInDays,
  weekStart,
  isCurrentUser,
}: MemberCardProps) {
  return (
    <div className="snap-start shrink-0 w-[85vw] max-w-sm bg-surface-container rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
            <span className="text-on-surface text-sm font-bold">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <p className="text-base font-bold text-on-surface">
            {displayName}
            {isCurrentUser && ' (you)'}
          </p>
        </div>
      </div>
      <DayDots
        checkedInDays={checkedInDays}
        goal={weeklyGoal}
        weekStart={weekStart}
      />
    </div>
  )
}
