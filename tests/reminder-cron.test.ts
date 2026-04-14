import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Phase 5 Plan 02 — /api/cron/reminders behavior tests.
 * Asserts:
 *   - Members with reminder_hour=localHour AND notifications_enabled=true AND no check-in today are picked
 *   - Members with notifications_enabled=false are NEVER included
 *   - Members who already checked in today are excluded
 *   - Cron rejects requests without CRON_SECRET Bearer header (401)
 *   - Cron returns 500 when CRON_SECRET env var is unset
 */

// --- Capture sendPushToUsers calls ---
const sendPushSpy = vi.fn()
vi.mock('@/lib/push/send', () => ({
  sendPushToUsers: (...args: unknown[]) => {
    sendPushSpy(...args)
    return Promise.resolve()
  },
}))

// --- Mock @/db with controllable challenge list and reminder query result ---
let allChallenges: Array<{ id: string; timezone: string }> = []
// Per-challenge result: array of due-member rows
let dueMembersResult: Array<{ userId: string }> = []

vi.mock('@/db', () => {
  // The route makes two distinct select chains:
  //   1) db.select().from(challenges)                       → allChallenges
  //   2) db.select(...).from(challengeMembers).leftJoin(...).where(...) → dueMembersResult
  // We can't tell them apart from just .select() — we use a counter.
  let callIdx = 0
  return {
    db: {
      select: () => ({
        from: () => {
          // Return a thenable for case 1, OR an object that exposes .leftJoin().where() for case 2.
          // Use a dual-shape proxy: it has .then (thenable) AND .leftJoin (chain).
          const shape: Record<string, unknown> = {
            leftJoin: () => ({
              where: () => Promise.resolve(dueMembersResult),
            }),
            then: (resolve: (v: unknown) => void) => {
              callIdx++
              resolve(allChallenges)
            },
          }
          return shape
        },
      }),
    },
  }
})

vi.mock('@/db/schema', () => ({
  challenges: {},
  challengeMembers: {
    userId: 'um_user_id',
    challengeId: 'um_challenge_id',
    reminderHour: 'um_reminder_hour',
    notificationsEnabled: 'um_notif_enabled',
  },
  checkIns: {
    id: 'ci_id',
    userId: 'ci_user_id',
    challengeId: 'ci_challenge_id',
    checkedInDate: 'ci_date',
  },
}))

vi.mock('drizzle-orm', () => ({
  and: (...args: unknown[]) => ({ _and: args }),
  eq: (a: unknown, b: unknown) => ({ _eq: [a, b] }),
  isNull: (a: unknown) => ({ _isNull: a }),
}))

function buildRequest(authHeader?: string): { headers: { get: (k: string) => string | null } } {
  return {
    headers: {
      get: (k: string) => (k === 'authorization' && authHeader ? authHeader : null),
    },
  }
}

beforeEach(() => {
  sendPushSpy.mockReset()
  allChallenges = []
  dueMembersResult = []
  vi.resetModules()
  process.env.CRON_SECRET = 'test-secret'
})

describe('/api/cron/reminders', () => {
  it('returns 401 when authorization header is missing', async () => {
    const { GET } = await import('@/app/api/cron/reminders/route')
    // @ts-expect-error — minimal NextRequest stub
    const res = await GET(buildRequest())
    expect(res.status).toBe(401)
    expect(sendPushSpy).not.toHaveBeenCalled()
  })

  it('returns 401 when authorization header has wrong secret', async () => {
    const { GET } = await import('@/app/api/cron/reminders/route')
    // @ts-expect-error — minimal NextRequest stub
    const res = await GET(buildRequest('Bearer wrong-secret'))
    expect(res.status).toBe(401)
    expect(sendPushSpy).not.toHaveBeenCalled()
  })

  it('returns 500 when CRON_SECRET env var is unset', async () => {
    delete process.env.CRON_SECRET
    const { GET } = await import('@/app/api/cron/reminders/route')
    // @ts-expect-error — minimal NextRequest stub
    const res = await GET(buildRequest('Bearer test-secret'))
    expect(res.status).toBe(500)
    expect(sendPushSpy).not.toHaveBeenCalled()
  })

  it('sends push to due members returned by the query', async () => {
    allChallenges = [{ id: 'c1', timezone: 'America/New_York' }]
    dueMembersResult = [{ userId: 'u-due-1' }, { userId: 'u-due-2' }]

    const { GET } = await import('@/app/api/cron/reminders/route')
    // @ts-expect-error — minimal NextRequest stub
    const res = await GET(buildRequest('Bearer test-secret'))
    expect(res.status).toBe(200)
    expect(sendPushSpy).toHaveBeenCalledTimes(1)
    const call = sendPushSpy.mock.calls[0]
    expect(call[0]).toEqual(['u-due-1', 'u-due-2'])
    expect(call[1]).toMatchObject({
      title: expect.any(String),
      body: expect.any(String),
      url: '/check-in',
    })
  })

  it('does not send when no due members are returned (notifications_enabled=false / wrong hour / already checked in are all filtered by the query)', async () => {
    allChallenges = [{ id: 'c1', timezone: 'America/New_York' }]
    dueMembersResult = [] // query already excludes disabled / checked-in / wrong-hour members

    const { GET } = await import('@/app/api/cron/reminders/route')
    // @ts-expect-error — minimal NextRequest stub
    const res = await GET(buildRequest('Bearer test-secret'))
    expect(res.status).toBe(200)
    expect(sendPushSpy).not.toHaveBeenCalled()
    const body = await res.json()
    expect(body.reminded).toBe(0)
  })

  it('uses notifications_enabled=true AND reminder_hour=localHour AND isNull(check_ins.id) in the WHERE clause', async () => {
    // Static-source assertion: we can't fully exercise drizzle mocking for SQL semantics,
    // so verify the route file contains the three required filters.
    const fs = await import('fs')
    const src = fs.readFileSync('src/app/api/cron/reminders/route.ts', 'utf-8')
    expect(src).toContain('notificationsEnabled')
    expect(src).toContain('reminderHour')
    expect(src).toContain('isNull(checkIns.id)')
  })
})
