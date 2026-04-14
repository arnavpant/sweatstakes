'use server'

import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { challengeMembers } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Phase 5 SETT-03 — Profile editing Server Actions.
 *
 * updateDisplayNameAction writes to BOTH layers:
 *   1. challenge_members.display_name (drizzle) — read by Dashboard + Feed
 *   2. auth.users.user_metadata.full_name (admin API) — read by future surfaces
 * Existing user_metadata keys (avatar_url, etc.) are preserved via spread.
 *
 * updateAvatarUrlAction stores the public Storage URL with a ?v=<timestamp>
 * cache-bust so other members see new photos without waiting for CDN TTL.
 *
 * Threat mitigations:
 *   T-05-04-03: URL must start with NEXT_PUBLIC_SUPABASE_URL (SSRF/open-redirect defense)
 *   T-05-04-05: spread user_metadata before overwriting full_name
 */

const nameSchema = z
  .string()
  .transform(s => s.trim())
  .pipe(z.string().min(1, 'Name cannot be empty').max(40, 'Name must be 40 characters or less'))

export async function updateDisplayNameAction(rawName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }

  const parsed = nameSchema.safeParse(rawName)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Layer 1: challenge_members.display_name
  await db.update(challengeMembers)
    .set({ displayName: parsed.data })
    .where(eq(challengeMembers.userId, user.id))

  // Layer 2: auth.users.user_metadata — preserve existing keys (avatar_url, etc.)
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...(user.user_metadata ?? {}), full_name: parsed.data },
  })
  if (error) {
    // Dashboard/Feed is authoritative; don't roll back layer 1.
    console.error('[profile] admin updateUserById failed', error)
  }

  return { success: true as const }
}

export async function updateAvatarUrlAction(url: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }

  const urlParsed = z.string().url().safeParse(url)
  if (!urlParsed.success) return { error: 'Invalid URL' as const }

  // SSRF/open-redirect defense: must be our own Supabase bucket URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || !url.startsWith(supabaseUrl)) {
    return { error: 'Invalid URL' as const }
  }

  // Cache-bust so the new avatar shows up immediately for everyone
  const busted = `${url}?v=${Date.now()}`

  await db.update(challengeMembers)
    .set({ avatarUrl: busted })
    .where(eq(challengeMembers.userId, user.id))

  return { success: true as const }
}
