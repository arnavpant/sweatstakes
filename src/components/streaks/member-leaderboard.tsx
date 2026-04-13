interface LeaderboardMember {
  userId: string
  displayName: string
  avatarUrl: string | null
  balance: number
}

interface MemberLeaderboardProps {
  members: LeaderboardMember[]
  currentUserId: string
}

export function MemberLeaderboard({ members, currentUserId }: MemberLeaderboardProps) {
  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-on-surface">Balances</h2>
        <span className="text-xs text-on-surface-variant">(updated after weekly settlement)</span>
      </div>

      {/* Leaderboard list */}
      <div className="space-y-2">
        {members.map((member, index) => {
          const isCurrentUser = member.userId === currentUserId
          const rank = index + 1

          return (
            <div
              key={member.userId}
              className={`bg-surface-container rounded-xl px-4 py-3 flex items-center gap-3 min-h-14${
                isCurrentUser ? ' ring-1 ring-secondary/30' : ''
              }`}
            >
              {/* Rank */}
              <span className="text-sm font-bold text-on-surface-variant w-5">{rank}</span>

              {/* Avatar */}
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.displayName}
                  className="w-9 h-9 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center">
                  <span className="text-sm font-bold text-on-surface-variant">
                    {member.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Display name */}
              <span className="text-base text-on-surface flex-1 truncate">
                {member.displayName}
                {isCurrentUser && (
                  <span className="text-on-surface-variant"> (You)</span>
                )}
              </span>

              {/* Balance */}
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-xl font-bold ${
                    member.balance > 0
                      ? 'text-secondary'
                      : member.balance < 0
                        ? 'text-error'
                        : 'text-on-surface-variant'
                  }`}
                >
                  {member.balance < 0 ? `\u2212${Math.abs(member.balance)}` : member.balance}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">pts</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
