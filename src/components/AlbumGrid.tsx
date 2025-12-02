import { useState } from 'react';
import AlbumCard from './AlbumCard';
import Button from './Button';
import type { UserReleaseWithDetails, CollectionType } from '@/types/collection';

interface AlbumGridProps {
  albums: UserReleaseWithDetails[];
  type: CollectionType;
  onRemove: (albumId: string) => void;
  onMove?: (albumId: string) => void; // Déplacer de wishlist vers collection
  loading?: boolean;
}

export default function AlbumGrid({
  albums,
  type,
  onRemove,
  onMove,
  loading = false,
}: AlbumGridProps) {
  const [processingAlbum, setProcessingAlbum] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'remove' | 'move' | null>(null);
  // Loading skeletons
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square w-full rounded-lg bg-[var(--background-lighter)]"></div>
            <div className="mt-3 h-4 rounded bg-[var(--background-lighter)]"></div>
            <div className="mt-2 h-3 w-2/3 rounded bg-[var(--background-lighter)]"></div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (albums.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="mb-6 text-8xl">
          {type === 'collection' ? '💿' : '⭐'}
        </div>
        <h3 className="mb-3 text-2xl font-bold text-[var(--foreground)]">
          {type === 'collection'
            ? 'Votre collection est vide'
            : 'Votre wishlist est vide'}
        </h3>
        <p className="mb-6 text-[var(--foreground-muted)]">
          {type === 'collection'
            ? 'Commencez à ajouter vos vinyles préférés à votre collection'
            : 'Ajoutez les albums que vous souhaitez acquérir'}
        </p>
        <div className="text-6xl opacity-20">
          {type === 'collection' ? '🎵 🎶 🎸' : '✨ 🎹 🎺'}
        </div>
      </div>
    );
  }

  // Grid d'albums
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {albums.map((userAlbum) => (
        <AlbumCard
          key={userAlbum.id}
          album={userAlbum.album}
          actions={
            <div className="flex flex-col gap-2">
              {/* Bouton déplacer vers collection (seulement pour wishlist) */}
              {type === 'wishlist' && onMove && (
                <Button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setProcessingAlbum(userAlbum.albumId);
                    setActionType('move');
                    await onMove(userAlbum.albumId);
                    setProcessingAlbum(null);
                    setActionType(null);
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
              )}

              {/* Bouton supprimer */}
              <Button
                onClick={async (e) => {
                  e.stopPropagation();
                  setProcessingAlbum(userAlbum.albumId);
                  setActionType('remove');
                  await onRemove(userAlbum.albumId);
                  setProcessingAlbum(null);
                  setActionType(null);
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
  );
}
