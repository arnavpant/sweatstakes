import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Phase 5 Plan 01 — sendPushToUsers behavior tests.
 * Asserts:
 *   - 410 Gone deletes the dead subscription row
 *   - Successful send leaves the row alone
 *   - Non-410 errors are caught (sendPushToUsers never rejects)
 */

// Note: 'server-only' is aliased to tests/stubs/server-only.ts in vitest.config.mts.

// --- Mock web-push (default export only — sendNotification + setVapidDetails) ---
const sendNotification = vi.fn()
const setVapidDetails = vi.fn()
vi.mock('web-push', () => ({
  default: {
    sendNotification: (...args: unknown[]) => sendNotification(...args),
    setVapidDetails: (...args: unknown[]) => setVapidDetails(...args),
  },
}))

// --- Mock @/db with a controllable select / delete chain ---
let seededSubs: Array<{ id: string; userId: string; endpoint: string; p256dh: string; auth: string }> = []
const deleteWhereSpy = vi.fn()

vi.mock('@/db', () => {
  return {
    db: {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve(seededSubs),
        }),
      }),
      delete: () => ({
        where: (cond: unknown) => {
          deleteWhereSpy(cond)
          return Promise.resolve()
        },
      }),
    },
  }
})

// --- Stub schema so eq/inArray imports work ---
vi.mock('@/db/schema', () => ({
  pushSubscriptions: {
    userId: 'user_id_col',
    endpoint: 'endpoint_col',
  },
}))

// --- Provide VAPID env so sendPushToUsers proceeds past the no-op guard ---
beforeEach(() => {
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BPublicKey'
  process.env.VAPID_PRIVATE_KEY = 'PrivKey'
  sendNotification.mockReset()
  setVapidDetails.mockReset()
  deleteWhereSpy.mockReset()
  seededSubs = []
})

describe('sendPushToUsers', () => {
  it('deletes the row when the push service returns 410 Gone', async () => {
    seededSubs = [
      { id: 'sub1', userId: 'u1', endpoint: 'https://fcm.example/dead', p256dh: 'p', auth: 'a' },
    ]
    sendNotification.mockRejectedValueOnce({ statusCode: 410, body: 'gone' })

    const { sendPushToUsers } = await import('@/lib/push/send')
    await sendPushToUsers(['u1'], { title: 't', body: 'b' })

    expect(deleteWhereSpy).toHaveBeenCalledTimes(1)
  })

  it('also deletes on 404 Not Found', async () => {
    seededSubs = [
      { id: 'sub1', userId: 'u1', endpoint: 'https://fcm.example/missing', p256dh: 'p', auth: 'a' },
    ]
    sendNotification.mockRejectedValueOnce({ statusCode: 404, body: 'not found' })

    const { sendPushToUsers } = await import('@/lib/push/send')
    await sendPushToUsers(['u1'], { title: 't', body: 'b' })

    expect(deleteWhereSpy).toHaveBeenCalledTimes(1)
  })

  it('does not delete the row on a successful send', async () => {
    seededSubs = [
      { id: 'sub1', userId: 'u1', endpoint: 'https://fcm.example/live', p256dh: 'p', auth: 'a' },
    ]
    sendNotification.mockResolvedValueOnce({ statusCode: 201 })

    const { sendPushToUsers } = await import('@/lib/push/send')
    await sendPushToUsers(['u1'], { title: 't', body: 'b' })

    expect(deleteWhereSpy).not.toHaveBeenCalled()
  })

  it('swallows non-410/404 errors (does not reject)', async () => {
    seededSubs = [
      { id: 'sub1', userId: 'u1', endpoint: 'https://fcm.example/err', p256dh: 'p', auth: 'a' },
    ]
    sendNotification.mockRejectedValueOnce({ statusCode: 500, body: 'server error' })

    const { sendPushToUsers } = await import('@/lib/push/send')
    await expect(
      sendPushToUsers(['u1'], { title: 't', body: 'b' })
    ).resolves.toBeUndefined()
    expect(deleteWhereSpy).not.toHaveBeenCalled()
  })

  it('no-ops when userIds is empty', async () => {
    const { sendPushToUsers } = await import('@/lib/push/send')
    await sendPushToUsers([], { title: 't', body: 'b' })
    expect(sendNotification).not.toHaveBeenCalled()
  })
})
