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
