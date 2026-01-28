import { supabase } from '../supabaseClient'
import type { User } from '../types/user'

export function validateUsername(username: string): boolean {
  // Règles : 3-20 caractères, lettres, chiffres, - et _
  const regex = /^[a-zA-Z0-9_-]{3,20}$/
  return regex.test(username)
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)

    if (error) {
      console.error('Erreur lors de la vérification du username:', error)
      return false
    }

    // Si data est null ou vide, le username est disponible
    // Si data contient un résultat, le username est déjà pris
    return !data || data.length === 0
  } catch (err) {
    console.error('Erreur inattendue:', err)
    return false
  }
}

/**
 * Valide la bio
 * @param bio - Bio à valider
 * @returns true si valide, false sinon
 */
export function validateBio(bio: string): boolean {
  return bio.length <= 200
}

/**
 * Vérifie la disponibilité d'un username en excluant l'utilisateur actuel
 * @param username - Nom d'utilisateur à vérifier
 * @param excludeUserId - ID de l'utilisateur à exclure (pour l'édition)
 * @returns true si disponible, false sinon
 */
export async function checkUsernameAvailability(
  username: string,
  excludeUserId?: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('uid, username')
      .eq('username', username)

    if (error) {
      console.error('Erreur lors de la vérification du username:', error)
      return false
    }

    // Si aucun résultat, le username est disponible
    if (!data || data.length === 0) {
      return true
    }

    // Si un utilisateur existe avec ce username, vérifier si c'est l'utilisateur actuel
    if (excludeUserId) {
      return data[0].uid === excludeUserId
    }

    return false
  } catch (err) {
    console.error('Erreur inattendue:', err)
    return false
  }
}

/**
 * Met à jour le profil utilisateur
 * @param userId - ID de l'utilisateur
 * @param data - Données à mettre à jour
 */
export async function updateUserProfile(
  userId: string,
  data: {
    username?: string;
    first_name?: string;
    last_name?: string;
    bio?: string;
    photo_url?: string;
  },
): Promise<void> {
  // Filtrer les valeurs undefined
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  )

  const { error } = await supabase
    .from('users')
    .update(cleanData)
    .eq('uid', userId)

  if (error) {
    console.error('Erreur lors de la mise à jour du profil:', error)
    throw new Error('Impossible de mettre à jour le profil')
  }
}

export async function getUserByUid(uid: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('uid', uid)
      .single()

    if (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error)
      return null
    }

    return data as User
  } catch (err) {
    console.error('Erreur inattendue:', err)
    return null
  }
}