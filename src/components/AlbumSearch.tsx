'use client';

import React, { useState, useCallback } from 'react';
import AlbumCard from './AlbumCard';
import Button from './Button';
import { getOrCreateAlbum } from '@/lib/albums';
import { isInCollection, isInWishlist } from '@/lib/user-albums';
import { useAuth } from './AuthProvider';
import { useSearchAlbums } from '@/hooks/useSpotifyQueries';
import { useDebouncedValue } from '@/hooks/useDebounce';
import type { AlbumSearchResult } from '@/types/album';

interface AlbumSearchProps {
  onAlbumSelect: (album: AlbumSearchResult) => void;
}

interface AlbumStatus {
  inCollection: boolean;
  inWishlist: boolean;
}

export default function AlbumSearch({ onAlbumSelect }: AlbumSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [caching, setCaching] = useState(false);
  const [albumStatuses, setAlbumStatuses] = useState<Map<string, AlbumStatus>>(new Map());

  // Debounce la query pour éviter trop de requêtes
  const debouncedQuery = useDebouncedValue(query, 500);

  // React Query hook pour la recherche Spotify
  // Cache automatique 1h, pas de requêtes dupliquées
  const {
    data: spotifyResults = [],
    isLoading,
    error,
    isFetching,
  } = useSearchAlbums(debouncedQuery);

  const hasSearched = debouncedQuery.trim().length > 0;

  // Cache Firestore et vérification des statuts (en arrière-plan)
  const cacheAndCheckStatuses = useCallback(
    async (results: AlbumSearchResult[]) => {
      if (results.length === 0) return;

      setCaching(true);
      console.log(`[Cache Client] Début du cache de ${results.length} albums dans Firestore...`);

      try {
        // 1. Cacher les albums dans Firestore
        const cachedResults = await Promise.all(
          results.map(async (album) => {
            try {
              const firestoreAlbum = await getOrCreateAlbum({
                spotifyId: album.spotifyId,
                title: album.title,
                artist: album.artist,
                year: album.year,
                coverUrl: album.coverUrl,
                spotifyUrl: album.spotifyUrl,
              });

              console.log(`[Cache Client] ✓ Album caché: ${album.title} (ID: ${firestoreAlbum.id})`);

              return {
                ...album,
                firestoreId: firestoreAlbum.id,
              };
            } catch (err) {
              console.error(
                `[Cache Client] ✗ Erreur pour "${album.title}":`,
                err instanceof Error ? err.message : err
              );
              return album;
            }
          })
        );

        const cachedCount = cachedResults.filter((a) => a.firestoreId).length;
        console.log(`[Cache Client] Terminé: ${cachedCount}/${cachedResults.length} albums cachés`);

        // 2. Vérifier le statut (collection/wishlist) si user connecté
        if (user) {
          console.log(`[Status] Vérification du statut pour ${cachedResults.length} albums...`);
          const statusMap = new Map<string, AlbumStatus>();

          await Promise.all(
            cachedResults.map(async (album) => {
              if (!album.firestoreId) return;

              try {
                const [inCol, inWish] = await Promise.all([
                  isInCollection(user.uid, album.firestoreId),
                  isInWishlist(user.uid, album.firestoreId),
                ]);

                statusMap.set(album.firestoreId, {
                  inCollection: inCol,
                  inWishlist: inWish,
                });

                if (inCol || inWish) {
                  console.log(`[Status] ${album.title}: Collection=${inCol}, Wishlist=${inWish}`);
                }
              } catch (err) {
                console.error(`[Status] Erreur pour ${album.title}:`, err);
              }
            })
          );

          setAlbumStatuses(statusMap);
          console.log(`[Status] Vérification terminée`);
        }
      } catch (err) {
        console.error('[Cache Client] Erreur générale:', err);
      } finally {
        setCaching(false);
      }
    },
    [user]
  );

  // Déclencher le cache quand les résultats changent
  React.useEffect(() => {
    if (spotifyResults.length > 0) {
      cacheAndCheckStatuses(spotifyResults);
    }
  }, [spotifyResults, cacheAndCheckStatuses]);

  return (
    <div className="w-full">
      {/* Barre de recherche */}
      <div className="mb-8">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <svg
              className="h-5 w-5 text-[var(--foreground-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un album ou un artiste..."
            className="w-full rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] py-4 pl-12 pr-4 text-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          />
          {isFetching && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          {`Recherchez parmi des millions d'albums sur Spotify`}
          {debouncedQuery !== query && ' (tape en cours...)'}
        </p>
        {caching && (
          <div className="mt-2 flex items-center gap-2 text-xs text-[var(--primary)]">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
            <span>Sauvegarde des albums dans votre bibliothèque...</span>
          </div>
        )}
      </div>

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
            <span>{error instanceof Error ? error.message : 'Une erreur est survenue'}</span>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && spotifyResults.length === 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square w-full rounded-lg bg-[var(--background-lighter)]"></div>
              <div className="mt-3 h-4 rounded bg-[var(--background-lighter)]"></div>
              <div className="mt-2 h-3 w-2/3 rounded bg-[var(--background-lighter)]"></div>
            </div>
          ))}
        </div>
      )}

      {/* Résultats */}
      {!isLoading && spotifyResults.length > 0 && (
        <>
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            {spotifyResults.length} résultat{spotifyResults.length > 1 ? 's' : ''} trouvé
            {spotifyResults.length > 1 ? 's' : ''}
            {isFetching && ' (mise à jour...)'}
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {spotifyResults.map((album) => {
              const status = album.firestoreId ? albumStatuses.get(album.firestoreId) : null;
              const inCollection = status?.inCollection || false;
              const inWishlist = status?.inWishlist || false;
              const isAdded = inCollection || inWishlist;

              return (
                <div key={album.spotifyId} className="relative">
                  {/* Badges en haut de la card */}
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
                        <span>En collection</span>
                      </div>
                    )}
                    {inWishlist && (
                      <div className="flex items-center gap-1 rounded-full bg-[var(--primary)] px-2 py-1 text-xs font-medium text-white shadow-lg">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>En wishlist</span>
                      </div>
                    )}
                  </div>

                  <AlbumCard
                    album={album}
                    actions={
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isAdded) {
                            onAlbumSelect(album);
                          }
                        }}
                        variant={isAdded ? 'outline' : 'primary'}
                        disabled={isAdded}
                        className={isAdded ? 'cursor-not-allowed opacity-60' : ''}
                      >
                        {inCollection
                          ? 'Déjà en collection'
                          : inWishlist
                          ? 'Déjà en wishlist'
                          : 'Ajouter'}
                      </Button>
                    }
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {!isLoading && hasSearched && spotifyResults.length === 0 && !error && (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">🔍</div>
          <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">Aucun résultat</h3>
          <p className="text-[var(--foreground-muted)]">
            {`Essayez avec un autre nom d'album ou d'artiste`}
          </p>
        </div>
      )}

      {/* État initial */}
      {!isLoading && !hasSearched && (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">💿</div>
          <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
            Recherchez votre premier album
          </h3>
          <p className="text-[var(--foreground-muted)]">
            {`Tapez le nom d'un album ou d'un artiste pour commencer`}
          </p>
        </div>
      )}
    </div>
  );
}
