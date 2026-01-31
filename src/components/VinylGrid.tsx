import { useRef, useEffect } from 'react'
import VinylCard from './VinylCard'
import Button from './Button'
import type { UserVinylType, UserVinylWithDetails, Vinyl, Album } from '../types/vinyl'

interface VinylGridProps {
  vinyls: UserVinylWithDetails[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  total: number;
  onLoadMore: () => void;
  onRefresh: () => void;
  onVinylClick: (vinyl: Vinyl, album: Album) => void;  // Nouveau callback
  emptyMessage?: string;
  emptyIcon?: string;
  type: UserVinylType;
}

export default function VinylGrid({
  vinyls,
  loading,
  loadingMore,
  hasMore,
  error,
  onLoadMore,
  onRefresh,
  onVinylClick,
  emptyMessage = 'Aucun vinyle pour le moment',
  emptyIcon = '💿',
  type,
}: VinylGridProps) {
  const observerTarget = useRef<HTMLDivElement>(null)

  // Intersection Observer pour infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          onLoadMore()
        }
      },
      { threshold: 1.0 },
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore, onLoadMore])

  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-lg bg-[var(--background-lighter)]"
          />
        ))}
      </div>
    )
  }

  // Message d'erreur
  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
        <div className="mb-4 text-4xl">⚠️</div>
        <h3 className="mb-2 text-lg font-semibold text-red-500">
          Erreur de chargement
        </h3>
        <p className="mb-4 text-sm text-red-500/80">{error.message}</p>
        <Button onClick={onRefresh} variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500/10">
          Réessayer
        </Button>
      </div>
    )
  }

  // Empty state
  if (vinyls.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="mb-6 text-8xl">{emptyIcon}</div>
        <h3 className="mb-3 text-2xl font-bold text-[var(--foreground)]">
          {emptyMessage}
        </h3>
        <p className="mb-6 text-[var(--foreground-muted)]">
          {type === 'collection' 
            ? 'Commencez à ajouter vos vinyles préférés à votre collection'
            : 'Ajoutez des vinyles que vous souhaitez acquérir'}
        </p>
        <div className="text-6xl opacity-20">🎵 🎶 🎸</div>
      </div>
    )
  }

  // Grille de vinyles
  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {vinyls.map((userVinyl) => (
          <VinylCard
            key={userVinyl.id}
            vinyl={userVinyl.vinyl}
            albumCoverUrl={userVinyl.album?.coverUrl}
            onClick={() => onVinylClick(userVinyl.vinyl, userVinyl.album)}
            variant="compact"
          />
        ))}
      </div>

      {/* Intersection Observer target pour infinite scroll */}
      {hasMore && (
        <div ref={observerTarget} className="mt-8 flex justify-center items-center h-20">
          {loadingMore && (
            <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
              <svg
                className="animate-spin h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Chargement...</span>
            </div>
          )}
        </div>
      )}

      {/* End message */}
      {!hasMore && vinyls.length > 0 && (
        <div className="text-center py-8 mt-8">
          <p className="text-[var(--foreground-muted)]">
            Vous avez atteint la fin de votre {type === 'collection' ? 'collection' : 'wishlist'}
          </p>
        </div>
      )}
    </>
  )
}