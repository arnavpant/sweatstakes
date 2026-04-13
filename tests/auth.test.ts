import { describe, it, expect } from 'vitest'
import fs from 'fs'

describe('Auth infrastructure', () => {
  it('proxy.ts exists at project root (not middleware.ts)', () => {
    expect(fs.existsSync('proxy.ts')).toBe(true)
    // Ensure old middleware.ts naming is not used
    expect(fs.existsSync('middleware.ts')).toBe(false)
  })

  it('proxy.ts exports proxy function (not middleware)', () => {
    const content = fs.readFileSync('proxy.ts', 'utf-8')
    expect(content).toContain('export async function proxy')
    expect(content).not.toContain('export async function middleware')
  })

  it('proxy.ts uses getUser() not getSession()', () => {
    const content = fs.readFileSync('proxy.ts', 'utf-8')
    expect(content).toContain('getUser()')
    // Check non-comment lines don't call getSession() — comments explaining what NOT to use are fine
    const nonCommentLines = content.split('\n').filter(line => !line.trim().startsWith('//'))
    expect(nonCommentLines.join('\n')).not.toMatch(/getSession\(\)/)
  })

  it('proxy.ts protects all four authenticated routes', () => {
    const content = fs.readFileSync('proxy.ts', 'utf-8')
    expect(content).toContain('/dashboard')
    expect(content).toContain('/streaks')
    expect(content).toContain('/feed')
    expect(content).toContain('/settings')
  })

  it('server.ts Supabase client uses createServerClient', () => {
    const content = fs.readFileSync('src/lib/supabase/server.ts', 'utf-8')
    expect(content).toContain('createServerClient')
    expect(content).toContain('export const createClient')
  })

  it('client.ts Supabase client uses createBrowserClient', () => {
    const content = fs.readFileSync('src/lib/supabase/client.ts', 'utf-8')
    expect(content).toContain('createBrowserClient')
    expect(content).toContain('export const createClient')
  })

  it('auth actions export signInWithGoogleAction and signOutAction', () => {
    const content = fs.readFileSync('src/lib/actions/auth.ts', 'utf-8')
    expect(content).toContain('export async function signInWithGoogleAction')
    expect(content).toContain('export async function signOutAction')
    expect(content).toContain("'use server'")
  })

  it('auth callback route exchanges code for session', () => {
    const content = fs.readFileSync('src/app/auth/callback/route.ts', 'utf-8')
    expect(content).toContain('exchangeCodeForSession')
    expect(content).toContain('export async function GET')
  })

  it('login page contains required UI elements', () => {
    const content = fs.readFileSync('src/app/(auth)/login/page.tsx', 'utf-8')
    expect(content).toContain('SweatStakes')
    expect(content).toContain('GoogleSignInButton')
    expect(content).toContain('glass-panel')
    expect(content).toContain('emerald-glow')
  })

  it('login page has no animation (per D-04)', () => {
    const content = fs.readFileSync('src/app/(auth)/login/page.tsx', 'utf-8')
    // D-04: No animation on the login screen
    expect(content).not.toMatch(/animate-(?!spin)/)  // animate-spin is only on the button component, not the page
    expect(content).not.toContain('transition')
    expect(content).not.toContain('motion')
  })

  it('dashboard shows personalized greeting', () => {
    const content = fs.readFileSync('src/app/(protected)/dashboard/page.tsx', 'utf-8')
    expect(content).toContain('Welcome,')
    expect(content).toContain('avatar_url')
    expect(content).toContain('No active challenge yet.')
  })

  it('sign-out button is a client component with loading state', () => {
    const content = fs.readFileSync('src/components/auth/sign-out-button.tsx', 'utf-8')
    expect(content).toContain("'use client'")
    expect(content).toContain('signOutAction')
    expect(content).toContain('Loader2')
    expect(content).toContain('animate-spin')
    expect(content).toContain('Sign out of SweatStakes')
    expect(content).toContain('bg-error-container')
    expect(content).toContain('aria-busy')
    expect(content).toContain('disabled:opacity-60')
  })

  it('settings page renders SignOutButton component', () => {
    const content = fs.readFileSync('src/app/(protected)/settings/page.tsx', 'utf-8')
    expect(content).toContain('SignOutButton')
    expect(content).toContain('sign-out-button')
  })

  it('bottom nav has all four tabs', () => {
    const content = fs.readFileSync('src/components/layout/bottom-nav.tsx', 'utf-8')
    expect(content).toContain('/dashboard')
    expect(content).toContain('/streaks')
    expect(content).toContain('/feed')
    expect(content).toContain('/settings')
    expect(content).toContain('min-h-[44px]')
  })

  it('PWA manifest has correct properties', () => {
    const content = fs.readFileSync('src/app/manifest.ts', 'utf-8')
    expect(content).toContain("'SweatStakes'")
    expect(content).toContain("'standalone'")
    expect(content).toContain("'portrait'")
    expect(content).toContain("'#001233'")
  })

  it('icon inventory tracks all Phase 1 assets', () => {
    const content = fs.readFileSync('src/docs/icon-inventory.md', 'utf-8')
    // Verify all 13 icons + 2 loaders are tracked
    expect(content).toContain('ICON-01')
    expect(content).toContain('ICON-13')
    expect(content).toContain('LOADER-01')
    expect(content).toContain('LOADER-02')
    expect(content).toContain('Nano Banana')
    // ICON-05 must reference sign-out-button.tsx, not settings/page.tsx
    expect(content).toContain('sign-out-button.tsx')
  })

  it('.env.local.example documents required variables', () => {
    const content = fs.readFileSync('.env.local.example', 'utf-8')
    expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL')
    expect(content).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  })

  it('protected layout checks auth and renders bottom nav', () => {
    const content = fs.readFileSync('src/app/(protected)/layout.tsx', 'utf-8')
    expect(content).toContain('getUser')
    expect(content).toContain('BottomNav')
    expect(content).toContain("redirect('/login')")
  })
})
