'use client';

import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import { getFeedPosts } from '@/lib/posts';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PostWithDetails } from '@/types/post';

interface FeedProps {
  userId: string;
}

export default function Feed({ userId }: FeedProps) {
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newPostsAvailable, setNewPostsAvailable] = useState(0);

  // Pull-to-refresh state
  const [pullStartY, setPullStartY] = useState(0);
  const [pullCurrentY, setPullCurrentY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  // Charger les posts initiaux
  useEffect(() => {
    loadInitialPosts();
  }, [userId]);

  // Écouter les nouveaux posts en temps réel
  useEffect(() => {
    if (posts.length === 0) return;

    // Récupérer le timestamp du post le plus récent
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
      (error) => {
        console.error('Erreur lors de l\'écoute des nouveaux posts:', error);
      }
    );

    return () => unsubscribe();
  }, [posts]);

  const loadInitialPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const initialPosts = await getFeedPosts(userId, 20);
      setPosts(initialPosts);
      setHasMore(initialPosts.length === 20);
    } catch (err) {
      console.error('Erreur lors du chargement du feed:', err);
      setError('Impossible de charger le feed');
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore || posts.length === 0) return;

    setLoadingMore(true);

    try {
      const lastPost = posts[posts.length - 1];
      const morePosts = await getFeedPosts(userId, 20, lastPost);

      if (morePosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prev) => [...prev, ...morePosts]);
        setHasMore(morePosts.length === 20);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de plus de posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Refresh feed (pull-to-refresh)
  const refreshFeed = async () => {
    setRefreshing(true);
    setError(null);
    setNewPostsAvailable(0); // Reset notification

    try {
      const initialPosts = await getFeedPosts(userId, 20);
      setPosts(initialPosts);
      setHasMore(initialPosts.length === 20);
    } catch (err) {
      console.error('Erreur lors du rafraîchissement du feed:', err);
      setError('Impossible de rafraîchir le feed');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle touch events for pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || window.scrollY > 0) {
      setIsPulling(false);
      return;
    }

    const currentY = e.touches[0].clientY;
    const pullDistance = currentY - pullStartY;

    if (pullDistance > 0 && pullDistance < 150) {
      setPullCurrentY(pullDistance);
    }
  };

  const handleTouchEnd = () => {
    if (isPulling && pullCurrentY > 80) {
      refreshFeed();
    }

    setIsPulling(false);
    setPullStartY(0);
    setPullCurrentY(0);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--background-lighter)] bg-[var(--background-light)] p-6 animate-pulse"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-[var(--background-lighter)]" />
              <div className="flex-1">
                <div className="h-4 bg-[var(--background-lighter)] rounded w-32 mb-2" />
                <div className="h-3 bg-[var(--background-lighter)] rounded w-64" />
              </div>
            </div>
            <div className="w-full max-w-md mx-auto h-80 bg-[var(--background-lighter)] rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto mb-4 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-red-500 font-semibold mb-4">{error}</p>
        <button
          onClick={loadInitialPosts}
          className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--background-lighter)] bg-[var(--background-light)] p-12 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-20 w-20 mx-auto mb-6 text-[var(--foreground-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 className="text-2xl font-bold text-[var(--foreground)] mb-3">
          Votre feed est vide
        </h3>
        <p className="text-[var(--foreground-muted)] mb-6 max-w-md mx-auto">
          Suivez des utilisateurs pour voir leur activité ! Découvrez de nouveaux
          collectionneurs et explorez leurs vinyles.
        </p>
        <a
          href="/users"
          className="inline-block px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors font-semibold"
        >
          Découvrir des utilisateurs
        </a>
      </div>
    );
  }

  return (
    <div
      className="space-y-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* New posts notification */}
      {newPostsAvailable > 0 && !refreshing && (
        <button
          onClick={refreshFeed}
          className="sticky top-20 z-10 mx-auto flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-[var(--primary-hover)] hover:scale-105"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {newPostsAvailable} {newPostsAvailable === 1 ? 'nouveau post' : 'nouveaux posts'}
        </button>
      )}

      {/* Pull-to-refresh indicator */}
      {(isPulling || refreshing) && (
        <div
          className="flex justify-center py-4 transition-all"
          style={{
            transform: `translateY(${isPulling ? pullCurrentY / 2 : 0}px)`,
            opacity: isPulling ? Math.min(pullCurrentY / 80, 1) : 1,
          }}
        >
          <div
            className={`h-8 w-8 rounded-full border-4 border-[var(--primary)] border-t-transparent ${
              refreshing ? 'animate-spin' : ''
            }`}
          />
        </div>
      )}

      {/* Posts List */}
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={userId}
          onDelete={() => {
            // Retirer le post de la liste
            setPosts((prev) => prev.filter((p) => p.id !== post.id));
          }}
        />
      ))}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-6">
          <button
            onClick={loadMorePosts}
            disabled={loadingMore}
            className="px-8 py-3 bg-[var(--background-light)] border border-[var(--background-lighter)] text-[var(--foreground)] rounded-lg hover:bg-[var(--background-lighter)] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Chargement...
              </span>
            ) : (
              'Charger plus'
            )}
          </button>
        </div>
      )}

      {/* End of feed message */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <p className="text-[var(--foreground-muted)]">
            Vous avez atteint la fin du feed
          </p>
        </div>
      )}
    </div>
  );
}
