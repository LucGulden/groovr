import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { addVinylToUser } from '../lib/vinyls'
import { useVinylStatsStore } from '../stores/vinylStatsStore'
import type { Album, Artist, UserVinylType, Vinyl } from '../types/vinyl'
import AlbumSearch from './AlbumSearch'
import VinylSelection from './VinylSelection'
import VinylDetails from './VinylDetails'
import CreateAlbumForm from './CreateAlbumForm'
import CreateVinylForm from './CreateVinylForm'

interface AddVinylModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  targetType?: UserVinylType;
  initialAlbum?: Album;
  initialStep?: ModalStep;
  initialVinyl?: Vinyl;
  isOwnProfile?: boolean;
  artist?: Artist;
}

type ModalStep = 'albumSearch' | 'createAlbum' | 'vinylSelection' | 'createVinyl' | 'vinylDetails';

export default function AddVinylModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  targetType,
  initialAlbum,
  initialStep,
  initialVinyl,
  isOwnProfile = false,
  artist,
}: AddVinylModalProps) {

  const [currentStep, setCurrentStep] = useState<ModalStep>(
    initialStep ?? (
      initialVinyl 
        ? 'vinylDetails' 
        : initialAlbum 
        ? 'vinylSelection' 
        : artist 
        ? 'albumSearch' 
        : 'createAlbum' // Si pas d'artiste, démarre à création d'album
    ),
  )
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(initialAlbum || null)
  const [selectedVinyl, setSelectedVinyl] = useState<Vinyl | null>(initialVinyl || null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { incrementCollection, incrementWishlist } = useVinylStatsStore()

  if (!isOpen) return null

  const handleSelectAlbum = (album: Album) => {
    setSelectedAlbum(album)
    setCurrentStep('vinylSelection')
  }

  const handleSelectVinyl = (vinyl: Vinyl) => {
    setSelectedVinyl(vinyl)
    setCurrentStep('vinylDetails')
  }

  const handleCreateAlbum = () => {
    setCurrentStep('createAlbum')
  }

  const handleAlbumCreated = (album: Album) => {
    setSelectedAlbum(album)
    setCurrentStep('vinylSelection')
  }

  const handleCreateVinyl = () => {
    setCurrentStep('createVinyl')
  }

  const handleVinylCreated = (vinyl: Vinyl) => {
    setSelectedVinyl(vinyl)
    setCurrentStep('vinylDetails')
  }

  const handleBack = () => {
    if (currentStep === 'vinylSelection') {
      if (initialAlbum) return
      setCurrentStep('albumSearch')
      setSelectedAlbum(null)
    } else if (currentStep === 'createAlbum') {
      if (initialStep === 'createAlbum') return 
      setCurrentStep('albumSearch')
    } else if (currentStep === 'vinylDetails') {
      if (initialVinyl) return
      setCurrentStep('vinylSelection')
      setSelectedVinyl(null)
    } else if (currentStep === 'createVinyl') {
      setCurrentStep('vinylSelection')
    }
  }

  const handleAddVinyl = async (type: UserVinylType) => {
    if (!selectedVinyl) return

    try {
      setError(null)
      await addVinylToUser(userId, selectedVinyl.id, type)
      setSuccess(true)
      
      if (type === 'collection') {
        incrementCollection()
      } else {
        incrementWishlist()
      }

      setTimeout(() => {
        handleSuccessClose()
      }, 1500)
    } catch (err) {
      console.error('Erreur lors de l\'ajout:', err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    }
  }

  const handleSuccessClose = () => {
    setCurrentStep('albumSearch')
    setSelectedAlbum(null)
    setSelectedVinyl(null)
    setError(null)
    setSuccess(false)
    onSuccess()
  }

  const handleClose = () => {
    setCurrentStep('albumSearch')
    setSelectedAlbum(null)
    setSelectedVinyl(null)
    setError(null)
    setSuccess(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--background-lighter)] bg-[var(--background)] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-[var(--background-lighter)] bg-[var(--background)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Bouton retour */}
              {currentStep !== 'albumSearch' && 
              (currentStep !== 'vinylSelection' || !initialAlbum) &&
              (currentStep !== 'vinylDetails' || !initialVinyl) &&
              (currentStep !== 'createAlbum' || initialStep !== 'createAlbum') && (
                <button
                  onClick={handleBack}
                  className="rounded-full p-2 text-[var(--foreground-muted)] hover:bg-[var(--background-lighter)] hover:text-[var(--foreground)] transition-colors"
                  aria-label="Retour"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Titre dynamique */}
              <div>
                <h2 className="text-2xl font-bold text-[var(--foreground)]">
                  {currentStep === 'albumSearch' && (
                    targetType === 'collection'
                      ? 'Ajouter à ma collection'
                      : targetType === 'wishlist'
                      ? 'Ajouter à ma wishlist'
                      : 'Rechercher un album'
                  )}
                  {currentStep === 'createAlbum' && 'Créer un album'}
                  {currentStep === 'vinylSelection' && 'Choisir un pressage'}
                  {currentStep === 'createVinyl' && 'Créer un pressage'}
                  {currentStep === 'vinylDetails' && (
                    initialVinyl 
                      ? 'Détails du vinyle'  // Consultation depuis un profil
                      : 'Confirmer l\'ajout' // Fin du processus d'ajout
                  )}
                </h2>
                {/* Sous-titre pour recherche par artiste */}
                {currentStep === 'albumSearch' && artist && artist?.name && (
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    Albums de <span className="text-[var(--primary)]">{artist.name}</span>
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleClose}
              className="rounded-full p-2 text-[var(--foreground-muted)] hover:bg-[var(--background-lighter)] hover:text-[var(--foreground)] transition-colors"
              aria-label="Fermer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-180px)] overflow-y-auto p-6">
          {/* Message de succès */}
          {success && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-green-500">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Vinyle ajouté avec succès !</span>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-500">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Contenu animé */}
          <AnimatePresence mode="wait">
            {currentStep === 'albumSearch' && artist && (
              <motion.div
                key="albumSearch"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <AlbumSearch 
                  onAlbumSelect={handleSelectAlbum}
                  onCreateAlbum={handleCreateAlbum}
                  artist={artist}
                />
              </motion.div>
            )}

            {currentStep === 'vinylSelection' && selectedAlbum && (
              <motion.div
                key="vinylSelection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <VinylSelection
                  album={selectedAlbum}
                  userId={userId}
                  onVinylSelect={handleSelectVinyl}
                  onCreateVinyl={handleCreateVinyl}
                />
              </motion.div>
            )}

            {currentStep === 'vinylDetails' && selectedAlbum && selectedVinyl && (
              <motion.div
                key="vinylDetails"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <VinylDetails
                  vinyl={selectedVinyl}
                  album={selectedAlbum}
                  userId={userId}
                  onConfirm={handleAddVinyl}
                  targetType={targetType}
                  isOwnProfile={isOwnProfile}
                  onActionComplete={handleSuccessClose}
                />
              </motion.div>
            )}

            {currentStep === 'createAlbum' && (
              <motion.div
                key="createAlbum"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <CreateAlbumForm
                  onAlbumCreated={handleAlbumCreated}
                  onCancel={() => {
                    if (initialStep === 'createAlbum') {
                      handleClose()
                    } else {
                      setCurrentStep('albumSearch')
                    }
                  }}
                  userId={userId}
                />
              </motion.div>
            )}

            {currentStep === 'createVinyl' && selectedAlbum && (
              <motion.div
                key="createVinyl"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <CreateVinylForm
                  album={selectedAlbum}
                  onVinylCreated={handleVinylCreated}
                  onCancel={() => setCurrentStep('vinylSelection')}
                  userId={userId}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}