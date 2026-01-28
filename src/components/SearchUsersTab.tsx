import { useState, useEffect } from 'react'
import { searchUsers } from '../lib/search'
import UserListItem from './UserListItem'
import type { User } from '../types/user'

interface SearchUsersTabProps {
  query: string;
}

export default function SearchUsersTab({ query }: SearchUsersTabProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [searchResults, setSearchResults] = useState<User[]>([])

  const hasSearched = query.trim().length > 0

  // Debounce search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const results = await searchUsers(query)
        setSearchResults(results)
      } catch (err) {
        console.error('[SearchUsersTab] Erreur lors de la recherche:', err)
        setError(err instanceof Error ? err : new Error('Erreur lors de la recherche'))
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

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
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-[var(--background-lighter)]" />
                <div className="flex-1">
                  <div className="mb-2 h-4 w-32 rounded bg-[var(--background-lighter)]" />
                  <div className="h-3 w-24 rounded bg-[var(--background-lighter)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Résultats */}
      {!isLoading && searchResults.length > 0 && (
        <>
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-3">
            {searchResults.map((user) => (
              <UserListItem
                key={user.uid}
                user={user}
                showFollowButton={true}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty state - Recherche effectuée mais aucun résultat */}
      {!isLoading && hasSearched && searchResults.length === 0 && !error && (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">🔍</div>
          <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
            Aucun résultat
          </h3>
          <p className="text-[var(--foreground-muted)]">
            Aucun utilisateur trouvé pour "{query}". Essayez un autre nom ou nom d'utilisateur.
          </p>
        </div>
      )}

      {/* État initial - Pas de recherche */}
      {!isLoading && !hasSearched && (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">👥</div>
          <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
            Recherchez des utilisateurs
          </h3>
          <p className="text-[var(--foreground-muted)]">
            Tapez un nom ou un nom d'utilisateur pour commencer
          </p>
        </div>
      )}
    </div>
  )
}