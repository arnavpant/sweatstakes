#!/usr/bin/env node
/**
 * One-off script to push drizzle/0002_phase04_fixes.sql to Supabase.
 * Uses the same `postgres` driver pattern as Phase 3/4 schema pushes
 * (drizzle-kit push crashes on Supabase check constraint introspection).
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
  // WR-02: redemptions.reward_id FK
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'redemptions_reward_id_fkey'
      ) THEN
        ALTER TABLE redemptions
          ADD CONSTRAINT redemptions_reward_id_fkey
          FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE RESTRICT;
      END IF;
    END$$;
  `
  console.log('[ok] WR-02: redemptions_reward_id_fkey applied')

  // WR-06: point_transactions.reason CHECK
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'point_transactions_reason_check'
      ) THEN
        ALTER TABLE point_transactions
          ADD CONSTRAINT point_transactions_reason_check
          CHECK (reason IN ('earned', 'penalty', 'redemption'));
      END IF;
    END$$;
  `
  console.log('[ok] WR-06: point_transactions_reason_check applied')

  // Verify
  const fk = await sql`
    SELECT conname FROM pg_constraint WHERE conname = 'redemptions_reward_id_fkey'
  `
  const chk = await sql`
    SELECT conname, pg_get_constraintdef(oid) AS def
      FROM pg_constraint WHERE conname = 'point_transactions_reason_check'
  `
  console.log('verify FK:', fk)
  console.log('verify CHECK:', chk)
} catch (err) {
  console.error('Migration failed:', err)
  process.exitCode = 1
} finally {
  await sql.end({ timeout: 5 })
}
