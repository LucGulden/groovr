'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import AlbumCard from '@/components/AlbumCard';
import AddAlbumModal from '@/components/AddAlbumModal';
import Button from '@/components/Button';
import { AlbumGridSkeleton } from '@/components/ui/AlbumGridSkeleton';
import { useCollectionPagination } from '@/hooks/useCollectionPagination';
import { removeFromWishlist, moveToCollection } from '@/lib/user-albums';

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingAlbum, setProcessingAlbum] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'remove' | 'move' | null>(null);

  // Intersection Observer pour infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  // Redirection si non authentifié
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Hook de pagination
  const {
    albums,
    loading,
    loadingMore,
    hasMore,
    error,
    total,
    loadMore,
    refresh,
    removeAlbumFromList,
  } = useCollectionPagination({
    userId: user?.uid || '',
    type: 'wishlist',
  });

  // Intersection Observer pour auto-load
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  const handleRemove = async (albumId: string) => {
    if (!user) return;

    if (!confirm('Êtes-vous sûr de vouloir retirer cet album de votre wishlist ?')) {
      return;
    }

    setProcessingAlbum(albumId);
    setActionType('remove');

    try {
      await removeFromWishlist(user.uid, albumId);
      removeAlbumFromList(albumId);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setProcessingAlbum(null);
      setActionType(null);
    }
  };

  const handleMoveToCollection = async (albumId: string) => {
    if (!user) return;

    setProcessingAlbum(albumId);
    setActionType('move');

    try {
      await moveToCollection(user.uid, albumId);
      removeAlbumFromList(albumId);
    } catch (err) {
      console.error('Erreur lors du déplacement:', err);
      alert(err instanceof Error ? err.message : 'Erreur lors du déplacement');
    } finally {
      setProcessingAlbum(null);
      setActionType(null);
    }
  };

  // Loading state
  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-[var(--foreground)]">
              Ma Wishlist
            </h1>
            <p className="text-[var(--foreground-muted)]">
              {loading
                ? 'Chargement...'
                : total === 0
                ? 'Aucun album pour le moment'
                : `${total} album${total > 1 ? 's' : ''} dans votre wishlist`}
            </p>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            className="sm:w-auto"
          >
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Ajouter à la wishlist
            </span>
          </Button>
        </div>

        {/* Message d'erreur */}
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
              <span>{error.message}</span>
            </div>
            <button
              onClick={refresh}
              className="mt-3 text-sm underline hover:no-underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && <AlbumGridSkeleton count={20} />}

        {/* Empty state */}
        {!loading && albums.length === 0 && (
          <div className="py-20 text-center">
            <div className="mb-6 text-8xl">⭐</div>
            <h3 className="mb-3 text-2xl font-bold text-[var(--foreground)]">
              Votre wishlist est vide
            </h3>
            <p className="mb-6 text-[var(--foreground-muted)]">
              Ajoutez les albums que vous souhaitez acquérir
            </p>
            <div className="text-6xl opacity-20">✨ 🎹 🎺</div>
          </div>
        )}

        {/* Grid d'albums */}
        {!loading && albums.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {albums.map((userAlbum) => (
                <AlbumCard
                  key={userAlbum.id}
                  album={userAlbum.album}
                  actions={
                    <div className="flex flex-col gap-2">
                      {/* Bouton déplacer vers collection */}
                      <Button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleMoveToCollection(userAlbum.albumId);
                        }}
                        variant="primary"
                        className="w-full"
                        loading={processingAlbum === userAlbum.albumId && actionType === 'move'}
                        disabled={processingAlbum === userAlbum.albumId}
                      >
                        {!(processingAlbum === userAlbum.albumId && actionType === 'move') && (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {`J'ai cet album`}
                          </span>
                        )}
                      </Button>

                      {/* Bouton supprimer */}
                      <Button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleRemove(userAlbum.albumId);
                        }}
                        variant="outline"
                        className="w-full border-red-500/30 text-red-500 hover:border-red-500 hover:bg-red-500/10"
                        loading={processingAlbum === userAlbum.albumId && actionType === 'remove'}
                        disabled={processingAlbum === userAlbum.albumId}
                      >
                        {!(processingAlbum === userAlbum.albumId && actionType === 'remove') && (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Retirer
                          </span>
                        )}
                      </Button>
                    </div>
                  }
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

            {/* End of wishlist message */}
            {!hasMore && albums.length > 0 && (
              <div className="text-center py-8 mt-8">
                <p className="text-[var(--foreground-muted)]">
                  Vous avez atteint la fin de votre wishlist
                </p>
              </div>
            )}
          </>
        )}

        {/* Modal d'ajout */}
        <AddAlbumModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            // Rafraîchir la liste après ajout
            refresh();
          }}
          targetType="wishlist"
        />
      </div>
    </div>
  );
}
