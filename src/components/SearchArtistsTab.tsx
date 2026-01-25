import { useState, useEffect } from 'react';
import { searchArtists } from '../lib/vinyls';
import { useAuth } from '../hooks/useAuth';
import ArtistCard from './ArtistCard';
import AddVinylModal from './AddVinylModal';
import type { Artist } from '../types/vinyl';

interface SearchArtistsTabProps {
  query: string;
}

export default function SearchArtistsTab({ query }: SearchArtistsTabProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasSearched = query.trim().length > 0;

  // Debounce search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const results = await searchArtists(query);
        setSearchResults(results);
      } catch (err) {
        console.error('[SearchArtistsTab] Erreur lors de la recherche:', err);
        setError(err instanceof Error ? err : new Error('Erreur lors de la recherche'));
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleArtistClick = async (artist: Artist) => {
    setSelectedArtist(artist);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full">
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
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square w-full rounded-lg bg-[var(--background-lighter)]"></div>
              <div className="mt-3 h-4 rounded bg-[var(--background-lighter)]"></div>
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
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {searchResults.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                onClick={handleArtistClick}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty state - Recherche effectuée mais aucun résultat */}
      {!isLoading && hasSearched && searchResults.length === 0 && !error && (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">🎤</div>
          <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
            Aucun artiste trouvé
          </h3>
          <p className="text-[var(--foreground-muted)]">
            Aucun artiste trouvé pour "{query}". Essayez un autre nom.
          </p>
        </div>
      )}

      {/* État initial - Pas de recherche */}
      {!isLoading && !hasSearched && (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">🎵</div>
          <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
            Recherchez un artiste
          </h3>
          <p className="text-[var(--foreground-muted)]">
            Tapez le nom d'un artiste pour commencer
          </p>
        </div>
      )}

      {/* Modal - uniquement si user connecté */}
      {user && selectedArtist && (
        <AddVinylModal
          key={isModalOpen ? 'modal-open' : 'modal-closed'}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedArtist(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedArtist(null);
          }}
          userId={user.id}
          artist={selectedArtist}
        />
      )}
    </div>
  );
}