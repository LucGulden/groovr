import { useState, useEffect, useCallback } from 'react'
import { searchUsers } from '../lib/user'
import type { User } from '../types/user'

interface UseUserSearchParams {
  query: string;
  pageSize?: number;
}

interface UseUserSearchReturn {
  users: User[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => Promise<void>;
}

export function useUserSearch({
  query,
  pageSize = 20,
}: UseUserSearchParams): UseUserSearchReturn {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [offset, setOffset] = useState(0)

  // Recherche initiale
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setUsers([])
      setHasMore(false)
      setOffset(0)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const results = await searchUsers(searchQuery, pageSize, 0)
      setUsers(results)
      setHasMore(results.length >= pageSize)
      setOffset(results.length)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la recherche'))
      setUsers([])
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
      const moreResults = await searchUsers(query, pageSize, offset)
      setUsers((prev) => [...prev, ...moreResults])
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
    users,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
  }
}