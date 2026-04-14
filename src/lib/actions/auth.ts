'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signInWithGoogleAction(next: string = '/dashboard') {
  const supabase = await createClient()
  const requestHeaders = await headers()

  // Use hardcoded site URL as source of truth; fall back to origin header, then
  // Vercel's auto-injected deployment URL, then localhost for local dev.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    requestHeaders.get('origin') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000'

  // Thread the next param through OAuth so auth/callback redirects to the right place (D-07, Pitfall 4)
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })

  if (error || !data.url) {
    return redirect('/login?error=OAuthSigninFailed')
  }

  redirect(data.url)
}

export async function signOutAction() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) {
    redirect('/login?error=SignOutFailed')
  }
  redirect('/login')
}
