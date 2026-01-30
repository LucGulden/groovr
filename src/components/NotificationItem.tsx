import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Avatar from './Avatar'
import VinylImage from './VinylImage'
import { getRelativeTimeString } from '../utils/date-utils'
import type { NotificationWithDetails } from '../types/notification'

interface NotificationItemProps {
  notification: NotificationWithDetails;
}

export default function NotificationItem({ 
  notification,
}: NotificationItemProps) {
  const { actor, type, read, createdAt, post, comment } = notification

  // Générer le message selon le type
  const getMessage = () => {
    const actorName = actor.firstName && actor.lastName 
      ? `${actor.firstName} ${actor.lastName}`
      : `@${actor.username}`

    switch (type) {
      case 'new_follower':
        return (
          <>
            <span className="font-semibold">{actorName}</span> a commencé à vous suivre
          </>
        )
      case 'post_like':
        return (
          <>
            <span className="font-semibold">{actorName}</span> a aimé votre post
          </>
        )
      case 'post_comment':
        return (
          <>
            <span className="font-semibold">{actorName}</span> a commenté votre post
            {comment && (
              <div className="text-sm text-foreground-muted mt-1 italic line-clamp-2">
                "{comment.content}"
              </div>
            )}
          </>
        )
      default:
        return null
    }
  }

  // Déterminer le lien de destination
  const getDestinationLink = () => {
    if (type === 'new_follower') {
      return `/profile/${actor.username}`
    }
    // Pour post_like et post_comment, on pourrait rediriger vers le post
    // Pour l'instant, on redirige vers le profil de l'acteur
    return `/profile/${actor.username}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        to={getDestinationLink()}
        className={`
          block p-4 border-b border-background-lighter
          hover:bg-background-light transition-colors
          ${!read ? 'bg-background-light/50' : ''}
        `}
      >
        <div className="flex items-start gap-3">
          {/* Avatar de l'acteur */}
          <Avatar
            src={actor.photoUrl}
            username={actor.username}
            size="md"
          />

          {/* Contenu de la notification */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="text-sm text-foreground">
                  {getMessage()}
                </div>
                <div className="text-xs text-foreground-muted mt-1">
                  {getRelativeTimeString(createdAt)}
                </div>
              </div>

              {/* Badge "non lu" */}
              {!read && (
                <div className="w-2 h-2 bg-primary rounded-full mt-1 flex-shrink-0" />
              )}
            </div>
          </div>

          {/* Aperçu du vinyle (pour post_like et post_comment) */}
          {(type === 'post_like' || type === 'post_comment') && post?.vinyl && post.vinyl.coverUrl && (
            <div className="w-12 h-12 flex-shrink-0">
              <VinylImage
                src={post.vinyl.coverUrl}
                alt={`${post.vinyl.artist} - ${post.vinyl.title}`}
                className="rounded"
              />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}