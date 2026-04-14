'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import { Camera, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateAvatarUrlAction } from '@/lib/actions/profile'

interface Props {
  userId: string
  currentAvatarUrl: string | null
  fallbackAvatarUrl: string | null
  displayName: string
}

const MAX_SOURCE_BYTES = 5 * 1024 * 1024

export function AvatarUploader({ userId, currentAvatarUrl, fallbackAvatarUrl, displayName }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const displayUrl = currentAvatarUrl || fallbackAvatarUrl

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    if (!file.type.startsWith('image/')) {
      setError('Please pick an image file.')
      return
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError('Image is too large. Pick one under 5 MB.')
      return
    }

    setUploading(true)
    try {
      // Compress to ~512px / ~100 KB JPEG (re-encode via canvas strips EXIF — T-05-04-08)
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 512,
        fileType: 'image/jpeg',
        useWebWorker: true,
      })

      const supabase = createClient()
      const path = `${userId}/avatar.jpg`
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })

      if (uploadErr) throw uploadErr

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      const result = await updateAvatarUrlAction(pub.publicUrl)
      if ('error' in result) {
        setError(result.error ?? 'Upload failed.')
        return
      }

      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Upload failed. Try again.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt={displayName}
            className="w-16 h-16 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center">
            <span className="text-on-surface text-xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="h-5 w-5 animate-spin text-on-surface" />
          </div>
        )}
      </div>
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 bg-secondary text-on-secondary rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-60"
        >
          <Camera className="h-4 w-4" />
          {currentAvatarUrl ? 'Change photo' : 'Upload photo'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    </div>
  )
}
