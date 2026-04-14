'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { submitCheckInAction } from '@/lib/actions/check-ins'

interface PhotoPreviewProps {
  compositeBlob: Blob
  selfieBlob: Blob | null
  onRetake: () => void
  onSuccess: () => void
}

export function PhotoPreview({ compositeBlob, selfieBlob, onRetake, onSuccess }: PhotoPreviewProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  // Create and manage object URL for the composite blob
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(compositeBlob)
    objectUrlRef.current = url
    setPreviewUrl(url)

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [compositeBlob])

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      // Step 1: Compress the photo
      const file = new File([compositeBlob], 'check-in.jpg', { type: 'image/jpeg' })
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg',
      })

      // Step 2: Upload composite to Supabase Storage
      const supabase = createClient()
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !user) {
        setError('Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }
      const stamp = `${Date.now()}-${crypto.randomUUID()}`
      const fileName = `${user.id}/${stamp}.jpg`
      const { data, error: uploadError } = await supabase.storage
        .from('check-in-photos')
        .upload(fileName, compressed, {
          cacheControl: '31536000',
          contentType: 'image/jpeg',
          upsert: false,
        })

      if (uploadError) {
        setError('Failed to upload photo. Please try again.')
        setSubmitting(false)
        return
      }

      // Step 3: Get public URL for composite
      const { data: urlData } = supabase.storage
        .from('check-in-photos')
        .getPublicUrl(data.path)

      // Step 3b: Compress + upload standalone selfie (used by Dashboard gallery).
      // Best-effort: if it fails, the check-in still succeeds with composite only.
      let selfieUrl: string | null = null
      if (selfieBlob) {
        try {
          const selfieFile = new File([selfieBlob], 'selfie.jpg', { type: 'image/jpeg' })
          const compressedSelfie = await imageCompression(selfieFile, {
            maxSizeMB: 0.2,
            maxWidthOrHeight: 640,
            useWebWorker: true,
            fileType: 'image/jpeg',
          })
          const selfieName = `${user.id}/${stamp}-selfie.jpg`
          const { data: selfieData, error: selfieErr } = await supabase.storage
            .from('check-in-photos')
            .upload(selfieName, compressedSelfie, {
              cacheControl: '31536000',
              contentType: 'image/jpeg',
              upsert: false,
            })
          if (!selfieErr && selfieData) {
            selfieUrl = supabase.storage
              .from('check-in-photos')
              .getPublicUrl(selfieData.path).data.publicUrl
          }
        } catch {
          // Swallow — selfie is optional.
        }
      }

      // Step 4: Get today's date in local timezone
      const today = new Date()
      const checkedInDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      // Step 5: Call server action to record check-in
      const result = await submitCheckInAction(urlData.publicUrl, checkedInDate, selfieUrl)

      if ('error' in result && result.error) {
        setError(result.error)
        setSubmitting(false)
        return
      }

      // Success
      onSuccess()
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Photo preview */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Check-in photo preview"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="px-6 pb-2">
          <p className="text-error text-sm text-center">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-6 pb-[env(safe-area-inset-bottom,16px)]">
        <div className="flex gap-4 py-4">
          {/* Retake button */}
          <button
            onClick={onRetake}
            disabled={submitting}
            className="flex-1 rounded-full py-3 border border-on-surface/30 text-on-surface font-bold text-sm min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            Retake
          </button>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-full py-3 bg-secondary text-on-secondary font-bold text-sm min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
