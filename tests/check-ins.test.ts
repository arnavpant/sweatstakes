import { describe, it, expect } from 'vitest'
import fs from 'fs'
import { getMonday, getSunday, getWeekBounds } from '../src/lib/utils/week'

// ============================================================
// Phase 3 Plan 01: Check-ins Data Layer
// Comprehensive tests covering CHKN-01 through CHKN-05
// ============================================================

// ============================================================
// 1. Schema: check-ins table (CHKN-01, CHKN-02)
// ============================================================

describe('Schema: check-ins table (CHKN-01, CHKN-02)', () => {
  const schemaPath = 'src/db/schema.ts'

  it('schema exports checkIns table', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8')
    expect(content).toContain('export const checkIns')
    expect(content).toContain("pgTable('check_ins'")
  })

  it('checkIns has id column with uuid primaryKey', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8')
    expect(content).toMatch(/id:\s*uuid\('id'\)\.primaryKey\(\)\.defaultRandom\(\)/)
  })

  it('checkIns has userId column (uuid, notNull)', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8')
    expect(content).toContain("userId: uuid('user_id').notNull()")
  })

  it('checkIns has challengeId with FK to challenges (cascade)', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8')
    expect(content).toMatch(/challengeId:\s*uuid\('challenge_id'\)\.notNull\(\)\.references\(\(\)\s*=>\s*challenges\.id/)
  })

  it('checkIns has photoUrl column (text, notNull) - CHKN-02', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8')
    expect(content).toContain("photoUrl: text('photo_url').notNull()")
  })

  it('checkIns has checkedInDate column (date, mode: string)', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8')
    expect(content).toMatch(/checkedInDate:\s*date\('checked_in_date'/)
    expect(content).toContain("mode: 'string'")
  })

  it('checkIns has createdAt column (timestamp, withTimezone)', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8')
    const checkInsSection = content.slice(content.indexOf("pgTable('check_ins'"))
    expect(checkInsSection).toContain('withTimezone: true')
    expect(checkInsSection).toContain("timestamp('created_at'")
  })

  it('checkIns has check_ins_user_date_idx composite index', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8')
    expect(content).toContain('check_ins_user_date_idx')
    // Verify it's on userId and checkedInDate
    expect(content).toMatch(/index\('check_ins_user_date_idx'\)\.on\(t\.userId,\s*t\.checkedInDate\)/)
  })

  it('checkIns has check_ins_challenge_idx composite index', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8')
    expect(content).toContain('check_ins_challenge_idx')
    // Verify it's on challengeId and createdAt
    expect(content).toMatch(/index\('check_ins_challenge_idx'\)\.on\(t\.challengeId,\s*t\.createdAt\)/)
  })

  it('checkIns has onDelete cascade on challengeId FK', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8')
    // There should be at least 3 cascade deletes now (challengeMembers, inviteLinks, checkIns)
    const cascadeMatches = content.match(/onDelete: 'cascade'/g)
    expect(cascadeMatches).not.toBeNull()
    expect(cascadeMatches!.length).toBeGreaterThanOrEqual(3)
  })

  it('challengeMembers has weeklyGoal column with smallint, notNull, default(3) - CHKN-03', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8')
    expect(content).toContain('weeklyGoal')
    expect(content).toMatch(/smallint\('weekly_goal'\)\.notNull\(\)\.default\(3\)/)
  })

  it('schema imports smallint, date, and index from drizzle-orm/pg-core', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8')
    expect(content).toContain('smallint')
    expect(content).toContain('date')
    expect(content).toContain('index')
    expect(content).toContain("from 'drizzle-orm/pg-core'")
  })
})

// ============================================================
// 2. Server Actions: check-in mutations (CHKN-01, CHKN-03)
// ============================================================

