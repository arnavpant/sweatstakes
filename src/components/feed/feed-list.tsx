'use client'

import PullToRefresh from 'react-simple-pull-to-refresh'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { FeedCard } from './feed-card'
import type { FeedItem } from '@/lib/queries/feed'

/**
 * FeedList — FEED-02 client wrapper around PullToRefresh.
 *
 * Two update triggers (per locked CONTEXT.md decision — no Realtime subscription here):
 *   1. Pull-down gesture → router.refresh()
 *   2. Navigating into /feed → router.refresh() (useEffect on pathname)
 */
export function FeedList({ items }: { items: FeedItem[] }) {
  const router = useRouter()
  const pathname = usePathname()

  // Revalidate when user navigates to /feed
  useEffect(() => {
    if (pathname === '/feed') router.refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  async function handleRefresh() {
    router.refresh()
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-24 px-6">
        <div className="bg-surface-container rounded-xl p-6 w-full max-w-sm text-center space-y-3">
          <h2 className="text-base font-bold text-on-surface">No check-ins yet</h2>
          <p className="text-base text-on-surface-variant">
            When you or a friend logs a workout, it&apos;ll show up here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      pullingContent={
        <div className="flex justify-center py-2">
          <Loader2 className="animate-spin h-5 w-5 text-on-surface-variant" />
        </div>
      }
      refreshingContent={
        <div className="flex justify-center py-2">
          <Loader2 className="animate-spin h-5 w-5 text-on-surface-variant" />
        </div>
      }
    >
      <div className="flex flex-col gap-4 px-4 pt-4 pb-8">
        {items.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
    </PullToRefresh>
  )
}
