import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  Timestamp,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { getAlbumById } from './albums';
import { getUserByUid } from './user';
import { getFollowing } from './follows';
import type { Post, PostWithDetails, PostType, CreatePostData } from '@/types/post';

const POSTS_COLLECTION = 'posts';

/**
 * Crée un post automatiquement
 */
export async function createPost(
  userId: string,
  type: PostType,
  albumId: string
): Promise<Post> {
  try {
    const newPostRef = doc(collection(db, POSTS_COLLECTION));
    const postData = {
      userId,
      type,
      albumId,
      createdAt: serverTimestamp(),
      likesCount: 0,
      commentsCount: 0,
    };

    await setDoc(newPostRef, postData);

    console.log(`[Post] Created post ${newPostRef.id} by ${userId}: ${type} ${albumId}`);

    return {
      id: newPostRef.id,
      ...postData,
      createdAt: postData.createdAt as any,
    } as Post;
  } catch (error) {
    console.error('Erreur lors de la création du post:', error);
    throw new Error('Impossible de créer le post');
  }
}

/**
 * Récupère les posts du feed pour un utilisateur
 * Retourne les posts des personnes qu'il suit + ses propres posts
 * Limité à 10 utilisateurs suivis pour optimiser les performances
 */
export async function getFeedPosts(
  userId: string,
  limitCount: number = 20,
  lastPost?: Post
): Promise<PostWithDetails[]> {
  try {
    // Récupérer les IDs des utilisateurs suivis (status=accepted)
    const following = await getFollowing(userId);
    let followingIds = following.map((user) => user.uid);

    // OPTIMISATION: Limiter à 10 utilisateurs suivis maximum
    // Cela évite trop de requêtes Firestore et améliore les performances
    if (followingIds.length > 10) {
      // Prendre les 10 premiers (ou implémenter une logique plus sophistiquée)
      followingIds = followingIds.slice(0, 10);
      console.log(`[Feed] Limité à 10 utilisateurs suivis (sur ${following.length})`);
    }

    // Ajouter son propre ID
    const userIds = [...followingIds, userId];

    if (userIds.length === 0) {
      return [];
    }

    // Firestore limite les requêtes "in" à 30 éléments max
    // Avec notre limite de 10, on ne devrait avoir qu'un seul batch
    const batchSize = 30;
    const batches: string[][] = [];

    for (let i = 0; i < userIds.length; i += batchSize) {
      batches.push(userIds.slice(i, i + batchSize));
    }

    // Récupérer les posts pour chaque batch
    const allPosts: Post[] = [];

    for (const batch of batches) {
      const postsRef = collection(db, POSTS_COLLECTION);
      let q = query(
        postsRef,
        where('userId', 'in', batch),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (lastPost) {
        q = query(
          postsRef,
          where('userId', 'in', batch),
          orderBy('createdAt', 'desc'),
          startAfter(lastPost.createdAt),
          limit(limitCount)
        );
      }

      const querySnapshot = await getDocs(q);
      const batchPosts: Post[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];

      allPosts.push(...batchPosts);
    }

    // Trier tous les posts par date et limiter
    allPosts.sort((a, b) => {
      const aTime = (a.createdAt as Timestamp).toMillis();
      const bTime = (b.createdAt as Timestamp).toMillis();
      return bTime - aTime;
    });

    const limitedPosts = allPosts.slice(0, limitCount);

    // Récupérer les détails de chaque post (album + user)
    const postsWithDetails = await Promise.all(
      limitedPosts.map(async (post) => {
        const album = await getAlbumById(post.albumId);
        const user = await getUserByUid(post.userId);

        if (!album || !user) {
          console.warn(`Post ${post.id}: album ou user introuvable`);
          return null;
        }

        return {
          ...post,
          album,
          user,
        } as PostWithDetails;
      })
    );

    return postsWithDetails.filter((post): post is PostWithDetails => post !== null);
  } catch (error) {
    console.error('Erreur lors de la récupération du feed:', error);
    throw new Error('Impossible de récupérer le feed');
  }
}

/**
 * Récupère les posts d'un utilisateur spécifique
 */
export async function getUserPosts(userId: string): Promise<PostWithDetails[]> {
  try {
    const postsRef = collection(db, POSTS_COLLECTION);
    const q = query(
      postsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const posts: Post[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];

    // Récupérer les détails de chaque post
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const album = await getAlbumById(post.albumId);
        const user = await getUserByUid(post.userId);

        if (!album || !user) {
          console.warn(`Post ${post.id}: album ou user introuvable`);
          return null;
        }

        return {
          ...post,
          album,
          user,
        } as PostWithDetails;
      })
    );

    return postsWithDetails.filter((post): post is PostWithDetails => post !== null);
  } catch (error) {
    console.error('Erreur lors de la récupération des posts:', error);
    throw new Error('Impossible de récupérer les posts');
  }
}