describe('Server Actions: check-in mutations (CHKN-01, CHKN-03)', () => {
  const actionsPath = 'src/lib/actions/check-ins.ts'

  it('check-ins.ts file exists', () => {
    expect(fs.existsSync(actionsPath)).toBe(true)
  })

  it('file has use server directive at the top', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content.trimStart().startsWith("'use server'")).toBe(true)
  })

  it('exports submitCheckInAction function', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('export async function submitCheckInAction')
  })

  it('exports updateWeeklyGoalAction function', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('export async function updateWeeklyGoalAction')
  })

  it('submitCheckInAction accepts photoUrl and checkedInDate parameters', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toMatch(/submitCheckInAction\(photoUrl:\s*string,\s*checkedInDate:\s*string\)/)
  })

  it('updateWeeklyGoalAction accepts goal parameter', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toMatch(/updateWeeklyGoalAction\(goal:\s*number\)/)
  })

  it('submitCheckInAction has auth gate via supabase.auth.getUser() - T-03-01', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('supabase.auth.getUser()')
    expect(content).toContain("'Not authenticated'")
  })

  it('submitCheckInAction validates photoUrl with Zod z.string().url() - T-03-02', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('z.string().url()')
    expect(content).toContain("'Invalid photo URL'")
  })

  it('submitCheckInAction optionally validates photoUrl starts with Supabase URL', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL')
    expect(content).toContain('startsWith')
  })

  it('submitCheckInAction validates checkedInDate format with regex - T-03-03', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain("'Invalid date'")
    // Regex for YYYY-MM-DD
    expect(content).toMatch(/\\d\{4\}-\\d\{2\}-\\d\{2\}/)
  })

  it('submitCheckInAction rejects future dates and dates > 1 day in past', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('parsedDate > today')
    expect(content).toContain('parsedDate < yesterday')
  })

  it('submitCheckInAction checks challenge membership before inserting - T-03-05', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('challengeMembers')
    expect(content).toContain("'Not in a challenge'")
  })

  it('submitCheckInAction inserts into checkIns table', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('db.insert(checkIns)')
  })

  it('submitCheckInAction uses userId from auth, not from client input - T-03-01', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    // userId should come from user.id, not a parameter
    expect(content).toContain('userId: user.id')
  })

  it('submitCheckInAction returns { success: true } on success', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('{ success: true }')
  })

  it('updateWeeklyGoalAction validates goal with z.number().int().min(1).max(7) - T-03-04', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('z.number().int().min(1).max(7)')
  })

  it('updateWeeklyGoalAction returns error message for invalid goal', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain("'Goal must be between 1 and 7'")
  })

  it('updateWeeklyGoalAction updates challengeMembers.weeklyGoal', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('set({ weeklyGoal: goal })')
  })

  it('both actions call supabase.auth.getUser() for auth check', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    const getUserMatches = content.match(/supabase\.auth\.getUser\(\)/g)
    expect(getUserMatches).not.toBeNull()
    expect(getUserMatches!.length).toBeGreaterThanOrEqual(2)
  })

  it('imports db from @/db', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain("from '@/db'")
  })

  it('imports checkIns and challengeMembers from @/db/schema', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('checkIns')
    expect(content).toContain('challengeMembers')
    expect(content).toContain("from '@/db/schema'")
  })

  it('imports createClient from @/lib/supabase/server', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain("from '@/lib/supabase/server'")
  })

  it('does NOT contain delete functionality (D-18: check-ins are permanent)', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).not.toContain('deleteCheckIn')
    expect(content).not.toContain('db.delete(checkIns)')
  })

  it('returns generic error strings, never exposes SQL errors - T-03-07', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    // Should not contain raw SQL error exposure
    expect(content).not.toContain('throw')
    expect(content).not.toContain('stack')
  })
})

// ============================================================
// 3. Week utilities (CHKN-04, CHKN-05)
// ============================================================

describe('Week utilities: file structure (CHKN-04, CHKN-05)', () => {
  it('week.ts file exists', () => {
    expect(fs.existsSync('src/lib/utils/week.ts')).toBe(true)
  })

  it('exports getMonday function', () => {
    const content = fs.readFileSync('src/lib/utils/week.ts', 'utf-8')
    expect(content).toContain('export function getMonday')
  })

  it('exports getSunday function', () => {
    const content = fs.readFileSync('src/lib/utils/week.ts', 'utf-8')
    expect(content).toContain('export function getSunday')
  })

  it('exports getWeekBounds function', () => {
    const content = fs.readFileSync('src/lib/utils/week.ts', 'utf-8')
    expect(content).toContain('export function getWeekBounds')
  })

  it('exports getWeeklyProgress async function', () => {
    const content = fs.readFileSync('src/lib/utils/week.ts', 'utf-8')
    expect(content).toContain('export async function getWeeklyProgress')
  })

  it('exports computeStreak async function', () => {
    const content = fs.readFileSync('src/lib/utils/week.ts', 'utf-8')
    expect(content).toContain('export async function computeStreak')
  })

  it('getWeeklyProgress deduplicates check-in days (D-17)', () => {
    const content = fs.readFileSync('src/lib/utils/week.ts', 'utf-8')
    expect(content).toContain('new Set')
    expect(content).toContain('uniqueDays')
  })

  it('computeStreak starts from previous week, never current week (D-16)', () => {
    const content = fs.readFileSync('src/lib/utils/week.ts', 'utf-8')
    expect(content).toContain('previousMonday')
    expect(content).toContain('setDate(previousMonday.getDate() - 7)')
  })

  it('computeStreak limits backward search to 52 weeks', () => {
    const content = fs.readFileSync('src/lib/utils/week.ts', 'utf-8')
    expect(content).toContain('i < 52')
  })

  it('computeStreak breaks on first missed week (D-15)', () => {
    const content = fs.readFileSync('src/lib/utils/week.ts', 'utf-8')
    expect(content).toContain('break')
  })
})

