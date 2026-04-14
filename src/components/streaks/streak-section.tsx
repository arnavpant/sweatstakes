interface StreakSectionProps {
  streak: number
  personalBest: number
}

/**
 * StreakSection — current streak + personal best display.
 * Server Component. Previously reused the standalone `StreakCounter`; that
 * component was folded into `DayDots` on the dashboard (quick 260414-82g),
 * so the same fire-emoji/"N weeks streak" rendering is inlined here.
 */
export function StreakSection({ streak, personalBest }: StreakSectionProps) {
  return (
    <div className="bg-surface-container rounded-xl p-4 space-y-3">
      {/* Current streak — inlined from former StreakCounter */}
      {streak === 0 ? (
        <div className="flex items-center gap-2 px-1">
          <span className="text-sm text-on-surface-variant">No streak yet</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-1">
          <span role="img" aria-label="fire">&#128293;</span>
          <span
            className={`text-sm font-bold ${
              streak >= 4 ? 'text-secondary' : 'text-on-surface'
            }`}
          >
            {streak} {streak === 1 ? 'week' : 'weeks'} streak
          </span>
        </div>
      )}

      {/* Personal best */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs font-bold text-on-surface-variant">Personal best</span>
        {personalBest === 0 ? (
          <span className="text-xs font-bold text-on-surface-variant">No best yet</span>
        ) : (
          <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
            <span role="img" aria-label="trophy">&#127942;</span> {personalBest} {personalBest === 1 ? 'week' : 'weeks'}
            {streak === personalBest && streak > 0 && (
              <span className="bg-secondary/20 text-secondary text-xs px-2 py-0.5 rounded-full">
                Current best!
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
