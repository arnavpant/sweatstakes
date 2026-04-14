import { MemberCard } from './member-card'

/**
 * MemberCardRow — DASH-02 horizontal scroll container.
 * Server Component. Receives pre-computed per-member progress rows
 * (current user already pinned first by the caller) and wraps them in
 * a scroll-snapping row.
 */
interface Row {
  userId: string
  displayName: string
  avatarUrl: string | null
  weeklyGoal: number
  checkedInDays: string[]
  isCurrentUser: boolean
}

export function MemberCardRow({
  rows,
  weekStart,
}: {
  rows: Row[]
  weekStart: string
}) {
  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2 no-scrollbar">
      {rows.map((r) => (
        <MemberCard
          key={r.userId}
          userId={r.userId}
          displayName={r.displayName}
          avatarUrl={r.avatarUrl}
          weeklyGoal={r.weeklyGoal}
          checkedInDays={r.checkedInDays}
          weekStart={weekStart}
          isCurrentUser={r.isCurrentUser}
        />
      ))}
    </div>
  )
}
