import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Phase 5 Plan 04 — Profile Server Actions tests.
 * Asserts:
 *   - updateDisplayNameAction: trims, updates challenge_members.display_name AND auth.users.user_metadata.full_name
 *   - updateDisplayNameAction: rejects empty (whitespace-only) and >40-char strings
 *   - updateDisplayNameAction: preserves other user_metadata keys (avatar_url, etc.) when updating full_name
 *   - updateAvatarUrlAction: writes cache-busted URL to challenge_members.avatar_url when URL is valid
 *   - updateAvatarUrlAction: rejects non-URL strings
 *   - updateAvatarUrlAction: rejects URLs that don't start with NEXT_PUBLIC_SUPABASE_URL (SSRF defense)
 *   - Both actions return { error: 'Not authenticated' } when no session
 */

// --- Mock Supabase server client (controllable user + metadata) ---
let currentUser: { id: string; user_metadata: Record<string, unknown> } | null = null
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: currentUser } }),
    },
  }),
}))

// --- Mock Supabase admin client — capture updateUserById calls ---
const updateUserByIdSpy = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        updateUserById: (id: string, attrs: unknown) => {
          updateUserByIdSpy(id, attrs)
          return Promise.resolve({ data: null, error: null })
        },
      },
    },
  }),
}))

// --- Capture db update calls ---
const updateSetSpy = vi.fn()
const updateWhereSpy = vi.fn()
vi.mock('@/db', () => ({
  db: {
    update: () => ({
      set: (v: unknown) => {
        updateSetSpy(v)
        return {
          where: (c: unknown) => {
            updateWhereSpy(c)
            return Promise.resolve()
          },
        }
      },
    }),
  },
}))

vi.mock('@/db/schema', () => ({
  challengeMembers: {
    userId: 'user_id_col',
    displayName: 'display_name_col',
    avatarUrl: 'avatar_url_col',
  },
}))

// Fix the Supabase URL for the SSRF guard test
const SUPABASE_URL = 'https://project-abc.supabase.co'

beforeEach(() => {
  currentUser = {
    id: 'user-1',
    user_metadata: { full_name: 'Old Name', avatar_url: 'https://google.com/old.jpg' },
  }
  updateUserByIdSpy.mockReset()
  updateSetSpy.mockReset()
  updateWhereSpy.mockReset()
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL
})

describe('updateDisplayNameAction', () => {
  it('trims and updates both challenge_members.display_name AND auth.users.user_metadata.full_name', async () => {
    const { updateDisplayNameAction } = await import('@/lib/actions/profile')
    const result = await updateDisplayNameAction('  Arnav  ')

    expect(result).toEqual({ success: true })
    expect(updateSetSpy).toHaveBeenCalledWith({ displayName: 'Arnav' })
    expect(updateWhereSpy).toHaveBeenCalledTimes(1)
    expect(updateUserByIdSpy).toHaveBeenCalledTimes(1)
    expect(updateUserByIdSpy).toHaveBeenCalledWith(
      'user-1',
      { user_metadata: expect.objectContaining({ full_name: 'Arnav' }) }
    )
  })

  it('rejects whitespace-only names', async () => {
    const { updateDisplayNameAction } = await import('@/lib/actions/profile')
    const result = await updateDisplayNameAction('   ')
    expect(result).toEqual({ error: 'Name cannot be empty' })
    expect(updateSetSpy).not.toHaveBeenCalled()
    expect(updateUserByIdSpy).not.toHaveBeenCalled()
  })

  it('rejects 41-character names (max 40)', async () => {
    const { updateDisplayNameAction } = await import('@/lib/actions/profile')
    const result = await updateDisplayNameAction('a'.repeat(41))
    expect('error' in result).toBe(true)
    expect(updateSetSpy).not.toHaveBeenCalled()
  })

  it('preserves existing user_metadata keys (avatar_url) when updating full_name', async () => {
    const { updateDisplayNameAction } = await import('@/lib/actions/profile')
    await updateDisplayNameAction('New Name')

    expect(updateUserByIdSpy).toHaveBeenCalledWith(
      'user-1',
      { user_metadata: { full_name: 'New Name', avatar_url: 'https://google.com/old.jpg' } }
    )
  })

  it('returns { error: Not authenticated } when no session', async () => {
    currentUser = null
    const { updateDisplayNameAction } = await import('@/lib/actions/profile')
    const result = await updateDisplayNameAction('Arnav')
    expect(result).toEqual({ error: 'Not authenticated' })
    expect(updateSetSpy).not.toHaveBeenCalled()
  })
})

describe('updateAvatarUrlAction', () => {
  it('writes cache-busted URL to challenge_members.avatar_url when URL is valid', async () => {
    const { updateAvatarUrlAction } = await import('@/lib/actions/profile')
    const url = `${SUPABASE_URL}/storage/v1/object/public/avatars/user-1/avatar.jpg`
    const result = await updateAvatarUrlAction(url)

    expect(result).toEqual({ success: true })
    expect(updateSetSpy).toHaveBeenCalledTimes(1)
    const setArg = updateSetSpy.mock.calls[0][0] as { avatarUrl: string }
    expect(setArg.avatarUrl.startsWith(url + '?v=')).toBe(true)
    // cache-bust value should be a number (timestamp)
    const v = setArg.avatarUrl.split('?v=')[1]
    expect(Number.isFinite(Number(v))).toBe(true)
  })

  it('rejects non-URL strings', async () => {
    const { updateAvatarUrlAction } = await import('@/lib/actions/profile')
    const result = await updateAvatarUrlAction('not-a-url')
    expect(result).toEqual({ error: 'Invalid URL' })
    expect(updateSetSpy).not.toHaveBeenCalled()
  })

  it('rejects URLs not starting with NEXT_PUBLIC_SUPABASE_URL (SSRF defense)', async () => {
    const { updateAvatarUrlAction } = await import('@/lib/actions/profile')
    const result = await updateAvatarUrlAction('https://evil.example.com/pwned.jpg')
    expect(result).toEqual({ error: 'Invalid URL' })
    expect(updateSetSpy).not.toHaveBeenCalled()
  })

  it('returns { error: Not authenticated } when no session', async () => {
    currentUser = null
    const { updateAvatarUrlAction } = await import('@/lib/actions/profile')
    const result = await updateAvatarUrlAction(`${SUPABASE_URL}/anything`)
    expect(result).toEqual({ error: 'Not authenticated' })
    expect(updateSetSpy).not.toHaveBeenCalled()
  })
})
