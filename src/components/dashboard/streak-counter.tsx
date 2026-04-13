interface StreakCounterProps {
  streak: number
}

/**
 * StreakCounter — displays fire emoji + consecutive week streak count.
 * Server Component: receives streak as a prop from Dashboard.
 *
 * Per D-14: Fire emoji + number, e.g. "🔥 3 week streak".
 * Per D-15: Streak resets silently when a week is missed.
 * Per D-16: Streak counts previous completed weeks only.
 */
export function StreakCounter({ streak }: StreakCounterProps) {
  if (streak === 0) {
    return (
      <div className="flex items-center gap-2 px-1">
        <span className="text-sm text-on-surface-variant">No streak yet</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-1">
      <span role="img" aria-label="fire">🔥</span>
      <span
        className={`text-sm font-bold ${
          streak >= 4 ? 'text-secondary' : 'text-on-surface'
        }`}
      >
        {streak} {streak === 1 ? 'week' : 'weeks'} streak
      </span>
    </div>
  )
}
