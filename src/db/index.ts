import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'Missing DATABASE_URL environment variable. ' +
    'Add it to .env.local with your Supabase Transaction mode connection string (port 6543).'
  )
}

// Supabase uses connection pooling (Transaction mode) — must disable prepared statements
const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema })
