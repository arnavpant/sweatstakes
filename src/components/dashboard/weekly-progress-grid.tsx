/**
 * WeeklyProgressGrid — unified weekly card showing every challenge member's
 * progress in a 2-column grid. Replaces the old DayDots + MemberCardRow pair.
 * Server Component.
 *
 * Layout per cell: member name + "X/Y" progress pill, then a 7-day dot grid
 * arranged 4-top / 3-bottom via grid-cols-4. Filled days use emerald; today
 * gets a subtle ring so the current day stands out.
 */

interface Member {
  userId: string
  displayName: string
  weeklyGoal: number
  checkedInDays: string[]
  isCurrentUser: boolean
}

interface WeeklyProgressGridProps {
  members: Member[]
  weekStart: string
  timezone: string
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatRange(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
  return `${fmt(start)} - ${fmt(end)}`
}

/** Today's YYYY-MM-DD in the challenge's timezone. */
function getLocalDateInTz(date: Date, timezone: string): string {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = fmt.formatToParts(date)
  const y = parts.find((p) => p.type === 'year')!.value
  const m = parts.find((p) => p.type === 'month')!.value
  const d = parts.find((p) => p.type === 'day')!.value
  return `${y}-${m}-${d}`
}

/** Full days (inclusive of today) remaining in the Mon-Sun week. */
function getDaysLeft(weekStart: string, timezone: string): number {
  const todayStr = getLocalDateInTz(new Date(), timezone)
  const today = new Date(todayStr + 'T00:00:00')
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const ms = end.getTime() - today.getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)) + 1)
}

/** "Europe/London" -> "London"; "America/New_York" -> "New York". */
function tzCity(tz: string): string {
  const last = tz.split('/').pop() ?? tz
  return last.replace(/_/g, ' ')
}

export function WeeklyProgressGrid({ members, weekStart, timezone }: WeeklyProgressGridProps) {
  const daysLeft = getDaysLeft(weekStart, timezone)
  const range = formatRange(weekStart)
  const city = tzCity(timezone)
  const today = getLocalDateInTz(new Date(), timezone)
  const sorted = [...members].sort(
    (a, b) => Number(b.isCurrentUser) - Number(a.isCurrentUser)
  )

  return (
    <div className="bg-[#0b1a3a] border border-white/10 rounded-md p-4">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-white">This Week</h3>
          <p className="text-sm text-slate-400 mt-0.5">{range}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
            <span className="material-symbols-outlined text-sm leading-none">public</span>
            <span>{city} time</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-slate-200 text-sm whitespace-nowrap">
          <span className="material-symbols-outlined text-base leading-none">schedule</span>
          <span>
            {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-5">
        {sorted.map((m) => {
          const set = new Set(m.checkedInDays)
          const completed = m.checkedInDays.length
          return (
            <div key={m.userId} className="min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-sm font-semibold text-white truncate">
                  {m.displayName}
                </span>
                <span className="text-xs text-slate-300 bg-white/10 px-2 py-0.5 rounded-md whitespace-nowrap">
                  {completed}/{m.weeklyGoal}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {DAY_LABELS.map((label, i) => {
                  const date = addDays(weekStart, i)
                  const isChecked = set.has(date)
                  const isToday = date === today
                  return (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                        isChecked
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/5 text-slate-400'
                      } ${isToday && !isChecked ? 'ring-2 ring-emerald-400/60' : ''}`}
                    >
                      {label}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
