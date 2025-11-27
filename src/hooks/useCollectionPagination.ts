import { useState, useEffect, useCallback } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { getUserAlbumsPaginated, countUserAlbums } from '@/lib/user-albums';
import type { UserAlbumWithDetails, CollectionType } from '@/types/collection';

const INITIAL_LOAD_COUNT = 20;
const LOAD_MORE_COUNT = 15;

export interface UseCollectionPaginationProps {
  userId: string;
  type: CollectionType;
  initialLimit?: number;
  loadMoreLimit?: number;
}

export interface UseCollectionPaginationReturn {
  albums: UserAlbumWithDetails[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  total: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  removeAlbumFromList: (albumId: string) => void;
}

/**
 * Hook personnalisé pour gérer la pagination des collections/wishlists
 * - Chargement initial : 20 albums
 * - Load more : 15 albums à la fois
 * - Curseur Firestore (lastVisible document)
 */
export function useCollectionPagination({
  userId,
  type,
  initialLimit = INITIAL_LOAD_COUNT,
  loadMoreLimit = LOAD_MORE_COUNT,
}: UseCollectionPaginationProps): UseCollectionPaginationReturn {
  const [albums, setAlbums] = useState<UserAlbumWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  /**
   * Charge le nombre total d'albums
   */
  const fetchTotal = useCallback(async () => {
    try {
      const count = await countUserAlbums(userId, type);
      setTotal(count);
    } catch (err) {
      console.error('Erreur lors du comptage:', err);
    }
  }, [userId, type]);

  /**
   * Charge les premiers albums (20 albums)
   */
  const fetchInitialAlbums = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { albums: initialAlbums, lastDoc: newLastDoc } = await getUserAlbumsPaginated(
        userId,
        type,
        initialLimit
      );

      setAlbums(initialAlbums);
      setLastDoc(newLastDoc);
      setHasMore(initialAlbums.length === initialLimit);

      // Charger le total en parallèle
      await fetchTotal();
    } catch (err) {
      console.error('Erreur lors du chargement initial:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId, type, initialLimit, fetchTotal]);

  /**
   * Charge 15 albums supplémentaires
   */
  const loadMoreAlbums = async () => {
    if (loadingMore || !hasMore || !lastDoc) return;

    setLoadingMore(true);

    try {
      const { albums: moreAlbums, lastDoc: newLastDoc } = await getUserAlbumsPaginated(
        userId,
        type,
        loadMoreLimit,
        lastDoc
      );

      if (moreAlbums.length === 0) {
        setHasMore(false);
      } else {
        setAlbums((prev) => [...prev, ...moreAlbums]);
        setLastDoc(newLastDoc);
        setHasMore(moreAlbums.length === loadMoreLimit);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de plus d\'albums:', err);
      setError(err as Error);
    } finally {
      setLoadingMore(false);
    }
  };

  /**
   * Rafraîchit la liste complète
   */
  const refreshAlbums = async () => {
    setLoading(true);
    setError(null);

    try {
      const { albums: initialAlbums, lastDoc: newLastDoc } = await getUserAlbumsPaginated(
        userId,
        type,
        initialLimit
      );

      setAlbums(initialAlbums);
      setLastDoc(newLastDoc);
      setHasMore(initialAlbums.length === initialLimit);

      // Rafraîchir le total
      await fetchTotal();
    } catch (err) {
      console.error('Erreur lors du rafraîchissement:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Supprime un album de la liste locale (après suppression Firestore)
   */
  const removeAlbumFromList = useCallback((albumId: string) => {
    setAlbums((prev) => prev.filter((album) => album.albumId !== albumId));
    setTotal((prev) => Math.max(0, prev - 1));
  }, []);

  // Chargement initial
  useEffect(() => {
    fetchInitialAlbums();
  }, [fetchInitialAlbums]);

  return {
    albums,
    loading,
    loadingMore,
    hasMore,
    error,
    total,
    loadMore: loadMoreAlbums,
    refresh: refreshAlbums,
    removeAlbumFromList,
  };
}
