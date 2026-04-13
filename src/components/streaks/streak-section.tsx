import { StreakCounter } from '@/components/dashboard/streak-counter'

interface StreakSectionProps {
  streak: number
  personalBest: number
}

export function StreakSection({ streak, personalBest }: StreakSectionProps) {
  return (
    <div className="bg-surface-container rounded-xl p-4 space-y-3">
      {/* Current streak — reuses existing StreakCounter */}
      <StreakCounter streak={streak} />

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
