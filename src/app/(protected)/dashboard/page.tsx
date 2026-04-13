import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const firstName = user.user_metadata.full_name?.split(' ')[0] || 'there'
  const avatarUrl = user.user_metadata.avatar_url

  return (
    <div className="px-4 pt-8">
      {/* Header: greeting with Google avatar (per D-07) */}
      <div className="flex items-center gap-3 mb-8">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${firstName}'s avatar`}
            className="w-10 h-10 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
            <span className="text-on-surface text-sm font-bold">
              {firstName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <h1 className="text-2xl font-bold text-on-surface">
          Welcome, {firstName}!
        </h1>
      </div>

      {/* Empty state card (per D-08) */}
      <div className="bg-surface-container rounded-xl p-6">
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Placeholder icon — tracked as ICON-06 in icon inventory */}
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">
            group_add
          </span>
          <h2 className="text-base font-bold text-on-surface">
            No active challenge yet.
          </h2>
          <p className="text-base text-on-surface-variant">
            Invite friends to get started.
          </p>
        </div>
      </div>
    </div>
  )
}
