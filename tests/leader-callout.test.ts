import { describe, it, expect } from 'vitest'
import { computeLeaderCallout, type LeaderCalloutInput } from '@/lib/utils/leader-callout'

/**
 * Phase 5 Plan 03 — DASH-01 leader callout unit tests (viewer-POV).
 */

function b(userId: string, displayName: string, balance: number): LeaderCalloutInput {
  return { userId, displayName, balance }
}

describe('computeLeaderCallout', () => {
  it('empty array → "No stakes settled yet — keep checking in"', () => {
    expect(computeLeaderCallout([], 'viewer')).toBe(
      'No stakes settled yet — keep checking in'
    )
  })

  it('all balances zero → "No stakes settled yet — keep checking in"', () => {
    const balances = [b('a', 'Alice', 0), b('m', 'Max', 0)]
    expect(computeLeaderCallout(balances, 'm')).toBe(
      'No stakes settled yet — keep checking in'
    )
  })

  it('viewer is sole leader (no runner-up with different balance) → "You lead with N pts"', () => {
    const balances = [b('a', 'Alice', 12)]
    expect(computeLeaderCallout(balances, 'a')).toBe('You lead with 12 pts')
  })

  it('viewer leading with gap → "You lead with 12 pts — 3 ahead of Max"', () => {
    const balances = [b('arnav', 'Arnav', 12), b('max', 'Max', 9)]
    expect(computeLeaderCallout(balances, 'arnav')).toBe(
      'You lead with 12 pts — 3 ahead of Max'
    )
  })

  it('viewer not leading, only one person ahead → "You\'re 3 behind Arnav"', () => {
    const balances = [b('arnav', 'Arnav', 12), b('max', 'Max', 9)]
    expect(computeLeaderCallout(balances, 'max')).toBe(
      "You're 3 behind Arnav"
    )
  })

  it('viewer not leading, runner-up present → adds "— closest: Sara at 5 pts"', () => {
    const balances = [
      b('arnav', 'Arnav', 12),
      b('max', 'Max', 9),
      b('sara', 'Sara', 5),
    ]
    expect(computeLeaderCallout(balances, 'sara')).toBe(
      "You're 7 behind Arnav — closest: Max at 9 pts"
    )
  })

  it('viewer tied with one leader → "You and Arnav tied at 10 pts"', () => {
    const balances = [b('arnav', 'Arnav', 10), b('max', 'Max', 10)]
    expect(computeLeaderCallout(balances, 'max')).toBe(
      'You and Arnav tied at 10 pts'
    )
  })

  it('viewer at bottom with negative balances → "You\'re 5 behind Arnav"', () => {
    const balances = [b('arnav', 'Arnav', -3), b('max', 'Max', -8)]
    expect(computeLeaderCallout(balances, 'max')).toBe(
      "You're 5 behind Arnav"
    )
  })
})
