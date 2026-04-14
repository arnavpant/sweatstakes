'use client'

import { useEffect, useState } from 'react'
import { formatRelative } from '@/lib/utils/relative-time'
import type { FeedItem } from '@/lib/queries/feed'

/**
 * FeedCard — FEED-01 single BeReal-style check-in card.
 * Client Component so the relative timestamp can re-tick every 60s
 * while the page is open. Note: Next.js serializes Date → string across
 * the server→client boundary, so `formatRelative` must accept both (it does).
 */
export function FeedCard({ item }: { item: FeedItem }) {
  const [relative, setRelative] = useState(() => formatRelative(item.createdAt))

  useEffect(() => {
    // Re-compute every 60s so "2m ago" becomes "3m ago"
    const id = setInterval(() => setRelative(formatRelative(item.createdAt)), 60_000)
    return () => clearInterval(id)
  }, [item.createdAt])

  return (
    <article className="bg-surface-container rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        {item.avatarUrl ? (
          <img
            src={item.avatarUrl}
            alt={item.displayName}
            className="w-10 h-10 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
            <span className="text-on-surface text-sm font-bold">
              {item.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1">
          <p className="text-base font-bold text-on-surface">{item.displayName}</p>
          <p className="text-xs text-on-surface-variant">{relative}</p>
        </div>
      </div>
      <img
        src={item.photoUrl}
        alt={`${item.displayName}'s check-in`}
        className="w-full aspect-square object-cover"
        loading="lazy"
      />
    </article>
  )
}
