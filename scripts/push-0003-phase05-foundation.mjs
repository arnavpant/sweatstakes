#!/usr/bin/env node
/**
 * Phase 5 Plan 01 — Foundation migration runner.
 * Reads drizzle/0003_phase05_foundation.sql and applies it via the `postgres` driver.
 * (drizzle-kit push crashes on Supabase check constraint introspection — see Phase 3 STATE.)
 *
 * Run with: npm run db:push-phase5
 * All sections in the SQL file are idempotent — safe to re-run.
 */
import { config } from 'dotenv'
import postgres from 'postgres'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('Missing DATABASE_URL in .env.local')
  process.exit(1)
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const sqlPath = resolve(__dirname, '..', 'drizzle', '0003_phase05_foundation.sql')
const sqlContents = readFileSync(sqlPath, 'utf8')

const sql = postgres(connectionString, { prepare: false })

try {
  console.log(`[run] applying ${sqlPath}`)
  // sql.unsafe handles multi-statement scripts including DO $$ ... END $$ blocks.
  await sql.unsafe(sqlContents)
  console.log('[ok] migration applied')

  // Verify
  const tbl = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'push_subscriptions'
    ORDER BY ordinal_position
  `
  console.log('verify push_subscriptions columns:', tbl.map((r) => r.column_name))

  const cm = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'challenge_members'
      AND column_name IN ('reminder_hour', 'notifications_enabled')
    ORDER BY column_name
  `
  console.log('verify challenge_members new columns:', cm.map((r) => r.column_name))

  const bucket = await sql`SELECT id, public FROM storage.buckets WHERE id = 'avatars'`
  console.log('verify avatars bucket:', bucket)

  const policies = await sql`
    SELECT policyname FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname LIKE '%avatar%'
    ORDER BY policyname
  `
  console.log('verify avatars policies:', policies.map((r) => r.policyname))
} catch (err) {
  console.error('Migration failed:', err)
  process.exitCode = 1
} finally {
  await sql.end({ timeout: 5 })
}
