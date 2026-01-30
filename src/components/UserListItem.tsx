import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Avatar from './Avatar'
import Button from './Button'
import { followUser, unfollowUser, isFollowing } from '../lib/follows'
import { useAuth } from '../hooks/useAuth'
import { type User } from '../types/user'

interface UserListItemProps {
  user: User;
  showFollowButton?: boolean;
  onFollowChange?: () => void;
}

export default function UserListItem({
  user,
  showFollowButton = false,
  onFollowChange,
}: UserListItemProps) {
  const { user: currentUser } = useAuth()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
  const isOwnProfile = currentUser?.id === user.uid

  // Vérifier si on suit déjà cet utilisateur
  useEffect(() => {
    if (!currentUser || isOwnProfile || !showFollowButton) return

    const checkFollowing = async () => {
      try {
        const result = await isFollowing(currentUser.id, user.uid)
        setFollowing(result)
      } catch (error) {
        console.error('Erreur lors de la vérification du follow:', error)
      }
    }

    checkFollowing()
  }, [currentUser, user.uid, isOwnProfile, showFollowButton])

  // Gérer le follow/unfollow
  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.preventDefault() // Empêcher la navigation du Link parent
    if (!currentUser) return

    try {
      setLoading(true)

      if (following) {
        await unfollowUser(currentUser.id, user.uid)
        setFollowing(false)
      } else {
        await followUser(currentUser.id, user.uid)
        setFollowing(true)
      }

      // Notifier le parent pour rafraîchir la liste
      onFollowChange?.()
    } catch (error) {
      console.error('Erreur lors du follow/unfollow:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] p-4 transition-colors hover:bg-[var(--background-lighter)]">
      <Link
        to={`/profile/${user.username}`}
        className="flex flex-1 items-center gap-3"
      >
        {/* Avatar */}
        <Avatar
          src={user.photoUrl}
          username={user.username}
          size="md"
        />

        {/* Infos utilisateur */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-[var(--foreground)]">
              {fullName || user.username}
            </p>
          </div>
          <p className="truncate text-sm text-[var(--foreground-muted)]">
            @{user.username}
          </p>
          {user.bio && (
            <p className="mt-1 line-clamp-1 text-sm text-[var(--foreground-muted)]">
              {user.bio}
            </p>
          )}
        </div>
      </Link>

      {/* Bouton Follow (optionnel) */}
      {showFollowButton && !isOwnProfile && (
        <div className="ml-3 flex-shrink-0">
          <Button
            onClick={handleFollowToggle}
            loading={loading}
            disabled={loading}
            variant={following ? 'outline' : 'primary'}
            size="sm"
          >
            {following ? 'Abonné' : 'Suivre'}
          </Button>
        </div>
      )}
    </div>
  )
}