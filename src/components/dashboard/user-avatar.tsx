interface UserAvatarProps {
  avatarUrl?: string | null
  name: string
  // size reserved for future variants
  size?: number
}

/**
 * UserAvatar — reusable avatar with ring + initials fallback.
 * Server Component (pure presentational).
 *
 * Hardcodes 48px (w-12 h-12) for v1; `size` prop preserved for forward compat.
 */
export function UserAvatar({ avatarUrl, name, size: _size }: UserAvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${name}'s avatar`}
        className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/40"
        referrerPolicy="no-referrer"
      />
    )
  }
  return (
    <div className="w-12 h-12 rounded-full bg-[#13254f] ring-2 ring-emerald-500/40 flex items-center justify-center">
      <span className="text-white text-sm font-bold">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}
