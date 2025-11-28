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
  collectionGroup,
} from 'firebase/firestore';
import { db } from './firebase';
import { getAlbumById } from './albums';
import { getUserByUid } from './user';
import { getFollowers } from './follows';
import type { Post, PostWithDetails, PostType } from '@/types/post';

const POSTS_COLLECTION = 'posts';

/**
 * Crée un post automatiquement et fait le fan-out vers les feeds des followers
 * Architecture: 1 post principal + N pointeurs légers dans les feeds individuels
 */
export async function createPost(
  userId: string,
  type: PostType,
  albumId: string
): Promise<Post> {
  try {
    // ÉTAPE 1: Créer le post principal (source of truth)
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

    // ÉTAPE 2: Fan-out - Ajouter des pointeurs dans les feeds des followers
    try {
      const followers = await getFollowers(userId);

      // Limite de sécurité pour éviter les timeouts (max 5000 followers)
      const fanoutLimit = Math.min(followers.length, 5000);

      if (followers.length > 0) {
        // Créer les pointeurs légers dans chaque feed
        const feedPromises = followers.slice(0, fanoutLimit).map(async (follower) => {
          const feedPostRef = doc(db, `user_feeds/${follower.uid}/posts`, newPostRef.id);
          return setDoc(feedPostRef, {
            postId: newPostRef.id,
            createdAt: serverTimestamp(),
            userId: userId, // Pour faciliter le nettoyage lors d'unfollow
          });
        });

        await Promise.all(feedPromises);

        console.log(`[Fan-out] Post distribué à ${fanoutLimit} followers`);
        if (followers.length > fanoutLimit) {
          console.warn(`[Fan-out] Limité à ${fanoutLimit}/${followers.length} followers`);
        }
      }

      // ÉTAPE 3: Ajouter aussi dans son propre feed
      const ownFeedRef = doc(db, `user_feeds/${userId}/posts`, newPostRef.id);
      await setDoc(ownFeedRef, {
        postId: newPostRef.id,
        createdAt: serverTimestamp(),
        userId: userId,
      });

      // ÉTAPE 4: Ajouter aussi dans le feed du profil
      const profileFeedRef = doc(db, `profile_feeds/${userId}/posts`, newPostRef.id);
      await setDoc(profileFeedRef, {
        postId: newPostRef.id,
        createdAt: serverTimestamp(),
        userId: userId,
      });

    } catch (fanoutError) {
      console.error('[Fan-out] Erreur lors du fan-out (post créé mais pas distribué):', fanoutError);
      // Le post est créé, mais pas distribué - on peut continuer
    }

    return {
      id: newPostRef.id,
      ...postData,
      createdAt: postData.createdAt,
    } as Post;
  } catch (error) {
    console.error('Erreur lors de la création du post:', error);
    throw new Error('Impossible de créer le post');
  }
}

/**
 * Récupère les posts du feed pour un utilisateur
 * Architecture fan-out: Lit directement depuis user_feeds/{userId}/posts
 * Ultra-rapide: 1 seule requête peu importe le nombre d'utilisateurs suivis!
 */
export async function getFeedPosts(
  userId: string,
  profileFeed: boolean,
  limitCount: number = 20,
  lastPost?: Post
): Promise<PostWithDetails[]> {
  try {
    const path = profileFeed ? `profile_feeds/${userId}/posts` : `user_feeds/${userId}/posts`;
    // ÉTAPE 1: Lire les pointeurs depuis le feed personnel de l'utilisateur
    const userFeedRef = collection(db, path);

    let q = query(
      userFeedRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    // Pagination: démarrer après le dernier post
    if (lastPost) {
      q = query(
        userFeedRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastPost.createdAt),
        limit(limitCount)
      );
    }

    const feedSnapshot = await getDocs(q);

    console.log(`[Feed] Chargé ${feedSnapshot.size} pointeurs depuis ${path}`);

    if (feedSnapshot.empty) {
      return [];
    }

    // ÉTAPE 2: "Hydrater" les pointeurs avec les vraies données des posts
    const postsWithDetails = await Promise.all(
      feedSnapshot.docs.map(async (feedDoc) => {
        const feedData = feedDoc.data();
        const postId = feedData.postId;

        // Récupérer le post principal (avec cache !)
        const postRef = doc(db, POSTS_COLLECTION, postId);
        const postDoc = await getDoc(postRef);

        if (!postDoc.exists()) {
          console.warn(`[Feed] Post ${postId} introuvable (pointeur orphelin)`);
          return null;
        }

        const post = {
          id: postDoc.id,
          ...postDoc.data(),
        } as Post;

        // Récupérer les détails de l'album et de l'utilisateur (avec cache !)
        const album = await getAlbumById(post.albumId);
        const user = await getUserByUid(post.userId);

        if (!album || !user) {
          console.warn(`[Feed] Post ${post.id}: album ou user introuvable`);
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
 * Supprime un post et tous les likes/commentaires/pointeurs de feed associés (cascade)
 * Architecture fan-out: doit aussi supprimer tous les pointeurs dans les feeds
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
    console.log(`[Post Delete] Supprimé ${likesSnapshot.size} likes`);

    // 2. Supprimer tous les commentaires associés au post
    const commentsRef = collection(db, 'comments');
    const commentsQuery = query(commentsRef, where('postId', '==', postId));
    const commentsSnapshot = await getDocs(commentsQuery);

    const commentsDeletions = commentsSnapshot.docs.map((doc) =>
      deleteDoc(doc.ref)
    );
    await Promise.all(commentsDeletions);
    console.log(`[Post Delete] Supprimé ${commentsSnapshot.size} commentaires`);

    // 3. Supprimer tous les pointeurs dans les feeds (utilise collectionGroup)
    // IMPORTANT: Nécessite un index composite sur collectionGroup 'posts'
    try {
      const feedPostsQuery = query(
        collectionGroup(db, 'posts'),
        where('postId', '==', postId)
      );

      const feedPostsSnapshot = await getDocs(feedPostsQuery);

      if (feedPostsSnapshot.size > 0) {
        const feedDeletions = feedPostsSnapshot.docs.map((doc) =>
          deleteDoc(doc.ref)
        );
        await Promise.all(feedDeletions);

        console.log(`[Post Delete] Supprimé ${feedPostsSnapshot.size} pointeurs dans les feeds`);
      }
    } catch (feedError) {
      console.error('[Post Delete] Erreur lors de la suppression des pointeurs (continuons):', feedError);
      // On continue même si la suppression des pointeurs échoue
    }

    // 4. Supprimer le post principal lui-même
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await deleteDoc(postRef);

    console.log(`[Post Delete] Post ${postId} supprimé avec succès (cascade complète)`);
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
