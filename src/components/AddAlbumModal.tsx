'use client';

import React, { useState } from 'react';
import AlbumSearch from './AlbumSearch';
import Button from './Button';
import ImageOptimized from './ImageOptimized';
import { addToCollection, addToWishlist } from '@/lib/user-albums';
import { useAuth } from './AuthProvider';
import type { AlbumSearchResult } from '@/types/album';
import type { CollectionType } from '@/types/collection';

interface AddAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: CollectionType;
}

export default function AddAlbumModal({
  isOpen,
  onClose,
  targetType,
}: AddAlbumModalProps) {
  const { user } = useAuth();
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumSearchResult | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSelectAlbum = (album: AlbumSearchResult) => {
    setSelectedAlbum(album);
    setError(null);
    setSuccess(false);
  };

  const handleAddAlbum = async () => {
    if (!user || !selectedAlbum) return;

    // Vérifier qu'on a un firestoreId
    if (!selectedAlbum.firestoreId) {
      setError('Album non disponible. Veuillez réessayer.');
      return;
    }

    try {
      setAdding(true);
      setError(null);

      if (targetType === 'collection') {
        await addToCollection(user.uid, selectedAlbum.firestoreId);
      } else {
        await addToWishlist(user.uid, selectedAlbum.firestoreId);
      }

      setSuccess(true);
      setSelectedAlbum(null);

      // Fermer le modal après un court délai
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Erreur lors de l\'ajout:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
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
      ></div>

      {/* Modal */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--background-lighter)] bg-[var(--background)] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-[var(--background-lighter)] bg-[var(--background)] px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">
              {targetType === 'collection'
                ? 'Ajouter à ma collection'
                : 'Ajouter à ma wishlist'}
            </h2>
            <button
              onClick={handleClose}
              className="rounded-full p-2 text-[var(--foreground-muted)] hover:bg-[var(--background-lighter)] hover:text-[var(--foreground)]"
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

          {/* Album sélectionné */}
          {selectedAlbum && (
            <div className="mb-6 rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-4">
              <div className="flex items-center gap-4">
                <ImageOptimized
                  src={selectedAlbum.coverUrl}
                  alt={selectedAlbum.title}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-[var(--foreground)]">
                    {selectedAlbum.title}
                  </h4>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {selectedAlbum.artist} • {selectedAlbum.year}
                  </p>
                </div>
                <Button
                  onClick={handleAddAlbum}
                  loading={adding}
                  disabled={adding || success}
                  variant="primary"
                >
                  {targetType === 'collection' ? 'Ajouter' : 'Ajouter à la wishlist'}
                </Button>
              </div>
            </div>
          )}

          {/* Composant de recherche */}
          <AlbumSearch onAlbumSelect={handleSelectAlbum} />
        </div>
      </div>
    </div>
  );
}
