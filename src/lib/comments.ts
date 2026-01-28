import { supabase } from '../supabaseClient'
import type { CommentWithUser } from '../types/comment'

/**
 * Ajouter un commentaire à un post
 */
export async function addComment(
  postId: string,
  userId: string,
  content: string,
): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content,
    })

  if (error) {
    console.error('Erreur lors de l\'ajout du commentaire:', error)
    throw error
  }
}

/**
 * Supprimer un commentaire
 */
export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('Erreur lors de la suppression du commentaire:', error)
    throw error
  }
}

/**
 * S'abonner aux commentaires d'un post en temps réel
 */
export function subscribeToPostComments(
  postId: string,
  onData: (comments: CommentWithUser[]) => void,
  onError: (error: Error) => void,
): () => void {
  // Charger les commentaires initiaux
  const loadComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        user_id,
        post_id,
        content,
        created_at,
        user:users!user_id (
          uid,
          username,
          photo_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      onError(error)
      return
    }

    // Transformer les données pour matcher le type CommentWithUser
    const transformedComments: CommentWithUser[] = (data || []).map((comment: any) => ({
      id: comment.id,
      userId: comment.user_id,
      postId: comment.post_id,
      content: comment.content,
      createdAt: comment.created_at,
      user: {
        username: comment.user.username,
        photoURL: comment.user.photo_url,
      },
    }))

    onData(transformedComments)
  }

  // Charger immédiatement
  loadComments()

  // S'abonner aux changements en temps réel
  const channel = supabase
    .channel(`comments:${postId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`,
      },
      () => {
        // Recharger tous les commentaires quand il y a un changement
        loadComments()
      },
    )
    .subscribe()

  // Fonction de désabonnement
  return () => {
    channel.unsubscribe()
  }
}