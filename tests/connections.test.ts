import { describe, it, expect } from 'vitest'
import fs from 'fs'

describe('Phase 2: Connections - Schema', () => {
  // Schema structure tests (CONN-03)

  it('src/db/schema.ts exists', () => {
    expect(fs.existsSync('src/db/schema.ts')).toBe(true)
  })

  it('schema exports challenges table', () => {
    const content = fs.readFileSync('src/db/schema.ts', 'utf-8')
    expect(content).toContain('export const challenges')
    expect(content).toContain("pgTable('challenges'")
  })

  it('schema exports challengeMembers table', () => {
    const content = fs.readFileSync('src/db/schema.ts', 'utf-8')
    expect(content).toContain('export const challengeMembers')
    expect(content).toContain("pgTable('challenge_members'")
  })

  it('schema exports inviteLinks table', () => {
    const content = fs.readFileSync('src/db/schema.ts', 'utf-8')
    expect(content).toContain('export const inviteLinks')
    expect(content).toContain("pgTable('invite_links'")
  })

  it('inviteLinks has .unique() constraint on code column', () => {
    const content = fs.readFileSync('src/db/schema.ts', 'utf-8')
    // The code column must have a unique constraint
    expect(content).toMatch(/code.*\.unique\(\)/)
  })

  it('challengeMembers and inviteLinks have onDelete cascade on challengeId FK', () => {
    const content = fs.readFileSync('src/db/schema.ts', 'utf-8')
    // Both tables reference challenges.id with cascade delete
    const cascadeMatches = content.match(/onDelete: 'cascade'/g)
    expect(cascadeMatches).not.toBeNull()
    expect(cascadeMatches!.length).toBeGreaterThanOrEqual(2)
  })

  it('schema does NOT contain pgPolicy (RLS handled in Server Actions)', () => {
    const content = fs.readFileSync('src/db/schema.ts', 'utf-8')
    expect(content).not.toContain('pgPolicy')
    expect(content).not.toContain('authenticatedRole')
    expect(content).not.toContain('authUid')
  })
})

describe('Phase 2: Connections - Drizzle Client', () => {
  it('src/db/index.ts exists', () => {
    expect(fs.existsSync('src/db/index.ts')).toBe(true)
  })

  it('Drizzle client exports db', () => {
    const content = fs.readFileSync('src/db/index.ts', 'utf-8')
    expect(content).toContain('export const db')
  })

  it('Drizzle client uses prepare: false for Supabase Transaction mode pooler', () => {
    const content = fs.readFileSync('src/db/index.ts', 'utf-8')
    expect(content).toContain('prepare: false')
  })

  it('Drizzle client reads DATABASE_URL from environment', () => {
    const content = fs.readFileSync('src/db/index.ts', 'utf-8')
    expect(content).toContain('process.env.DATABASE_URL')
  })

  it('Drizzle client imports schema', () => {
    const content = fs.readFileSync('src/db/index.ts', 'utf-8')
    expect(content).toMatch(/import.*schema.*from.*\.\/schema/)
  })
})

describe('Phase 2: Connections - Configuration', () => {
  it('drizzle.config.ts exists at project root', () => {
    expect(fs.existsSync('drizzle.config.ts')).toBe(true)
  })

  it('drizzle.config.ts references src/db/schema.ts', () => {
    const content = fs.readFileSync('drizzle.config.ts', 'utf-8')
    expect(content).toMatch(/schema.*src\/db\/schema/)
  })

  it('drizzle.config.ts uses postgresql dialect', () => {
    const content = fs.readFileSync('drizzle.config.ts', 'utf-8')
    expect(content).toContain("dialect: 'postgresql'")
  })

  it('.env.local.example documents DATABASE_URL', () => {
    const content = fs.readFileSync('.env.local.example', 'utf-8')
    expect(content).toContain('DATABASE_URL')
    expect(content).toContain('Drizzle ORM')
  })

  it('package.json has db:push script for drizzle-kit push', () => {
    const content = fs.readFileSync('package.json', 'utf-8')
    expect(content).toContain('"db:push"')
    expect(content).toContain('drizzle-kit push')
  })
})

// ============================================================
// Plan 02-02: Server Actions, Join Flow, Auth Next-Param Tests
// ============================================================

