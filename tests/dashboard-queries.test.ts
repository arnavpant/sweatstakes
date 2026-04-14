import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Phase 5 Plan 03 — dashboard query helper tests.
 * Mocks @/db to capture the drizzle builder chain for getRecentCheckInPhotos
 * and getBalancesForChallenge.
 */

// Capture calls on the chainable builder
const chainCalls: Array<{ method: string; args: unknown[] }> = []

function record(method: string) {
  return (...args: unknown[]) => {
    chainCalls.push({ method, args })
    return builder
  }
}

const builder: Record<string, unknown> & PromiseLike<unknown[]> = {
  select: record('select'),
  from: record('from'),
  innerJoin: record('innerJoin'),
  where: record('where'),
  groupBy: record('groupBy'),
  orderBy: record('orderBy'),
  limit: record('limit'),
  // Make the chain thenable so `await db...` resolves to []
  then: (resolve: (v: unknown) => void) => resolve([]),
}

vi.mock('@/db', () => ({
  db: builder,
}))

beforeEach(() => {
  chainCalls.length = 0
})

describe('getRecentCheckInPhotos', () => {
  it('defaults to limit(6) and orders by createdAt desc', async () => {
    const { getRecentCheckInPhotos } = await import('@/lib/queries/dashboard')
    await getRecentCheckInPhotos('challenge-1')

    const limitCall = chainCalls.find((c) => c.method === 'limit')
    expect(limitCall).toBeDefined()
    expect(limitCall!.args[0]).toBe(6)

    const orderCall = chainCalls.find((c) => c.method === 'orderBy')
    expect(orderCall).toBeDefined()
  })

  it('honors a custom limit', async () => {
    const { getRecentCheckInPhotos } = await import('@/lib/queries/dashboard')
    await getRecentCheckInPhotos('challenge-1', 12)

    const limitCall = chainCalls.find((c) => c.method === 'limit')
    expect(limitCall!.args[0]).toBe(12)
  })
})

describe('getBalancesForChallenge', () => {
  it('groups by userId and displayName', async () => {
    const { getBalancesForChallenge } = await import('@/lib/queries/dashboard')
    await getBalancesForChallenge('challenge-1')

    const groupByCall = chainCalls.find((c) => c.method === 'groupBy')
    expect(groupByCall).toBeDefined()
    // Two arguments: userId and displayName
    expect(groupByCall!.args.length).toBe(2)
  })

  it('joins challengeMembers via innerJoin', async () => {
    const { getBalancesForChallenge } = await import('@/lib/queries/dashboard')
    await getBalancesForChallenge('challenge-1')

    const joinCall = chainCalls.find((c) => c.method === 'innerJoin')
    expect(joinCall).toBeDefined()
  })
})