/**
 * Supprime un post et tous les likes/commentaires associés (cascade)
 */
export async function deletePost(postId: string): Promise<void> {
  try {
    // 1. Supprimer tous les likes associés au post
    const likesRef = collection(db, 'likes');
    const likesQuery = query(likesRef, where('postId', '==', postId));
    const likesSnapshot = await getDocs(likesQuery);

    const likesDeletions = likesSnapshot.docs.map((doc) =>
      deleteDoc(doc.ref)
    );
    await Promise.all(likesDeletions);
    console.log(`[Post] Supprimé ${likesSnapshot.size} likes pour le post ${postId}`);

    // 2. Supprimer tous les commentaires associés au post
    const commentsRef = collection(db, 'comments');
    const commentsQuery = query(commentsRef, where('postId', '==', postId));
    const commentsSnapshot = await getDocs(commentsQuery);

    const commentsDeletions = commentsSnapshot.docs.map((doc) =>
      deleteDoc(doc.ref)
    );
    await Promise.all(commentsDeletions);
    console.log(`[Post] Supprimé ${commentsSnapshot.size} commentaires pour le post ${postId}`);

    // 3. Supprimer le post lui-même
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await deleteDoc(postRef);

    console.log(`[Post] Post ${postId} supprimé avec succès (cascade complète)`);
  } catch (error) {
    console.error('Erreur lors de la suppression du post:', error);
    throw new Error('Impossible de supprimer le post');
  }
}

/**
 * Récupère un post par ID
 */
export async function getPostById(postId: string): Promise<PostWithDetails | null> {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      return null;
    }

    const post = {
      id: postDoc.id,
      ...postDoc.data(),
    } as Post;

    // Récupérer les détails
    const album = await getAlbumById(post.albumId);
    const user = await getUserByUid(post.userId);

    if (!album || !user) {
      console.warn(`Post ${post.id}: album ou user introuvable`);
      return null;
    }

    return {
      ...post,
      album,
      user,
    } as PostWithDetails;
  } catch (error) {
    console.error('Erreur lors de la récupération du post:', error);
    return null;
  }
}

/**
 * Subscribe aux nouveaux posts du feed (real-time)
 * Limité aux X derniers posts pour éviter trop de données
 */
export function subscribeToFeedPosts(
  userId: string,
  onUpdate: (posts: PostWithDetails[]) => void,
  onError?: (error: Error) => void,
  limitCount: number = 20
): Unsubscribe {
  // Pour simplifier, on écoute juste les derniers posts
  // Une vraie implémentation pourrait écouter seulement les personnes suivies
  const postsRef = collection(db, POSTS_COLLECTION);
  const q = query(
    postsRef,
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    async (querySnapshot) => {
      try {
        const posts: Post[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];

        // Récupérer les détails
        const postsWithDetails = await Promise.all(
          posts.map(async (post) => {
            const album = await getAlbumById(post.albumId);
            const user = await getUserByUid(post.userId);

            if (!album || !user) return null;

            return {
              ...post,
              album,
              user,
            } as PostWithDetails;
          })
        );

        const filtered = postsWithDetails.filter(
          (post): post is PostWithDetails => post !== null
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