describe('Phase 2: Connections - Server Actions', () => {
  const actionsPath = 'src/lib/actions/connections.ts'

  it('connections.ts starts with use server directive', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content.trimStart().startsWith("'use server'")).toBe(true)
  })

  it('exports generateInviteLinkAction function', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('export async function generateInviteLinkAction')
  })

  it('exports joinChallengeAction function', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('export async function joinChallengeAction')
  })

  it('exports leaveChallengeAction function', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('export async function leaveChallengeAction')
  })

  it('uses customAlphabet from nanoid (not Math.random)', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('customAlphabet')
    expect(content).toContain("from 'nanoid'")
    expect(content).not.toContain('Math.random')
  })

  it('invite code alphabet excludes ambiguous characters (0, O, I, 1)', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('ABCDEFGHJKLMNPQRSTUVWXYZ23456789')
    // Verify excluded: 0, O, I, 1
    const alphabetMatch = content.match(/INVITE_CODE_ALPHABET\s*=\s*'([^']+)'/)
    expect(alphabetMatch).not.toBeNull()
    const alphabet = alphabetMatch![1]
    expect(alphabet).not.toContain('0')
    expect(alphabet).not.toContain('O')
    expect(alphabet).not.toContain('I')
    expect(alphabet).not.toContain('1')
  })

  it('invite code length is 8', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toMatch(/INVITE_CODE_LENGTH\s*=\s*8/)
  })

  it('joinChallengeAction uses atomic update pattern with isNull check (Pitfall 3)', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('isNull(inviteLinks.usedAt)')
    expect(content).toContain('gt(inviteLinks.expiresAt')
    expect(content).toContain('.returning()')
  })

  it('all three actions call supabase.auth.getUser() for auth check', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    const getUserMatches = content.match(/supabase\.auth\.getUser\(\)/g)
    expect(getUserMatches).not.toBeNull()
    // All three actions must have their own getUser() call
    expect(getUserMatches!.length).toBeGreaterThanOrEqual(3)
  })

  it('generateInviteLinkAction creates challenge implicitly (D-11)', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('db.insert(challenges)')
  })

  it('generateInviteLinkAction uses 24-hour expiry (D-03)', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain('24 * 60 * 60 * 1000')
  })

  it('joinChallengeAction checks existing membership before joining (D-14)', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toContain("'already_in_challenge'")
  })

  it('leaveChallengeAction deletes membership row', () => {
    const content = fs.readFileSync(actionsPath, 'utf-8')
    expect(content).toMatch(/db\s*\.delete\(\s*challengeMembers\s*\)/)
  })
})

describe('Phase 2: Connections - Join Flow', () => {
  const joinPagePath = 'src/app/join/[code]/page.tsx'
  const errorPagePath = 'src/app/join/[code]/error/page.tsx'

  it('join page exists at src/app/join/[code]/page.tsx', () => {
    expect(fs.existsSync(joinPagePath)).toBe(true)
  })

  it('join page redirects unauthenticated users to /login?next=', () => {
    const content = fs.readFileSync(joinPagePath, 'utf-8')
    expect(content).toContain('/login?next=/join/')
  })

  it('join page calls joinChallengeAction', () => {
    const content = fs.readFileSync(joinPagePath, 'utf-8')
    expect(content).toContain('joinChallengeAction')
  })

  it('join page uses await params (Next.js 16 async params)', () => {
    const content = fs.readFileSync(joinPagePath, 'utf-8')
    expect(content).toContain('await params')
    expect(content).toContain('Promise<{ code: string }>')
  })

  it('error page exists at src/app/join/[code]/error/page.tsx', () => {
    expect(fs.existsSync(errorPagePath)).toBe(true)
  })

  it('error page contains user-facing expired message', () => {
    const content = fs.readFileSync(errorPagePath, 'utf-8')
    expect(content).toContain('expired or already been used')
  })

  it('error page contains Ask your friend message', () => {
    const content = fs.readFileSync(errorPagePath, 'utf-8')
    expect(content).toContain('Ask your friend to send a new invite link')
  })

  it('error page has a link to /dashboard', () => {
    const content = fs.readFileSync(errorPagePath, 'utf-8')
    expect(content).toContain('href="/dashboard"')
  })

  it('error page maps already_in_challenge error code', () => {
    const content = fs.readFileSync(errorPagePath, 'utf-8')
    expect(content).toContain('already_in_challenge')
  })
})

