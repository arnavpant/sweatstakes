'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signInWithGoogleAction() {
  const supabase = await createClient()
  const requestHeaders = await headers()

  // Use hardcoded site URL as source of truth; fall back to origin header, then localhost
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    requestHeaders.get('origin') ||
    'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
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
