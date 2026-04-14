import { computeLeaderCallout, type LeaderCalloutInput } from '@/lib/utils/leader-callout'

/**
 * LeaderCallout — DASH-01 viewer-POV motivational headline.
 * Server Component. Consumes balances from getBalancesForChallenge and the
 * authenticated user's id to personalize the phrasing.
 */
export function LeaderCallout({
  balances,
  viewerUserId,
}: {
  balances: LeaderCalloutInput[]
  viewerUserId: string
}) {
  const text = computeLeaderCallout(balances, viewerUserId)
  return (
    <div className="bg-surface-container rounded-xl p-4">
      <p className="text-base font-bold text-on-surface text-center">{text}</p>
    </div>
  )
}
