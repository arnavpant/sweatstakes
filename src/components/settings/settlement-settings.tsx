'use client'

import { useState, useTransition } from 'react'
import { updateSettlementSettingsAction } from '@/lib/actions/points'
import { Loader2 } from 'lucide-react'

interface SettlementSettingsProps {
  currentTimezone: string
  currentHour: number
}

export function SettlementSettings({ currentTimezone, currentHour }: SettlementSettingsProps) {
  const [timezone, setTimezone] = useState(currentTimezone)
  const [hour, setHour] = useState(currentHour)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Get all IANA timezones from the runtime
  const timezones = Intl.supportedValuesOf('timeZone')

  // Generate 24 hourly options
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const hasChanges = timezone !== currentTimezone || hour !== currentHour

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await updateSettlementSettingsAction({ timezone, settlementHour: hour })
      if (result.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="bg-surface-container rounded-xl p-4 space-y-4">
      <h2 className="text-xl font-bold text-on-surface">Settlement Settings</h2>

      {/* Timezone picker */}
      <div className="space-y-1.5">
        <label
          htmlFor="timezone-select"
          className="text-xs font-bold text-on-surface-variant uppercase tracking-widest"
        >
          Group timezone
        </label>
        <select
          id="timezone-select"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="bg-surface-container-high text-on-surface rounded-xl px-4 py-3 w-full border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none text-base"
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <p className="text-xs text-on-surface-variant">Changes affect the whole group.</p>
      </div>

      {/* Settlement hour picker */}
      <div className="space-y-1.5">
        <label
          htmlFor="hour-select"
          className="text-xs font-bold text-on-surface-variant uppercase tracking-widest"
        >
          Settlement time (Monday)
        </label>
        <select
          id="hour-select"
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          className="bg-surface-container-high text-on-surface rounded-xl px-4 py-3 w-full border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none text-base"
        >
          {hours.map((h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, '0')}:00
            </option>
          ))}
        </select>
        <p className="text-xs text-on-surface-variant">
          The week settles Monday at this time in your group's timezone.
        </p>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!hasChanges || isPending}
        className="bg-secondary text-on-secondary font-bold rounded-full w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        aria-busy={isPending}
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          'Save settlement settings'
        )}
      </button>
    </div>
  )
}
