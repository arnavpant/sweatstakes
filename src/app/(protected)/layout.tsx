import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/layout/bottom-nav'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Defense-in-depth: proxy.ts should already redirect, but double-check
  if (!user) {
    redirect('/login')
  }

  return (
    <>
      <main className="pb-32">
        {children}
      </main>
      <BottomNav />
    </>
  )
}
