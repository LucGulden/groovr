import { useRef, useEffect } from 'react'
import { useUserSearch } from '../hooks/useUserSearch'
import UserListItem from './UserListItem'

interface SearchUsersTabProps {
  query: string;
}

export default function SearchUsersTab({ query }: SearchUsersTabProps) {
  const { users, loading, loadingMore, hasMore, error, loadMore } = useUserSearch({ query })
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const hasSearched = query.trim().length > 0

  // Infinite scroll avec IntersectionObserver
  useEffect(() => {
    const currentRef = loadMoreRef.current
    if (!currentRef || !hasMore || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(currentRef)

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMore, loadingMore, loadMore])

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
      {loading && users.length === 0 && (
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
      {!loading && users.length > 0 && (
        <>
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            {users.length}{hasMore ? '+' : ''} résultat{users.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-3">
            {users.map((user) => (
              <UserListItem
                key={user.uid}
                user={user}
                showFollowButton={true}
              />
            ))}
          </div>

          {/* Trigger pour l'infinite scroll */}
          {hasMore && (
            <div ref={loadMoreRef} className="mt-8 flex justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                  <span>Chargement...</span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Empty state - Recherche effectuée mais aucun résultat */}
      {!loading && hasSearched && users.length === 0 && !error && (
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
      {!loading && !hasSearched && (
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