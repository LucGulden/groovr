/**
 * Post avec tous les détails (user, album, stats)
 * Utilisé pour l'affichage dans le feed
 */
export interface PostWithDetails {
  id: string
  userId: string
  type: 'collection_add' | 'wishlist_add'
  createdAt: string
  likesCount: number
  commentsCount: number
  user: {
    username: string
    photoURL?: string
  }
  album: {
    title: string
    artist: string
    coverUrl: string
  }
}

/**
 * Post de base (données brutes de la DB)
 */
export interface Post {
  id: string
  user_id: string
  vinyl_id: string
  type: 'collection_add' | 'wishlist_add'
  content?: string
  created_at: string
}

/**
 * Like sur un post
 */
export interface PostLike {
  id: string
  user_id: string
  post_id: string
  created_at: string
}