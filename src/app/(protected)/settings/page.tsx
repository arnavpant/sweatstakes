import { Construction } from 'lucide-react'
import { SignOutButton } from '@/components/auth/sign-out-button'

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center pt-24 px-6 space-y-6">
      {/* Placeholder content */}
      <div className="bg-surface-container rounded-xl p-6 w-full max-w-sm text-center space-y-3">
        <Construction className="h-10 w-10 text-on-surface-variant mx-auto" />
        <h1 className="text-2xl font-bold text-on-surface">Settings</h1>
        <p className="text-base text-on-surface-variant">
          This is coming in a future update.
        </p>
      </div>

      {/* Sign-out button (per D-17, D-18) — client component with loading state */}
      <SignOutButton />
    </div>
  )
}
