/**
 * formatRelative — render a Date/ISO string as a short "N ago" phrase
 * using Intl.RelativeTimeFormat with numeric: 'auto' so "yesterday" is emitted
 * for one day ago rather than "1 day ago".
 *
 * `now` is injectable for deterministic tests.
 */

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function formatRelative(date: Date | string, now: Date = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diffSec = Math.round((d.getTime() - now.getTime()) / 1000)
  const abs = Math.abs(diffSec)
  if (abs < 45) return rtf.format(diffSec, 'second')
  const diffMin = Math.round(diffSec / 60)
  if (Math.abs(diffMin) < 45) return rtf.format(diffMin, 'minute')
  const diffHr = Math.round(diffMin / 60)
  if (Math.abs(diffHr) < 22) return rtf.format(diffHr, 'hour')
  const diffDay = Math.round(diffHr / 24)
  return rtf.format(diffDay, 'day')
}
