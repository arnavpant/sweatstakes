#!/usr/bin/env node
/**
 * Applies drizzle/0005_check_ins_selfie_url.sql via the `postgres` driver.
 * drizzle-kit push hangs on Supabase check constraint introspection, so
 * individual migration SQL files are pushed by small runner scripts instead.
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
const sqlPath = resolve(__dirname, '..', 'drizzle', '0005_check_ins_selfie_url.sql')
const sqlContents = readFileSync(sqlPath, 'utf8')

const sql = postgres(connectionString, { prepare: false })

try {
  console.log(`[run] applying ${sqlPath}`)
  await sql.unsafe(sqlContents)
  console.log('[ok] migration applied')

  const cols = await sql`
    SELECT column_name, is_nullable, data_type
    FROM information_schema.columns
    WHERE table_name = 'check_ins' AND column_name = 'selfie_url'
  `
  console.log('verify check_ins.selfie_url:', cols)
} catch (err) {
  console.error('Migration failed:', err)
  process.exitCode = 1
} finally {
  await sql.end({ timeout: 5 })
}
