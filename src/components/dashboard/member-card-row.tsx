/**
 * MemberCardRow — vertical list of OTHER challenge members and their
 * weekly progress (current user filtered out by this component).
 * Server Component.
 *
 * Renders nothing when there are no other members.
 */
interface Row {
  userId: string
  displayName: string
  avatarUrl: string | null
  weeklyGoal: number
  checkedInDays: string[]
  isCurrentUser: boolean
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const

/** Adds `days` to a YYYY-MM-DD date string (local). */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function MiniDayDots({
  checkedInDays,
  weekStart,
}: {
  checkedInDays: string[]
  weekStart: string
}) {
  const set = new Set(checkedInDays)
  return (
    <div className="flex gap-1">
      {DAY_LABELS.map((label, i) => {
        const dateStr = addDays(weekStart, i)
        const isChecked = set.has(dateStr)
        return (
          <div
            key={i}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${
              isChecked
                ? 'bg-emerald-500 text-white'
                : 'bg-[#13254f] text-slate-400'
            }`}
          >
            {label}
          </div>
        )
      })}
    </div>
  )
}

export function MemberCardRow({
  rows,
  weekStart,
}: {
  rows: Row[]
  weekStart: string
}) {
  const others = rows.filter((r) => !r.isCurrentUser)
  if (others.length === 0) return null

  return (
    <div className="bg-[#0b1a3a] border border-white/10 rounded-xl p-4">
      <h3 className="text-sm font-medium text-white mb-4">Member Progress</h3>
      <div className="space-y-3">
        {others.map((m) => (
          <div
            key={m.userId}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#13254f]"
          >
            {m.avatarUrl ? (
              <img
                src={m.avatarUrl}
                alt={m.displayName}
                className="w-10 h-10 rounded-full object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#1a2f63] flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold">
                  {m.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate mb-2">
                {m.displayName}
              </p>
              <MiniDayDots checkedInDays={m.checkedInDays} weekStart={weekStart} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