describe('Week utilities: getMonday logic (CHKN-04)', () => {
  it('getMonday for a Monday returns that same Monday', () => {
    // April 13, 2026 is a Monday
    const monday = getMonday(new Date('2026-04-13T12:00:00'))
    expect(monday.getDay()).toBe(1) // Monday
    expect(monday.getDate()).toBe(13)
    expect(monday.getMonth()).toBe(3) // April (0-indexed)
    expect(monday.getFullYear()).toBe(2026)
    expect(monday.getHours()).toBe(0)
    expect(monday.getMinutes()).toBe(0)
    expect(monday.getSeconds()).toBe(0)
  })

  it('getMonday for a Wednesday returns the previous Monday', () => {
    // April 15, 2026 is a Wednesday
    const monday = getMonday(new Date('2026-04-15T12:00:00'))
    expect(monday.getDay()).toBe(1) // Monday
    expect(monday.getDate()).toBe(13)
    expect(monday.getMonth()).toBe(3)
  })

  it('getMonday for a Sunday returns the previous Monday (Mon-Sun week per D-13)', () => {
    // April 19, 2026 is a Sunday
    const monday = getMonday(new Date('2026-04-19T12:00:00'))
    expect(monday.getDay()).toBe(1) // Monday
    expect(monday.getDate()).toBe(13)
    expect(monday.getMonth()).toBe(3)
  })

  it('getMonday for a Saturday returns the previous Monday', () => {
    // April 18, 2026 is a Saturday
    const monday = getMonday(new Date('2026-04-18T12:00:00'))
    expect(monday.getDay()).toBe(1)
    expect(monday.getDate()).toBe(13)
  })

  it('getMonday for a Tuesday returns the previous Monday', () => {
    // April 14, 2026 is a Tuesday
    const monday = getMonday(new Date('2026-04-14T12:00:00'))
    expect(monday.getDay()).toBe(1)
    expect(monday.getDate()).toBe(13)
  })

  it('getMonday for a Friday returns the previous Monday', () => {
    // April 17, 2026 is a Friday
    const monday = getMonday(new Date('2026-04-17T12:00:00'))
    expect(monday.getDay()).toBe(1)
    expect(monday.getDate()).toBe(13)
  })

  it('getMonday zeroes out the time component', () => {
    const monday = getMonday(new Date('2026-04-15T14:30:45'))
    expect(monday.getHours()).toBe(0)
    expect(monday.getMinutes()).toBe(0)
    expect(monday.getSeconds()).toBe(0)
    expect(monday.getMilliseconds()).toBe(0)
  })
})

describe('Week utilities: getSunday logic (CHKN-04)', () => {
  it('getSunday for a Monday returns the following Sunday', () => {
    // April 13, 2026 is a Monday -> Sunday is April 19
    const sunday = getSunday(new Date('2026-04-13T12:00:00'))
    expect(sunday.getDay()).toBe(0) // Sunday
    expect(sunday.getDate()).toBe(19)
    expect(sunday.getMonth()).toBe(3)
    expect(sunday.getFullYear()).toBe(2026)
  })

  it('getSunday returns 23:59:59.999', () => {
    const sunday = getSunday(new Date('2026-04-13T12:00:00'))
    expect(sunday.getHours()).toBe(23)
    expect(sunday.getMinutes()).toBe(59)
    expect(sunday.getSeconds()).toBe(59)
    expect(sunday.getMilliseconds()).toBe(999)
  })

  it('getSunday for a Sunday returns that same Sunday', () => {
    // April 19, 2026 is a Sunday
    const sunday = getSunday(new Date('2026-04-19T12:00:00'))
    expect(sunday.getDay()).toBe(0)
    expect(sunday.getDate()).toBe(19)
  })

  it('getSunday for a Wednesday returns the end of the same week', () => {
    // April 15 (Wed) -> Sunday April 19
    const sunday = getSunday(new Date('2026-04-15T12:00:00'))
    expect(sunday.getDate()).toBe(19)
  })
})

