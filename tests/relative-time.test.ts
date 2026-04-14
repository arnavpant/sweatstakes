import { describe, it, expect } from 'vitest'
import { formatRelative } from '@/lib/utils/relative-time'

/**
 * Phase 5 Plan 03 — formatRelative unit tests.
 * Uses Intl.RelativeTimeFormat('en', { numeric: 'auto' }) so "yesterday" is emitted
 * instead of "1 day ago" for -1 day. Tests inject `now` for determinism.
 */

describe('formatRelative', () => {
  const now = new Date('2026-04-13T12:00:00Z')

  it('returns an "ago" string for a diff under 60 seconds', () => {
    const d = new Date(now.getTime() - 10 * 1000) // 10s ago
    const out = formatRelative(d, now)
    // numeric: 'auto' emits "now" for diff 0, or "N seconds ago" for small diffs.
    // Accept either phrasing — just assert it's a short recent-sounding string.
    expect(out.toLowerCase()).toMatch(/now|second/)
  })

  it('returns a minutes string for ~2 minutes ago', () => {
    const d = new Date(now.getTime() - 2 * 60 * 1000)
    const out = formatRelative(d, now)
    expect(out.toLowerCase()).toContain('minute')
  })

  it('returns an hours string for ~3 hours ago', () => {
    const d = new Date(now.getTime() - 3 * 60 * 60 * 1000)
    const out = formatRelative(d, now)
    expect(out.toLowerCase()).toContain('hour')
  })

  it('returns "yesterday" for ~28 hours ago (numeric: auto)', () => {
    const d = new Date(now.getTime() - 28 * 60 * 60 * 1000)
    const out = formatRelative(d, now)
    expect(out.toLowerCase()).toContain('yesterday')
  })

  it('returns "5 days ago" for a 5-day old date', () => {
    const d = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
    const out = formatRelative(d, now)
    expect(out).toMatch(/5\s+days?\s+ago/)
  })

  it('accepts an ISO string and a Date, producing equivalent output', () => {
    const d = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    const fromDate = formatRelative(d, now)
    const fromString = formatRelative(d.toISOString(), now)
    expect(fromString).toBe(fromDate)
  })
})
