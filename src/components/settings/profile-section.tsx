import { AvatarUploader } from './avatar-uploader'
import { DisplayNameEditor } from './display-name-editor'

interface Props {
  userId: string
  displayName: string
  customAvatarUrl: string | null
  googleAvatarUrl: string | null
}

export function ProfileSection({ userId, displayName, customAvatarUrl, googleAvatarUrl }: Props) {
  return (
    <div className="bg-surface-container rounded-xl p-5 w-full space-y-4">
      <h2 className="text-base font-bold text-on-surface">Profile</h2>
      <AvatarUploader
        userId={userId}
        currentAvatarUrl={customAvatarUrl}
        fallbackAvatarUrl={googleAvatarUrl}
        displayName={displayName}
      />
      <DisplayNameEditor currentName={displayName} />
    </div>
  )
}
