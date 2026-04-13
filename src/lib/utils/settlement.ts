/**
 * Pure settlement algorithm for the points economy.
 * No database dependencies — importable in tests without DATABASE_URL.
 *
 * Per D-02: 1 point earned per misser for each hitter.
 * Per D-03: Each misser owes 1 point per hitter.
 * Per D-04: Wash rule — all miss, no points change.
 */

export interface MemberProgress {
  userId: string
  checkedInCount: number
  weeklyGoal: number
}

export interface SettlementTransaction {
  userId: string
  delta: number       // positive = earned, negative = penalty
  reason: 'earned' | 'penalty'
}

export interface SettlementResult {
  washRule: boolean
  hitters: string[]   // userIds who met goal
  missers: string[]   // userIds who missed
  transactions: SettlementTransaction[]
}

export function computeSettlement(members: MemberProgress[]): SettlementResult {
  // Separate hitters (checkedInCount >= weeklyGoal) from missers
  const hitters = members.filter(m => m.checkedInCount >= m.weeklyGoal)
  const missers = members.filter(m => m.checkedInCount < m.weeklyGoal)

  // D-04: Wash rule — if ALL miss (0 hitters), no points change
  if (hitters.length === 0) {
    return {
      washRule: true,
      hitters: [],
      missers: members.map(m => m.userId),
      transactions: [],
    }
  }

  const transactions: SettlementTransaction[] = []

  // D-02: Each hitter earns 1 point per misser
  for (const hitter of hitters) {
    transactions.push({
      userId: hitter.userId,
      delta: missers.length,   // 0 if no missers
      reason: 'earned',
    })
  }

  // D-03: Each misser owes 1 point per hitter
  for (const misser of missers) {
    transactions.push({
      userId: misser.userId,
      delta: -hitters.length,
      reason: 'penalty',
    })
  }

  return {
    washRule: false,
    hitters: hitters.map(m => m.userId),
    missers: missers.map(m => m.userId),
    transactions,
  }
}

/**
 * Compute the personal best (longest) streak from an array of weekly hit/miss results.
 * weekResults is ordered oldest-first: true = met goal that week, false = missed.
 * Returns the length of the longest consecutive true run.
 */
export function computePersonalBest(weekResults: boolean[]): number {
  let maxStreak = 0
  let currentStreak = 0
  for (const hit of weekResults) {
    if (hit) {
      currentStreak++
      if (currentStreak > maxStreak) maxStreak = currentStreak
    } else {
      currentStreak = 0
    }
  }
  return maxStreak
}
