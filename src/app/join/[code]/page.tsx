import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { joinChallengeAction } from '@/lib/actions/connections'

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // D-07: Unauthenticated — redirect to login with next param preserving join intent
    redirect(`/login?next=/join/${encodeURIComponent(code)}`)
  }

  // D-08: Authenticated — attempt join immediately, no confirmation step
  const result = await joinChallengeAction(code)

  if (result.error) {
    // D-09: Show error page with reason
    redirect(`/join/${encodeURIComponent(code)}/error?reason=${encodeURIComponent(result.error)}`)
  }

  // Success — go to dashboard
  redirect('/dashboard')
}
