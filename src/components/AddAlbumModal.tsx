'use client';

import { useState } from 'react';
import AlbumSearch from './AlbumSearch';
import ReleaseSearch from './ReleaseSearch';
import type { CollectionType } from '@/types/collection';
import { AnimatePresence, motion } from 'framer-motion';
import type { Album } from '@/types/album';
import { Release } from '@/types/release';
import ReleaseDetails from './ReleaseDetails';
import { addToCollection, addToWishlist } from '@/lib/user-releases';
import { useAuth } from './AuthProvider';

interface AddAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetType: CollectionType;
}

type ModalStep = 'albumSearch' | 'releaseSearch' | 'releaseDetails';

export default function AddAlbumModal({
  isOpen,
  onClose,
  onSuccess,
  targetType,
}: AddAlbumModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<ModalStep>('albumSearch');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectAlbum = (album: Album) => {
    setSelectedAlbum(album);
    setCurrentStep('releaseSearch');
  };

  const handleSelectRelease = (release: Release) => {
    setSelectedRelease(release);
    setCurrentStep('releaseDetails');
  };

  const handleBack = () => {
    if (currentStep === 'releaseSearch') {
      setCurrentStep('albumSearch');
      setSelectedAlbum(null);
    } else if (currentStep === 'releaseDetails') {
      setCurrentStep('releaseSearch');
      setSelectedRelease(null);
    }
  };
  
  const handleAddRelease = async () => {
    if (!user || !selectedRelease) return;

    // Vérifier qu'on a un firestoreId
    if (!selectedRelease.id) {
      setError('Vinyle non disponible. Veuillez réessayer.');
      return;
    }

    try {
      setError(null);
      if (targetType === 'collection') {
        await addToCollection(user.uid, selectedRelease.id);
      } else {
        await addToWishlist(user.uid, selectedRelease.id);
      }

      setSuccess(true);
      setSelectedRelease(null);

      // Fermer le modal après un court délai
      setTimeout(() => {
        handleSuccess();
      }, 1500);
    } catch (err) {
      console.error('Erreur lors de l\'ajout:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleSuccess = () => {
    // 🔧 Reset tous les états
    setCurrentStep('albumSearch');
    setSelectedAlbum(null);
    setError(null);
    setSuccess(false);
    onSuccess();
  };

  const handleClose = () => {
    // 🔧 Reset tous les états
    setCurrentStep('albumSearch');
    setSelectedAlbum(null);
    setError(null);
    setSuccess(false);
    onClose();
  };

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
              {/* 🆕 Bouton retour */}
              {currentStep !== 'albumSearch' && (
                <button
                  onClick={handleBack}
                  className="rounded-full p-2 text-[var(--foreground-muted)] hover:bg-[var(--background-lighter)] hover:text-[var(--foreground)] transition-colors"
                  aria-label="Retour"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
              
              <h2 className="text-2xl font-bold text-[var(--foreground)]">
                {/* 🆕 Titre dynamique selon l'étape */}
                {currentStep === 'albumSearch' && (
                  targetType === 'collection'
                    ? 'Ajouter à ma collection'
                    : 'Ajouter à ma wishlist'
                )}
                {currentStep === 'releaseSearch' && 'Choisir une version'}
              </h2>
            </div>

            <button
              onClick={handleClose}
              className="rounded-full p-2 text-[var(--foreground-muted)] hover:bg-[var(--background-lighter)] hover:text-[var(--foreground)] transition-colors"
              aria-label="Fermer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
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
              <span className="font-medium">
                Album ajouté {targetType === 'collection' ? 'à votre collection' : 'à votre wishlist'} !
              </span>
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

          {/* 🔧 Contenu conditionnel (BUG CORRIGÉ) */}
          <AnimatePresence mode="wait">
            {currentStep === 'albumSearch' && (
              <motion.div
                key="albumSearch"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <AlbumSearch onAlbumSelect={handleSelectAlbum} />
              </motion.div>
            )}
            
            {currentStep === 'releaseSearch' && selectedAlbum && (
              <motion.div
                key="releaseSearch"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ReleaseSearch
                  albumId={selectedAlbum.id}
                  onReleaseSelect={handleSelectRelease}
                />
              </motion.div>
            )}
            {currentStep === 'releaseDetails' && selectedRelease && (
              <motion.div
                key="releaseDetails"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ReleaseDetails
                  release={selectedRelease}
                  onConfirm={handleAddRelease}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}