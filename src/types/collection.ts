import { Timestamp } from 'firebase/firestore';
import type { Album } from './album';
import type { Release } from './release';

/**
 * Type de collection : collection ou wishlist
 */
export type CollectionType = 'collection' | 'wishlist';

/**
 * Release dans la collection ou wishlist d'un utilisateur
 * Document dans Firestore : /user_releases/{id}
 */
export interface UserRelease {
  id: string; // ID Firestore du document
  userId: string; // ID de l'utilisateur propriétaire
  releaseId: string; // Référence vers collection "releases"
  type: CollectionType; // 'collection' ou 'wishlist'
  addedAt: Timestamp; // Date d'ajout
  notes?: string; // Notes optionnelles de l'utilisateur
}

/**
 * UserRelease avec les détails de l'release (JOIN)
 * Utilisé pour l'affichage dans les listes
 */
export interface UserReleaseWithDetails extends UserRelease {
  release: Release; // Détails complets de l'release
}

/**
 * Données pour créer un UserRelease
 */
export interface CreateUserReleaseData {
  userId: string;
  releaseId: string;
  type: CollectionType;
  notes?: string;
}

/**
 * Données pour mettre à jour un UserRelease
 */
export interface UpdateUserReleaseData {
  notes?: string;
  type?: CollectionType;
}