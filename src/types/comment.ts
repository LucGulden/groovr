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
