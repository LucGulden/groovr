import { Timestamp } from 'firebase/firestore';
import type { User } from './user';

/**
 * Like dans Firestore
 * Document dans collection "likes"
 */
export interface Like {
  id: string;
  userId: string;
  postId: string;
  createdAt: Timestamp;
}

/**
 * Like avec détails de l'utilisateur (JOIN)
 */
export interface LikeWithUser extends Like {
  user: User;
}

/**
 * Données pour créer un like
 */
export interface CreateLikeData {
  userId: string;
  postId: string;
}
