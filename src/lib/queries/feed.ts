import 'server-only'
import { db } from '@/db'
import { checkIns, challengeMembers } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'

/**
 * Phase 5 Plan 03 — Feed server query.
 *
 * Returns every check-in for the current challenge, newest first, joined
 * with the member's display name and avatar URL for the BeReal-style feed card.
 *
 * Pagination intentionally omitted per 05-CONTEXT.md FEED "Pagination" decision
 * — friend-group scale makes all-rows fine. Revisit with cursor pagination if volume grows.
 */

export interface FeedItem {
  id: string
  userId: string
  photoUrl: string
  createdAt: Date
  displayName: string
  avatarUrl: string | null
}

export async function getFeedItems(challengeId: string): Promise<FeedItem[]> {
  return db
    .select({
      id: checkIns.id,
      userId: checkIns.userId,
      photoUrl: checkIns.photoUrl,
      createdAt: checkIns.createdAt,
      displayName: challengeMembers.displayName,
      avatarUrl: challengeMembers.avatarUrl,
    })
    .from(checkIns)
    .innerJoin(
      challengeMembers,
      and(
        eq(challengeMembers.userId, checkIns.userId),
        eq(challengeMembers.challengeId, checkIns.challengeId)
      )
    )
    .where(eq(checkIns.challengeId, challengeId))
    .orderBy(desc(checkIns.createdAt))
}
