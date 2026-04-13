import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SweatStakes',
    short_name: 'SweatStakes',
    description: 'Hold your friends accountable to their fitness goals',
    start_url: '/',
    display: 'standalone',
    background_color: '#001233',
    theme_color: '#001233',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
