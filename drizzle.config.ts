import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'

// drizzle-kit does not auto-load .env.local — load it explicitly
config({ path: '.env.local' })

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ['public'],
})
