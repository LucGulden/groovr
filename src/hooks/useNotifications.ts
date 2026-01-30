import { useState, useEffect, useCallback } from 'react'
import { 
  getNotifications, 
  markAllAsRead,
} from '../lib/notifications'
import type { NotificationWithDetails } from '../types/notification'

interface UseNotificationsReturn {
  notifications: NotificationWithDetails[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  handleMarkAllAsRead: () => Promise<void>;
}

export function useNotifications(userId: string): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const LIMIT = 20

  // Charger les notifications initiales
  const loadNotifications = useCallback(async (reset: boolean = false) => {
    // Protection : ne rien faire si pas de userId
    if (!userId || userId.trim() === '') {
      setLoading(false)
      setLoadingMore(false)
      return
    }

    try {
      if (reset) {
        setLoading(true)
        setNotifications([])
        setHasMore(true)
      } else {
        setLoadingMore(true)
      }

      const lastNotification = reset ? undefined : notifications[notifications.length - 1]
      const data = await getNotifications(
        userId,
        LIMIT,
        lastNotification?.createdAt,
      )

      if (reset) {
        setNotifications(data)
      } else {
        setNotifications(prev => [...prev, ...data])
      }

      setHasMore(data.length === LIMIT)
      setError(null)
    } catch (err) {
      console.error('Error loading notifications:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [userId, notifications])


  // Charger plus de notifications (infinite scroll)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    await loadNotifications(false)
  }, [loadingMore, hasMore, loadNotifications])

  // Rafraîchir les notifications
  const refresh = useCallback(async () => {
    await loadNotifications(true)
  }, [loadNotifications])

  // Marquer toutes les notifications comme lues
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true })),
      )

      await markAllAsRead(userId)
    } catch (err) {
      console.error('Error marking all as read:', err)
      // Revert on error
      await loadNotifications(true)
    }
  }, [userId, loadNotifications])

  // Chargement initial
  useEffect(() => {
    if (userId && userId.trim() !== '') {
      loadNotifications(true)
    }
  }, []) // ← Une seule fois au montage (si userId est présent)

  return {
    notifications,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    handleMarkAllAsRead,
  }
}