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
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { getAlbumById } from './albums';
import { createPost } from './posts';
import type {
  UserAlbum,
  UserAlbumWithDetails,
  CollectionType,
  CreateUserAlbumData,
} from '@/types/collection';

const USER_ALBUMS_COLLECTION = 'user_albums';

/**
 * Ajoute un album à la collection d'un utilisateur
 */
export async function addToCollection(
  userId: string,
  albumId: string,
  notes?: string
): Promise<UserAlbum> {
  try {
    // Vérifier si déjà dans la collection
    const existing = await getUserAlbumByAlbumId(userId, albumId, 'collection');
    if (existing) {
      console.log(`Album déjà dans la collection`);
      return existing;
    }

    // Créer le document
    const newDocRef = doc(collection(db, USER_ALBUMS_COLLECTION));
    const userAlbumData = {
      userId,
      albumId,
      type: 'collection' as CollectionType,
      notes: notes || null,
      addedAt: serverTimestamp(),
    };

    await setDoc(newDocRef, userAlbumData);

    // Créer automatiquement un post pour partager l'ajout
    try {
      await createPost(userId, 'collection_add', albumId);
    } catch (postError) {
      console.error('Erreur lors de la création du post:', postError);
      // Ne pas faire échouer l'ajout si la création du post échoue
    }

    return {
      id: newDocRef.id,
      ...userAlbumData,
      addedAt: userAlbumData.addedAt as any,
    } as UserAlbum;
  } catch (error) {
    console.error('Erreur lors de l\'ajout à la collection:', error);
    throw new Error('Impossible d\'ajouter l\'album à la collection');
  }
}

/**
 * Ajoute un album à la wishlist d'un utilisateur
 */
export async function addToWishlist(
  userId: string,
  albumId: string,
  notes?: string
): Promise<UserAlbum> {
  try {
    // Vérifier si déjà dans la wishlist
    const existing = await getUserAlbumByAlbumId(userId, albumId, 'wishlist');
    if (existing) {
      console.log(`Album déjà dans la wishlist`);
      return existing;
    }

    const newDocRef = doc(collection(db, USER_ALBUMS_COLLECTION));
    const userAlbumData = {
      userId,
      albumId,
      type: 'wishlist' as CollectionType,
      notes: notes || null,
      addedAt: serverTimestamp(),
    };

    await setDoc(newDocRef, userAlbumData);

    // Créer automatiquement un post pour partager l'ajout
    try {
      await createPost(userId, 'wishlist_add', albumId);
    } catch (postError) {
      console.error('Erreur lors de la création du post:', postError);
      // Ne pas faire échouer l'ajout si la création du post échoue
    }

    return {
      id: newDocRef.id,
      ...userAlbumData,
      addedAt: userAlbumData.addedAt as any,
    } as UserAlbum;
  } catch (error) {
    console.error('Erreur lors de l\'ajout à la wishlist:', error);
    throw new Error('Impossible d\'ajouter l\'album à la wishlist');
  }
}

/**
 * Supprime un album de la collection
 */
