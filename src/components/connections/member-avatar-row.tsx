interface Member {
  displayName: string
  avatarUrl: string | null
  userId: string
}

interface MemberAvatarRowProps {
  members: Member[]
}

const MAX_VISIBLE = 5

export function MemberAvatarRow({ members }: MemberAvatarRowProps) {
  const visible = members.slice(0, MAX_VISIBLE)
  const overflow = members.length - MAX_VISIBLE

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visible.map((member) => (
          <div
            key={member.userId}
            className="w-8 h-8 rounded-full border-2 border-background flex-shrink-0 overflow-hidden"
            title={member.displayName}
          >
            {member.avatarUrl ? (
              <img
                src={member.avatarUrl}
                alt={member.displayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                <span className="text-xs font-bold text-on-surface">
                  {member.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        ))}
        {overflow > 0 && (
          <div className="w-8 h-8 rounded-full border-2 border-background bg-surface-container-high flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-on-surface-variant">
              +{overflow}
            </span>
          </div>
        )}
      </div>
      <span className="ml-3 text-sm text-on-surface-variant">
        Challenge active — {members.length} {members.length === 1 ? 'member' : 'members'}
      </span>
    </div>
  )
}
