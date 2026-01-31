import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import Button from './Button'
import { followUser, unfollowUser, isFollowing } from '../lib/follows'
import { useAuth } from '../hooks/useAuth'
import { type User } from '../types/user'

interface ProfileStats {
  releasesCount: number;
  wishlistCount?: number;
  followersCount: number;
  followingCount: number;
}

interface ProfileHeaderProps {
  user: User;
  stats: ProfileStats;
  isOwnProfile: boolean;
  onFollowChange?: () => void;
}

export default function ProfileHeader({
  user,
  stats,
  isOwnProfile,
  onFollowChange,
}: ProfileHeaderProps) {
  const { user: currentUser } = useAuth()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')

  // Vérifier si on suit déjà cet utilisateur
  useEffect(() => {
    if (!currentUser || isOwnProfile) return

    const checkFollowing = async () => {
      try {
        const result = await isFollowing(currentUser.id, user.uid)
        setFollowing(result)
      } catch (error) {
        console.error('Erreur lors de la vérification du follow:', error)
      }
    }

    checkFollowing()
  }, [currentUser, user.uid, isOwnProfile])

  // Gérer le follow/unfollow
  const handleFollowToggle = async () => {
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

      // Notifier le parent pour rafraîchir les stats
      onFollowChange?.()
    } catch (error) {
      console.error('Erreur lors du follow/unfollow:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Cover Image - Gradient */}
      <div className="relative h-48 w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] sm:h-64">
        {/* Avatar - Overlay at bottom */}
        <div className="absolute -bottom-12 left-6 sm:-bottom-16 sm:left-8">
          <Avatar
            src={user.photoUrl}
            username={user.username}
            size="xl"
            className="border-4 border-[var(--background)] ring-2 ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-6 pb-6 pt-16 sm:px-8 sm:pt-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* User Info */}
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
                {user.username}
              </h1>
            </div>

            {fullName && (
              <p className="mb-3 text-lg text-[var(--foreground-muted)]">{fullName}</p>
            )}

            {user.bio && (
              <p className="mb-4 max-w-2xl text-[var(--foreground)]">{user.bio}</p>
            )}

            {/* Stats */}
            <div className="flex gap-6">
              <div>
                <span className="text-xl font-bold text-[var(--foreground)]">
                  {stats.releasesCount}
                </span>
                <span className="ml-1 text-sm text-[var(--foreground-muted)]">vinyles</span>
              </div>
              {stats.wishlistCount !== undefined && (
                <div>
                  <span className="text-xl font-bold text-[var(--foreground)]">
                    {stats.wishlistCount}
                  </span>
                  <span className="ml-1 text-sm text-[var(--foreground-muted)]">wishlist</span>
                </div>
              )}
              <Link
                to={`/profile/${user.username}/followers`}
                className="transition-opacity hover:opacity-70"
              >
                <span className="text-xl font-bold text-[var(--foreground)]">
                  {stats.followersCount}
                </span>
                <span className="ml-1 text-sm text-[var(--foreground-muted)]">abonnés</span>
              </Link>
              <Link
                to={`/profile/${user.username}/following`}
                className="transition-opacity hover:opacity-70"
              >
                <span className="text-xl font-bold text-[var(--foreground)]">
                  {stats.followingCount}
                </span>
                <span className="ml-1 text-sm text-[var(--foreground-muted)]">abonnements</span>
              </Link>
            </div>
          </div>

          {/* Action Button */}
          <div>
            {isOwnProfile ? (
              <Link
                to="/settings"
                className="flex items-center gap-2 rounded-full border-2 border-[var(--foreground-muted)] px-6 py-2 font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                Modifier le profil
              </Link>
            ) : (
              <Button
                onClick={handleFollowToggle}
                loading={loading}
                disabled={loading}
                variant={following ? 'outline' : 'primary'}
              >
                {following ? (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Abonné
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Suivre
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}