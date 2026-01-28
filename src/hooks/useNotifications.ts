import { useState, useEffect, useCallback } from 'react'
import { 
  getNotifications, 
  getUnreadCount, 
  subscribeToNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../lib/notifications'
import type { NotificationWithDetails, Notification } from '../types/notification'

interface UseNotificationsReturn {
  notifications: NotificationWithDetails[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  unreadCount: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  handleMarkAsRead: (notificationId: string) => void;
  handleMarkAllAsRead: () => Promise<void>;
  handleDelete: (notificationId: string) => void;
}

export function useNotifications(userId: string): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  
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
        lastNotification?.created_at,
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

  // Charger le compteur de notifications non lues
  const loadUnreadCount = useCallback(async () => {
    // Protection : ne rien faire si pas de userId
    if (!userId || userId.trim() === '') {
      setUnreadCount(0)
      return
    }

    try {
      const count = await getUnreadCount(userId)
      setUnreadCount(count)
    } catch (err) {
      console.error('Error loading unread count:', err)
    }
  }, [userId])

  // Charger plus de notifications (infinite scroll)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    await loadNotifications(false)
  }, [loadingMore, hasMore, loadNotifications])

  // Rafraîchir les notifications
  const refresh = useCallback(async () => {
    await loadNotifications(true)
    await loadUnreadCount()
  }, [loadNotifications, loadUnreadCount])

  // Marquer une notification comme lue
  const handleMarkAsRead = useCallback((notificationId: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif,
      ),
    )
    setUnreadCount(prev => Math.max(0, prev - 1))

    // Update en base
    markAsRead(notificationId).catch(err => {
      console.error('Error marking as read:', err)
      // Revert optimistic update on error
      loadNotifications(true)
      loadUnreadCount()
    })
  }, [loadNotifications, loadUnreadCount])

  // Marquer toutes les notifications comme lues
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true })),
      )
      setUnreadCount(0)

      await markAllAsRead(userId)
    } catch (err) {
      console.error('Error marking all as read:', err)
      // Revert on error
      await loadNotifications(true)
      await loadUnreadCount()
    }
  }, [userId, loadNotifications, loadUnreadCount])

  // Supprimer une notification
  const handleDelete = useCallback((notificationId: string) => {
    // Optimistic update
    const notifToDelete = notifications.find(n => n.id === notificationId)
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    if (notifToDelete && !notifToDelete.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }

    // Delete en base
    deleteNotification(notificationId).catch(err => {
      console.error('Error deleting notification:', err)
      // Revert optimistic update on error
      loadNotifications(true)
      loadUnreadCount()
    })
  }, [notifications, loadNotifications, loadUnreadCount])

  // Chargement initial
  useEffect(() => {
    if (userId && userId.trim() !== '') {
      loadNotifications(true)
      loadUnreadCount()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // ← Une seule fois au montage (si userId est présent)

  // Subscribe aux nouvelles notifications en temps réel
  useEffect(() => {
    // Protection : ne pas subscribe si pas de userId
    if (!userId || userId.trim() === '') {
      return
    }

    const unsubscribe = subscribeToNotifications(
      userId,
      (newNotification: Notification) => {
        // Incrémenter le compteur de non lues
        setUnreadCount(prev => prev + 1)
        
        // Optionnel : Ajouter la notification en tête de liste
        // On pourrait aussi juste afficher un badge "Nouvelles notifications"
        // et laisser l'utilisateur refresh manuellement
        console.log('New notification received:', newNotification)
      },
      (err) => {
        console.error('Realtime subscription error:', err)
      },
    )

    return unsubscribe
  }, [userId])

  return {
    notifications,
    loading,
    loadingMore,
    hasMore,
    error,
    unreadCount,
    loadMore,
    refresh,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete,
  }
}