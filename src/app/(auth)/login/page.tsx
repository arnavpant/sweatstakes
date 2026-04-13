import { Suspense } from 'react'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'

export default function LoginPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Decorative background blobs (per UI-SPEC) */}
      <div className="absolute top-0 left-0 w-[50vw] h-[50vw] bg-secondary/10 rounded-full blur-[120px] -translate-x-1/4 -translate-y-1/4 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] bg-primary-container/30 rounded-full blur-[120px] translate-x-1/4 translate-y-1/4 pointer-events-none" />

      {/* Content — stacked vertically, centered */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm space-y-8">
        {/* Logo icon container (per UI-SPEC: 80x80, rounded-xl, primary-container bg, emerald glow) */}
        <div className="w-20 h-20 rounded-xl bg-primary-container emerald-glow flex items-center justify-center">
          {/* Placeholder Material Symbol — tracked as ICON-01 in icon inventory */}
          <span className="material-symbols-outlined text-4xl text-primary">
            fitness_center
          </span>
        </div>

        {/* App name — Display size: 40px / bold (per UI-SPEC Typography) */}
        <h1 className="text-5xl font-bold text-on-surface text-center">
          SweatStakes
        </h1>

        {/* Tagline — Body size: 16px / regular */}
        <p className="text-base text-on-surface-variant text-center">
          Your friends are watching. Are you?
        </p>

        {/* Glass panel card containing sign-in button (per UI-SPEC) */}
        <div className="glass-panel rounded-xl border border-outline-variant/15 p-6 w-full">
          <Suspense fallback={
            <button
              disabled
              className="w-full rounded-full py-5 bg-gradient-to-br from-secondary to-on-tertiary-container text-on-secondary-fixed font-bold text-base flex items-center justify-center gap-3 opacity-60 min-h-[44px]"
            >
              Sign in with Google
            </button>
          }>
            <GoogleSignInButton />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
