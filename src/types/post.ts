import { Timestamp } from 'firebase/firestore';
import type { Album } from './album';
import type { User } from './user';

/**
 * Type de post
 */
export type PostType = 'collection_add' | 'wishlist_add';

/**
 * Post dans Firestore
 * Document dans collection "posts"
 */
export interface Post {
  id: string;
  userId: string;
  type: PostType;
  albumId: string; // Référence vers collection "albums"
  createdAt: Timestamp;
  likesCount: number;
  commentsCount: number;
}

/**
 * Post avec détails de l'album et de l'utilisateur (JOIN)
 * Utilisé pour l'affichage dans le feed
 */
export interface PostWithDetails extends Post {
  album: Album; // Détails de l'album
  user: User; // Détails de l'utilisateur qui a posté
}

/**
 * Données pour créer un post
 */
export interface CreatePostData {
  userId: string;
  type: PostType;
  albumId: string;
}
