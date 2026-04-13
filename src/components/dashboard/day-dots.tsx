interface DayDotsProps {
  checkedInDays: string[]
  goal: number
  weekStart: string
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
 * DayDots — 7-dot progress tracker for Monday-Sunday fitness week.
 * Server Component: receives data as props from Dashboard.
 *
 * Shows M T W T F S S with filled dots for checked-in days,
 * today highlight, and "X/Y days" progress count.
 */
export function DayDots({ checkedInDays, goal, weekStart }: DayDotsProps) {
  const today = getToday()
  const checkedInSet = new Set(checkedInDays)
  const completed = checkedInDays.length
  const metGoal = completed >= goal

  return (
    <div className="bg-surface-container rounded-xl p-4">
      <div className="flex items-center gap-4">
        {/* 7-day dot row */}
        <div className="flex flex-1 justify-between">
          {DAY_LABELS.map((label, i) => {
            const dateStr = addDays(weekStart, i)
            const isCheckedIn = checkedInSet.has(dateStr)
            const isToday = dateStr === today

            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-on-surface-variant">{label}</span>
                <span
                  className={`w-3 h-3 rounded-full ${
                    isCheckedIn
                      ? isToday
                        ? 'bg-secondary ring-2 ring-secondary/30'
                        : 'bg-secondary'
                      : isToday
                        ? 'bg-surface-container-high ring-2 ring-secondary/50'
                        : 'bg-surface-container-high'
                  }`}
                />
              </div>
            )
          })}
        </div>

        {/* Progress count */}
        <span
          className={`text-sm font-bold whitespace-nowrap ${
            metGoal ? 'text-secondary' : 'text-on-surface'
          }`}
        >
          {completed}/{goal} days
        </span>
      </div>
    </div>
  )
}
