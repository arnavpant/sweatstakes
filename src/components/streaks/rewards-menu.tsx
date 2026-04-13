'use client'

import { useState, useTransition } from 'react'
import { Gift, Trash2 } from 'lucide-react'
import { deleteRewardAction } from '@/lib/actions/points'
import { useRouter } from 'next/navigation'
import { AddRewardDrawer } from '@/components/streaks/add-reward-drawer'
import { RedeemDialog } from '@/components/streaks/redeem-dialog'

interface Reward {
  id: string
  name: string
  pointCost: number
}

interface RewardsMenuProps {
  rewards: Reward[]
  userBalance: number
  challengeId: string
}

export function RewardsMenu({ rewards, userBalance, challengeId }: RewardsMenuProps) {
  const [redeemTarget, setRedeemTarget] = useState<Reward | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete(reward: Reward) {
    setDeletingId(reward.id)
    startTransition(async () => {
      const result = await deleteRewardAction(reward.id)
      setDeletingId(null)
      if (!('error' in result)) {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-on-surface">Rewards</h2>
        <AddRewardDrawer />
      </div>

      {/* Empty state */}
      {rewards.length === 0 ? (
        <div className="bg-surface-container rounded-xl p-6 text-center space-y-2">
          <Gift size={32} className="text-on-surface-variant mx-auto" />
          <p className="text-base font-bold text-on-surface">No rewards yet</p>
          <p className="text-base text-on-surface-variant">Add something worth working for.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rewards.map((reward) => {
            const canRedeem = userBalance >= reward.pointCost
            const isDeleting = deletingId === reward.id

            return (
              <div
                key={reward.id}
                className={`bg-surface-container rounded-xl px-4 py-3 flex items-center gap-3 min-h-14${
                  isDeleting ? ' opacity-50' : ''
                }`}
              >
                {/* Reward name */}
                <span className="text-base text-on-surface flex-1 truncate">{reward.name}</span>

                {/* Cost badge */}
                <span className="bg-surface-container-high text-on-surface text-sm font-bold px-2 py-1 rounded-full whitespace-nowrap">
                  {reward.pointCost} pts
                </span>

                {/* Redeem button */}
                {canRedeem ? (
                  <button
                    onClick={() => setRedeemTarget(reward)}
                    className="bg-secondary text-on-secondary text-sm font-bold rounded-full px-3 py-1.5 min-h-[36px]"
                  >
                    Redeem
                  </button>
                ) : (
                  <button
                    aria-disabled="true"
                    className="bg-surface-container-high text-on-surface-variant text-sm font-bold rounded-full px-3 py-1.5 min-h-[36px] opacity-50 cursor-not-allowed"
                    tabIndex={-1}
                  >
                    Redeem
                  </button>
                )}

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(reward)}
                  disabled={isDeleting}
                  className="text-error p-1.5 rounded-full hover:bg-error/10 min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label={`Delete ${reward.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Redeem confirmation dialog */}
      {redeemTarget && (
        <RedeemDialog
          rewardId={redeemTarget.id}
          rewardName={redeemTarget.name}
          pointCost={redeemTarget.pointCost}
          userBalance={userBalance}
          open={!!redeemTarget}
          onOpenChange={(open) => {
            if (!open) setRedeemTarget(null)
          }}
        />
      )}
    </div>
  )
}
