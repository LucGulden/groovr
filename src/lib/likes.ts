import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import { getUserByUid } from './user';
import type { Like, LikeWithUser } from '@/types/like';

const LIKES_COLLECTION = 'likes';
const POSTS_COLLECTION = 'posts';

/**
 * Like un post
 * Utilise une transaction pour éviter les doublons
 */
export async function likePost(userId: string, postId: string): Promise<Like> {
  try {
    // Vérifier si le like existe déjà
    const existingLike = await getLikeDoc(userId, postId);
    if (existingLike) {
      console.log('Like déjà existant');
      return existingLike;
    }

    // Créer le like et incrémenter le compteur dans une transaction
    const newLikeRef = doc(collection(db, LIKES_COLLECTION));
    const postRef = doc(db, POSTS_COLLECTION, postId);

    const likeData = {
      userId,
      postId,
      createdAt: serverTimestamp(),
    };

    await setDoc(newLikeRef, likeData);

    // Incrémenter le compteur de likes du post
    await updateDoc(postRef, {
      likesCount: increment(1),
    });

    console.log(`[Like] ${userId} liked post ${postId}`);

    return {
      id: newLikeRef.id,
      ...likeData,
      createdAt: likeData.createdAt as any,
    } as Like;
  } catch (error) {
    console.error('Erreur lors du like:', error);
    throw new Error('Impossible de liker le post');
  }
}

/**
 * Unlike un post
 */
export async function unlikePost(userId: string, postId: string): Promise<void> {
  try {
    const like = await getLikeDoc(userId, postId);
    if (!like) {
      console.log('Like non trouvé');
      return;
    }

    const likeRef = doc(db, LIKES_COLLECTION, like.id);
    const postRef = doc(db, POSTS_COLLECTION, postId);

    await deleteDoc(likeRef);

    // Décrémenter le compteur de likes du post
    await updateDoc(postRef, {
      likesCount: increment(-1),
    });

    console.log(`[Unlike] ${userId} unliked post ${postId}`);
  } catch (error) {
    console.error('Erreur lors du unlike:', error);
    throw new Error('Impossible de unliker le post');
  }
}

/**
 * Vérifie si un utilisateur a liké un post
 */
export async function hasLikedPost(userId: string, postId: string): Promise<boolean> {
  try {
    const like = await getLikeDoc(userId, postId);
    return like !== null;
  } catch (error) {
    console.error('Erreur lors de la vérification du like:', error);
    return false;
  }
}

/**
 * Récupère les utilisateurs qui ont liké un post
 */
export async function getPostLikes(
  postId: string,
  limitCount: number = 10
): Promise<LikeWithUser[]> {
  try {
    const likesRef = collection(db, LIKES_COLLECTION);
    const q = query(
      likesRef,
      where('postId', '==', postId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const likes: Like[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Like[];

    // Récupérer les infos des utilisateurs
    const likesWithUsers = await Promise.all(
      likes.map(async (like) => {
        const user = await getUserByUid(like.userId);
        if (!user) {
          console.warn(`User ${like.userId} non trouvé`);
          return null;
        }
        return {
          ...like,
          user,
        } as LikeWithUser;
      })
    );

    return likesWithUsers.filter((like): like is LikeWithUser => like !== null);
  } catch (error) {
    console.error('Erreur lors de la récupération des likes:', error);
    throw new Error('Impossible de récupérer les likes');
  }
}

/**
 * Helper: Récupère un like par userId et postId
 */
async function getLikeDoc(userId: string, postId: string): Promise<Like | null> {
  try {
    const likesRef = collection(db, LIKES_COLLECTION);
    const q = query(
      likesRef,
      where('userId', '==', userId),
      where('postId', '==', postId)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Like;
  } catch (error) {
    console.error('Erreur lors de la récupération du like:', error);
    return null;
  }
}
