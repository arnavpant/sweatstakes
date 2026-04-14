'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import {
  detectPushEnvironment,
  urlBase64ToUint8Array,
  type PushEnvironment,
} from '@/lib/push/client-util'
import {
  subscribeUserPush,
  unsubscribeUserPush,
  setNotificationsEnabled,
} from '@/lib/actions/push'
import { ReminderHourPicker } from './reminder-hour-picker'

interface NotificationsSectionProps {
  initialEnabled: boolean
  initialReminderHour: number | null
  hasActiveSubscription: boolean
  vapidPublicKey: string
}

/**
 * Phase 5 SETT-02 — Notifications card for Settings.
 *
 * Four states:
 *   1. master OFF → just the toggle, no subsection
 *   2. master ON, already subscribed → toggle + reminder picker
 *   3. master ON, unsupported on iOS Safari tab → Add-to-Home-Screen instructions
 *   4. master ON, supported but not subscribed → "Enable notifications" button + reminder picker
 *
 * Subscription flow (handleEnable):
 *   serviceWorker.register('/sw.js') → pushManager.subscribe → subscribeUserPush Server Action.
 *   On success, router.refresh() re-renders the parent (server queries push_subscriptions again).
 */
export function NotificationsSection({
  initialEnabled,
  initialReminderHour,
  hasActiveSubscription,
  vapidPublicKey,
}: NotificationsSectionProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [subscribed, setSubscribed] = useState(hasActiveSubscription)
  const [env, setEnv] = useState<PushEnvironment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Detect push environment only after mount (navigator is undefined during SSR).
  useEffect(() => {
    setEnv(detectPushEnvironment())
  }, [])

  function handleToggle(next: boolean) {
    setError(null)
    setEnabled(next)
    startTransition(async () => {
      const result = await setNotificationsEnabled(next)
      if ('error' in result) {
        setEnabled(!next) // revert
        setError(result.error ?? 'Failed to update notifications')
      } else {
        router.refresh()
      }
    })
  }

  async function handleEnable() {
    setError(null)
    setBusy(true)
    try {
      if (!vapidPublicKey) {
        setError('Notifications are not configured. Contact support.')
        return
      }

      // Request permission up-front so we can give a useful error before the whole SW dance.
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        const perm = await Notification.requestPermission()
        if (perm === 'denied') {
          setError(
            'Notifications are blocked for this site. Enable them in your browser settings and try again.'
          )
          return
        }
      } else if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        setError(
          'Notifications are blocked for this site. Enable them in your browser settings and try again.'
        )
        return
      }

      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
      await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // TS lib.dom narrows applicationServerKey to BufferSource with ArrayBuffer-backed views;
        // urlBase64ToUint8Array returns Uint8Array<ArrayBufferLike> which is runtime-compatible.
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      })
      const json = sub.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        setError("Couldn't read subscription — try again or re-install the app")
        return
      }
      const result = await subscribeUserPush({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      })
      if ('error' in result) {
        setError(result.error ?? 'Subscription failed')
        return
      }
      setSubscribed(true)
      router.refresh()
    } catch (err) {
      console.error('[notifications] subscribe failed', err)
      setError("Couldn't subscribe — try again or re-install the app")
    } finally {
      setBusy(false)
    }
  }

  async function handleDisableDevice() {
    setError(null)
    setBusy(true)
    try {
      // Unregister on the browser too so the user can re-enable cleanly
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js')
        const sub = await reg?.pushManager.getSubscription()
        await sub?.unsubscribe()
      }
      const result = await unsubscribeUserPush()
      if ('error' in result) {
        setError(result.error ?? 'Unsubscribe failed')
        return
      }
      setSubscribed(false)
      router.refresh()
    } catch (err) {
      console.error('[notifications] unsubscribe failed', err)
      setError("Couldn't unsubscribe — try again")
    } finally {
      setBusy(false)
    }
  }

  // Determine what to show inside the card when master is ON
  const showInstallHint = enabled && env && !env.isSupported && env.isIOS && !env.isStandalone
  const showUnsupported = enabled && env && !env.isSupported && !(env.isIOS && !env.isStandalone)
  const showEnableButton = enabled && env && env.isSupported && !subscribed
  const showReminderPicker = enabled && subscribed

  return (
    <div className="bg-surface-container rounded-xl p-5 w-full space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-on-surface" aria-hidden="true" />
        <h2 className="text-base font-bold text-on-surface">Notifications</h2>
      </div>

      {/* Master switch */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-sm text-on-surface">Notifications</p>
          <p className="text-xs text-on-surface-variant">
            Check-ins, redemptions, settlements, and daily reminders.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Notifications master switch"
          disabled={isPending}
          onClick={() => handleToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
            enabled ? 'bg-secondary' : 'bg-surface-container-high'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-on-secondary transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* iOS Add-to-Home-Screen instructions */}
      {showInstallHint && (
        <div className="rounded-lg bg-surface-container-high p-4 space-y-2">
          <p className="text-sm font-bold text-on-surface">
            Add SweatStakes to your Home Screen
          </p>
          <ol className="text-sm text-on-surface-variant space-y-1 list-decimal list-inside">
            <li>Tap the Share icon in Safari</li>
            <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
            <li>Open SweatStakes from your Home Screen, then return here</li>
          </ol>
          <p className="text-xs text-on-surface-variant">
            iOS only delivers Web Push inside an installed PWA.
          </p>
        </div>
      )}

      {/* Generic unsupported fallback */}
      {showUnsupported && (
        <p className="text-sm text-on-surface-variant">
          Notifications aren&apos;t supported on this browser. Try Chrome on Android or Safari on iPhone (iOS 16.4+).
        </p>
      )}

      {/* Enable button */}
      {showEnableButton && (
        <button
          type="button"
          onClick={handleEnable}
          disabled={busy}
          className="bg-secondary text-on-secondary rounded-lg px-4 py-2 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? 'Enabling…' : 'Enable notifications'}
        </button>
      )}

      {/* Subscribed — show reminder picker + disable-this-device button */}
      {showReminderPicker && (
        <>
          <ReminderHourPicker currentHour={initialReminderHour} />
          <button
            type="button"
            onClick={handleDisableDevice}
            disabled={busy}
            className="text-xs text-on-surface-variant underline disabled:opacity-60"
          >
            {busy ? 'Disabling…' : 'Disable on this device'}
          </button>
        </>
      )}

      {error && (
        <p role="alert" className="text-error text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
