'use client'

import { Dialog } from '@base-ui/react/dialog'
import { useState, useTransition } from 'react'
import { redeemRewardAction } from '@/lib/actions/points'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RedeemDialogProps {
  rewardId: string
  rewardName: string
  pointCost: number
  userBalance: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RedeemDialog({ rewardId, rewardName, pointCost, userBalance, open, onOpenChange }: RedeemDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleRedeem() {
    setError(null)
    startTransition(async () => {
      const result = await redeemRewardAction(rewardId)
      if ('error' in result) {
        setError(result.error ?? 'Redemption failed. Please try again.')
      } else {
        onOpenChange(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="bg-black/60 fixed inset-0 z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <Dialog.Popup className="bg-surface-container-high rounded-2xl p-6 space-y-4 mx-4 max-w-sm w-full">
            <Dialog.Title className="text-xl font-bold text-on-surface">Redeem Reward?</Dialog.Title>

            <div className="space-y-1">
              <p className="text-base font-bold text-on-surface">&ldquo;{rewardName}&rdquo;</p>
              <p className="text-base text-on-surface-variant">
                This will cost you {pointCost} pts from your balance.
              </p>
              <p className="text-xs font-bold text-on-surface-variant">
                Your current balance: {userBalance} pts
              </p>
            </div>

            {error && <p className="text-error text-sm">{error}</p>}

            <div className="space-y-2">
              <button
                onClick={handleRedeem}
                disabled={isPending}
                className="bg-secondary text-on-secondary font-bold rounded-full w-full py-3 flex items-center justify-center disabled:opacity-50"
                aria-busy={isPending}
              >
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Redeem'}
              </button>
              <Dialog.Close
                className="text-on-surface-variant font-bold rounded-full w-full py-3 text-center"
              >
                Keep my points
              </Dialog.Close>
            </div>
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
