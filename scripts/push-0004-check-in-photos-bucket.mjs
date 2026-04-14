#!/usr/bin/env node
/**
 * Quick Fix 260414-5bc — check-in-photos bucket migration runner.
 * Reads drizzle/0004_check_in_photos_bucket.sql and applies it via the `postgres` driver.
 * (drizzle-kit push crashes on Supabase check constraint introspection — see Phase 3 STATE.)
 *
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
const sqlPath = resolve(__dirname, '..', 'drizzle', '0004_check_in_photos_bucket.sql')
const sqlContents = readFileSync(sqlPath, 'utf8')

const sql = postgres(connectionString, { prepare: false })

try {
  console.log(`[run] applying ${sqlPath}`)
  await sql.unsafe(sqlContents)
  console.log('[ok] migration applied')

  const bucket = await sql`SELECT id, public FROM storage.buckets WHERE id = 'check-in-photos'`
  console.log('verify check-in-photos bucket:', bucket)

  const policies = await sql`
    SELECT policyname FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname ILIKE '%check-in%'
    ORDER BY policyname
  `
  console.log('verify check-in-photos policies:', policies.map((r) => r.policyname))
} catch (err) {
  console.error('Migration failed:', err)
  process.exitCode = 1
} finally {
  await sql.end({ timeout: 5 })
}