export async function removeFromCollection(
  userId: string,
  albumId: string
): Promise<void> {
  try {
    const userAlbum = await getUserAlbumByAlbumId(userId, albumId, 'collection');
    if (!userAlbum) {
      console.log(`Album non trouvé dans la collection`);
      return;
    }

    const docRef = doc(db, USER_ALBUMS_COLLECTION, userAlbum.id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erreur lors de la suppression de la collection:', error);
    throw new Error('Impossible de supprimer l\'album de la collection');
  }
}

/**
 * Supprime un album de la wishlist
 */
export async function removeFromWishlist(
  userId: string,
  albumId: string
): Promise<void> {
  try {
    const userAlbum = await getUserAlbumByAlbumId(userId, albumId, 'wishlist');
    if (!userAlbum) {
      console.log(`Album non trouvé dans la wishlist`);
      return;
    }

    const docRef = doc(db, USER_ALBUMS_COLLECTION, userAlbum.id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erreur lors de la suppression de la wishlist:', error);
    throw new Error('Impossible de supprimer l\'album de la wishlist');
  }
}

/**
 * Déplace un album de la wishlist vers la collection
 */
export async function moveToCollection(
  userId: string,
  albumId: string
): Promise<void> {
  try {
    const wishlistItem = await getUserAlbumByAlbumId(userId, albumId, 'wishlist');
    if (!wishlistItem) {
      throw new Error('Album non trouvé dans la wishlist');
    }

    // Supprimer de la wishlist
    await removeFromWishlist(userId, albumId);

    // Ajouter à la collection
    await addToCollection(userId, albumId, wishlistItem.notes);
  } catch (error) {
    console.error('Erreur lors du déplacement vers la collection:', error);
    throw new Error('Impossible de déplacer l\'album vers la collection');
  }
}

/**
 * Récupère la collection d'un utilisateur avec les détails des albums
 */
export async function getUserCollection(
  userId: string
): Promise<UserAlbumWithDetails[]> {
  try {
    const userAlbumsRef = collection(db, USER_ALBUMS_COLLECTION);
    const q = query(
      userAlbumsRef,
      where('userId', '==', userId),
      where('type', '==', 'collection'),
      orderBy('addedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const userAlbums: UserAlbum[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserAlbum[];

    // Récupérer les détails de chaque album
    const albumsWithDetails = await Promise.all(
      userAlbums.map(async (userAlbum) => {
        const album = await getAlbumById(userAlbum.albumId);
        if (!album) {
          console.warn(`Album ${userAlbum.albumId} non trouvé`);
          return null;
        }
        return {
          ...userAlbum,
          album,
        } as UserAlbumWithDetails;
      })
    );

    return albumsWithDetails.filter((item): item is UserAlbumWithDetails => item !== null);
  } catch (error) {
    console.error('Erreur lors de la récupération de la collection:', error);
    throw new Error('Impossible de récupérer la collection');
  }
}

/**
 * Récupère la wishlist d'un utilisateur avec les détails des albums
 */
export async function getUserWishlist(
  userId: string
): Promise<UserAlbumWithDetails[]> {
  try {
    const userAlbumsRef = collection(db, USER_ALBUMS_COLLECTION);
    const q = query(
      userAlbumsRef,
      where('userId', '==', userId),
      where('type', '==', 'wishlist'),
      orderBy('addedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const userAlbums: UserAlbum[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserAlbum[];

    // Récupérer les détails de chaque album
    const albumsWithDetails = await Promise.all(
      userAlbums.map(async (userAlbum) => {
        const album = await getAlbumById(userAlbum.albumId);
        if (!album) {
          console.warn(`Album ${userAlbum.albumId} non trouvé`);
          return null;
        }
        return {
          ...userAlbum,
          album,
        } as UserAlbumWithDetails;
      })
    );

    return albumsWithDetails.filter((item): item is UserAlbumWithDetails => item !== null);
  } catch (error) {
    console.error('Erreur lors de la récupération de la wishlist:', error);
    throw new Error('Impossible de récupérer la wishlist');
  }
}

/**
 * Vérifie si un album est dans la collection d'un utilisateur
 */
export async function isInCollection(
  userId: string,
  albumId: string
): Promise<boolean> {
  try {
    const userAlbum = await getUserAlbumByAlbumId(userId, albumId, 'collection');
    return userAlbum !== null;
  } catch (error) {
    console.error('Erreur lors de la vérification de la collection:', error);
    return false;
  }
}

/**
 * Vérifie si un album est dans la wishlist d'un utilisateur
 */
export async function isInWishlist(
  userId: string,
  albumId: string
): Promise<boolean> {
  try {
    const userAlbum = await getUserAlbumByAlbumId(userId, albumId, 'wishlist');
    return userAlbum !== null;
  } catch (error) {
    console.error('Erreur lors de la vérification de la wishlist:', error);
    return false;
  }
}

/**
 * Subscribe aux changements de la collection (real-time)
 */
export function subscribeToUserCollection(
  userId: string,
  onUpdate: (albums: UserAlbumWithDetails[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const userAlbumsRef = collection(db, USER_ALBUMS_COLLECTION);
  const q = query(
    userAlbumsRef,
    where('userId', '==', userId),
    where('type', '==', 'collection'),
    orderBy('addedAt', 'desc')
  );

  return onSnapshot(
    q,
    async (querySnapshot) => {
      try {
        const userAlbums: UserAlbum[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserAlbum[];

        const albumsWithDetails = await Promise.all(
          userAlbums.map(async (userAlbum) => {
            const album = await getAlbumById(userAlbum.albumId);
            if (!album) return null;
            return { ...userAlbum, album } as UserAlbumWithDetails;
          })
        );

        const filtered = albumsWithDetails.filter(
          (item): item is UserAlbumWithDetails => item !== null
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

/**
 * Subscribe aux changements de la wishlist (real-time)
 */
export function subscribeToUserWishlist(
  userId: string,
  onUpdate: (albums: UserAlbumWithDetails[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const userAlbumsRef = collection(db, USER_ALBUMS_COLLECTION);
  const q = query(
    userAlbumsRef,
    where('userId', '==', userId),
    where('type', '==', 'wishlist'),
    orderBy('addedAt', 'desc')
  );

  return onSnapshot(
    q,
    async (querySnapshot) => {
      try {
        const userAlbums: UserAlbum[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserAlbum[];

        const albumsWithDetails = await Promise.all(
          userAlbums.map(async (userAlbum) => {
            const album = await getAlbumById(userAlbum.albumId);
            if (!album) return null;
            return { ...userAlbum, album } as UserAlbumWithDetails;
          })
        );

        const filtered = albumsWithDetails.filter(
          (item): item is UserAlbumWithDetails => item !== null
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

/**
 * Helper: Récupère un UserAlbum par albumId et type
 */
async function getUserAlbumByAlbumId(
  userId: string,
  albumId: string,
  type: CollectionType
): Promise<UserAlbum | null> {
  try {
    const userAlbumsRef = collection(db, USER_ALBUMS_COLLECTION);
    const q = query(
      userAlbumsRef,
      where('userId', '==', userId),
      where('albumId', '==', albumId),
      where('type', '==', type)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as UserAlbum;
  } catch (error) {
    console.error('Erreur lors de la récupération du UserAlbum:', error);
    return null;
  }
}
