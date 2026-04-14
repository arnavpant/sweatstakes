'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, SwitchCamera } from 'lucide-react'
import { CaptureButton } from './capture-button'
import { CountdownOverlay } from './countdown-overlay'
import { PhotoPreview } from './photo-preview'

type CameraPhase =
  | 'selfie-capture'
  | 'rear-countdown'
  | 'rear-auto-capture'
  | 'preview'
  | 'submitting'
  | 'done'

export function CameraView() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [phase, setPhase] = useState<CameraPhase>('selfie-capture')
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null)
  const [compositeBlob, setCompositeBlob] = useState<Blob | null>(null)
  const [countdown, setCountdown] = useState(3)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user')

  // Stop all tracks on a given stream
  const stopTracks = useCallback((stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
  }, [])

  // Open camera with given facing mode
  const openCamera = useCallback(async (facing: 'environment' | 'user', opts?: { width?: number; height?: number }) => {
    // Check for secure context / camera API availability
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Camera requires a secure connection (HTTPS). Please access this page over HTTPS.')
      return null
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: opts?.width ?? 1920 },
          height: { ideal: opts?.height ?? 1080 },
        },
      })

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      streamRef.current = stream
      return stream
    } catch (err) {
      const e = err as Error
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.')
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError('Unable to access camera. Please try again.')
      }
      return null
    }
  }, [])

  // Capture the current video frame as a Blob
  const captureFrame = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current
    if (!video) return null

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0)

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.9
      )
    })
  }, [])

  // Create composite image: rear photo full-size with selfie thumbnail in top-left
  const createComposite = useCallback(async (rear: Blob, selfie: Blob): Promise<Blob | null> => {
    const rearImg = await createImageBitmap(rear)
    const selfieImg = await createImageBitmap(selfie)

    const canvas = document.createElement('canvas')
    canvas.width = rearImg.width
    canvas.height = rearImg.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Draw rear photo full-size
    ctx.drawImage(rearImg, 0, 0)

    // Draw selfie in top-left with rounded corners
    const selfieSize = Math.round(canvas.width * 0.25) // 25% of canvas width
    const margin = 16
    const radius = 12

    // Clip to rounded rectangle for selfie thumbnail
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(margin, margin, selfieSize, selfieSize, radius)
    ctx.clip()
    ctx.drawImage(selfieImg, margin, margin, selfieSize, selfieSize)
    ctx.restore()

    // Draw white border around selfie thumbnail
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(margin, margin, selfieSize, selfieSize, radius)
    ctx.stroke()

    // Clean up ImageBitmaps
    rearImg.close()
    selfieImg.close()

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.92
      )
    })
  }, [])

  // Initialize selfie camera on mount
  useEffect(() => {
    let mounted = true

    const init = async () => {
      const stream = await openCamera('user')
      if (!stream && mounted) {
        // Error already set by openCamera
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [openCamera])

  // Cleanup: stop all tracks on unmount
  useEffect(() => {
    return () => {
      stopTracks(streamRef.current)
      streamRef.current = null
    }
  }, [stopTracks])

  // Cleanup: stop tracks when page visibility changes (user navigates away)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && streamRef.current) {
        stopTracks(streamRef.current)
        streamRef.current = null
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [stopTracks])

  // Rear countdown timer
  useEffect(() => {
    if (phase !== 'rear-countdown') return

    if (countdown <= 0) {
      // Auto-capture rear photo when countdown reaches 0
      const autoCapture = async () => {
        setPhase('rear-auto-capture')
        const rear = await captureFrame()

        // Stop rear camera tracks
        stopTracks(streamRef.current)
        streamRef.current = null

        if (rear && selfieBlob) {
          const composite = await createComposite(rear, selfieBlob)
          if (composite) {
            setCompositeBlob(composite)
            setPhase('preview')
          } else {
            setError('Failed to create composite image. Please try again.')
            setPhase('selfie-capture')
          }
        } else {
          setError('Failed to capture rear photo. Please try again.')
          setPhase('selfie-capture')
        }
      }

      autoCapture()
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [phase, countdown, selfieBlob, captureFrame, createComposite, stopTracks])

  // Handle selfie camera shutter tap
  const handleSelfieCapture = async () => {
    const blob = await captureFrame()
    if (!blob) {
      setError('Failed to capture photo. Please try again.')
      return
    }

    setSelfieBlob(blob)

    // Stop selfie camera tracks
    stopTracks(streamRef.current)
    streamRef.current = null

    // Open rear camera for environment photo
    const rearStream = await openCamera('environment')
    if (rearStream) {
      setCountdown(3)
      setPhase('rear-countdown')
    } else {
      // If rear camera fails (e.g. laptop with single camera), show error
      setError('Rear camera not available. Please try on a device with two cameras.')
    }
  }

  // Handle flip camera during selfie-capture phase
  const handleFlipCamera = async () => {
    if (phase !== 'selfie-capture') return

    stopTracks(streamRef.current)
    streamRef.current = null

    const newFacing = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newFacing)

    await openCamera(newFacing)
  }

  // Handle retake: restart entire flow
  const handleRetake = async () => {
    setSelfieBlob(null)
    setCompositeBlob(null)
    setCountdown(3)
    setError(null)
    setFacingMode('user')
    setPhase('selfie-capture')

    await openCamera('user')
  }

  // Handle success: navigate back to dashboard
  const handleSuccess = () => {
    setPhase('done')
    router.push('/dashboard')
  }

  // Handle close/back
  const handleClose = () => {
    stopTracks(streamRef.current)
    streamRef.current = null
    router.back()
  }

  // Error state
  if (error && phase !== 'rear-countdown' && phase !== 'rear-auto-capture') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-error text-lg mb-6">{error}</p>
          <button
            onClick={handleClose}
            className="rounded-full px-6 py-3 bg-surface-container-high text-on-surface font-bold text-sm min-h-[44px]"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Preview phase
  if (phase === 'preview' && compositeBlob) {
    return (
      <PhotoPreview
        compositeBlob={compositeBlob}
        selfieBlob={selfieBlob}
        onRetake={handleRetake}
        onSuccess={handleSuccess}
      />
    )
  }

  // Camera view (rear-capture, selfie-countdown, selfie-capture)
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Video feed - full screen */}
      <div className="relative flex-1 overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${
            phase === 'selfie-capture' ? 'scale-x-[-1]' : ''
          }`}
          style={
            phase === 'selfie-capture'
              ? { transform: 'scaleX(-1)' }
              : undefined
          }
        />

        {/* Countdown overlay */}
        {phase === 'rear-countdown' && (
          <CountdownOverlay count={countdown} />
        )}

        {/* Top controls */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-[env(safe-area-inset-top,16px)]">
          {/* Close/back button */}
          <button
            onClick={handleClose}
            aria-label="Go back"
            className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          {/* Flip camera button (only during selfie capture) */}
          {phase === 'selfie-capture' && (
            <button
              onClick={handleFlipCamera}
              aria-label="Switch camera"
              className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center"
            >
              <SwitchCamera className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Phase indicator for rear capture */}
        {(phase === 'rear-countdown' || phase === 'rear-auto-capture') && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pt-[env(safe-area-inset-top,16px)]">
            <span className="bg-black/40 text-white text-sm font-medium px-3 py-1.5 rounded-full">
              Show your workout!
            </span>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-black/80 pb-[env(safe-area-inset-bottom,16px)]">
        <div className="flex items-center justify-center py-6">
          {phase === 'selfie-capture' && (
            <CaptureButton onCapture={handleSelfieCapture} />
          )}

          {(phase === 'rear-countdown' || phase === 'rear-auto-capture') && (
            <div className="text-on-surface-variant text-sm font-medium">
              Hold still...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
