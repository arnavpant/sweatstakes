'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setReminderHour } from '@/lib/actions/push'

interface ReminderHourPickerProps {
  currentHour: number | null
}

/**
 * 24-hour reminder time picker bound to challenge_members.reminder_hour.
 * Emits null for "Off" (clears the column → cron skips this user).
 */
export function ReminderHourPicker({ currentHour }: ReminderHourPickerProps) {
  const [hour, setHour] = useState<number | null>(currentHour)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function labelFor(h: number): string {
    if (h === 0) return '12 AM'
    if (h === 12) return '12 PM'
    if (h < 12) return `${h} AM`
    return `${h - 12} PM`
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const raw = e.target.value
    const next = raw === 'off' ? null : Number(raw)
    setHour(next)
    setError(null)
    startTransition(async () => {
      const result = await setReminderHour(next)
      if ('error' in result) {
        setError(result.error ?? 'Failed to update reminder')
        setHour(currentHour) // revert
      } else {
        router.refresh()
      }
    })
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="reminder-hour-select"
        className="text-xs font-bold text-on-surface-variant uppercase tracking-widest"
      >
        Remind me at
      </label>
      <select
        id="reminder-hour-select"
        value={hour === null ? 'off' : String(hour)}
        onChange={handleChange}
        disabled={isPending}
        className="bg-surface-container-high text-on-surface rounded-xl px-4 py-3 w-full border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none text-base disabled:opacity-60"
      >
        <option value="off">Off</option>
        {hours.map((h) => (
          <option key={h} value={h}>
            {labelFor(h)}
          </option>
        ))}
      </select>
      {error && <p role="alert" className="text-error text-sm">{error}</p>}
    </div>
  )
}
