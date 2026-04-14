import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { challengeMembers } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getFeedItems } from '@/lib/queries/feed'
import { FeedList } from '@/components/feed/feed-list'

/**
 * Feed page — FEED-01/02 BeReal-style vertical card stack of check-ins
 * for the authenticated user's current challenge, newest first.
 *
 * Server Component: resolves the viewer's challengeId from membership
 * (never from client input — mitigates T-05-03-01) and fetches the full
 * feed in one query. Update model is pull-to-refresh + tab-navigation
 * revalidation handled inside <FeedList />.
 */
export default async function FeedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await db
    .select({ challengeId: challengeMembers.challengeId })
    .from(challengeMembers)
    .where(eq(challengeMembers.userId, user.id))
    .limit(1)

  if (membership.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-24 px-6">
        <div className="bg-surface-container rounded-xl p-6 w-full max-w-sm text-center space-y-3">
          <h2 className="text-base font-bold text-on-surface">No active challenge</h2>
          <p className="text-base text-on-surface-variant">
            Join or create a challenge to see the feed.
          </p>
        </div>
      </div>
    )
  }

  const items = await getFeedItems(membership[0].challengeId)
  return <FeedList items={items} />
}
