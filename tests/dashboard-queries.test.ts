import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Phase 5 Plan 03 — dashboard query helper tests.
 * Mocks @/db to capture the drizzle builder chain for getRecentCheckInPhotos.
 */

// Capture calls on the chainable builder
const chainCalls: Array<{ method: string; args: unknown[] }> = []

function record(method: string) {
  return (...args: unknown[]) => {
    chainCalls.push({ method, args })
    return builder
  }
}

// Chainable builder that is also thenable — resolves to [] when awaited.
// Typed as `any` to satisfy the varying drizzle method signatures at test time.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const builder: any = {
  select: record('select'),
  from: record('from'),
  innerJoin: record('innerJoin'),
  where: record('where'),
  groupBy: record('groupBy'),
  orderBy: record('orderBy'),
  limit: record('limit'),
  then: (resolve: (v: unknown[]) => void) => resolve([]),
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
