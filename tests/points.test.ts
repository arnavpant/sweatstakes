import { describe, it, expect } from 'vitest'
import { getTableName } from 'drizzle-orm'
import {
  computeSettlement,
  computePersonalBest,
  type MemberProgress,
} from '@/lib/utils/settlement'

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

describe('Settlement Logic (STAK-01, STAK-02, STAK-03)', () => {
  // Helper to create member progress
  function member(userId: string, checkedInCount: number, weeklyGoal: number): MemberProgress {
    return { userId, checkedInCount, weeklyGoal }
  }

  describe('computeSettlement', () => {
    it('3 hitters, 1 misser: misser gets -3, each hitter gets +1', () => {
      const members: MemberProgress[] = [
        member('a', 4, 3), // hit
        member('b', 5, 3), // hit
        member('c', 3, 3), // hit
        member('d', 1, 3), // miss
      ]

      const result = computeSettlement(members)

      expect(result.washRule).toBe(false)
      expect(result.hitters).toEqual(['a', 'b', 'c'])
      expect(result.missers).toEqual(['d'])
      expect(result.transactions).toHaveLength(4)

      // Each hitter earns +1 (1 misser)
      const hitterTxns = result.transactions.filter(t => t.reason === 'earned')
      expect(hitterTxns).toHaveLength(3)
      hitterTxns.forEach(t => expect(t.delta).toBe(1))

      // Misser owes -3 (3 hitters)
      const misserTxn = result.transactions.find(t => t.userId === 'd')
      expect(misserTxn).toBeDefined()
      expect(misserTxn!.delta).toBe(-3)
      expect(misserTxn!.reason).toBe('penalty')
    })

    it('0 hitters, 3 missers: wash rule applies, no transactions', () => {
      const members: MemberProgress[] = [
        member('a', 1, 3),
        member('b', 0, 3),
        member('c', 2, 3),
      ]

      const result = computeSettlement(members)

      expect(result.washRule).toBe(true)
      expect(result.hitters).toEqual([])
      expect(result.missers).toEqual(['a', 'b', 'c'])
      expect(result.transactions).toEqual([])
    })

    it('2 hitters, 0 missers: each hitter gets delta=0', () => {
      const members: MemberProgress[] = [
        member('a', 4, 3),
        member('b', 3, 3),
      ]

      const result = computeSettlement(members)

      expect(result.washRule).toBe(false)
      expect(result.hitters).toEqual(['a', 'b'])
      expect(result.missers).toEqual([])
      expect(result.transactions).toHaveLength(2)
      result.transactions.forEach(t => {
        expect(t.delta).toBe(0)
        expect(t.reason).toBe('earned')
      })
    })

    it('1 hitter, 1 misser: hitter gets +1, misser gets -1', () => {
      const members: MemberProgress[] = [
        member('a', 5, 4), // hit
        member('b', 2, 4), // miss
      ]

      const result = computeSettlement(members)

      expect(result.washRule).toBe(false)
      expect(result.hitters).toEqual(['a'])
      expect(result.missers).toEqual(['b'])

      const hitterTxn = result.transactions.find(t => t.userId === 'a')
      expect(hitterTxn!.delta).toBe(1)
      expect(hitterTxn!.reason).toBe('earned')

      const misserTxn = result.transactions.find(t => t.userId === 'b')
      expect(misserTxn!.delta).toBe(-1)
      expect(misserTxn!.reason).toBe('penalty')
    })

    it('empty members array: wash rule, no transactions', () => {
      const result = computeSettlement([])

      expect(result.washRule).toBe(true)
      expect(result.hitters).toEqual([])
      expect(result.missers).toEqual([])
      expect(result.transactions).toEqual([])
    })

    it('single member who hits: delta=0 (no missers)', () => {
      const members: MemberProgress[] = [
        member('solo', 5, 3),
      ]

      const result = computeSettlement(members)

      expect(result.washRule).toBe(false)
      expect(result.hitters).toEqual(['solo'])
      expect(result.missers).toEqual([])
      expect(result.transactions).toHaveLength(1)
      expect(result.transactions[0].delta).toBe(0)
      expect(result.transactions[0].reason).toBe('earned')
    })

    it('single member who misses: wash rule (all missed)', () => {
      const members: MemberProgress[] = [
        member('solo', 1, 3),
      ]

      const result = computeSettlement(members)

      expect(result.washRule).toBe(true)
      expect(result.hitters).toEqual([])
      expect(result.missers).toEqual(['solo'])
      expect(result.transactions).toEqual([])
    })
  })

  describe('computePersonalBest', () => {
    it('mixed results [true,true,false,true,true,true,false,true] returns 3', () => {
      const results = [true, true, false, true, true, true, false, true]
      expect(computePersonalBest(results)).toBe(3)
    })

    it('all false returns 0', () => {
      expect(computePersonalBest([false, false, false])).toBe(0)
    })

    it('all true returns length of array', () => {
      const results = [true, true, true, true, true]
      expect(computePersonalBest(results)).toBe(5)
    })

    it('empty array returns 0', () => {
      expect(computePersonalBest([])).toBe(0)
    })
  })
})
