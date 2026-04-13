'use client'

interface CaptureButtonProps {
  onCapture: () => void
  disabled?: boolean
}

export function CaptureButton({ onCapture, disabled = false }: CaptureButtonProps) {
  return (
    <button
      onClick={onCapture}
      disabled={disabled}
      aria-label="Take photo"
      className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-opacity active:scale-95"
    >
      <div className="w-14 h-14 rounded-full bg-white" />
    </button>
  )
}
