import { useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { useNotificationsStore } from '../stores/notificationsStore'
import NotificationItem from '../components/NotificationItem'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Notifications() {
  const { user } = useAuth()
  
  // Guard TypeScript (ne devrait jamais arriver grâce à ProtectedRoute)
  if (!user) {
    return null
  }

  return <NotificationsContent userId={user.id} />
}

function NotificationsContent({ userId }: { userId: string }) {
  const {
    notifications,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    handleMarkAllAsRead,
  } = useNotifications(userId)

  const { reset } = useNotificationsStore()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Calculer le nombre de notifications non lues depuis les données locales
  const unreadCount = notifications.filter(n => !n.read).length

  // Marquer toutes les notifications comme lues au montage
  useEffect(() => {
    // Attendre que le chargement initial soit terminé
    if (loading) return

    // Reset le compteur dans le store (Navigation)
    reset()

    // Marquer en BDD seulement s'il y a des notifications non lues
    if (unreadCount > 0) {
      handleMarkAllAsRead()
    }
  }, [loading]) // Se déclenche quand loading passe à false

  // Infinite scroll avec Intersection Observer
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 },
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observerRef.current.observe(currentRef)
    }

    return () => {
      if (observerRef.current && currentRef) {
        observerRef.current.unobserve(currentRef)
      }
    }
  }, [loading, loadingMore, hasMore, loadMore])

  // Loading initial
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-foreground-muted mt-1">
              {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Liste des notifications */}
      {notifications.length === 0 ? (
        // Empty state
        <div className="bg-background-light rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🔔</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Aucune notification
          </h2>
          <p className="text-foreground-muted">
            Vous n'avez pas encore de notifications.
          </p>
        </div>
      ) : (
        <div className="bg-background-light rounded-lg overflow-hidden">
          <AnimatePresence mode="popLayout">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </AnimatePresence>

          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="p-4 text-center">
              {loadingMore && <LoadingSpinner size="sm" />}
            </div>
          )}
        </div>
      )}
    </div>
  )
}