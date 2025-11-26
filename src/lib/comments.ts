import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { getUserByUid } from './user';
import type { Comment, CommentWithUser } from '@/types/comment';

const COMMENTS_COLLECTION = 'comments';
const POSTS_COLLECTION = 'posts';

/**
 * Ajoute un commentaire à un post
 */
export async function addComment(
  postId: string,
  userId: string,
  text: string
): Promise<Comment> {
  try {
    if (!text.trim()) {
      throw new Error('Le commentaire ne peut pas être vide');
    }

    const newCommentRef = doc(collection(db, COMMENTS_COLLECTION));
    const commentData = {
      postId,
      userId,
      text: text.trim(),
      createdAt: serverTimestamp(),
    };

    await setDoc(newCommentRef, commentData);

    // Incrémenter le compteur de commentaires du post
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      commentsCount: increment(1),
    });

    console.log(`[Comment] ${userId} commented on post ${postId}`);

    return {
      id: newCommentRef.id,
      ...commentData,
      createdAt: commentData.createdAt as any,
    } as Comment;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du commentaire:', error);
    throw new Error('Impossible d\'ajouter le commentaire');
  }
}

/**
 * Récupère les commentaires d'un post
 * Ordre : createdAt ASC (du plus ancien au plus récent)
 */
export async function getPostComments(postId: string): Promise<CommentWithUser[]> {
  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    const q = query(
      commentsRef,
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const comments: Comment[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Comment[];

    // Récupérer les infos des utilisateurs
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await getUserByUid(comment.userId);
        if (!user) {
          console.warn(`User ${comment.userId} non trouvé`);
          return null;
        }
        return {
          ...comment,
          user,
        } as CommentWithUser;
      })
    );

    return commentsWithUsers.filter(
      (comment): comment is CommentWithUser => comment !== null
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des commentaires:', error);
    throw new Error('Impossible de récupérer les commentaires');
  }
}

/**
 * Supprime un commentaire
 */
export async function deleteComment(commentId: string, postId: string): Promise<void> {
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    await deleteDoc(commentRef);

    // Décrémenter le compteur de commentaires du post
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      commentsCount: increment(-1),
    });

    console.log(`[Comment] Deleted comment ${commentId}`);
  } catch (error) {
    console.error('Erreur lors de la suppression du commentaire:', error);
    throw new Error('Impossible de supprimer le commentaire');
  }
}

/**
 * Subscribe aux commentaires d'un post (real-time)
 */
export function subscribeToPostComments(
  postId: string,
  onUpdate: (comments: CommentWithUser[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const commentsRef = collection(db, COMMENTS_COLLECTION);
  const q = query(
    commentsRef,
    where('postId', '==', postId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    async (querySnapshot) => {
      try {
        const comments: Comment[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Comment[];

        const commentsWithUsers = await Promise.all(
          comments.map(async (comment) => {
            const user = await getUserByUid(comment.userId);
            if (!user) return null;
            return { ...comment, user } as CommentWithUser;
          })
        );

        const filtered = commentsWithUsers.filter(
          (comment): comment is CommentWithUser => comment !== null
        );
        onUpdate(filtered);
      } catch (error) {
        if (onError) {
          onError(error as Error);
        }
      }
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}