describe('Week utilities: getWeekBounds logic (CHKN-04)', () => {
  it('getWeekBounds returns { start, end } as YYYY-MM-DD strings', () => {
    const bounds = getWeekBounds(new Date('2026-04-15T12:00:00'))
    expect(bounds.start).toBe('2026-04-13')
    expect(bounds.end).toBe('2026-04-19')
  })

  it('getWeekBounds for a Sunday returns the containing Mon-Sun week', () => {
    // Sunday April 19 belongs to Mon April 13 - Sun April 19 week
    const bounds = getWeekBounds(new Date('2026-04-19T12:00:00'))
    expect(bounds.start).toBe('2026-04-13')
    expect(bounds.end).toBe('2026-04-19')
  })

  it('getWeekBounds for a Monday returns that week', () => {
    const bounds = getWeekBounds(new Date('2026-04-13T12:00:00'))
    expect(bounds.start).toBe('2026-04-13')
    expect(bounds.end).toBe('2026-04-19')
  })

  it('getWeekBounds handles month boundary crossing', () => {
    // April 27, 2026 is a Monday. Sunday is May 3.
    const bounds = getWeekBounds(new Date('2026-04-29T12:00:00'))
    expect(bounds.start).toBe('2026-04-27')
    expect(bounds.end).toBe('2026-05-03')
  })

  it('getWeekBounds handles year boundary crossing', () => {
    // Dec 29, 2025 is a Monday. Sunday is Jan 4, 2026.
    const bounds = getWeekBounds(new Date('2025-12-31T12:00:00'))
    expect(bounds.start).toBe('2025-12-29')
    expect(bounds.end).toBe('2026-01-04')
  })
})

// ============================================================
// 4. Component stubs (CHKN-01, CHKN-04, CHKN-05)
// ============================================================

describe('Component stubs: future plans (CHKN-01, CHKN-04, CHKN-05)', () => {
  it.skip('camera-view.tsx will be created in Plan 02 (CHKN-01)', () => {
    // Plan 02 will create src/components/check-in/camera-view.tsx
    expect(fs.existsSync('src/components/check-in/camera-view.tsx')).toBe(true)
  })

  it.skip('day-dots.tsx will be created in Plan 03 (CHKN-04)', () => {
    // Plan 03 will create src/components/dashboard/day-dots.tsx
    expect(fs.existsSync('src/components/dashboard/day-dots.tsx')).toBe(true)
  })

  it.skip('streak-counter.tsx will be created in Plan 03 (CHKN-05)', () => {
    // Plan 03 will create src/components/dashboard/streak-counter.tsx
    expect(fs.existsSync('src/components/dashboard/streak-counter.tsx')).toBe(true)
  })

  it.skip('goal-stepper.tsx will be created in Plan 03 (CHKN-03)', () => {
    // Plan 03 will create src/components/settings/goal-stepper.tsx
    expect(fs.existsSync('src/components/settings/goal-stepper.tsx')).toBe(true)
  })

  it('camera-view.tsx does NOT exist yet (planned for Plan 02)', () => {
    expect(fs.existsSync('src/components/check-in/camera-view.tsx')).toBe(false)
  })

  it('day-dots.tsx does NOT exist yet (planned for Plan 03)', () => {
    expect(fs.existsSync('src/components/dashboard/day-dots.tsx')).toBe(false)
  })

  it('streak-counter.tsx does NOT exist yet (planned for Plan 03)', () => {
    expect(fs.existsSync('src/components/dashboard/streak-counter.tsx')).toBe(false)
  })

  it('goal-stepper.tsx does NOT exist yet (planned for Plan 03)', () => {
    expect(fs.existsSync('src/components/settings/goal-stepper.tsx')).toBe(false)
  })
})
