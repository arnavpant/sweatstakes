'use client'

import { useState } from 'react'
import { Loader2, LogOut } from 'lucide-react'
import { leaveChallengeAction } from '@/lib/actions/connections'
import { useRouter } from 'next/navigation'

export function LeaveChallengeButton() {
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()

  async function handleLeave() {
    setLoading(true)
    try {
      const result = await leaveChallengeAction()
      if (result.success) {
        router.refresh()
      }
    } catch {
      // Silently handle error
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center justify-center gap-2 w-full rounded-full py-3 text-error text-sm font-bold min-h-[44px]"
      >
        <LogOut className="h-4 w-4" />
        Leave Challenge
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-on-surface-variant text-center">
        Are you sure? You will lose your membership in this challenge.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setConfirming(false)}
          className="flex-1 rounded-full py-3 bg-surface-container-high text-on-surface text-sm font-bold min-h-[44px]"
        >
          Cancel
        </button>
        <button
          onClick={handleLeave}
          disabled={loading}
          aria-busy={loading}
          className="flex-1 rounded-full py-3 bg-error/20 text-error text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 min-h-[44px]"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'Leaving...' : 'Confirm'}
        </button>
      </div>
    </div>
  )
}
