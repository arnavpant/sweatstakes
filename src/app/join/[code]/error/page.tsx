import Link from 'next/link'

export default async function JoinErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams

  // Map error codes to user-friendly messages (D-09, T-02-08: no internal details exposed)
  const messages: Record<string, string> = {
    invalid_or_expired: 'This invite link has expired or already been used.',
    already_in_challenge: 'You are already in a challenge. Leave your current challenge first to join a new one.',
  }

  const message = messages[reason || ''] || 'This invite link has expired or already been used.'

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center w-full max-w-sm space-y-6 text-center">
        <span className="material-symbols-outlined text-5xl text-error">
          link_off
        </span>
        <h1 className="text-2xl font-bold text-on-surface">
          Invite Link Invalid
        </h1>
        <p className="text-base text-on-surface-variant">
          {message}
        </p>
        <p className="text-sm text-on-surface-variant">
          Ask your friend to send a new invite link.
        </p>
        <Link
          href="/dashboard"
          className="rounded-full px-6 py-3 bg-surface-container text-on-surface font-bold text-sm min-h-[44px] flex items-center justify-center"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  )
}
