import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CreateReleaseData, Release } from '@/types/release';
import { releaseCache } from './cache';

const RELEASES_COLLECTION = 'releases';

/**
 * Crée un vinyle dans Firestore et le retourne
 * @param createReleaseData - Données du vinyle
 * @returns Le vinyle avec son ID Firestore
 */
export async function createRelease(createReleaseData: CreateReleaseData): Promise<Release> {
  try {
    // Le vinyle n'existe pas, le créer
    const newReleaseRef = doc(collection(db, RELEASES_COLLECTION));

    const releaseData = {
      ...createReleaseData,
      createdAt: serverTimestamp(),
    };

    await setDoc(newReleaseRef, releaseData);

    // Retourner le vinyle créé avec son ID
    return {
      id: newReleaseRef.id,
      ...releaseData,
      createdAt: releaseData.createdAt, // serverTimestamp() sera résolu par Firestore
    } as Release;

  } catch (error) {
    console.error('Erreur lors de la récupération/création du vinyle:', error);
    throw new Error('Impossible de récupérer ou créer le vinyle');
  }
}

/**
 * Récupère un vinyle par son ID Firestore
 * Utilise un cache pour éviter les requêtes répétées
 * @param releaseId - ID Firestore du vinyle
 * @returns Le vinyle ou null s'il n'existe pas
 */
export async function getReleaseById(releaseId: string): Promise<Release | null> {
  try {
    // Vérifier le cache d'abord
    const cached = releaseCache.get(releaseId);
    if (cached) {
      return cached;
    }

    const releaseRef = doc(db, RELEASES_COLLECTION, releaseId);
    const releaseDoc = await getDoc(releaseRef);

    if (!releaseDoc.exists()) {
      return null;
    }

    const release = {
      id: releaseDoc.id,
      ...releaseDoc.data(),
    } as Release;

    // Mettre en cache
    releaseCache.set(releaseId, release);

    return release;
  } catch (error) {
    console.error('Erreur lors de la récupération du vinyle:', error);
    throw new Error('Impossible de récupérer le vinyle');
  }
}

/**
 * Recherche d'éditions dans Firestore par album
 * Note: Firestore ne supporte pas les recherches textuelles avancées.
 * Cette fonction récupère toutes les releases et filtre côté client.
 * Pour une vraie app en production, il faudrait utiliser Algolia ou Elasticsearch.
 * @param searchQuery - Texte de recherche
 * @param maxResults - Nombre maximum de résultats (par défaut 50)
 * @returns Tableau de résultats de recherche
 */
export async function searchReleases(albumId: string | undefined, searchQuery: string, maxResults: number = 50): Promise<Release[]> {
  try {
    const normalizedQuery = searchQuery.toLowerCase().trim();

    // Récupérer toutes les éditions (ou un grand nombre)
    // Note: Pour une vraie production, il faudrait paginer ou utiliser un service de recherche
    const releasesRef = collection(db, RELEASES_COLLECTION);
    const q = query(
      releasesRef,
      orderBy('createdAt', 'desc'),
      limit(1000) // Limite pour ne pas charger toute la base
    );

    const querySnapshot = await getDocs(q);
    const allReleases: Release[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Release[];

    console.log('---------')
    console.log(allReleases)
    console.log(albumId)
    // Filtrer côté client par titre ou artiste
    const filteredReleases = allReleases.filter((release) => {
      const albumMatch = albumId === undefined || release.albumId === albumId
      const titleMatch = release.title.toLowerCase().includes(normalizedQuery);
      return albumMatch && titleMatch;
    });

    // Limiter le nombre de résultat
    const results: Release[] = filteredReleases.slice(0, maxResults);

    console.log(`[Search] Trouvé ${results.length} releases pour "${searchQuery}"`);

    return results;
  } catch (error) {
    console.error('Erreur lors de la recherche d\'éditions:', error);
    throw new Error('Impossible de rechercher des éditions');
  }
}


/**
 * Valide les champs textes du formulaire de création/édition de vinyles
 * @param fieldValue - Valeur du champ à valider
 * @returns true si valide, false sinon
 */
export function validateReleaseTextField(fieldValue: string): boolean {
  return fieldValue.length <= 100;
}
