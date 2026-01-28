import { useState, useEffect } from 'react'
import { searchAlbums, getAlbumsByArtist } from '../lib/vinyls'
import type { Album } from '../types/vinyl'
import AlbumCard from './AlbumCard'
import type { Artist } from '../types/vinyl'
import Button from './Button'

interface AlbumSearchProps {
  onAlbumSelect: (album: Album) => void;
  onCreateAlbum: () => void;
  artist?: Artist;
}

export default function AlbumSearch({ onAlbumSelect, onCreateAlbum, artist }: AlbumSearchProps) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [searchResults, setSearchResults] = useState<Album[]>([])

  const hasSearched = query.trim().length > 0

  // Charger les albums de l'artiste au montage si artistId est défini
  useEffect(() => {
    if (artist) {
      setIsLoading(true)
      setError(null)
      
      getAlbumsByArtist(artist.id)
        .then((results) => {
          setSearchResults(results)
        })
        .catch((err) => {
          console.error('[Search] Erreur lors du chargement des albums:', err)
          setError(err instanceof Error ? err : new Error('Erreur lors du chargement'))
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [artist])

  // Debounce search
  useEffect(() => {
    if (!query || query.trim().length < 1) {
      // Si pas d'artiste, vider les résultats
      if (!artist) {
        setSearchResults([])
        return
      }
      
      // Si artiste défini et query vide, recharger tous ses albums
      setIsLoading(true)
      setError(null)
      
      getAlbumsByArtist(artist.id)
        .then((results) => {
          setSearchResults(results)
        })
        .catch((err) => {
          console.error('[Search] Erreur lors du chargement des albums:', err)
          setError(err instanceof Error ? err : new Error('Erreur lors du chargement'))
        })
        .finally(() => {
          setIsLoading(false)
        })
      
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      setError(null)

      try {
        let results: Album[]
        
        if (artist) {
          // Recherche filtrée sur les albums de l'artiste
          const artistAlbums = await getAlbumsByArtist(artist.id)
          const searchLower = query.toLowerCase()
          results = artistAlbums.filter(album => 
            album.title.toLowerCase().includes(searchLower) ||
            album.artist?.toLowerCase().includes(searchLower),
          )
        } else {
          // Recherche globale
          results = await searchAlbums(query)
        }
        
        setSearchResults(results)
      } catch (err) {
        console.error('[Search] Erreur lors de la recherche:', err)
        setError(err instanceof Error ? err : new Error('Erreur lors de la recherche'))
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, artist])

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
            placeholder={artist ? 'Filtrer les albums...' : 'Rechercher un album ou un artiste...'}
            className="w-full rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] py-4 pl-12 pr-4 text-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            autoFocus
          />
          {isLoading && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          {artist 
            ? `Filtrez parmi les albums de ${artist.name || 'cet artiste'}`
            : 'Recherchez dans notre bibliothèque d\'albums'
          }
        </p>
      </div>
      
      {/* Bouton créer un album */}
      <Button onClick={onCreateAlbum} variant="outline" className="mb-6 w-full">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Vous ne trouvez pas ? Créer un album
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
            <span>{error instanceof Error ? error.message : 'Une erreur est survenue'}</span>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && searchResults.length === 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square w-full rounded-lg bg-[var(--background-lighter)]" />
              <div className="mt-3 h-4 rounded bg-[var(--background-lighter)]" />
              <div className="mt-2 h-3 w-2/3 rounded bg-[var(--background-lighter)]" />
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
            {searchResults.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onClick={onAlbumSelect}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!isLoading && hasSearched && searchResults.length === 0 && !error && (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">🔍</div>
          <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
            Aucun résultat
          </h3>
          <p className="text-[var(--foreground-muted)]">
            Aucun album trouvé dans votre bibliothèque. Essayez un autre nom d'album ou d'artiste.
          </p>
        </div>
      )}

      {/* État initial */}
      {!isLoading && !hasSearched && !artist && (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">💿</div>
          <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
            Recherchez votre premier album
          </h3>
          <p className="text-[var(--foreground-muted)]">
            Tapez le nom d'un album ou d'un artiste pour commencer
          </p>
        </div>
      )}
    </div>
  )
}