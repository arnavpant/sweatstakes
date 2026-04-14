/**
 * Phase 5 SETT-02 — Client-safe push helpers.
 * No 'server-only' import: this module is imported by Client Components
 * (Settings notifications toggle, install hint card).
 */

/**
 * Convert a base64url-encoded VAPID public key into the Uint8Array
 * format `pushManager.subscribe({ applicationServerKey })` expects.
 * Works in both browser and Node test environments.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData =
    typeof window !== 'undefined' && typeof window.atob === 'function'
      ? window.atob(base64)
      : Buffer.from(base64, 'base64').toString('binary')
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export interface PushEnvironment {
  isIOS: boolean
  isStandalone: boolean
  isSupported: boolean
}

/**
 * Detect whether the current environment can register for Web Push.
 * iOS Safari only supports push from an installed PWA (16.4+) — the bare
 * Safari tab returns isSupported=false even though `serviceWorker` exists.
 */
export function detectPushEnvironment(
  nav: Navigator = typeof navigator !== 'undefined' ? navigator : ({} as Navigator),
  win: Window = typeof window !== 'undefined' ? window : ({} as Window)
): PushEnvironment {
  const ua = nav.userAgent || ''
  const isIOS = /iPad|iPhone|iPod/.test(ua)

  const standaloneMedia = win.matchMedia?.('(display-mode: standalone)').matches ?? false
  const standaloneLegacy = (nav as unknown as { standalone?: boolean }).standalone === true
  const isStandalone = standaloneMedia || standaloneLegacy

  const hasSW = 'serviceWorker' in nav
  const hasPM = 'PushManager' in win
  // iOS push only works inside an installed PWA
  const isSupported = hasSW && hasPM && (!isIOS || isStandalone)

  return { isIOS, isStandalone, isSupported }
}
