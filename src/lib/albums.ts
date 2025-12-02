import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { albumCache } from './cache';
import type { Album } from '@/types/album';

const ALBUMS_COLLECTION = 'albums';

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
 * Recherche d'albums dans Firestore par titre ou artiste
 * Note: Firestore ne supporte pas les recherches textuelles avancées.
 * Cette fonction récupère tous les albums et filtre côté client.
 * Pour une vraie app en production, il faudrait utiliser Algolia ou Elasticsearch.
 * @param searchQuery - Texte de recherche
 * @param maxResults - Nombre maximum de résultats (par défaut 50)
 * @returns Tableau de résultats de recherche
 */
export async function searchAlbums(searchQuery: string, maxResults: number = 50): Promise<Album[]> {
  try {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return [];
    }

    const normalizedQuery = searchQuery.toLowerCase().trim();

    // Récupérer tous les albums (ou un grand nombre)
    // Note: Pour une vraie production, il faudrait paginer ou utiliser un service de recherche
    const albumsRef = collection(db, ALBUMS_COLLECTION);
    const q = query(
      albumsRef,
      orderBy('createdAt', 'desc'),
      limit(1000) // Limite pour ne pas charger toute la base
    );

    const querySnapshot = await getDocs(q);
    const allAlbums: Album[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Album[];

    // Filtrer côté client par titre ou artiste
    const filteredAlbums = allAlbums.filter((album) => {
      const titleMatch = album.title.toLowerCase().includes(normalizedQuery);
      const artistMatch = album.artist.toLowerCase().includes(normalizedQuery);
      return titleMatch || artistMatch;
    });

    const results: Album[] = filteredAlbums.slice(0, maxResults);

    console.log(`[Search] Trouvé ${results.length} albums pour "${searchQuery}"`);

    return results;
  } catch (error) {
    console.error('Erreur lors de la recherche d\'albums:', error);
    throw new Error('Impossible de rechercher des albums');
  }
}
