/**
 * Commentaire avec détails utilisateur
 * Utilisé pour l'affichage dans PostCard
 */
export interface CommentWithUser {
  id: string
  userId: string
  postId: string
  content: string
  createdAt: string
  user: {
    username: string
    photoURL?: string
  }
}

/**
 * Commentaire de base (données brutes de la DB)
 */
export interface Comment {
  id: string
  user_id: string
  post_id: string
  content: string
  created_at: string
}