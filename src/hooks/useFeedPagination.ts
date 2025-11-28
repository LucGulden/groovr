import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getFeedPosts } from '@/lib/posts';
import type { PostWithDetails } from '@/types/post';

const INITIAL_LOAD_COUNT = 15;
const LOAD_MORE_COUNT = 10;

export interface UseFeedPaginationReturn {
  posts: PostWithDetails[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  refreshing: boolean;
  newPostsAvailable: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  handleDeletePost: (postId: string) => void;
}

/**
 * Hook personnalisé pour gérer la pagination du feed avec infinite scroll
 * - Chargement initial : 15 posts
 * - Load more : 10 posts à la fois
 * - Curseur Firestore (lastVisible document)
 * - Écoute en temps réel des nouveaux posts
 */
export function useFeedPagination(userId: string): UseFeedPaginationReturn {
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newPostsAvailable, setNewPostsAvailable] = useState(0);

  /**
   * Charge les premiers posts du feed (15 posts)
   */
  const fetchInitialPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const initialPosts = await getFeedPosts(userId, INITIAL_LOAD_COUNT);
      setPosts(initialPosts);
      setHasMore(initialPosts.length === INITIAL_LOAD_COUNT);
    } catch (err) {
      console.error('Erreur lors du chargement du feed:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Charge 10 posts supplémentaires
   */
  const loadMorePosts = async () => {
    if (loadingMore || !hasMore || posts.length === 0) return;

    setLoadingMore(true);

    try {
      const lastPost = posts[posts.length - 1];
      const morePosts = await getFeedPosts(userId, LOAD_MORE_COUNT, lastPost);

      if (morePosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prev) => [...prev, ...morePosts]);
        setHasMore(morePosts.length === LOAD_MORE_COUNT);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de plus de posts:', err);
      setError(err as Error);
    } finally {
      setLoadingMore(false);
    }
  };

  /**
   * Rafraîchit le feed (pull-to-refresh)
   */
  const refreshFeed = async () => {
    setRefreshing(true);
    setError(null);
    setNewPostsAvailable(0);

    try {
      const initialPosts = await getFeedPosts(userId, INITIAL_LOAD_COUNT);
      setPosts(initialPosts);
      setHasMore(initialPosts.length === INITIAL_LOAD_COUNT);
    } catch (err) {
      console.error('Erreur lors du rafraîchissement du feed:', err);
      setError(err as Error);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Supprime un post de la liste locale
   */
  const handleDeletePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  // Chargement initial
  useEffect(() => {
    fetchInitialPosts();
  }, [fetchInitialPosts]);

  // Écoute en temps réel des nouveaux posts
  useEffect(() => {
    if (posts.length === 0) return;

    const newestPostTime = posts[0].createdAt;
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      where('createdAt', '>', newestPostTime),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newPostsCount = snapshot.docs.length;
        if (newPostsCount > 0) {
          setNewPostsAvailable(newPostsCount);
        }
      },
      (err) => {
        console.error('Erreur lors de l\'écoute des nouveaux posts:', err);
      }
    );

    return () => unsubscribe();
  }, [posts]);

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    refreshing,
    newPostsAvailable,
    loadMore: loadMorePosts,
    refresh: refreshFeed,
    handleDeletePost,
  };
}
