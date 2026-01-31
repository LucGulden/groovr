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
