import { supabase } from '../supabaseClient'
import type { 
  Notification, 
  NotificationWithDetails, 
  CreateNotificationParams,
} from '../types/notification'

/**
 * Récupère les notifications d'un utilisateur avec pagination
 */
export async function getNotifications(
  userId: string,
  limit: number = 20,
  lastCreatedAt?: string,
): Promise<NotificationWithDetails[]> {
  let query = supabase
    .from('notifications')
    .select(`
      *,
      actor:actor_id (
        uid,
        username,
        first_name,
        last_name,
        photo_url
      ),
      post:post_id (
        id,
        vinyl_id,
        content,
        vinyl:vinyl_id (
          id,
          title,
          cover_url,
          vinyl_artists(
            artist:artists(name)
          ),
          album:albums(
            id,
            title,
            album_artists(
              artist:artists(name)
            )
          )
        )
      ),
      comment:comment_id (
        id,
        content
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  // Pagination cursor-based
  if (lastCreatedAt) {
    query = query.lt('created_at', lastCreatedAt)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching notifications:', error)
    throw error
  }

  // Transformer la structure pour reconstituer les champs artist
  return (data || []).map((item: any) => {
    // Si on a un post avec un vinyl
    if (item.post?.vinyl) {
      // Extraire les artistes du vinyl
      const vinylArtists = item.post.vinyl.vinyl_artists?.map((va: any) => va.artist?.name).filter(Boolean) || []
      
      // Extraire les artistes de l'album
      const albumArtists = item.post.vinyl.album?.album_artists?.map((aa: any) => aa.artist?.name).filter(Boolean) || []
      
      item.post.vinyl = {
        ...item.post.vinyl,
        artist: vinylArtists.join(', ') || albumArtists.join(', ') || 'Artiste inconnu',
        vinyl_artists: undefined,
        album: item.post.vinyl.album ? {
          ...item.post.vinyl.album,
          artist: albumArtists.join(', ') || 'Artiste inconnu',
          album_artists: undefined,
        } : undefined,
      }
    }

    return item
  }) as NotificationWithDetails[]
}

/**
 * Compte le nombre de notifications non lues
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) {
    console.error('Error counting unread notifications:', error)
    throw error
  }

  return count || 0
}

/**
 * Marque toutes les notifications d'un utilisateur comme lues
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    throw error
  }
}

/**
 * Crée une nouvelle notification
 * Note: Principalement utilisé par les triggers SQL, mais peut être appelé manuellement
 */
export async function createNotification(
  params: CreateNotificationParams,
): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: params.user_id,
      type: params.type,
      actor_id: params.actor_id,
      post_id: params.post_id || null,
      comment_id: params.comment_id || null,
    })
    .select()
    .single()

  if (error) {
    // Si c'est une erreur de contrainte unique (notification déjà existante), on ignore
    if (error.code === '23505') {
      console.log('Notification already exists, skipping')
      return null
    }
    console.error('Error creating notification:', error)
    throw error
  }

  return data as Notification
}

/**
 * Subscribe aux nouvelles notifications en temps réel
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void,
  onError?: (error: Error) => void,
) {
  const channel = supabase
    .channel(`notifs-${userId}-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new as Notification)
      },
    )
    .subscribe((status, err) => {  // ← Ajouter le paramètre err
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to notifications')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Channel error details:', err)  // ← Logger les détails
        onError?.(new Error(`Error subscribing to notifications: ${err?.message || 'Unknown error'}`))
      } else if (status === 'TIMED_OUT') {
        console.error('❌ Subscription timed out')
        onError?.(new Error('Subscription timed out'))
      } else if (status === 'CLOSED') {
        console.log('🔌 Channel closed')
      }
    })

  return () => {
    channel.unsubscribe()
  }
}