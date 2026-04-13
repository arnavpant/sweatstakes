/**
 * Week boundary utilities for Monday-Sunday fitness weeks (D-13).
 * Used by Server Components and Server Actions for progress/streak computation.
 */

/**
 * Get Monday 00:00:00 of the week containing `date`.
 * Week is Monday-Sunday per D-13.
 * For Sunday (getDay()===0), go back 6 days to get the previous Monday.
 */
export function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun, 1=Mon, 2=Tue, ...
  const diff = (day === 0 ? -6 : 1) - day // If Sunday, go back 6 days
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get Sunday 23:59:59.999 of the week containing `date`.
 */
export function getSunday(date: Date): Date {
  const monday = getMonday(date)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return sunday
}

/**
 * Get the Monday-Sunday week bounds as YYYY-MM-DD strings.
 */
export function getWeekBounds(date: Date): { start: string; end: string } {
  const monday = getMonday(date)
  const sunday = getSunday(date)
  return {
    start: formatDate(monday),
    end: formatDate(sunday),
  }
}

/**
 * Format a Date as YYYY-MM-DD string.
 */
function formatDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
