import { supabase } from '../supabaseClient'
import { toCamelCase, toSnakeCase } from '../utils/caseConverter'

/**
 * Récupérer les statistiques de follow d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Nombre de followers et following
 */
export async function getFollowStats(userId: string): Promise<{
  followersCount: number
  followingCount: number
}> {
  try {
    // Compter les followers (personnes qui suivent cet utilisateur)
    const { data: followersData, error: followersError } = await supabase
      .from('follows')
      .select('id')
      .eq('following_id', userId)
      .eq('status', 'active')

    if (followersError) throw followersError

    // Compter les following (personnes que cet utilisateur suit)
    const { data: followingData, error: followingError } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', userId)
      .eq('status', 'active')

    if (followingError) throw followingError

    return {
      followersCount: followersData?.length || 0,
      followingCount: followingData?.length || 0,
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des stats de follow:', error)
    return {
      followersCount: 0,
      followingCount: 0,
    }
  }
}

/**
 * Suivre un utilisateur
 * @param followerId - ID de l'utilisateur qui suit
 * @param followingId - ID de l'utilisateur à suivre
 */
export async function followUser(
  followerId: string,
  followingId: string,
): Promise<void> {
  // Convertir en snake_case pour la BDD
  const dbData = toSnakeCase({
    followerId,
    followingId,
    status: 'active',
  })

  const { error } = await supabase.from('follows').insert(dbData)

  if (error) {
    console.error('Erreur lors du follow:', error)
    throw error
  }
}

/**
 * Ne plus suivre un utilisateur
 * @param followerId - ID de l'utilisateur qui suit
 * @param followingId - ID de l'utilisateur suivi
 */
export async function unfollowUser(
  followerId: string,
  followingId: string,
): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  if (error) {
    console.error('Erreur lors du unfollow:', error)
    throw error
  }
}

/**
 * Vérifier si un utilisateur suit un autre
 * @param followerId - ID de l'utilisateur qui suit
 * @param followingId - ID de l'utilisateur suivi
 * @returns true si le follow existe et est actif
 */
export async function isFollowing(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .eq('status', 'active')

  if (error) {
    console.error('Erreur lors de la vérification du follow:', error)
    return false
  }

  return data && data.length > 0
}

/**
 * Récupérer la liste des abonnés d'un utilisateur
 */
export async function getFollowers(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur lors de la récupération des abonnés:', error)
    throw error
  }

  // Récupérer les IDs des followers
  const followerIds = data.map(f => f.follower_id)

  if (followerIds.length === 0) {
    return []
  }

  // Récupérer les infos complètes des users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .in('uid', followerIds)

  if (usersError) {
    console.error('Erreur lors de la récupération des utilisateurs:', usersError)
    throw usersError
  }

  // Convertir en camelCase
  return toCamelCase(users || [])
}

/**
 * Récupérer la liste des abonnements d'un utilisateur
 */
export async function getFollowing(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur lors de la récupération des abonnements:', error)
    throw error
  }

  // Récupérer les IDs des following
  const followingIds = data.map(f => f.following_id)

  if (followingIds.length === 0) {
    return []
  }

  // Récupérer les infos complètes des users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .in('uid', followingIds)

  if (usersError) {
    console.error('Erreur lors de la récupération des utilisateurs:', usersError)
    throw usersError
  }

  // Convertir en camelCase
  return toCamelCase(users || [])
}