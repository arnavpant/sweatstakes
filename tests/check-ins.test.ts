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
    expect(content).toMatch(/submitCheckInAction\(\s*photoUrl:\s*string,\s*checkedInDate:\s*string/)
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
// 4. Camera & Upload Components (CHKN-01, CHKN-02) - Plan 02
// ============================================================

describe('Camera & Upload Components (CHKN-01, CHKN-02)', () => {
  it('camera-view.tsx exists and is a client component', () => {
    const path = 'src/components/check-in/camera-view.tsx'
    expect(fs.existsSync(path)).toBe(true)
    const content = fs.readFileSync(path, 'utf-8')
    expect(content.trimStart().startsWith("'use client'")).toBe(true)
  })

  it('camera-view.tsx uses getUserMedia', () => {
    const content = fs.readFileSync('src/components/check-in/camera-view.tsx', 'utf-8')
    expect(content).toContain('getUserMedia')
  })

  it('camera-view.tsx handles both facingMode environment and user', () => {
    const content = fs.readFileSync('src/components/check-in/camera-view.tsx', 'utf-8')
    expect(content).toContain("'environment'")
    expect(content).toContain("'user'")
    const facingModeMatches = content.match(/facingMode/g)
    expect(facingModeMatches).not.toBeNull()
    expect(facingModeMatches!.length).toBeGreaterThanOrEqual(2)
  })

  it('camera-view.tsx calls getTracks for cleanup', () => {
    const content = fs.readFileSync('src/components/check-in/camera-view.tsx', 'utf-8')
    expect(content).toContain('getTracks')
    expect(content).toContain('.forEach(track => track.stop())')
  })

  it('camera-view.tsx uses createImageBitmap for canvas compositing', () => {
    const content = fs.readFileSync('src/components/check-in/camera-view.tsx', 'utf-8')
    expect(content).toContain('createImageBitmap')
  })

  it('camera-view.tsx applies scaleX(-1) mirror for front camera preview', () => {
    const content = fs.readFileSync('src/components/check-in/camera-view.tsx', 'utf-8')
    expect(content).toContain('scaleX(-1)')
  })

  it('camera-view.tsx uses toBlob for frame capture (rear + composite)', () => {
    const content = fs.readFileSync('src/components/check-in/camera-view.tsx', 'utf-8')
    const toBlobMatches = content.match(/toBlob/g)
    expect(toBlobMatches).not.toBeNull()
    expect(toBlobMatches!.length).toBeGreaterThanOrEqual(2)
  })

  it('countdown-overlay.tsx exists and is a client component', () => {
    const path = 'src/components/check-in/countdown-overlay.tsx'
    expect(fs.existsSync(path)).toBe(true)
    const content = fs.readFileSync(path, 'utf-8')
    expect(content.trimStart().startsWith("'use client'")).toBe(true)
  })

  it('countdown-overlay.tsx shows countdown number', () => {
    const content = fs.readFileSync('src/components/check-in/countdown-overlay.tsx', 'utf-8')
    expect(content).toContain('countdown')
    expect(content).toContain('count')
  })

  it('capture-button.tsx exists and is a client component', () => {
    const path = 'src/components/check-in/capture-button.tsx'
    expect(fs.existsSync(path)).toBe(true)
    const content = fs.readFileSync(path, 'utf-8')
    expect(content.trimStart().startsWith("'use client'")).toBe(true)
  })

  it('capture-button.tsx has onCapture prop', () => {
    const content = fs.readFileSync('src/components/check-in/capture-button.tsx', 'utf-8')
    expect(content).toContain('onCapture')
  })

  it('photo-preview.tsx exists and is a client component', () => {
    const path = 'src/components/check-in/photo-preview.tsx'
    expect(fs.existsSync(path)).toBe(true)
    const content = fs.readFileSync(path, 'utf-8')
    expect(content.trimStart().startsWith("'use client'")).toBe(true)
  })

  it('photo-preview.tsx imports submitCheckInAction', () => {
    const content = fs.readFileSync('src/components/check-in/photo-preview.tsx', 'utf-8')
    expect(content).toContain('submitCheckInAction')
    expect(content).toContain("from '@/lib/actions/check-ins'")
  })

  it('photo-preview.tsx uses browser-image-compression', () => {
    const content = fs.readFileSync('src/components/check-in/photo-preview.tsx', 'utf-8')
    expect(content).toContain('imageCompression')
    expect(content).toContain("from 'browser-image-compression'")
  })

  it('photo-preview.tsx uploads to check-in-photos bucket', () => {
    const content = fs.readFileSync('src/components/check-in/photo-preview.tsx', 'utf-8')
    expect(content).toContain("'check-in-photos'")
    expect(content).toContain('.upload(')
  })

  it('photo-preview.tsx uses createObjectURL for preview', () => {
    const content = fs.readFileSync('src/components/check-in/photo-preview.tsx', 'utf-8')
    expect(content).toContain('createObjectURL')
    expect(content).toContain('revokeObjectURL')
  })

  it('photo-preview.tsx has Retake and Submit buttons', () => {
    const content = fs.readFileSync('src/components/check-in/photo-preview.tsx', 'utf-8')
    expect(content).toContain('Retake')
    expect(content).toContain('Submit')
  })

  it('photo-preview.tsx compresses to maxSizeMB 0.5', () => {
    const content = fs.readFileSync('src/components/check-in/photo-preview.tsx', 'utf-8')
    expect(content).toContain('maxSizeMB: 0.5')
  })

  it('photo-preview.tsx generates unique filename with timestamp and UUID', () => {
    const content = fs.readFileSync('src/components/check-in/photo-preview.tsx', 'utf-8')
    expect(content).toContain('Date.now()')
    expect(content).toContain('crypto.randomUUID()')
  })

  it('photo-preview.tsx gets today date in local timezone', () => {
    const content = fs.readFileSync('src/components/check-in/photo-preview.tsx', 'utf-8')
    expect(content).toContain('getFullYear()')
    expect(content).toContain('getMonth()')
    expect(content).toContain('getDate()')
    expect(content).toContain('padStart')
  })

  it('check-in page.tsx exists under (protected) route', () => {
    expect(fs.existsSync('src/app/(protected)/check-in/page.tsx')).toBe(true)
  })

  it('check-in page.tsx imports CameraView', () => {
    const content = fs.readFileSync('src/app/(protected)/check-in/page.tsx', 'utf-8')
    expect(content).toContain('CameraView')
    expect(content).toContain("from '@/components/check-in/camera-view'")
  })
})

// ============================================================
// 5. Goal Stepper UI (CHKN-03)
// ============================================================

describe('Goal Stepper UI (CHKN-03)', () => {
  const goalStepperPath = 'src/components/settings/goal-stepper.tsx'
  const settingsPagePath = 'src/app/(protected)/settings/page.tsx'

  it('goal-stepper.tsx exists and is a client component', () => {
    expect(fs.existsSync(goalStepperPath)).toBe(true)
    const content = fs.readFileSync(goalStepperPath, 'utf-8')
    expect(content.trimStart().startsWith("'use client'")).toBe(true)
  })

  it('goal-stepper.tsx imports updateWeeklyGoalAction', () => {
    const content = fs.readFileSync(goalStepperPath, 'utf-8')
    expect(content).toContain('updateWeeklyGoalAction')
    expect(content).toContain("from '@/lib/actions/check-ins'")
  })

  it('goal-stepper.tsx contains "days per week" text', () => {
    const content = fs.readFileSync(goalStepperPath, 'utf-8')
    expect(content.toLowerCase()).toContain('days per week')
  })

  it('goal-stepper.tsx clamps goal range 1-7', () => {
    const content = fs.readFileSync(goalStepperPath, 'utf-8')
    expect(content).toContain('=== 1')
    expect(content).toContain('=== 7')
  })

  it('goal-stepper.tsx has accessible button labels', () => {
    const content = fs.readFileSync(goalStepperPath, 'utf-8')
    expect(content).toContain('aria-label="Decrease goal"')
    expect(content).toContain('aria-label="Increase goal"')
  })

  it('goal-stepper.tsx has error display with role="alert"', () => {
    const content = fs.readFileSync(goalStepperPath, 'utf-8')
    expect(content).toContain('role="alert"')
  })

  it('Settings page imports GoalStepper', () => {
    const content = fs.readFileSync(settingsPagePath, 'utf-8')
    expect(content).toContain('GoalStepper')
    expect(content).toContain("from '@/components/settings/goal-stepper'")
  })

  it('Settings page queries weeklyGoal from challengeMembers', () => {
    const content = fs.readFileSync(settingsPagePath, 'utf-8')
    expect(content).toContain('weeklyGoal')
    expect(content).toContain('challengeMembers.weeklyGoal')
  })
})

// ============================================================
// 6. Day Dots Progress (CHKN-04)
// ============================================================

describe('Day Dots Progress (CHKN-04)', () => {
  const dayDotsPath = 'src/components/dashboard/day-dots.tsx'
  const dashboardPath = 'src/app/(protected)/dashboard/page.tsx'

  it('day-dots.tsx exists', () => {
    expect(fs.existsSync(dayDotsPath)).toBe(true)
  })

  it('day-dots.tsx is NOT a client component (Server Component)', () => {
    const content = fs.readFileSync(dayDotsPath, 'utf-8')
    expect(content).not.toContain("'use client'")
  })

  it('day-dots.tsx contains day letters M T W T F S S', () => {
    const content = fs.readFileSync(dayDotsPath, 'utf-8')
    expect(content).toContain("'M'")
    expect(content).toContain("'T'")
    expect(content).toContain("'W'")
    expect(content).toContain("'F'")
    expect(content).toContain("'S'")
  })

  it('day-dots.tsx uses emerald fill for checked dots', () => {
    const content = fs.readFileSync(dayDotsPath, 'utf-8')
    expect(content).toContain('bg-emerald-500')
  })

  it('day-dots.tsx receives checkedInDays prop', () => {
    const content = fs.readFileSync(dayDotsPath, 'utf-8')
    expect(content).toContain('checkedInDays')
  })

  it('day-dots.tsx shows progress count with days format', () => {
    const content = fs.readFileSync(dayDotsPath, 'utf-8')
    expect(content).toContain('/{goal} days')
  })

  it('day-dots.tsx highlights today with ring', () => {
    const content = fs.readFileSync(dayDotsPath, 'utf-8')
    expect(content).toContain('ring-2')
    expect(content).toContain('ring-emerald-400/60')
  })

  it('Dashboard page imports DayDots', () => {
    const content = fs.readFileSync(dashboardPath, 'utf-8')
    expect(content).toContain('DayDots')
    expect(content).toContain("from '@/components/dashboard/day-dots'")
  })

  it('Dashboard page calls getWeeklyProgress', () => {
    const content = fs.readFileSync(dashboardPath, 'utf-8')
    expect(content).toContain('getWeeklyProgress')
  })
})

// ============================================================
// 7. Streak display (CHKN-05)
//
// The dashboard redesign (quick 260414-82g) folded the standalone
// StreakCounter into DayDots as an inline streak pill.
// StreakSection on /streaks now inlines the same fire-emoji rendering.
// ============================================================

describe('Streak display (CHKN-05)', () => {
  const dashboardPath = 'src/app/(protected)/dashboard/page.tsx'
  const dayDotsPath = 'src/components/dashboard/day-dots.tsx'
  const streakSectionPath = 'src/components/streaks/streak-section.tsx'

  it('standalone streak-counter.tsx no longer exists (folded into DayDots)', () => {
    expect(fs.existsSync('src/components/dashboard/streak-counter.tsx')).toBe(false)
  })

  it('DayDots exposes a streak prop', () => {
    const content = fs.readFileSync(dayDotsPath, 'utf-8')
    expect(content).toContain('streak')
  })

  it('DayDots is NOT a client component (Server Component)', () => {
    const content = fs.readFileSync(dayDotsPath, 'utf-8')
    expect(content).not.toContain("'use client'")
  })

  it('StreakSection handles zero streak with "No streak yet"', () => {
    const content = fs.readFileSync(streakSectionPath, 'utf-8')
    expect(content).toContain('streak === 0')
    expect(content.toLowerCase()).toContain('no streak yet')
  })

  it('StreakSection handles singular vs plural weeks', () => {
    const content = fs.readFileSync(streakSectionPath, 'utf-8')
    expect(content).toContain("streak === 1 ? 'week' : 'weeks'")
  })

  it('Dashboard page no longer imports StreakCounter', () => {
    const content = fs.readFileSync(dashboardPath, 'utf-8')
    expect(content).not.toContain("from '@/components/dashboard/streak-counter'")
  })

  it('Dashboard page calls computeStreak', () => {
    const content = fs.readFileSync(dashboardPath, 'utf-8')
    expect(content).toContain('computeStreak')
  })
})

// ============================================================
// 8. Bottom Nav FAB (CHKN-01) - Plan 04
// ============================================================

describe('Bottom Nav FAB (CHKN-01)', () => {
  const bottomNavPath = 'src/components/layout/bottom-nav.tsx'

  it('bottom-nav.tsx contains /check-in href', () => {
    const content = fs.readFileSync(bottomNavPath, 'utf-8')
    expect(content).toContain('/check-in')
  })

  it('bottom-nav.tsx contains aria-label for check-in button', () => {
    const content = fs.readFileSync(bottomNavPath, 'utf-8')
    expect(content).toContain('aria-label="Check in"')
  })

  it('bottom-nav.tsx has 4 regular tabs plus FAB center element', () => {
    const content = fs.readFileSync(bottomNavPath, 'utf-8')
    // 4 regular tabs: Home, Feed, Streaks, Settings
    expect(content).toContain("label: 'Home'")
    expect(content).toContain("label: 'Feed'")
    expect(content).toContain("label: 'Streaks'")
    expect(content).toContain("label: 'Settings'")
    // FAB uses bg-secondary for emerald green
    expect(content).toContain('bg-secondary')
    expect(content).toContain('rounded-full')
    expect(content).toContain('w-14')
    expect(content).toContain('h-14')
  })

  it('bottom-nav.tsx hides on /check-in route', () => {
    const content = fs.readFileSync(bottomNavPath, 'utf-8')
    // Should check pathname and return null for /check-in
    expect(content).toContain("pathname === '/check-in'")
    expect(content).toContain('return null')
  })

  it('bottom-nav.tsx FAB has shadow for elevation', () => {
    const content = fs.readFileSync(bottomNavPath, 'utf-8')
    expect(content).toContain('shadow-lg')
    expect(content).toContain('shadow-secondary/30')
  })

  it('bottom-nav.tsx FAB has negative margin for pop-out effect', () => {
    const content = fs.readFileSync(bottomNavPath, 'utf-8')
    expect(content).toContain('-mt-5')
  })

  it('bottom-nav.tsx FAB uses camera icon (add_a_photo)', () => {
    const content = fs.readFileSync(bottomNavPath, 'utf-8')
    expect(content).toContain('add_a_photo')
  })

  it('bottom-nav.tsx tab order is Home, Feed, [FAB], Streaks, Settings', () => {
    const content = fs.readFileSync(bottomNavPath, 'utf-8')
    // leftTabs should be Home then Feed
    const leftTabsMatch = content.match(/leftTabs\s*=\s*\[([\s\S]*?)\]/)
    expect(leftTabsMatch).not.toBeNull()
    const leftSection = leftTabsMatch![1]
    expect(leftSection).toContain("'Home'")
    expect(leftSection).toContain("'Feed'")
    // rightTabs should be Streaks then Settings
    const rightTabsMatch = content.match(/rightTabs\s*=\s*\[([\s\S]*?)\]/)
    expect(rightTabsMatch).not.toBeNull()
    const rightSection = rightTabsMatch![1]
    expect(rightSection).toContain("'Streaks'")
    expect(rightSection).toContain("'Settings'")
    // Home appears before Feed in leftTabs
    expect(leftSection.indexOf("'Home'")).toBeLessThan(leftSection.indexOf("'Feed'"))
    // Streaks appears before Settings in rightTabs
    expect(rightSection.indexOf("'Streaks'")).toBeLessThan(rightSection.indexOf("'Settings'"))
  })
})

// ============================================================
// 9. End-to-End Integration (all CHKN) - Plan 04
// ============================================================

describe('End-to-End Integration (all CHKN)', () => {
  it('all required source files exist', () => {
    const requiredFiles = [
      'src/db/schema.ts',
      'src/lib/actions/check-ins.ts',
      'src/lib/utils/week.ts',
      'src/components/check-in/camera-view.tsx',
      'src/components/check-in/photo-preview.tsx',
      'src/components/check-in/capture-button.tsx',
      'src/components/check-in/countdown-overlay.tsx',
      'src/components/dashboard/day-dots.tsx',
      'src/components/settings/goal-stepper.tsx',
      'src/components/layout/bottom-nav.tsx',
      'src/app/(protected)/check-in/page.tsx',
    ]
    for (const file of requiredFiles) {
      expect(fs.existsSync(file)).toBe(true)
    }
  })

  it('submitCheckInAction and updateWeeklyGoalAction are exported from check-ins actions', () => {
    const content = fs.readFileSync('src/lib/actions/check-ins.ts', 'utf-8')
    expect(content).toContain('export async function submitCheckInAction')
    expect(content).toContain('export async function updateWeeklyGoalAction')
  })

  it('getWeeklyProgress and computeStreak are exported from week utils', () => {
    const content = fs.readFileSync('src/lib/utils/week.ts', 'utf-8')
    expect(content).toContain('export async function getWeeklyProgress')
    expect(content).toContain('export async function computeStreak')
  })

  it('Dashboard imports DayDots (StreakCounter folded into DayDots pill)', () => {
    const content = fs.readFileSync('src/app/(protected)/dashboard/page.tsx', 'utf-8')
    expect(content).toContain("from '@/components/dashboard/day-dots'")
    expect(content).not.toContain("from '@/components/dashboard/streak-counter'")
  })

  it('Settings imports GoalStepper', () => {
    const content = fs.readFileSync('src/app/(protected)/settings/page.tsx', 'utf-8')
    expect(content).toContain("from '@/components/settings/goal-stepper'")
  })

  it('Check-in page imports CameraView', () => {
    const content = fs.readFileSync('src/app/(protected)/check-in/page.tsx', 'utf-8')
    expect(content).toContain("from '@/components/check-in/camera-view'")
  })

  it('Bottom nav links to /check-in', () => {
    const content = fs.readFileSync('src/components/layout/bottom-nav.tsx', 'utf-8')
    expect(content).toContain('href="/check-in"')
  })
})
