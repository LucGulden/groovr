import { Timestamp } from 'firebase/firestore';
import type { User } from './user';

/**
 * Comment dans Firestore
 * Document dans collection "comments"
 */
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: Timestamp;
}

/**
 * Comment avec détails de l'utilisateur (JOIN)
 */
export interface CommentWithUser extends Comment {
  user: User;
}

/**
 * Données pour créer un commentaire
 */
export interface CreateCommentData {
  postId: string;
  userId: string;
  text: string;
}
