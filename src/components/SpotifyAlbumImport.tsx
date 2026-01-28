import { useState, useEffect } from 'react'
import { searchSpotifyAlbums, type SpotifyAlbumResult } from '../lib/spotify'
import { createAlbum, getAlbumBySpotifyId } from '../lib/vinyls'
import type { Album } from '../types/vinyl'
import VinylImage from './VinylImage'

interface SpotifyAlbumImportProps {
  onAlbumCreated: (album: Album) => void;
  onBack: () => void;
  userId: string;
}

export default function SpotifyAlbumImport({ onAlbumCreated, onBack, userId }: SpotifyAlbumImportProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SpotifyAlbumResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      setError(null)

      try {
        const data = await searchSpotifyAlbums(query)
        setResults(data)
      } catch (err) {
        console.error('Erreur recherche Spotify:', err)
        setError('Erreur lors de la recherche Spotify')
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelectAlbum = async (spotifyAlbum: SpotifyAlbumResult) => {
    setIsImporting(true)
    setError(null)

    try {
      // Vérifier si l'album existe déjà
      const existingAlbum = await getAlbumBySpotifyId(spotifyAlbum.spotifyId)

      if (existingAlbum) {
        onAlbumCreated(existingAlbum)
        return
      }

      // Créer l'album avec l'URL Spotify directement
      const newAlbum = await createAlbum({
        title: spotifyAlbum.title,
        artist: spotifyAlbum.artist,
        year: spotifyAlbum.year,
        coverUrl: spotifyAlbum.coverUrl, // URL Spotify directe
        spotifyId: spotifyAlbum.spotifyId,
        spotifyUrl: spotifyAlbum.spotifyUrl,
        createdBy: userId,
      })

      onAlbumCreated(newAlbum)
    } catch (err) {
      console.error('Erreur import album:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import')
      setIsImporting(false)
    }
  }

  const hasSearched = query.trim().length > 0

  return (
    <div className="w-full">
      {/* Header avec bouton retour */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <svg className="h-5 w-5 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher sur Spotify..."
            className="w-full rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] py-4 pl-12 pr-4 text-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:border-[#1DB954] focus:outline-none focus:ring-2 focus:ring-[#1DB954]/20"
            autoFocus
            disabled={isImporting}
          />
          {isSearching && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1DB954] border-t-transparent" />
            </div>
          )}
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-500">
          {error}
        </div>
      )}

      {/* Overlay d'import */}
      {isImporting && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          <p className="text-[var(--foreground-muted)]">Import en cours...</p>
        </div>
      )}

      {/* Résultats */}
      {!isImporting && !isSearching && results.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {results.map((album) => (
            <button
              key={album.spotifyId}
              onClick={() => handleSelectAlbum(album)}
              className="group text-left"
            >
              <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-[var(--background-lighter)]">
                <VinylImage
                  src={album.coverUrl || ''}
                  alt={`${album.title} par ${album.artist}`}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <h4 className="truncate font-medium text-[var(--foreground)]">{album.title}</h4>
              <p className="truncate text-sm text-[var(--foreground-muted)]">{album.artist}</p>
              {album.year && (
                <p className="text-sm text-[var(--foreground-muted)]">{album.year}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isImporting && !isSearching && hasSearched && results.length === 0 && (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">🔍</div>
          <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
            Aucun résultat sur Spotify
          </h3>
          <p className="text-[var(--foreground-muted)]">
            Essayez un autre terme ou créez l'album manuellement
          </p>
        </div>
      )}

      {/* État initial */}
      {!isImporting && !isSearching && !hasSearched && (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">🎵</div>
          <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
            Recherchez sur Spotify
          </h3>
          <p className="text-[var(--foreground-muted)]">
            Tapez le nom d'un album ou d'un artiste
          </p>
        </div>
      )}
    </div>
  )
}