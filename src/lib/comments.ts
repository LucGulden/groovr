import { supabase } from '../supabaseClient'
import { toCamelCase, toSnakeCase } from '../utils/caseConverter'
import type { CommentWithUser } from '../types/comment'

/**
 * Ajouter un commentaire à un post
 */
export async function addComment(
  postId: string,
  userId: string,
  content: string,
): Promise<void> {
  // Convertir en snake_case pour la BDD
  const dbData = toSnakeCase({
    postId,
    userId,
    content,
  })

  const { error } = await supabase
    .from('comments')
    .insert(dbData)

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

    // Convertir en camelCase
    const comments = toCamelCase<CommentWithUser[]>(data || [])
    
    // Restructurer pour matcher CommentWithUser
    const transformedComments: CommentWithUser[] = comments.map((comment: any) => ({
      id: comment.id,
      userId: comment.userId,
      postId: comment.postId,
      content: comment.content,
      createdAt: comment.createdAt,
      user: {
        username: comment.user.username,
        photoURL: comment.user.photoUrl,
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

/**
 * S'abonner au compteur de commentaires d'un post en temps réel
 * Plus léger que subscribeToPostComments car ne charge pas les commentaires complets
 */
export function subscribeToPostCommentsCount(
  postId: string,
  onUpdate: (count: number) => void,
  onError: (error: Error) => void,
): () => void {
  // Charger le compteur initial
  const loadCount = async () => {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)

    if (error) {
      onError(error)
      return
    }

    onUpdate(count || 0)
  }

  // Charger immédiatement
  loadCount()

  // S'abonner aux changements en temps réel
  const channel = supabase
    .channel(`comments-count:${postId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`,
      },
      () => {
        // Recharger le compteur quand il y a un changement
        loadCount()
      },
    )
    .subscribe()

  // Fonction de désabonnement
  return () => {
    channel.unsubscribe()
  }
}