'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Home', icon: 'home', href: '/dashboard' },
  { label: 'Streaks', icon: 'local_fire_department', href: '/streaks' },
  { label: 'Feed', icon: 'explore', href: '/feed' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-6 left-0 right-0 flex justify-center z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="bg-[#002366]/80 backdrop-blur-xl rounded-full px-2 py-3 w-[90%] max-w-md shadow-2xl flex justify-around">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center min-h-[44px] justify-center ${
                isActive
                  ? 'bg-gradient-to-br from-secondary to-on-tertiary-container text-on-secondary-fixed rounded-full p-3 shadow-[0_0_15px_rgba(80,200,120,0.4)]'
                  : 'text-on-surface/70 p-3'
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {tab.icon}
              </span>
              <span className="font-bold text-[10px] mt-1">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
