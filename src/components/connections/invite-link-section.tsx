'use client'

import { useState } from 'react'
import { Loader2, Link as LinkIcon } from 'lucide-react'
import { generateInviteLinkAction } from '@/lib/actions/connections'
import { ShareInviteButton } from './share-invite-button'

export function InviteLinkSection() {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const result = await generateInviteLinkAction()
      if (result.error) {
        setError(result.error)
      } else if (result.url) {
        setInviteUrl(result.url)
      }
    } catch {
      setError('Failed to generate invite link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-container rounded-xl p-5 w-full space-y-4">
      <div className="flex items-center gap-2">
        <LinkIcon className="h-5 w-5 text-secondary" />
        <h2 className="text-base font-bold text-on-surface">Invite Friends</h2>
      </div>

      <p className="text-sm text-on-surface-variant">
        Generate a one-time invite link to share with a friend. Links expire after 24 hours.
      </p>

      {!inviteUrl ? (
        <button
          onClick={handleGenerate}
          disabled={loading}
          aria-busy={loading}
          className="w-full rounded-full py-3 bg-gradient-to-br from-secondary to-on-tertiary-container text-on-secondary-fixed font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Invite Link'
          )}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-surface-container-high rounded-lg px-3 py-2">
            <p className="text-xs text-on-surface-variant font-mono break-all">
              {inviteUrl}
            </p>
          </div>
          <ShareInviteButton url={inviteUrl} />
          <button
            onClick={() => setInviteUrl(null)}
            className="w-full text-sm text-on-surface-variant py-2"
          >
            Generate New Link
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-error text-sm text-center">
          {error}
        </p>
      )}
    </div>
  )
}
