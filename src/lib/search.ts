import { supabase } from '../supabaseClient'
import type { User } from '../types/user'

/**
 * Recherche d'utilisateurs par username, nom ou prénom
 * @param query - Terme de recherche
 * @param limit - Nombre max de résultats (défaut: 20)
 * @returns Liste d'utilisateurs correspondants
 */
export async function searchUsers(
  query: string,
  limit: number = 20,
): Promise<User[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  const searchTerm = query.trim().toLowerCase()

  const { data, error } = await supabase
    .from('users')
    .select('uid, username, first_name, last_name, bio, photo_url, email')
    .or(
      `username.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`,
    )
    .limit(limit)
    .order('username', { ascending: true })

  if (error) {
    console.error('[Search] Erreur recherche utilisateurs:', error)
    throw error
  }

  return data || []
}