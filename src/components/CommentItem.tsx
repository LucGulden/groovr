import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import { deleteComment } from '../lib/comments'
import { getRelativeTimeString } from '../utils/date-utils'
import type { CommentWithUser } from '../types/comment'

interface CommentItemProps {
  comment: CommentWithUser
  currentUserId?: string
  isPending?: boolean
  onDelete: () => void
}

export default function CommentItem({ 
  comment, 
  currentUserId, 
  isPending = false,
  onDelete 
}: CommentItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const isOwner = currentUserId === comment.userId

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce commentaire ?')) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteComment(comment.id)
      if (onDelete) {
        onDelete()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du commentaire:', error)
      alert('Impossible de supprimer le commentaire')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div 
      className={`flex gap-3 py-3 transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}
    >
      {/* Avatar */}
      <Link to={`/profile/${comment.user.username}`} className="flex-shrink-0">
        <Avatar 
          src={comment.user.photoURL} 
          username={comment.user.username} 
          size="sm" 
        />
      </Link>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <Link
            to={`/profile/${comment.user.username}`}
            className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
          >
            {comment.user.username}
          </Link>
          <span className="text-xs text-[var(--foreground-muted)]">
            {isPending ? 'Publication...' : getRelativeTimeString(comment.createdAt)}
          </span>
        </div>

        <p className="mt-1 text-[var(--foreground)] break-words whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>

      {/* Bouton supprimer si c'est son commentaire (pas visible si pending) */}
      {isOwner && !isPending && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-shrink-0 text-[var(--foreground-muted)] hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={isDeleting ? 'Suppression en cours...' : 'Supprimer'}
        >
          {isDeleting ? (
            <svg
              className="h-4 w-4 animate-spin text-red-500"
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
              className="h-4 w-4"
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
  )
}