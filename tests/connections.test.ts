import { describe, it, expect } from 'vitest'
import fs from 'fs'

describe('Phase 2: Connections - Schema', () => {
  // Schema structure tests (CONN-03)

  it('src/db/schema.ts exists', () => {
    expect(fs.existsSync('src/db/schema.ts')).toBe(true)
  })

  it('schema exports challenges table', () => {
    const content = fs.readFileSync('src/db/schema.ts', 'utf-8')
    expect(content).toContain('export const challenges')
    expect(content).toContain("pgTable('challenges'")
  })

  it('schema exports challengeMembers table', () => {
    const content = fs.readFileSync('src/db/schema.ts', 'utf-8')
    expect(content).toContain('export const challengeMembers')
    expect(content).toContain("pgTable('challenge_members'")
  })

  it('schema exports inviteLinks table', () => {
    const content = fs.readFileSync('src/db/schema.ts', 'utf-8')
    expect(content).toContain('export const inviteLinks')
    expect(content).toContain("pgTable('invite_links'")
  })

  it('inviteLinks has .unique() constraint on code column', () => {
    const content = fs.readFileSync('src/db/schema.ts', 'utf-8')
    // The code column must have a unique constraint
    expect(content).toMatch(/code.*\.unique\(\)/)
  })

  it('challengeMembers and inviteLinks have onDelete cascade on challengeId FK', () => {
    const content = fs.readFileSync('src/db/schema.ts', 'utf-8')
    // Both tables reference challenges.id with cascade delete
    const cascadeMatches = content.match(/onDelete: 'cascade'/g)
    expect(cascadeMatches).not.toBeNull()
    expect(cascadeMatches!.length).toBeGreaterThanOrEqual(2)
  })

  it('schema does NOT contain pgPolicy (RLS handled in Server Actions)', () => {
    const content = fs.readFileSync('src/db/schema.ts', 'utf-8')
    expect(content).not.toContain('pgPolicy')
    expect(content).not.toContain('authenticatedRole')
    expect(content).not.toContain('authUid')
  })
})

describe('Phase 2: Connections - Drizzle Client', () => {
  it('src/db/index.ts exists', () => {
    expect(fs.existsSync('src/db/index.ts')).toBe(true)
  })

  it('Drizzle client exports db', () => {
    const content = fs.readFileSync('src/db/index.ts', 'utf-8')
    expect(content).toContain('export const db')
  })

  it('Drizzle client uses prepare: false for Supabase Transaction mode pooler', () => {
    const content = fs.readFileSync('src/db/index.ts', 'utf-8')
    expect(content).toContain('prepare: false')
  })

  it('Drizzle client reads DATABASE_URL from environment', () => {
    const content = fs.readFileSync('src/db/index.ts', 'utf-8')
    expect(content).toContain('process.env.DATABASE_URL')
  })

  it('Drizzle client imports schema', () => {
    const content = fs.readFileSync('src/db/index.ts', 'utf-8')
    expect(content).toMatch(/import.*schema.*from.*\.\/schema/)
  })
})

describe('Phase 2: Connections - Configuration', () => {
  it('drizzle.config.ts exists at project root', () => {
    expect(fs.existsSync('drizzle.config.ts')).toBe(true)
  })

  it('drizzle.config.ts references src/db/schema.ts', () => {
    const content = fs.readFileSync('drizzle.config.ts', 'utf-8')
    expect(content).toMatch(/schema.*src\/db\/schema/)
  })

  it('drizzle.config.ts uses postgresql dialect', () => {
    const content = fs.readFileSync('drizzle.config.ts', 'utf-8')
    expect(content).toContain("dialect: 'postgresql'")
  })

  it('.env.local.example documents DATABASE_URL', () => {
    const content = fs.readFileSync('.env.local.example', 'utf-8')
    expect(content).toContain('DATABASE_URL')
    expect(content).toContain('Drizzle ORM')
  })

  it('package.json has db:push script for drizzle-kit push', () => {
    const content = fs.readFileSync('package.json', 'utf-8')
    expect(content).toContain('"db:push"')
    expect(content).toContain('drizzle-kit push')
  })
})
