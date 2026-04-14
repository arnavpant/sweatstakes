import 'server-only'
import webpush from 'web-push'
import { db } from '@/db'
import { pushSubscriptions } from '@/db/schema'
import { inArray, eq } from 'drizzle-orm'

/**
 * Phase 5 SETT-02 — Server-only push fan-out.
 * SERVER-ONLY: relies on VAPID_PRIVATE_KEY which must never reach the browser.
 * Mitigates T-05-01-01.
 */

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
const CONTACT = process.env.CONTACT_EMAIL || 'arnav@sweatstakes.app'

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(`mailto:${CONTACT}`, VAPID_PUBLIC, VAPID_PRIVATE)
}

export interface PushPayload {
  title: string
  body: string
  url?: string
}

/**
 * Fan out a push payload to every subscription owned by `userIds`.
 * - Fire-and-forget safe: never throws; uses Promise.allSettled internally.
 * - Self-cleans dead subscriptions: 404/410 from the push service deletes the row
 *   (mitigates T-05-01-04 — keeps the active subscription set bounded).
 * - No-op when VAPID keys are unset (local dev without keys still boots cleanly).
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<void> {
  if (userIds.length === 0) return
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.warn('[push] VAPID keys not configured — skipping send')
    return
  }

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(inArray(pushSubscriptions.userId, userIds))

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        const body = (err as { body?: unknown })?.body
        if (statusCode === 404 || statusCode === 410) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.endpoint, sub.endpoint))
        } else {
          console.error('[push] send failed', statusCode, body)
        }
      }
    })
  )
}
