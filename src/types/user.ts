import { Timestamp } from 'firebase/firestore';

/**
 * Interface représentant un utilisateur dans l'application
 */
export interface User {
  uid: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  bio?: string;
  isPrivate: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Données nécessaires pour l'inscription
 */
export interface SignUpData {
  email: string;
  password: string;
  username: string;
}

/**
 * Données nécessaires pour la connexion
 */
export interface SignInData {
  email: string;
  password: string;
}

/**
 * Type pour les erreurs d'authentification
 */
export type AuthError = {
  code: string;
  message: string;
};

/**
 * Données pour créer un profil utilisateur dans Firestore
 */
export interface CreateUserProfileData {
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  bio?: string;
  isPrivate?: boolean;
}

/**
 * Données pour mettre à jour un profil utilisateur
 */
export interface UpdateUserProfileData {
  username?: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  bio?: string;
  isPrivate?: boolean;
}

/**
 * Type pour les données de mise à jour du profil (formulaire)
 */
export interface UpdateProfileData {
  username: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  isPrivate: boolean;
}

/**
 * Statistiques du profil utilisateur
 */
export interface ProfileStats {
  releasesCount: number;
  wishlistCount?: number; // Optionnel pour compatibilité
  followersCount: number;
  followingCount: number;
}
