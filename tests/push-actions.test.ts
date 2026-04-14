import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Phase 5 Plan 02 — Push Server Actions tests.
 * Asserts:
 *   - subscribeUserPush: valid payload inserts (with onConflictDoUpdate); invalid payload returns { error }
 *   - unsubscribeUserPush: deletes all rows for the authenticated user
 *   - setNotificationsEnabled: updates challenge_members.notifications_enabled
 *   - setReminderHour: 0-23 persists; null clears; anything else rejected
 *   - All 4 return { error: 'Not authenticated' } when no session
 */

// --- Mock Supabase server client (controllable getUser resolution) ---
let currentUser: { id: string } | null = null
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: currentUser } }),
    },
  }),
}))

// --- Capture db calls ---
const insertValuesSpy = vi.fn()
const onConflictSetSpy = vi.fn()
const deleteWhereSpy = vi.fn()
const updateSetSpy = vi.fn()
const updateWhereSpy = vi.fn()

vi.mock('@/db', () => ({
  db: {
    insert: () => ({
      values: (v: unknown) => {
        insertValuesSpy(v)
        return {
          onConflictDoUpdate: (opts: unknown) => {
            onConflictSetSpy(opts)
            return Promise.resolve()
          },
        }
      },
    }),
    delete: () => ({
      where: (c: unknown) => {
        deleteWhereSpy(c)
        return Promise.resolve()
      },
    }),
    update: () => ({
      set: (v: unknown) => {
        updateSetSpy(v)
        return {
          where: (c: unknown) => {
            updateWhereSpy(c)
            return Promise.resolve()
          },
        }
      },
    }),
  },
}))

// --- Schema stub — push-actions only uses the table objects as column markers ---
vi.mock('@/db/schema', () => ({
  pushSubscriptions: {
    endpoint: 'endpoint_col',
    userId: 'user_id_col',
  },
  challengeMembers: {
    userId: 'user_id_col',
    notificationsEnabled: 'notif_enabled_col',
    reminderHour: 'reminder_hour_col',
  },
}))

// Reset state between tests
beforeEach(() => {
  currentUser = { id: 'user-1' }
  insertValuesSpy.mockReset()
  onConflictSetSpy.mockReset()
  deleteWhereSpy.mockReset()
  updateSetSpy.mockReset()
  updateWhereSpy.mockReset()
})

describe('subscribeUserPush', () => {
  it('inserts a row with onConflictDoUpdate on endpoint when payload is valid', async () => {
    const { subscribeUserPush } = await import('@/lib/actions/push')
    const result = await subscribeUserPush({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      p256dh: 'p256dh-key',
      auth: 'auth-secret',
    })

    expect(result).toEqual({ success: true })
    expect(insertValuesSpy).toHaveBeenCalledTimes(1)
    expect(insertValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
        p256dh: 'p256dh-key',
        auth: 'auth-secret',
      })
    )
    // Idempotent via onConflictDoUpdate (not DoNothing — re-subscribe should refresh keys)
    expect(onConflictSetSpy).toHaveBeenCalledTimes(1)
    const opts = onConflictSetSpy.mock.calls[0][0] as { target: unknown; set: Record<string, unknown> }
    expect(opts.set).toMatchObject({
      userId: 'user-1',
      p256dh: 'p256dh-key',
      auth: 'auth-secret',
    })
  })

  it('returns { error } when endpoint is missing/invalid', async () => {
    const { subscribeUserPush } = await import('@/lib/actions/push')
    const result = await subscribeUserPush({
      endpoint: 'not-a-url',
      p256dh: 'p',
      auth: 'a',
    })
    expect(result).toEqual({ error: 'Invalid subscription' })
    expect(insertValuesSpy).not.toHaveBeenCalled()
  })

  it('returns { error: Not authenticated } when user session is absent', async () => {
    currentUser = null
    const { subscribeUserPush } = await import('@/lib/actions/push')
    const result = await subscribeUserPush({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      p256dh: 'p',
      auth: 'a',
    })
    expect(result).toEqual({ error: 'Not authenticated' })
  })
})

