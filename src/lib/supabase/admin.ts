import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Phase 5 — Service-role Supabase client.
 * SERVER-ONLY: SUPABASE_SERVICE_ROLE_KEY must never reach the browser.
 * Mitigates T-05-01-02. Used by:
 *   - Profile name edits (auth.users.user_metadata.full_name updates require admin scope)
 *   - Cron handlers that bypass RLS for cross-user reads
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase admin env vars missing')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
