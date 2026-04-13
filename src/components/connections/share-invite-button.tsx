'use client'

import { useState, useEffect } from 'react'
import { Share2, Copy, Check } from 'lucide-react'

interface ShareInviteButtonProps {
  url: string
}

export function ShareInviteButton({ url }: ShareInviteButtonProps) {
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    // Check Web Share API availability after mount (client-only)
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  async function handleShare() {
    // Try Web Share API first (available on mobile browsers)
    if (canShare && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join my SweatStakes challenge',
          text: "I'm holding you accountable to your workouts. Join here:",
          url,
        })
        return
      } catch (err) {
        // User cancelled share -- fall through to clipboard
        if ((err as Error).name === 'AbortError') return
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyFailed(true)
      setTimeout(() => setCopyFailed(false), 3000)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center justify-center gap-2 w-full rounded-full py-3 bg-surface-container-high text-on-surface font-bold text-sm min-h-[44px]"
    >
      {copyFailed ? (
        <span className="text-error">Copy failed -- try manually</span>
      ) : copied ? (
        <>
          <Check className="h-4 w-4 text-secondary" />
          Copied!
        </>
      ) : (
        <>
          {canShare ? (
            <Share2 className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          Share Invite Link
        </>
      )}
    </button>
  )
}