describe('Phase 2: Connections - Auth Next-Param Threading', () => {
  it('signInWithGoogleAction accepts a next parameter', () => {
    const content = fs.readFileSync('src/lib/actions/auth.ts', 'utf-8')
    expect(content).toMatch(/signInWithGoogleAction\(next:\s*string/)
  })

  it('auth.ts encodes next param safely with encodeURIComponent', () => {
    const content = fs.readFileSync('src/lib/actions/auth.ts', 'utf-8')
    expect(content).toContain('encodeURIComponent(next)')
  })

  it('GoogleSignInButton reads next from searchParams', () => {
    const content = fs.readFileSync('src/components/auth/google-sign-in-button.tsx', 'utf-8')
    expect(content).toContain("searchParams.get('next')")
  })

  it('GoogleSignInButton passes next to signInWithGoogleAction', () => {
    const content = fs.readFileSync('src/components/auth/google-sign-in-button.tsx', 'utf-8')
    expect(content).toMatch(/signInWithGoogleAction\(nextParam/)
  })

  it('auth/callback/route.ts reads next param (regression)', () => {
    const content = fs.readFileSync('src/app/auth/callback/route.ts', 'utf-8')
    expect(content).toContain("searchParams.get('next')")
  })
})

// ============================================================
// Plan 02-03: UI Components Tests
// ============================================================

describe('Phase 2: Connections - Settings UI (CONN-01)', () => {
  const inviteLinkPath = 'src/components/connections/invite-link-section.tsx'
  const shareButtonPath = 'src/components/connections/share-invite-button.tsx'
  const leaveButtonPath = 'src/components/connections/leave-challenge-button.tsx'
  const settingsPagePath = 'src/app/(protected)/settings/page.tsx'

  it('invite-link-section.tsx exists and is a client component', () => {
    expect(fs.existsSync(inviteLinkPath)).toBe(true)
    const content = fs.readFileSync(inviteLinkPath, 'utf-8')
    expect(content.trimStart().startsWith("'use client'")).toBe(true)
  })

  it('invite-link-section.tsx calls generateInviteLinkAction', () => {
    const content = fs.readFileSync(inviteLinkPath, 'utf-8')
    expect(content).toContain('generateInviteLinkAction')
  })

  it('invite-link-section.tsx contains loading state with Loader2 and aria-busy', () => {
    const content = fs.readFileSync(inviteLinkPath, 'utf-8')
    expect(content).toContain('Loader2')
    expect(content).toContain('aria-busy')
  })

  it('invite-link-section.tsx contains Generate Invite Link button text', () => {
    const content = fs.readFileSync(inviteLinkPath, 'utf-8')
    expect(content).toContain('Generate Invite Link')
  })

  it('invite-link-section.tsx mentions 24 hour expiry in description', () => {
    const content = fs.readFileSync(inviteLinkPath, 'utf-8')
    expect(content).toContain('expire after 24 hours')
  })

  it('share-invite-button.tsx exists and is a client component', () => {
    expect(fs.existsSync(shareButtonPath)).toBe(true)
    const content = fs.readFileSync(shareButtonPath, 'utf-8')
    expect(content.trimStart().startsWith("'use client'")).toBe(true)
  })

  it('share-invite-button.tsx contains navigator.share (Web Share API)', () => {
    const content = fs.readFileSync(shareButtonPath, 'utf-8')
    expect(content).toContain('navigator.share')
  })

  it('share-invite-button.tsx contains navigator.clipboard.writeText (clipboard fallback)', () => {
    const content = fs.readFileSync(shareButtonPath, 'utf-8')
    expect(content).toContain('navigator.clipboard.writeText')
  })

  it('share-invite-button.tsx contains Copied! feedback text', () => {
    const content = fs.readFileSync(shareButtonPath, 'utf-8')
    expect(content).toContain('Copied!')
  })

  it('leave-challenge-button.tsx exists and is a client component', () => {
    expect(fs.existsSync(leaveButtonPath)).toBe(true)
    const content = fs.readFileSync(leaveButtonPath, 'utf-8')
    expect(content.trimStart().startsWith("'use client'")).toBe(true)
  })

  it('leave-challenge-button.tsx calls leaveChallengeAction', () => {
    const content = fs.readFileSync(leaveButtonPath, 'utf-8')
    expect(content).toContain('leaveChallengeAction')
  })

  it('leave-challenge-button.tsx has confirmation flow (Are you sure)', () => {
    const content = fs.readFileSync(leaveButtonPath, 'utf-8')
    expect(content).toContain('Are you sure')
    expect(content).toContain('Cancel')
    expect(content).toContain('Confirm')
  })

  it('settings page imports InviteLinkSection', () => {
    const content = fs.readFileSync(settingsPagePath, 'utf-8')
    expect(content).toContain('InviteLinkSection')
    expect(content).toContain("from '@/components/connections/invite-link-section'")
  })

  it('settings page imports LeaveChallengeButton', () => {
    const content = fs.readFileSync(settingsPagePath, 'utf-8')
    expect(content).toContain('LeaveChallengeButton')
    expect(content).toContain("from '@/components/connections/leave-challenge-button'")
  })

  it('settings page does NOT import Construction (placeholder removed)', () => {
    const content = fs.readFileSync(settingsPagePath, 'utf-8')
    expect(content).not.toContain('Construction')
  })

  it('settings page queries challengeMembers via Drizzle', () => {
    const content = fs.readFileSync(settingsPagePath, 'utf-8')
    expect(content).toContain('challengeMembers')
    expect(content).toContain("from '@/db/schema'")
  })
})

describe('Phase 2: Connections - Dashboard UI (CONN-03)', () => {
  const avatarRowPath = 'src/components/connections/member-avatar-row.tsx'
  const dashboardPath = 'src/app/(protected)/dashboard/page.tsx'

  it('member-avatar-row.tsx exists', () => {
    expect(fs.existsSync(avatarRowPath)).toBe(true)
  })

  it('member-avatar-row.tsx is NOT a client component (no use client)', () => {
    const content = fs.readFileSync(avatarRowPath, 'utf-8')
    expect(content).not.toContain("'use client'")
  })

  it('member-avatar-row.tsx contains MAX_VISIBLE = 5', () => {
    const content = fs.readFileSync(avatarRowPath, 'utf-8')
    expect(content).toContain('MAX_VISIBLE = 5')
  })

  it('member-avatar-row.tsx contains overflow rendering logic (+{overflow})', () => {
    const content = fs.readFileSync(avatarRowPath, 'utf-8')
    expect(content).toContain('+{overflow}')
  })

  it('member-avatar-row.tsx contains Challenge Members header label', () => {
    const content = fs.readFileSync(avatarRowPath, 'utf-8')
    // Restyled per quick 260414-82g: header now reads "Challenge Members"
    expect(content).toContain('Challenge Members')
  })

  it('member-avatar-row.tsx has referrerPolicy on img tags', () => {
    const content = fs.readFileSync(avatarRowPath, 'utf-8')
    expect(content).toContain('referrerPolicy="no-referrer"')
  })

  it('member-avatar-row.tsx has letter fallback for avatars', () => {
    const content = fs.readFileSync(avatarRowPath, 'utf-8')
    expect(content).toContain('charAt(0).toUpperCase()')
  })

  it('dashboard page imports MemberAvatarRow', () => {
    const content = fs.readFileSync(dashboardPath, 'utf-8')
    expect(content).toContain('MemberAvatarRow')
    expect(content).toContain("from '@/components/connections/member-avatar-row'")
  })

  it('dashboard page imports db from @/db', () => {
    const content = fs.readFileSync(dashboardPath, 'utf-8')
    expect(content).toContain("from '@/db'")
  })

  it('dashboard page still contains empty state copy', () => {
    const content = fs.readFileSync(dashboardPath, 'utf-8')
    // Quick 260414-82g dropped the trailing period in the heading.
    expect(content).toContain('No active challenge yet')
    expect(content).toContain('Invite friends to get started.')
  })

  it('dashboard page conditionally renders based on isInChallenge', () => {
    const content = fs.readFileSync(dashboardPath, 'utf-8')
    expect(content).toContain('isInChallenge')
  })
})
