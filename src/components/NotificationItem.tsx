import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Avatar from './Avatar'
import VinylImage from './VinylImage'
import { getRelativeTimeString } from '../lib/date-utils'
import type { NotificationWithDetails } from '../types/notification'

interface NotificationItemProps {
  notification: NotificationWithDetails;
}

export default function NotificationItem({ 
  notification,
}: NotificationItemProps) {
  const { actor, type, read, created_at, post, comment } = notification

  // Générer le message selon le type
  const getMessage = () => {
    const actorName = actor.first_name && actor.last_name 
      ? `${actor.first_name} ${actor.last_name}`
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
            src={actor.photo_url}
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
                  {getRelativeTimeString(created_at)}
                </div>
              </div>

              {/* Badge "non lu" */}
              {!read && (
                <div className="w-2 h-2 bg-primary rounded-full mt-1 flex-shrink-0" />
              )}
            </div>
          </div>

          {/* Aperçu du vinyle (pour post_like et post_comment) */}
          {(type === 'post_like' || type === 'post_comment') && post?.vinyl && post.vinyl.cover_url && (
            <div className="w-12 h-12 flex-shrink-0">
              <VinylImage
                src={post.vinyl.cover_url}
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