'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { signOutAction } from '@/lib/actions/auth'

export function SignOutButton() {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await signOutAction()
    } catch {
      // signOutAction calls redirect() — this catch handles unexpected errors
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="w-full max-w-sm">
      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="w-full rounded-full py-4 bg-error-container text-on-error-container border border-error/30 font-bold text-base flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Signing out...
          </>
        ) : (
          'Sign out of SweatStakes'
        )}
      </button>
    </form>
  )
}
