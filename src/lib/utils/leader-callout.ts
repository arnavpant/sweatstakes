/**
 * computeLeaderCallout — viewer-POV motivational line for the Dashboard (DASH-01).
 *
 * Pure function, no DB access. Takes the full list of member balances and the
 * current viewer's userId, returns a single string customized from their POV.
 *
 * Locked user decisions (see 05-CONTEXT.md DASH-01):
 *   - "No stakes settled yet — keep checking in" when all balances are zero OR empty
 *   - "You lead with N pts" when viewer is sole leader and everyone else has the same balance
 *     (or no runner-up exists)
 *   - "You lead with N pts — G ahead of X" when viewer is sole leader with a gap
 *   - "You and X tied at N pts" when viewer ties with exactly one person at the top
 *   - "You're tied for the lead with K others at N pts" when multi-way tie at top
 *   - "You're G behind X" when viewer is not leading
 *   - "You're G behind X — closest: Y at M pts" adds the runner-up-above-viewer tail when present
 */

export interface LeaderCalloutInput {
  userId: string
  displayName: string
  balance: number
}

export function computeLeaderCallout(
  balances: LeaderCalloutInput[],
  viewerUserId: string
): string {
  if (balances.length === 0) return 'No stakes settled yet — keep checking in'

  // Sort desc by balance; tie-break alphabetically by displayName for determinism
  const sorted = [...balances].sort((a, b) => {
    if (b.balance !== a.balance) return b.balance - a.balance
    return a.displayName.localeCompare(b.displayName)
  })

  if (sorted.every((b) => b.balance === 0)) {
    return 'No stakes settled yet — keep checking in'
  }

  const viewer = sorted.find((b) => b.userId === viewerUserId)
  const leader = sorted[0]
  const runnerUp = sorted.find((b) => b.balance !== leader.balance)

  // Viewer is the (or a) leader
  if (viewer && viewer.balance === leader.balance) {
    const otherTied = sorted.filter(
      (b) => b.balance === leader.balance && b.userId !== viewerUserId
    )
    if (otherTied.length === 0) {
      // Viewer is sole leader
      if (!runnerUp) {
        return `You lead with ${leader.balance} pts`
      }
      return `You lead with ${leader.balance} pts — ${
        leader.balance - runnerUp.balance
      } ahead of ${runnerUp.displayName}`
    }
    if (otherTied.length === 1) {
      return `You and ${otherTied[0].displayName} tied at ${leader.balance} pts`
    }
    return `You're tied for the lead with ${otherTied.length} others at ${leader.balance} pts`
  }

  // Viewer not in balances (defensive) — fall back to leader-centric phrasing
  if (!viewer) {
    return `${leader.displayName} leads with ${leader.balance} pts`
  }

  // Viewer is not leading
  const gap = leader.balance - viewer.balance
  // Closest person ahead of viewer that isn't the leader (for the "— closest: X at N pts" tail)
  const aheadOfViewer = sorted.filter(
    (b) => b.balance > viewer.balance && b.userId !== leader.userId
  )
  if (aheadOfViewer.length > 0) {
    // Smallest lead over viewer = last one in desc-sorted list
    const closest = aheadOfViewer[aheadOfViewer.length - 1]
    return `You're ${gap} behind ${leader.displayName} — closest: ${closest.displayName} at ${closest.balance} pts`
  }
  return `You're ${gap} behind ${leader.displayName}`
}
