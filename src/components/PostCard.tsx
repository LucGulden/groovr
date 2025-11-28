'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Avatar from './Avatar';
import CommentItem from './CommentItem';
import ImageOptimized from './ImageOptimized';
import { getRelativeTimeString } from '@/lib/date-utils';
import { likePost, unlikePost, hasLikedPost } from '@/lib/likes';
import { addComment, subscribeToPostComments } from '@/lib/comments';
import { deletePost } from '@/lib/posts';
import type { PostWithDetails } from '@/types/post';
import type { CommentWithUser } from '@/types/comment';

interface PostCardProps {
  post: PostWithDetails;
  currentUserId?: string;
  onDelete?: () => void;
  priority?: boolean; // Priority loading for first post (above-the-fold)
}

export default function PostCard({ post, currentUserId, onDelete, priority = false }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = currentUserId === post.userId;

  // Vérifier si l'utilisateur a liké le post
  useEffect(() => {
    if (!currentUserId) return;

    const checkLike = async () => {
      const liked = await hasLikedPost(currentUserId, post.id);
      setIsLiked(liked);
    };

    checkLike();
  }, [currentUserId, post.id]);

  // S'abonner aux commentaires en temps réel
  useEffect(() => {
    if (!showComments) return;

    const unsubscribe = subscribeToPostComments(
      post.id,
      (newComments) => {
        setComments(newComments);
        // Mettre à jour le compteur en temps réel
        setCommentsCount(newComments.length);
      },
      (error) => {
        console.error('Erreur lors de la récupération des commentaires:', error);
      }
    );

    return () => unsubscribe();
  }, [post.id, showComments]);

  const handleLike = async () => {
    if (!currentUserId || isLiking) return;

    // Optimistic UI update
    const wasLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(!wasLiked);
    setLikesCount(wasLiked ? previousCount - 1 : previousCount + 1);
    setIsLiking(true);

    try {
      if (wasLiked) {
        await unlikePost(currentUserId, post.id);
      } else {
        await likePost(currentUserId, post.id);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(wasLiked);
      setLikesCount(previousCount);
      console.error('Erreur lors du like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUserId || !commentText.trim() || isCommenting) return;

    setIsCommenting(true);

    // Optimistic update du compteur
    const previousCount = commentsCount;
    setCommentsCount(previousCount + 1);

    try {
      await addComment(post.id, currentUserId, commentText);
      setCommentText('');
    } catch (error) {
      // Revert on error
      setCommentsCount(previousCount);
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      alert('Impossible d\'ajouter le commentaire');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Supprimer ce post ?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deletePost(post.id);
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du post:', error);
      alert('Impossible de supprimer le post');
    } finally {
      setIsDeleting(false);
    }
  };

  const postTypeText =
    post.type === 'collection_add' ? 'a ajouté' : 'souhaite ajouter';
  const collectionText =
    post.type === 'collection_add' ? 'sa collection' : 'sa wishlist';

  return (
    <div className="rounded-2xl border border-[var(--background-lighter)] bg-[var(--background-light)] p-6 transition-shadow hover:shadow-lg">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <Link href={`/profile/${post.user.username}`} className="flex-shrink-0">
          <Avatar src={post.user.photoURL} username={post.user.username} size="md" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/profile/${post.user.username}`}
              className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
            >
              {post.user.username}
            </Link>
            <span className="text-sm text-[var(--foreground-muted)]">
              {getRelativeTimeString(post.createdAt)}
            </span>
          </div>

          <p className="mt-1 text-[var(--foreground-muted)]">
            {postTypeText}{' '}
            <span className="font-semibold text-[var(--foreground)]">
              {post.album.title}
            </span>{' '}
            de{' '}
            <span className="font-semibold text-[var(--foreground)]">
              {post.album.artist}
            </span>{' '}
            à {collectionText}
          </p>
        </div>

        {/* Bouton supprimer si c'est son post */}
        {isOwner && (
          <button
            onClick={handleDeletePost}
            disabled={isDeleting}
            className="flex-shrink-0 text-[var(--foreground-muted)] hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={isDeleting ? "Suppression en cours..." : "Supprimer le post"}
          >
            {isDeleting ? (
              <svg
                className="h-5 w-5 animate-spin text-red-500"
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
            ) : (
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Album Cover */}
      <div className="mb-4 relative w-full max-w-md mx-auto aspect-square">
        <ImageOptimized
          src={post.album.coverUrl}
          alt={`${post.album.title} - ${post.album.artist}`}
          fill
          sizes="(max-width: 768px) 100vw, 448px"
          priority={priority}
          className="rounded-xl shadow-md object-cover"
        />
      </div>

      {/* Actions (Like, Comment) */}
      <div className="flex items-center gap-6 mb-4 pt-2 border-t border-[var(--background-lighter)]">
        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={!currentUserId || isLiking}
          className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLiking ? (
            <svg
              className="h-6 w-6 animate-spin text-red-500"
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
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-6 w-6 transition-all ${
                isLiked ? 'fill-red-500 text-red-500' : 'fill-none'
              }`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}
          <span className={isLiked ? 'text-red-500 font-semibold' : ''}>
            {likesCount}
          </span>
        </button>

        {/* Comment Button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span>{commentsCount}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-[var(--background-lighter)] pt-4">
          {/* Comments List */}
          {comments.length > 0 && (
            <div className="space-y-1 mb-4 max-h-96 overflow-y-auto">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  onDelete={() => {
                    // Les commentaires sont mis à jour en temps réel via subscribeToPostComments
                  }}
                />
              ))}
            </div>
          )}

          {/* Add Comment Form */}
          {currentUserId && (
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="flex-1 rounded-lg border border-[var(--background-lighter)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none"
                disabled={isCommenting}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isCommenting}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCommenting ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
          )}

          {!currentUserId && (
            <p className="text-sm text-[var(--foreground-muted)] text-center py-2">
              Connectez-vous pour commenter
            </p>
          )}
        </div>
      )}
    </div>
  );
}
