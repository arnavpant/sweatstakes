import { Construction } from 'lucide-react'

export default function StreaksPage() {
  return (
    <div className="flex flex-col items-center justify-center pt-24 px-6">
      <div className="bg-surface-container rounded-xl p-6 w-full max-w-sm text-center space-y-3">
        <Construction className="h-10 w-10 text-on-surface-variant mx-auto" />
        <h1 className="text-2xl font-bold text-on-surface">Streaks</h1>
        <p className="text-base text-on-surface-variant">
          This is coming in a future update.
        </p>
      </div>
    </div>
  )
}
