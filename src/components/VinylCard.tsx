import type { Vinyl } from '../types/vinyl'
import VinylImage from './VinylImage'

interface VinylCardProps {
  vinyl: Vinyl;
  albumCoverUrl?: string;
  inCollection?: boolean;
  inWishlist?: boolean;
  onClick: () => void;
  variant?: 'full' | 'compact';
}

export default function VinylCard({
  vinyl,
  albumCoverUrl,
  inCollection = false,
  inWishlist = false,
  onClick,
  variant = 'full',
}: VinylCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative text-left transition-transform hover:scale-105"
    >
      {/* Badges en haut - uniquement en mode full */}
      {variant === 'full' && (
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
          {inCollection && (
            <div className="flex items-center gap-1 rounded-full bg-green-500 px-2 py-1 text-xs font-medium text-white shadow-lg">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Collection</span>
            </div>
          )}
          {inWishlist && (
            <div className="flex items-center gap-1 rounded-full bg-blue-500 px-2 py-1 text-xs font-medium text-white shadow-lg">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>Wishlist</span>
            </div>
          )}
        </div>
      )}

      {/* Cover */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)]">
        <VinylImage
          src={vinyl.coverUrl || albumCoverUrl || ''}
          alt={`${vinyl.title} par ${vinyl.artist}`}
          className="h-full w-full object-cover transition-transform"
        />
      </div>

      {/* Info */}
      {variant === 'full' ? (
        <div className="mt-3">
          <h4 className="truncate font-medium text-[var(--foreground)]">
            {vinyl.title}
          </h4>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span className="inline-block rounded bg-[var(--primary-20)] px-2 py-0.5 text-xs font-medium text-[var(--primary)]">
              {vinyl.year}
            </span>
            <span className="inline-block rounded bg-[var(--background-lighter)] px-2 py-0.5 text-xs text-[var(--foreground-muted)]">
              {vinyl.country}
            </span>
            <span className="inline-block rounded bg-[var(--background-lighter)] px-2 py-0.5 text-xs text-[var(--foreground-muted)]">
              {vinyl.format}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-[var(--foreground-muted)]">
            {vinyl.label} – {vinyl.catalogNumber}
          </p>
        </div>
      ) : (
        <div className="mt-3">
          <h3 className="truncate font-semibold text-[var(--foreground)]">
            {vinyl.title}
          </h3>
          <p className="truncate text-sm text-[var(--foreground-muted)]">
            {vinyl.artist}
          </p>
          <p className="text-xs text-[var(--foreground-muted)]">
            {vinyl.year}
            </p>
        </div>
      )}
    </button>
  )
}