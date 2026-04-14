import { describe, it, expect } from 'vitest'
import { detectPushEnvironment, urlBase64ToUint8Array } from '@/lib/push/client-util'

/**
 * Phase 5 Plan 01 — detectPushEnvironment behavior across the four UA scenarios.
 * iOS push only works inside an installed PWA (16.4+) — bare Safari tabs return false.
 */

interface MockNav {
  userAgent: string
  serviceWorker?: object
  standalone?: boolean
}
interface MockWin {
  PushManager?: object
  matchMedia?: (q: string) => { matches: boolean }
}

function mkNav(opts: Partial<MockNav>): Navigator {
  return {
    userAgent: '',
    serviceWorker: {},
    ...opts,
  } as unknown as Navigator
}

function mkWin(standaloneMedia: boolean, hasPushManager = true): Window {
  const win: MockWin = {
    matchMedia: (_q: string) => ({ matches: standaloneMedia }),
  }
  if (hasPushManager) win.PushManager = {}
  return win as unknown as Window
}

describe('detectPushEnvironment', () => {
  it('iOS Safari tab (not installed) → not supported', () => {
    const nav = mkNav({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
      standalone: false,
    })
    const win = mkWin(false)
    expect(detectPushEnvironment(nav, win)).toEqual({
      isIOS: true,
      isStandalone: false,
      isSupported: false,
    })
  })

  it('iOS installed PWA (navigator.standalone=true) → supported', () => {
    const nav = mkNav({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
      standalone: true,
    })
    const win = mkWin(false)
    expect(detectPushEnvironment(nav, win)).toEqual({
      isIOS: true,
      isStandalone: true,
      isSupported: true,
    })
  })

  it('Android Chrome with display-mode standalone → supported', () => {
    const nav = mkNav({
      userAgent:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0',
    })
    const win = mkWin(true)
    expect(detectPushEnvironment(nav, win)).toEqual({
      isIOS: false,
      isStandalone: true,
      isSupported: true,
    })
  })

  it('Desktop Chrome (no standalone) → supported', () => {
    const nav = mkNav({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0',
    })
    const win = mkWin(false)
    expect(detectPushEnvironment(nav, win)).toEqual({
      isIOS: false,
      isStandalone: false,
      isSupported: true,
    })
  })

  it('Browser without PushManager → not supported', () => {
    const nav = mkNav({
      userAgent: 'Mozilla/5.0 (compatible; OldBrowser/1.0)',
    })
    const win = mkWin(false, false)
    expect(detectPushEnvironment(nav, win)).toEqual({
      isIOS: false,
      isStandalone: false,
      isSupported: false,
    })
  })
})

describe('urlBase64ToUint8Array', () => {
  it('decodes a base64url string back to bytes', () => {
    // 'hello' → base64 'aGVsbG8=' → base64url 'aGVsbG8'
    const out = urlBase64ToUint8Array('aGVsbG8')
    expect(Array.from(out)).toEqual([104, 101, 108, 108, 111])
  })

  it('handles base64url-specific chars (- and _)', () => {
    // bytes [251, 255, 191] → base64 '+/+/' → base64url '-_-_'
    const out = urlBase64ToUint8Array('-_-_')
    expect(out.length).toBe(3)
  })
})
