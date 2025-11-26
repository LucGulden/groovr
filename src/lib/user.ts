import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { userCache } from './cache';
import type { CreateUserProfileData, UpdateUserProfileData, User, ProfileStats } from '@/types/user';

const USERS_COLLECTION = 'users';

/**
 * Crée un profil utilisateur dans Firestore
 * @param uid - ID unique de l'utilisateur Firebase Auth
 * @param data - Données du profil utilisateur
 */
export async function createUserProfile(
  uid: string,
  data: CreateUserProfileData
): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);

    await setDoc(userRef, {
      uid,
      email: data.email,
      username: data.username,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      photoURL: data.photoURL || null,
      bio: data.bio || null,
      isPrivate: data.isPrivate || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la création du profil utilisateur:', error);
    throw new Error('Impossible de créer le profil utilisateur');
  }
}

/**
 * Vérifie si un nom d'utilisateur existe déjà
 * @param username - Nom d'utilisateur à vérifier
 * @returns true si le nom d'utilisateur est disponible, false sinon
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    return querySnapshot.empty;
  } catch (error) {
    console.error('Erreur lors de la vérification du nom d\'utilisateur:', error);
    throw new Error('Impossible de vérifier le nom d\'utilisateur');
  }
}

/**
 * Récupère un utilisateur par son nom d'utilisateur
 * @param username - Nom d'utilisateur à rechercher
 * @returns L'utilisateur trouvé ou null
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    return userDoc.data() as User;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    throw new Error('Impossible de récupérer l\'utilisateur');
  }
}

/**
 * Récupère un utilisateur par son UID
 * Utilise un cache pour éviter les requêtes répétées
 * @param uid - ID unique de l'utilisateur
 * @returns L'utilisateur trouvé ou null
 */
export async function getUserByUid(uid: string): Promise<User | null> {
  try {
    // Vérifier le cache d'abord
    const cached = userCache.get(uid);
    if (cached) {
      return cached;
    }

    const userRef = doc(db, USERS_COLLECTION, uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    const user = userDoc.data() as User;

    // Mettre en cache
    userCache.set(uid, user);

    return user;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    throw new Error('Impossible de récupérer l\'utilisateur');
  }
}

/**
 * Met à jour le profil utilisateur
 * @param uid - ID unique de l'utilisateur
 * @param data - Données à mettre à jour
 */
export async function updateUserProfile(
  uid: string,
  data: UpdateUserProfileData
): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);

    // Filtrer les valeurs undefined (Firestore ne les accepte pas)
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(userRef, {
      ...cleanData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    throw new Error('Impossible de mettre à jour le profil');
  }
}

/**
 * Valide le format d'un nom d'utilisateur
 * @param username - Nom d'utilisateur à valider
 * @returns true si valide, false sinon
 */
export function validateUsername(username: string): boolean {
  // Alphanumerique + tirets/underscores, 3-20 caractères
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Vérifie la disponibilité d'un username en temps réel
 * Exclut l'utilisateur actuel pour permettre l'édition
 * @param username - Nom d'utilisateur à vérifier
 * @param currentUserId - ID de l'utilisateur actuel (optionnel)
 * @returns true si disponible, false sinon
 */
export async function checkUsernameAvailability(
  username: string,
  currentUserId?: string
): Promise<boolean> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return true; // Username disponible
    }

    // Si un utilisateur existe avec ce username
    if (currentUserId) {
      // Vérifier si c'est l'utilisateur actuel
      const existingUser = querySnapshot.docs[0];
      return existingUser.id === currentUserId;
    }

    return false; // Username déjà pris
  } catch (error) {
    console.error('Erreur lors de la vérification du username:', error);
    throw new Error('Impossible de vérifier la disponibilité du username');
  }
}

/**
 * Récupère les statistiques du profil utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Statistiques du profil (placeholder avec 0 pour l'instant)
 */
export async function getProfileStats(userId: string): Promise<ProfileStats> {
  // Pour l'instant, on retourne des valeurs par défaut
  // Ces valeurs seront calculées plus tard avec les collections albums, followers, etc.
  return {
    albumsCount: 0,
    followersCount: 0,
    followingCount: 0,
  };
}

/**
 * Valide la bio
 * @param bio - Bio à valider
 * @returns true si valide, false sinon
 */
export function validateBio(bio: string): boolean {
  return bio.length <= 200;
}
