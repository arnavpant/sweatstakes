interface DayDotsProps {
  checkedInDays: string[]
  goal: number
  weekStart: string
  streak: number
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const

/**
 * Adds `days` to a YYYY-MM-DD date string and returns a new YYYY-MM-DD string.
 */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns today's date as YYYY-MM-DD in local timezone.
 */
function getToday(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * DayDots — weekly progress card with header (count + streak pill) and a
 * 7-dot row for Mon-Sun. Server Component; receives data as props.
 *
 * Folded the former StreakCounter into the top-right pill (orange-100 bg,
 * orange-500/600 fg per inspo).
 */
export function DayDots({ checkedInDays, goal, weekStart, streak }: DayDotsProps) {
  const today = getToday()
  const checkedInSet = new Set(checkedInDays)
  const completed = checkedInDays.length

  return (
    <div className="bg-[#0b1a3a] border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-sm text-slate-400">This Week</span>
          <p className="text-lg font-semibold text-white">
            {completed}/{goal} days
          </p>
        </div>
        <div className="flex items-center gap-2 bg-orange-500/15 px-3 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-orange-400 text-base">
            local_fire_department
          </span>
          <span className="text-sm font-semibold text-orange-300">
            {streak}w streak
          </span>
        </div>
      </div>
      <div className="flex justify-between">
        {DAY_LABELS.map((label, i) => {
          const dateStr = addDays(weekStart, i)
          const isChecked = checkedInSet.has(dateStr)
          const isToday = dateStr === today
          return (
            <div
              key={i}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                isChecked
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#13254f] text-slate-400'
              } ${isToday ? 'ring-2 ring-emerald-400/60' : ''}`}
            >
              {label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
