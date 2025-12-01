'use client';

import { useState, useCallback, useEffect } from 'react';
import ReleaseCard from './ReleaseCard';
import Button from './Button';
import { isInCollection, isInWishlist } from '@/lib/user-releases';
import { useAuth } from './AuthProvider';
import { useDebouncedValue } from '@/hooks/useDebounce';
import type { Release } from '@/types/release';
import { searchReleases } from '@/lib/releases';

interface ReleaseSearchProps {
  albumId: string | undefined;
  onReleaseSelect: (release: Release) => void;
}

interface ReleaseStatus {
  inCollection: boolean;
  inWishlist: boolean;
}

export default function ReleaseSearch({ albumId, onReleaseSelect }: ReleaseSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [releaseStatuses, setReleaseStatuses] = useState<Map<string, ReleaseStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchResults, setSearchResults] = useState<Release[]>([]);
  const [saving, setSaving] = useState(false);

  // Debounce la query pour éviter trop de requêtes
  const debouncedQuery = useDebouncedValue(query, 500);

  const isFetching = false;
  
  const selectRelease = (release: Release) => {
    setSaving(true);
    onReleaseSelect(release);
  }

  // Recherche dans Firestore et vérification des statuts
  const performSearch = useCallback(
    async (searchQuery: string) => {
      console.log('perfoming search for vinyl with query:' + searchQuery);
      setIsLoading(true);
      setError(null);

      try {
        // Rechercher dans Firestore
        const results = await searchReleases(albumId, searchQuery ?? '');
        setSearchResults(results);

        // Vérifier le statut (collection/wishlist) si user connecté
        if (user && results.length > 0) {
          console.log(`[Status] Vérification du statut pour ${results.length} vinyles...`);
          const statusMap = new Map<string, ReleaseStatus>();

          await Promise.all(
            results.map(async (release) => {
              if (!release.id) return;

              try {
                const [inCol, inWish] = await Promise.all([
                  isInCollection(user.uid, release.id),
                  isInWishlist(user.uid, release.id),
                ]);

                statusMap.set(release.id, {
                  inCollection: inCol,
                  inWishlist: inWish,
                });

                if (inCol || inWish) {
                  console.log(`[Status] ${release.title}: Collection=${inCol}, Wishlist=${inWish}`);
                }
              } catch (err) {
                console.error(`[Status] Erreur pour ${release.title}:`, err);
              }
            })
          );

          setReleaseStatuses(statusMap);
          console.log(`[Status] Vérification terminée`);
        }
      } catch (err) {
        console.error('[Search] Erreur lors de la recherche:', err);
        setError(err instanceof Error ? err : new Error('Erreur lors de la recherche'));
      } finally {
        setIsLoading(false);
      }
    },
    [user, albumId]
  );

  // Déclencher la recherche quand la query debounced change
  useEffect(() => {
    console.log('ALLO')
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);
    
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
            placeholder="Rechercher un vinyle ou un artiste..."
            className="w-full rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] py-4 pl-12 pr-4 text-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          />
          {isFetching && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          {`Recherchez parmi notre librairie de vinyles`}
          {debouncedQuery !== query && ' (tape en cours...)'}
        </p>
        {saving && (
          <div className="mt-2 flex items-center gap-2 text-xs text-[var(--primary)]">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
            <span>Sauvegarde des vinyles dans votre bibliothèque...</span>
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
      {isLoading && searchResults.length === 0 && (
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
      {!isLoading && searchResults.length > 0 && (
        <>
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé
            {searchResults.length > 1 ? 's' : ''}
            {isFetching && ' (mise à jour...)'}
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {searchResults.map((release) => {
              const status = release.id ? releaseStatuses.get(release.id) : null;
              const inCollection = status?.inCollection || false;
              const inWishlist = status?.inWishlist || false;
              const isAdded = inCollection || inWishlist;

              return (
                <div key={release.id} className="relative">
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

                  <ReleaseCard
                    release={release}
                    actions={
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isAdded) {
                            selectRelease(release);
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
      {!isLoading && searchResults.length === 0 && !error && (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">🔍</div>
          <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">Aucun résultat</h3>
          <p className="text-[var(--foreground-muted)]">
            {`Essayez avec une autre recherche`}
          </p>
        </div>
      )}
    </div>
  );
}
