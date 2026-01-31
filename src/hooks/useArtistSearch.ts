import { useState, useEffect, useCallback } from 'react'
import { searchArtists } from '../lib/vinyls'
import type { Artist } from '../types/vinyl'

interface UseArtistSearchParams {
  query: string;
  pageSize?: number;
}

interface UseArtistSearchReturn {
  artists: Artist[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => Promise<void>;
}

export function useArtistSearch({
  query,
  pageSize = 20,
}: UseArtistSearchParams): UseArtistSearchReturn {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [offset, setOffset] = useState(0)

  // Recherche initiale
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setArtists([])
      setHasMore(false)
      setOffset(0)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const results = await searchArtists(searchQuery, pageSize, 0)
      setArtists(results)
      setHasMore(results.length >= pageSize)
      setOffset(results.length)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la recherche'))
      setArtists([])
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
      const moreResults = await searchArtists(query, pageSize, offset)
      setArtists((prev) => [...prev, ...moreResults])
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
    artists,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
  }
}