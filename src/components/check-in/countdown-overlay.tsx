'use client'

interface CountdownOverlayProps {
  count: number
}

export function CountdownOverlay({ count }: CountdownOverlayProps) {
  if (count <= 0) return null

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
      <span
        key={count}
        className="text-8xl font-bold text-white animate-countdown select-none"
        style={{
          animation: 'countdown-pulse 0.8s ease-out',
        }}
      >
        {count}
      </span>

      {/* Inline keyframes for countdown pulse animation */}
      <style>{`
        @keyframes countdown-pulse {
          0% {
            transform: scale(1.5);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
