import { describe, it, expect } from 'vitest'
import fs from 'fs'

// ============================================================
// Task 1: Schema + Week Utilities (TDD RED)
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
    // Must reference challenges.id with cascade delete
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
    // The checkIns table should have its own createdAt with withTimezone
    const checkInsSection = content.slice(content.indexOf("pgTable('check_ins'"))
    expect(checkInsSection).toContain('withTimezone: true')
  })

  it('checkIns has check_ins_user_date_idx index', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8')
    expect(content).toContain('check_ins_user_date_idx')
  })

  it('checkIns has check_ins_challenge_idx index', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8')
    expect(content).toContain('check_ins_challenge_idx')
  })

  it('challengeMembers has weeklyGoal column with default(3)', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8')
    expect(content).toContain('weeklyGoal')
    expect(content).toMatch(/smallint\('weekly_goal'\)\.notNull\(\)\.default\(3\)/)
  })
})

describe('Week utilities (CHKN-04, CHKN-05)', () => {
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
})

// ============================================================
// Task 2: Server Actions + Progress/Streak (TDD RED)
// ============================================================

describe('Server Actions: check-in mutations (CHKN-01, CHKN-03)', () => {
  const actionsPath = 'src/lib/actions/check-ins.ts'

  it('check-ins.ts file exists', () => {
    expect(fs.existsSync(actionsPath)).toBe(true)
  })

  it('file has use server directive', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content.trimStart().startsWith("'use server'")).toBe(true)
  })

  it('exports submitCheckInAction', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('export async function submitCheckInAction')
  })

  it('exports updateWeeklyGoalAction', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('export async function updateWeeklyGoalAction')
  })

  it('submitCheckInAction calls supabase.auth.getUser()', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('supabase.auth.getUser()')
  })

  it('submitCheckInAction queries challengeMembers for membership', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('challengeMembers')
    expect(content).toContain("'Not in a challenge'")
  })

  it('submitCheckInAction inserts into checkIns', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('db.insert(checkIns)')
  })

  it('submitCheckInAction validates photoUrl', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain("'Invalid photo URL'")
  })

  it('submitCheckInAction validates checkedInDate format', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain("'Invalid date'")
  })

  it('updateWeeklyGoalAction validates goal with z.number().int().min(1).max(7)', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('z.number().int().min(1).max(7)')
  })

  it('updateWeeklyGoalAction updates challengeMembers weeklyGoal', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('weeklyGoal')
    expect(content).toContain("'Goal must be between 1 and 7'")
  })

  it('both actions call supabase.auth.getUser() for auth check', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    const getUserMatches = content.match(/supabase\.auth\.getUser\(\)/g)
    expect(getUserMatches).not.toBeNull()
    expect(getUserMatches!.length).toBeGreaterThanOrEqual(2)
  })
})

describe('Data utilities: progress and streak (CHKN-04, CHKN-05)', () => {
  it('week.ts exports getWeeklyProgress function', () => {
    const content = fs.readFileSync('src/lib/utils/week.ts', 'utf-8')
    expect(content).toContain('export async function getWeeklyProgress')
  })

  it('week.ts exports computeStreak function', () => {
    const content = fs.readFileSync('src/lib/utils/week.ts', 'utf-8')
    expect(content).toContain('export async function computeStreak')
  })
})
