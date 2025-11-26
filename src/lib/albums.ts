import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { albumCache } from './cache';
import type { Album, SpotifyAlbumData } from '@/types/album';

const ALBUMS_COLLECTION = 'albums';

/**
 * Récupère ou crée un album dans Firestore
 * Si l'album existe déjà (par spotifyId), le retourne
 * Sinon, le crée et retourne le nouvel album
 * @param spotifyData - Données de l'album depuis Spotify
 * @returns L'album avec son ID Firestore
 */
export async function getOrCreateAlbum(spotifyData: SpotifyAlbumData): Promise<Album> {
  try {
    // Vérifier si l'album existe déjà par spotifyId
    const albumsRef = collection(db, ALBUMS_COLLECTION);
    const q = query(albumsRef, where('spotifyId', '==', spotifyData.spotifyId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // L'album existe déjà, le retourner
      const existingAlbum = querySnapshot.docs[0];
      console.log(`📦 [CACHE HIT] "${spotifyData.title}" - Déjà dans Firestore (ID: ${existingAlbum.id})`);
      return {
        id: existingAlbum.id,
        ...existingAlbum.data(),
      } as Album;
    }

    // L'album n'existe pas, le créer
    const newAlbumRef = doc(collection(db, ALBUMS_COLLECTION));
    console.log(`✨ [CACHE MISS] "${spotifyData.title}" - Création dans Firestore (ID: ${newAlbumRef.id})`);

    const albumData = {
      spotifyId: spotifyData.spotifyId,
      title: spotifyData.title,
      artist: spotifyData.artist,
      year: spotifyData.year,
      coverUrl: spotifyData.coverUrl,
      spotifyUrl: spotifyData.spotifyUrl || null,
      createdAt: serverTimestamp(),
    };

    await setDoc(newAlbumRef, albumData);

    // Retourner l'album créé avec son ID
    return {
      id: newAlbumRef.id,
      ...albumData,
      createdAt: albumData.createdAt as any, // serverTimestamp() sera résolu par Firestore
    } as Album;
  } catch (error) {
    console.error('Erreur lors de la récupération/création de l\'album:', error);
    throw new Error('Impossible de récupérer ou créer l\'album');
  }
}

/**
 * Récupère un album par son ID Firestore
 * Utilise un cache pour éviter les requêtes répétées
 * @param albumId - ID Firestore de l'album
 * @returns L'album ou null s'il n'existe pas
 */
export async function getAlbumById(albumId: string): Promise<Album | null> {
  try {
    // Vérifier le cache d'abord
    const cached = albumCache.get(albumId);
    if (cached) {
      return cached;
    }

    const albumRef = doc(db, ALBUMS_COLLECTION, albumId);
    const albumDoc = await getDoc(albumRef);

    if (!albumDoc.exists()) {
      return null;
    }

    const album = {
      id: albumDoc.id,
      ...albumDoc.data(),
    } as Album;

    // Mettre en cache
    albumCache.set(albumId, album);

    return album;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'album:', error);
    throw new Error('Impossible de récupérer l\'album');
  }
}

/**
 * Récupère un album par son ID Spotify
 * @param spotifyId - ID Spotify de l'album
 * @returns L'album ou null s'il n'existe pas
 */
export async function getAlbumBySpotifyId(spotifyId: string): Promise<Album | null> {
  try {
    const albumsRef = collection(db, ALBUMS_COLLECTION);
    const q = query(albumsRef, where('spotifyId', '==', spotifyId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const albumDoc = querySnapshot.docs[0];
    return {
      id: albumDoc.id,
      ...albumDoc.data(),
    } as Album;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'album par Spotify ID:', error);
    throw new Error('Impossible de récupérer l\'album');
  }
}

/**
 * Récupère plusieurs albums par leurs IDs Firestore
 * @param albumIds - Tableau d'IDs Firestore
 * @returns Tableau d'albums
 */
export async function getAlbumsByIds(albumIds: string[]): Promise<Album[]> {
  try {
    const albums: Album[] = [];

    // Firestore limite les queries "in" à 10 éléments max
    // On fait des batches de 10
    for (let i = 0; i < albumIds.length; i += 10) {
      const batch = albumIds.slice(i, i + 10);
      const promises = batch.map((id) => getAlbumById(id));
      const results = await Promise.all(promises);
      albums.push(...results.filter((album): album is Album => album !== null));
    }

    return albums;
  } catch (error) {
    console.error('Erreur lors de la récupération des albums:', error);
    throw new Error('Impossible de récupérer les albums');
  }
}
