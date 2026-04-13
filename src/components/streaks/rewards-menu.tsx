'use client'

// Placeholder — will be replaced in Task 2 with full rewards menu
interface RewardsMenuProps {
  rewards: Array<{ id: string; name: string; pointCost: number }>
  userBalance: number
  challengeId: string
}

export function RewardsMenu({ rewards, userBalance, challengeId }: RewardsMenuProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-on-surface">Rewards</h2>
      <p className="text-base text-on-surface-variant">Loading rewards...</p>
    </div>
  )
}
