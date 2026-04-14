#!/usr/bin/env node
/**
 * Ad-hoc: clear all rows from point_transactions inserted during dev testing.
 * Usage: node scripts/wipe-test-points.mjs
 */
import { config } from 'dotenv'
import postgres from 'postgres'

config({ path: '.env.local' })

const sql = postgres(process.env.DATABASE_URL, { prepare: false })

try {
  const before = await sql`
    SELECT user_id, COALESCE(SUM(delta), 0)::int AS balance, COUNT(*)::int AS rows
    FROM point_transactions GROUP BY user_id
  `
  console.log('before:')
  console.table(before)

  const deleted = await sql`DELETE FROM point_transactions RETURNING id`
  console.log(`deleted ${deleted.length} rows`)

  const after = await sql`SELECT COUNT(*)::int AS remaining FROM point_transactions`
  console.log(`remaining rows: ${after[0].remaining}`)
} catch (err) {
  console.error('failed:', err)
  process.exitCode = 1
} finally {
  await sql.end({ timeout: 5 })
}
