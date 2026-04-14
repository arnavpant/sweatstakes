#!/usr/bin/env node
/**
 * Deletes every row from check_ins. Testing-only — never run in production.
 * Does NOT touch storage objects; orphaned photos in the check-in-photos
 * bucket can be cleaned up separately from the Supabase Storage UI if needed.
 */
import { config } from 'dotenv'
import postgres from 'postgres'

config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('Missing DATABASE_URL in .env.local')
  process.exit(1)
}

const sql = postgres(connectionString, { prepare: false })

try {
  const before = await sql`SELECT COUNT(*)::int AS n FROM check_ins`
  console.log(`[before] check_ins rows: ${before[0].n}`)

  const result = await sql`DELETE FROM check_ins`
  console.log(`[delete] removed rows`)

  const after = await sql`SELECT COUNT(*)::int AS n FROM check_ins`
  console.log(`[after] check_ins rows: ${after[0].n}`)
} catch (err) {
  console.error('Wipe failed:', err)
  process.exitCode = 1
} finally {
  await sql.end({ timeout: 5 })
}
