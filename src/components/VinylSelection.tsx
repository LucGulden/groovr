import { useState, useEffect } from 'react'
import { getVinylsByAlbum, hasVinyl } from '../lib/vinyls'
import type { Album, Vinyl } from '../types/vinyl'
import VinylImage from './VinylImage'
import VinylCard from './VinylCard'
import Button from './Button'

interface VinylSelectionProps {
  album: Album;
  userId: string;
  onVinylSelect: (vinyl: Vinyl) => void;
  onCreateVinyl: () => void;
}

interface VinylStatus {
  inCollection: boolean;
  inWishlist: boolean;
}

export default function VinylSelection({ album, userId, onVinylSelect, onCreateVinyl }: VinylSelectionProps) {
  const [vinyls, setVinyls] = useState<Vinyl[]>([])
  const [statuses, setStatuses] = useState<Map<string, VinylStatus>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadVinyls = async () => {
      setLoading(true)
      setError(null)

      try {
        const vinylResults = await getVinylsByAlbum(album.id)
        setVinyls(vinylResults)

        // Vérifier le statut de chaque vinyle
        const statusMap = new Map<string, VinylStatus>()
        await Promise.all(
          vinylResults.map(async (vinyl) => {
            try {
              const [inCol, inWish] = await Promise.all([
                hasVinyl(userId, vinyl.id, 'collection'),
                hasVinyl(userId, vinyl.id, 'wishlist'),
              ])
              statusMap.set(vinyl.id, {
                inCollection: inCol,
                inWishlist: inWish,
              })
            } catch (err) {
              console.error('Erreur statut:', err)
            }
          }),
        )
        setStatuses(statusMap)
      } catch (err) {
        console.error('Erreur chargement vinyles:', err)
        setError('Erreur lors du chargement des pressages')
      } finally {
        setLoading(false)
      }
    }

    loadVinyls()
  }, [album.id, userId])

  return (
    <div className="w-full">
      {/* Album header */}
      <div className="mb-6 flex items-center gap-4 rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)] p-4">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
          <VinylImage
            src={album.coverUrl || ''}
            alt={`${album.title} par ${album.artist}`}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h3 className="font-bold text-[var(--foreground)]">{album.title}</h3>
          <p className="text-sm text-[var(--foreground-muted)]">{album.artist}</p>
        </div>
      </div>

      {/* Bouton ajouter un pressage */}
      <Button onClick={onCreateVinyl} variant="outline" className="mb-6 w-full">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Ajouter un pressage
      </Button>
      
      {/* Erreur */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-500">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)] p-4">
              <div className="h-6 w-3/4 rounded bg-[var(--background)]" />
              <div className="mt-2 h-4 w-1/2 rounded bg-[var(--background)]" />
            </div>
          ))}
        </div>
      )}

      {/* No vinyls */}
      {!loading && vinyls.length === 0 && !error && (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">📀</div>
          <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
            Aucun pressage disponible
          </h3>
          <p className="text-[var(--foreground-muted)]">
            Aucun pressage vinyle disponible pour cet album
          </p>
        </div>
      )}

      {/* Vinyls list */}
      {!loading && vinyls.length > 0 && (
        <>
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            {vinyls.length} pressage{vinyls.length > 1 ? 's' : ''} disponible{vinyls.length > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {vinyls.map((vinyl) => {
              const status = statuses.get(vinyl.id)

              return (
                <VinylCard
                  key={vinyl.id}
                  vinyl={vinyl}
                  albumCoverUrl={album.coverUrl || undefined}
                  inCollection={status?.inCollection}
                  inWishlist={status?.inWishlist}
                  onClick={() => onVinylSelect(vinyl)}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}