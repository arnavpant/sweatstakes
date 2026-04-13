import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Geist } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#001233',
}

export const metadata: Metadata = {
  title: 'SweatStakes',
  description: 'Hold your friends accountable to their fitness goals',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SweatStakes',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="bg-background text-on-surface font-sans antialiased min-h-dvh">
        <div className="pt-[env(safe-area-inset-top)]">
          {children}
        </div>
      </body>
    </html>
  )
}
