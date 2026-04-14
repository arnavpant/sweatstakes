import Link from 'next/link'
import { Image as ImageIcon } from 'lucide-react'

/**
 * PhotoGallery — DASH-03 recent check-in grid (up to 6 photos, 3 cols × 2 rows).
 * Server Component. Wrapped in a Link to /feed (decision: no inline lightbox,
 * Feed is the gallery).
 *
 * Restyled per quick 260414-82g: emerald-accented card frame around the grid
 * with a "Recent Check-ins" header; thumbnails scale on hover.
 */
interface Photo {
  id: string
  photoUrl: string
}

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) {
    return (
      <div className="bg-surface-container border border-secondary/20 rounded-xl p-6 flex flex-col items-center text-center space-y-2">
        <ImageIcon className="h-8 w-8 text-on-surface-variant" />
        <p className="text-sm text-on-surface-variant">
          No check-ins yet. Snap your first workout.
        </p>
      </div>
    )
  }
  return (
    <Link href="/feed" className="block" aria-label="View feed">
      <div className="bg-surface-container border border-secondary/20 rounded-xl p-4">
        <h3 className="text-sm font-medium text-on-surface mb-4">Recent Check-ins</h3>
        <div className="grid grid-cols-3 gap-2">
          {photos.slice(0, 6).map((p) => (
            <div
              key={p.id}
              className="aspect-square overflow-hidden rounded-xl bg-surface-container-high"
            >
              <img
                src={p.photoUrl}
                alt="Check-in"
                className="w-full h-full object-cover hover:scale-105 transition-transform"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}
