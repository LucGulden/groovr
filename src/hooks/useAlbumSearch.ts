import { useState, useEffect, useCallback } from 'react'
import { searchAlbums } from '../lib/vinyls'
import type { Album } from '../types/vinyl'

interface UseAlbumSearchParams {
  query: string;
  pageSize?: number;
}

interface UseAlbumSearchReturn {
  albums: Album[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => Promise<void>;
}

export function useAlbumSearch({
  query,
  pageSize = 20,
}: UseAlbumSearchParams): UseAlbumSearchReturn {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [offset, setOffset] = useState(0)

  // Recherche initiale
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setAlbums([])
      setHasMore(false)
      setOffset(0)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const results = await searchAlbums(searchQuery, pageSize, 0)
      setAlbums(results)
      setHasMore(results.length >= pageSize)
      setOffset(results.length)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la recherche'))
      setAlbums([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  // Charger plus de résultats
  const loadMore = useCallback(async () => {
    if (!query || loadingMore || !hasMore) return

    setLoadingMore(true)
    setError(null)

    try {
      const moreResults = await searchAlbums(query, pageSize, offset)
      setAlbums((prev) => [...prev, ...moreResults])
      setHasMore(moreResults.length >= pageSize)
      setOffset((prev) => prev + moreResults.length)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors du chargement'))
    } finally {
      setLoadingMore(false)
    }
  }, [query, pageSize, offset, loadingMore, hasMore])

  // Reset et recherche quand la query change
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query)
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timer)
  }, [query, search])

  return {
    albums,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
  }
}