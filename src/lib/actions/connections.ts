'use server'

import { customAlphabet } from 'nanoid'
import { db } from '@/db'
import { challenges, challengeMembers, inviteLinks } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'
import { eq, and, isNull, gt } from 'drizzle-orm'

const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 32 chars, no ambiguous: 0/O, I/1
const INVITE_CODE_LENGTH = 8
const generateCode = customAlphabet(INVITE_CODE_ALPHABET, INVITE_CODE_LENGTH)

/**
 * Generate a one-time invite link for the user's challenge.
 * If the user has no challenge yet, one is created implicitly (D-11).
 * Link expires after 24 hours (D-03).
 */
export async function generateInviteLinkAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Find existing membership
  const existingMembership = await db
    .select({ challengeId: challengeMembers.challengeId })
    .from(challengeMembers)
    .where(eq(challengeMembers.userId, user.id))
    .limit(1)

  let challengeId: string

  if (existingMembership.length > 0) {
    challengeId = existingMembership[0].challengeId
  } else {
    // D-11: Implicit challenge creation — create challenge and add self as first member
    const [newChallenge] = await db.insert(challenges).values({}).returning()
    await db.insert(challengeMembers).values({
      challengeId: newChallenge.id,
      userId: user.id,
      displayName: user.user_metadata.full_name || user.email || 'Member',
      avatarUrl: user.user_metadata.avatar_url || null,
    })
    challengeId = newChallenge.id
  }

  // Generate unique 8-char code (D-02) with retry on collision (WR-01)
  // 24-hour expiry (D-03)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000'

  let attempts = 0
  while (attempts < 3) {
    const code = generateCode()
    try {
      await db.insert(inviteLinks).values({
        code,
        challengeId,
        createdBy: user.id,
        expiresAt,
      })
      return { url: `${siteUrl}/join/${code}` }
    } catch {
      attempts = attempts + 1
    }
  }
  return { error: 'Failed to generate invite link. Please try again.' }
}

/**
 * Join a challenge via invite code.
 * Atomically validates and consumes the one-time code (Pitfall 3 prevention).
 * Rejects if user is already in a challenge (D-14).
 */
export async function joinChallengeAction(code: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // D-14: Check if user is already in a challenge
  const existingMembership = await db
    .select({ challengeId: challengeMembers.challengeId })
    .from(challengeMembers)
    .where(eq(challengeMembers.userId, user.id))
    .limit(1)

  if (existingMembership.length > 0) {
    return { error: 'already_in_challenge' }
  }

  // Atomic validate-and-consume (Pitfall 3 — prevents race condition on one-time-use codes)
  // UPDATE ... WHERE code = ? AND used_at IS NULL AND expires_at > NOW() RETURNING
  const updated = await db
    .update(inviteLinks)
    .set({ usedAt: new Date() })
    .where(and(
      eq(inviteLinks.code, code),
      isNull(inviteLinks.usedAt),
      gt(inviteLinks.expiresAt, new Date())
    ))
    .returning()

  // D-09: Covers invalid, expired, and already-used codes
  if (updated.length === 0) {
    return { error: 'invalid_or_expired' }
  }

  // Insert new member into the challenge
  // Wrapped in try/catch to handle unique constraint violation (CR-01)
  // if a concurrent request already inserted this user
  try {
    await db.insert(challengeMembers).values({
      challengeId: updated[0].challengeId,
      userId: user.id,
      displayName: user.user_metadata.full_name || user.email || 'Member',
      avatarUrl: user.user_metadata.avatar_url || null,
    })
  } catch {
    // Unique constraint violation -- user already joined via concurrent request
    return { error: 'already_in_challenge' }
  }

  return { success: true }
}

/**
 * Leave the user's current challenge.
 * Per D-13: no special owner role — challenge continues as long as 1+ members remain.
 */
export async function leaveChallengeAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const deleted = await db
    .delete(challengeMembers)
    .where(eq(challengeMembers.userId, user.id))
    .returning()

  if (deleted.length === 0) {
    return { error: 'not_in_challenge' }
  }

  return { success: true }
}
