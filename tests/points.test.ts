import { describe, it, expect } from 'vitest'
import { getTableName } from 'drizzle-orm'

/**
 * Phase 4 Plan 01: Points Economy Schema & Settlement Logic
 * Requirements: STAK-01, STAK-02, STAK-03
 */

describe('Schema Static Assertions', () => {
  it('exports settledWeeks table', async () => {
    const schema = await import('@/db/schema')
    expect(schema.settledWeeks).toBeDefined()
    expect(getTableName(schema.settledWeeks)).toBe('settled_weeks')
  })

  it('exports pointTransactions table', async () => {
    const schema = await import('@/db/schema')
    expect(schema.pointTransactions).toBeDefined()
    expect(getTableName(schema.pointTransactions)).toBe('point_transactions')
  })

  it('exports rewards table', async () => {
    const schema = await import('@/db/schema')
    expect(schema.rewards).toBeDefined()
    expect(getTableName(schema.rewards)).toBe('rewards')
  })

  it('exports redemptions table', async () => {
    const schema = await import('@/db/schema')
    expect(schema.redemptions).toBeDefined()
    expect(getTableName(schema.redemptions)).toBe('redemptions')
  })

  it('challenges table has timezone column', async () => {
    const schema = await import('@/db/schema')
    expect(schema.challenges.timezone).toBeDefined()
  })

  it('challenges table has settlementHour column', async () => {
    const schema = await import('@/db/schema')
    expect(schema.challenges.settlementHour).toBeDefined()
  })
})
