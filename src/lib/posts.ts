import { supabase } from '../supabaseClient'
import { toSnakeCase } from '../utils/caseConverter'
import type { PostWithDetails } from '../types/post'

/**
 * Ajouter un like à un post
 */
export async function likePost(userId: string, postId: string): Promise<void> {
  const dbData = toSnakeCase({
    userId,
    postId,
  })

  const { error } = await supabase
    .from('post_likes')
    .insert(dbData)

  if (error) {
    console.error('Erreur lors du like:', error)
    throw error
  }
}

/**
 * Retirer un like d'un post
 */
export async function unlikePost(userId: string, postId: string): Promise<void> {
  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId)

  if (error) {
    console.error('Erreur lors du unlike:', error)
    throw error
  }
}

/**
 * Vérifier si un utilisateur a liké un post
 */
export async function hasLikedPost(userId: string, postId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('post_likes')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)

  if (error) {
    console.error('Erreur lors de la vérification du like:', error)
    return false
  }

  return data && data.length > 0
}

/**
 * S'abonner aux likes d'un post en temps réel
 */
export function subscribeToPostLikes(
  postId: string,
  onUpdate: (likesCount: number) => void,
  onError: (error: Error) => void,
): () => void {
  // Charger le compteur de likes
  const loadLikesCount = async () => {
    const { count, error } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)

    if (error) {
      onError(error)
      return
    }

    onUpdate(count || 0)
  }

  // Charger immédiatement
  loadLikesCount()

  // S'abonner aux changements en temps réel
  const channel = supabase
    .channel(`post-likes:${postId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, DELETE
        schema: 'public',
        table: 'post_likes',
        filter: `post_id=eq.${postId}`,
      },
      () => {
        // Recharger le compteur quand il y a un changement
        loadLikesCount()
      },
    )
    .subscribe()

  // Fonction de désabonnement
  return () => {
    channel.unsubscribe()
  }
}

/**
 * Récupérer les posts du feed avec pagination
 * @param userId - ID de l'utilisateur connecté
 * @param profileFeed - true = posts d'un utilisateur spécifique, false = feed global
 * @param limit - Nombre de posts à récupérer
 * @param lastPost - Dernier post récupéré (pour pagination)
 * @returns Liste des posts avec détails
 */
export async function getFeedPosts(
  userId: string,
  profileFeed: boolean,
  limit: number,
  lastPost?: PostWithDetails,
): Promise<PostWithDetails[]> {
  try {
    let query = supabase
      .from('posts')
      .select(`
        id,
        user_id,
        vinyl_id,
        type,
        content,
        created_at,
        user:users!user_id (
          uid,
          username,
          photo_url
        ),
        vinyl:vinyls!vinyl_id (
          id,
          title,
          cover_url,
          vinyl_artists(
            artist:artists(name)
          ),
          album:albums!album_id (
            title,
            cover_url,
            album_artists(
              artist:artists(name)
            )
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filtre selon le type de feed
    if (profileFeed) {
      // Feed d'un utilisateur spécifique
      query = query.eq('user_id', userId)
    } else {
      // Feed global : posts des utilisateurs suivis + les siens
      // On va d'abord récupérer la liste des utilisateurs suivis
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)
        .eq('status', 'active')

      if (followsError) {
        console.error('Erreur lors de la récupération des follows:', followsError)
        throw followsError
      }

      // Créer un tableau d'IDs (utilisateurs suivis + soi-même)
      const followedUserIds = followsData.map((f) => f.following_id)
      followedUserIds.push(userId) // Ajouter ses propres posts

      if (followedUserIds.length === 0) {
        // Aucun utilisateur suivi, retourner tableau vide
        return []
      }

      // Filtrer par la liste des utilisateurs
      query = query.in('user_id', followedUserIds)
    }

    // Pagination : si lastPost est fourni, récupérer les posts après celui-ci
    if (lastPost) {
      query = query.lt('created_at', lastPost.createdAt)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur lors de la récupération des posts:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return []
    }

    // Récupérer les stats (likes et commentaires) pour chaque post
    const postIds = data.map((post) => post.id)

    // Compter les likes pour tous les posts en une seule requête
    const { data: likesData } = await supabase
      .from('post_likes')
      .select('post_id')
      .in('post_id', postIds)

    // Compter les commentaires pour tous les posts
    const { data: commentsData } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds)

    // Créer des maps pour un accès rapide
    const likesCountMap = new Map<string, number>()
    const commentsCountMap = new Map<string, number>()

    likesData?.forEach((like) => {
      likesCountMap.set(like.post_id, (likesCountMap.get(like.post_id) || 0) + 1)
    })

    commentsData?.forEach((comment) => {
      commentsCountMap.set(comment.post_id, (commentsCountMap.get(comment.post_id) || 0) + 1)
    })

    // Transformer les données en PostWithDetails
    const posts: PostWithDetails[] = data.map((post: any) => {
      // Extraire les artistes du vinyle
      const vinylArtists = post.vinyl?.vinyl_artists?.map((va: any) => va.artist?.name).filter(Boolean) || []
      const vinylArtist = vinylArtists.join(', ') || 'Artiste inconnu'
      
      // Extraire les artistes de l'album
      const albumArtists = post.vinyl?.album?.album_artists?.map((aa: any) => aa.artist?.name).filter(Boolean) || []
      const albumArtist = albumArtists.join(', ') || vinylArtist

      // Récupérer les infos de l'album (depuis le vinyle ou l'album lié)
      const albumInfo = post.vinyl?.album || {
        title: post.vinyl?.title || 'Album inconnu',
        artist: vinylArtist,
        cover_url: post.vinyl?.cover_url,
      }

      return {
        id: post.id,
        userId: post.user_id,
        type: post.type,
        createdAt: post.created_at,
        likesCount: likesCountMap.get(post.id) || 0,
        commentsCount: commentsCountMap.get(post.id) || 0,
        user: {
          username: post.user.username,
          photoURL: post.user.photo_url,
        },
        album: {
          title: albumInfo.title,
          artist: albumArtist,
          coverUrl: albumInfo.cover_url,
        },
      }
    })

    return posts
  } catch (error) {
    console.error('Erreur dans getFeedPosts:', error)
    throw error
  }
}