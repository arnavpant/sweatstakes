'use server'

import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { pushSubscriptions, challengeMembers } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'

/**
 * Phase 5 SETT-02 — Push subscription + preferences Server Actions.
 *
 * Called from Settings UI client components:
 *   - subscribeUserPush: persists a PushSubscription after pushManager.subscribe
 *   - unsubscribeUserPush: wipes all subscriptions for the caller (cross-device sign-out)
 *   - setNotificationsEnabled: toggles the master gate (default false per CONTEXT.md)
 *   - setReminderHour: sets the hourly bucket for the daily reminder cron
 *
 * Threat mitigations:
 *   T-05-02-02: zod validates subscription payload shape
 *   T-05-02-06: userId is always taken from session, never from client input
 *   T-05-02-07: endpoint uniqueness at DB means forged endpoints dedupe harmlessly
 */

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
})

export async function subscribeUserPush(input: { endpoint: string; p256dh: string; auth: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }

  const parsed = subscribeSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid subscription' as const }

  // Dedupe by endpoint (unique constraint). If endpoint already exists, refresh
  // user_id + keys — the same device re-subscribing with new keys, or a shared
  // browser install now owned by a different signed-in user.
  await db.insert(pushSubscriptions)
    .values({
      userId: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.p256dh,
      auth: parsed.data.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId: user.id,
        p256dh: parsed.data.p256dh,
        auth: parsed.data.auth,
      },
    })

  return { success: true as const }
}

export async function unsubscribeUserPush() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }

  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, user.id))
  return { success: true as const }
}

export async function setNotificationsEnabled(enabled: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }
  if (typeof enabled !== 'boolean') return { error: 'Invalid input' as const }

  await db.update(challengeMembers)
    .set({ notificationsEnabled: enabled })
    .where(eq(challengeMembers.userId, user.id))

  return { success: true as const }
}

const hourSchema = z.number().int().min(0).max(23).nullable()

export async function setReminderHour(hour: number | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }

  const parsed = hourSchema.safeParse(hour)
  if (!parsed.success) return { error: 'Invalid hour' as const }

  await db.update(challengeMembers)
    .set({ reminderHour: parsed.data })
    .where(eq(challengeMembers.userId, user.id))

  return { success: true as const }
}
