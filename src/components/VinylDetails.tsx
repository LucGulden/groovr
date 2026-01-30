import { useState, useEffect } from 'react'
import { hasVinyl, moveToCollection, removeVinylFromUser } from '../lib/vinyls'
import { useVinylStatsStore } from '../stores/vinylStatsStore'
import type { Album, Vinyl, UserVinylType } from '../types/vinyl'
import VinylImage from './VinylImage'
import Button from './Button'

interface VinylDetailsProps {
  vinyl: Vinyl;
  album: Album;
  userId: string;
  onConfirm: (type: UserVinylType) => void;
  targetType?: UserVinylType;
  isOwnProfile?: boolean;
  onActionComplete?: () => void;
}

export default function VinylDetails({ 
  vinyl, 
  album, 
  userId, 
  onConfirm,
  targetType,
  isOwnProfile = false,
  onActionComplete,
}: VinylDetailsProps) {
  const [inCollection, setInCollection] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isMoving, setIsMoving] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  
  // ✨ Store Zustand
  const { incrementCollection, decrementCollection, incrementWishlist, decrementWishlist } = useVinylStatsStore()

  const isReissue = album.year !== vinyl.year

  useEffect(() => {
    let isMounted = true

    const checkStatus = async () => {
      try {
        const [inCol, inWish] = await Promise.all([
          hasVinyl(userId, vinyl.id, 'collection'),
          hasVinyl(userId, vinyl.id, 'wishlist'),
        ])

        if (isMounted) {
          setInCollection(inCol)
          setInWishlist(inWish)
          setLoading(false)
        }
      } catch (err) {
        console.error('Erreur vérification statut:', err)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkStatus()

    return () => {
      isMounted = false
    }
  }, [userId, vinyl.id])

  const handleMoveToCollection = async () => {
    try {
      setIsMoving(true)
      await moveToCollection(userId, vinyl.id)
      setInWishlist(false)
      setInCollection(true)
      
      // ✨ Mise à jour du store : -1 wishlist, +1 collection
      decrementWishlist()
      incrementCollection()
      
      onActionComplete?.()
    } catch (err) {
      console.error('Erreur déplacement:', err)
      alert('Erreur lors du déplacement vers la collection')
    } finally {
      setIsMoving(false)
    }
  }

  const handleRemove = async (type: UserVinylType) => {
    try {
      setIsRemoving(true)
      await removeVinylFromUser(userId, vinyl.id, type)
      
      if (type === 'collection') {
        setInCollection(false)
        // ✨ Mise à jour du store : -1 collection
        decrementCollection()
      } else {
        setInWishlist(false)
        // ✨ Mise à jour du store : -1 wishlist
        decrementWishlist()
      }
      
      onActionComplete?.()
    } catch (err) {
      console.error('Erreur suppression:', err)
      alert('Erreur lors de la suppression')
    } finally {
      setIsRemoving(false)
    }
  }

  // Déterminer quels boutons afficher selon le contexte
  const renderActions = () => {
    // CONTEXTE 1 : Mon profil > Collection
    if (isOwnProfile && targetType === 'collection') {
      return (
        <div className="flex justify-end">
          <Button
            onClick={() => handleRemove('collection')}
            variant="outline"
            disabled={isRemoving}
            className="w-full border-red-500/30 text-red-500 hover:border-red-500 hover:bg-red-500/10 sm:w-auto"
          >
            {isRemoving ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Suppression...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Retirer de ma collection
              </>
            )}
          </Button>
        </div>
      )
    }

    // CONTEXTE 2 : Mon profil > Wishlist
    if (isOwnProfile && targetType === 'wishlist') {
      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            onClick={handleMoveToCollection}
            variant="primary"
            disabled={isMoving || isRemoving}
            className="w-full sm:w-auto"
          >
            {isMoving ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Déplacement...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                J'ai acheté !
              </>
            )}
          </Button>
          <Button
            onClick={() => handleRemove('wishlist')}
            variant="outline"
            disabled={isMoving || isRemoving}
            className="w-full border-red-500/30 text-red-500 hover:border-red-500 hover:bg-red-500/10 sm:w-auto"
          >
            {isRemoving ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Suppression...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Retirer de ma wishlist
              </>
            )}
          </Button>
        </div>
      )
    }

    // CONTEXTE 3 : Profil d'un autre OU Search (comportement d'ajout classique)
    if (inCollection) {
      return (
        <p className="text-center text-sm text-[var(--foreground-muted)]">
          Ce pressage est déjà dans votre collection
        </p>
      )
    }

    if (inWishlist) {
      return (
        <div className="space-y-3">
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
            <p className="mb-3 text-sm text-blue-400">
              Ce vinyle est dans votre wishlist. Le déplacer vers la collection le retirera automatiquement de la wishlist.
            </p>
            <Button
              onClick={handleMoveToCollection}
              variant="primary"
              disabled={isMoving}
              className="w-full sm:w-auto"
            >
              {isMoving ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Déplacement...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Déplacer vers la collection
                </>
              )}
            </Button>
          </div>
        </div>
      )
    }

    // Ni collection ni wishlist → 2 boutons
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          onClick={() => onConfirm('collection')}
          variant="primary"
          className="w-full sm:w-auto"
        >
          Ajouter à ma collection
        </Button>
        <Button
          onClick={() => onConfirm('wishlist')}
          variant="outline"
          className="w-full sm:w-auto"
        >
          Ajouter à ma wishlist
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cover et infos principales */}
      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Cover */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)] md:w-[300px]">
          <VinylImage
            src={vinyl.coverUrl || ''}
            alt={`${vinyl.title} - ${vinyl.artist}`}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Infos principales */}
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-[var(--foreground)]">{vinyl.title}</h3>
            <p className="mt-1 text-lg font-medium text-[var(--foreground-muted)]">
              {vinyl.artist}
            </p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              {isReissue ? (
                <>
                  Album original : {album.year} • Réédition : {vinyl.year}
                </>
              ) : (
                vinyl.year
              )}
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {inCollection && (
              <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>En collection</span>
              </div>
            )}

            {inWishlist && (
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>En wishlist</span>
              </div>
            )}

            {isReissue && (
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-10)] px-3 py-1 text-xs font-medium text-[var(--primary)]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Réédition
              </div>
            )}
          </div>

          {/* Détails de l'édition */}
          <div className="space-y-3 rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)] p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
              Détails de l'édition
            </h4>
            <div className="space-y-2">
              {vinyl.label && <DetailRow label="Label" value={vinyl.label} />}
              {vinyl.catalogNumber && <DetailRow label="Numéro de catalogue" value={vinyl.catalogNumber} />}
              {vinyl.country && <DetailRow label="Pays" value={vinyl.country} />}
              {vinyl.format && <DetailRow label="Format" value={vinyl.format} />}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {!loading && (
        <div className="border-t border-[var(--background-lighter)] pt-6">
          {renderActions()}
        </div>
      )}
    </div>
  )
}

// Helper component
function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-[var(--foreground-muted)]">{label}</span>
      <span className="text-sm font-medium text-[var(--foreground)] text-right">{value}</span>
    </div>
  )
}