describe('unsubscribeUserPush', () => {
  it('deletes push_subscriptions rows for the authenticated user', async () => {
    const { unsubscribeUserPush } = await import('@/lib/actions/push')
    const result = await unsubscribeUserPush()
    expect(result).toEqual({ success: true })
    expect(deleteWhereSpy).toHaveBeenCalledTimes(1)
  })

  it('returns { error: Not authenticated } when no session', async () => {
    currentUser = null
    const { unsubscribeUserPush } = await import('@/lib/actions/push')
    const result = await unsubscribeUserPush()
    expect(result).toEqual({ error: 'Not authenticated' })
    expect(deleteWhereSpy).not.toHaveBeenCalled()
  })
})

describe('setNotificationsEnabled', () => {
  it('updates challenge_members.notifications_enabled to true for the caller', async () => {
    const { setNotificationsEnabled } = await import('@/lib/actions/push')
    const result = await setNotificationsEnabled(true)
    expect(result).toEqual({ success: true })
    expect(updateSetSpy).toHaveBeenCalledWith({ notificationsEnabled: true })
    expect(updateWhereSpy).toHaveBeenCalledTimes(1)
  })

  it('updates to false as well', async () => {
    const { setNotificationsEnabled } = await import('@/lib/actions/push')
    const result = await setNotificationsEnabled(false)
    expect(result).toEqual({ success: true })
    expect(updateSetSpy).toHaveBeenCalledWith({ notificationsEnabled: false })
  })

  it('returns { error } when input is not a boolean', async () => {
    const { setNotificationsEnabled } = await import('@/lib/actions/push')
    // @ts-expect-error — deliberately invalid
    const result = await setNotificationsEnabled('yes')
    expect(result).toEqual({ error: 'Invalid input' })
    expect(updateSetSpy).not.toHaveBeenCalled()
  })

  it('returns { error: Not authenticated } when no session', async () => {
    currentUser = null
    const { setNotificationsEnabled } = await import('@/lib/actions/push')
    const result = await setNotificationsEnabled(true)
    expect(result).toEqual({ error: 'Not authenticated' })
  })
})

describe('setReminderHour', () => {
  it('accepts 0-23 and persists to challenge_members.reminder_hour', async () => {
    const { setReminderHour } = await import('@/lib/actions/push')
    const result = await setReminderHour(18)
    expect(result).toEqual({ success: true })
    expect(updateSetSpy).toHaveBeenCalledWith({ reminderHour: 18 })
  })

  it('accepts null (clears the column)', async () => {
    const { setReminderHour } = await import('@/lib/actions/push')
    const result = await setReminderHour(null)
    expect(result).toEqual({ success: true })
    expect(updateSetSpy).toHaveBeenCalledWith({ reminderHour: null })
  })

  it('rejects 24 (out of range)', async () => {
    const { setReminderHour } = await import('@/lib/actions/push')
    const result = await setReminderHour(24)
    expect(result).toEqual({ error: 'Invalid hour' })
    expect(updateSetSpy).not.toHaveBeenCalled()
  })

  it('rejects -1 (out of range)', async () => {
    const { setReminderHour } = await import('@/lib/actions/push')
    const result = await setReminderHour(-1)
    expect(result).toEqual({ error: 'Invalid hour' })
    expect(updateSetSpy).not.toHaveBeenCalled()
  })

  it('rejects non-integer (3.5)', async () => {
    const { setReminderHour } = await import('@/lib/actions/push')
    const result = await setReminderHour(3.5)
    expect(result).toEqual({ error: 'Invalid hour' })
    expect(updateSetSpy).not.toHaveBeenCalled()
  })

  it('returns { error: Not authenticated } when no session', async () => {
    currentUser = null
    const { setReminderHour } = await import('@/lib/actions/push')
    const result = await setReminderHour(12)
    expect(result).toEqual({ error: 'Not authenticated' })
  })
})
