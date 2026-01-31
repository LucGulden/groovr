import { useState, useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useUserStore } from '../stores/userStore'
import { useVinylStatsStore } from '../stores/vinylStatsStore'
import ProfileHeader from '../components/ProfileHeader'
import ProfileVinyls from '../components/ProfileVinyls'
import Feed from '../components/Feed'
import { supabase } from '../supabaseClient'
import { getFollowStats } from '../lib/follows'
import { getVinylStats } from '../lib/vinyls'
import { type User } from '../types/user'
import AddVinylModal from '../components/AddVinylModal'
import LoadingSpinner from '../components/LoadingSpinner'
import { getUserByUsername } from '../lib/user'

interface ProfileStats {
  releasesCount: number;
  wishlistCount: number;
  followersCount: number;
  followingCount: number;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser, loading: authLoading } = useAuth()
  const { appUser } = useUserStore()
  const vinylStatsStore = useVinylStatsStore()

  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [stats, setStats] = useState<ProfileStats>({
    releasesCount: 0,
    wishlistCount: 0,
    followersCount: 0,
    followingCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<'feed' | 'collection' | 'wishlist'>('feed')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isOwnProfile = currentUser?.id === profileUser?.uid

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        setNotFound(true)
        return
      }

      try {
        setLoading(true)

        // Si c'est son propre profil, utiliser le store
        if (appUser && appUser.username === username) {
          setProfileUser(appUser)
          setLoading(false)
          return
        }

        // Sinon, récupérer l'utilisateur par username depuis la DB
        const user = await getUserByUsername(username)

        if (!user) {
          setNotFound(true)
          return
        }

        setProfileUser(user)
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [username, appUser])

  // Synchroniser profileUser avec appUser quand on est sur son propre profil
  useEffect(() => {
    if (appUser && profileUser && appUser.uid === profileUser.uid) {
      setProfileUser(appUser)
    }
  }, [appUser, profileUser])

  // Charger les stats
  useEffect(() => {
    const loadStats = async () => {
      if (!profileUser) return

      try {
        // Pour son propre profil, utiliser le store
        if (isOwnProfile && vinylStatsStore.isInitialized) {
          const followStats = await getFollowStats(profileUser.uid)
          setStats({
            releasesCount: vinylStatsStore.stats.collectionCount,
            wishlistCount: vinylStatsStore.stats.wishlistCount,
            followersCount: followStats.followersCount,
            followingCount: followStats.followingCount,
          })
        } else {
          // Pour les autres profils, charger depuis la DB
          const vinylStats = await getVinylStats(profileUser.uid)
          const followStats = await getFollowStats(profileUser.uid)

          setStats({
            releasesCount: vinylStats.collectionCount,
            wishlistCount: vinylStats.wishlistCount,
            followersCount: followStats.followersCount,
            followingCount: followStats.followingCount,
          })
        }
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error)
      }
    }

    loadStats()
  }, [profileUser, isOwnProfile, vinylStatsStore.stats, vinylStatsStore.isInitialized])

  // Callback pour rafraîchir les stats après un follow/unfollow
  const handleFollowChange = async () => {
    if (!profileUser) return

    try {
      const followStats = await getFollowStats(profileUser.uid)
      setStats((prev) => ({
        ...prev,
        followersCount: followStats.followersCount,
        followingCount: followStats.followingCount,
      }))
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des stats:', error)
    }
  }

  // Fonction pour ouvrir le modal depuis ProfileVinyls
  const handleOpenAddVinyl = () => {
    setIsModalOpen(true)
  }

  // Callback après succès du modal
  const handleModalSuccess = () => {
    setIsModalOpen(false)
    // Les stats sont déjà à jour via le store, plus besoin de rafraîchir manuellement
  }

  // Rediriger vers 404 si profil non trouvé
  if (notFound) {
    return <Navigate to="/404" replace />
  }

  // Loading state
  if (loading || authLoading) {
    return <LoadingSpinner fullScreen size="lg" />
  }

  if (!profileUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Profile Header */}
      <ProfileHeader
        user={profileUser}
        stats={stats}
        isOwnProfile={isOwnProfile}
        onFollowChange={handleFollowChange}
      />

      {/* Tabs */}
      <div className="border-b border-[var(--background-lighter)]">
        <div className="mx-auto max-w-5xl px-6 sm:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('feed')}
              className={`relative py-4 text-sm font-semibold transition-colors ${
                activeTab === 'feed'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Feed
              {activeTab === 'feed' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('collection')}
              className={`relative py-4 text-sm font-semibold transition-colors ${
                activeTab === 'collection'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Collection
              {activeTab === 'collection' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`relative py-4 text-sm font-semibold transition-colors ${
                activeTab === 'wishlist'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Wishlist
              {activeTab === 'wishlist' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8">
        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <Feed userId={profileUser.uid} profileFeed={true} />
        )}

        {/* Collection Tab */}
        {activeTab === 'collection' && (
          <ProfileVinyls
            userId={profileUser.uid}
            type="collection"
            isOwnProfile={isOwnProfile}
            username={profileUser.username}
            onOpenAddVinyl={handleOpenAddVinyl}
          />
        )}

        {/* Wishlist Tab */}
        {activeTab === 'wishlist' && (
          <ProfileVinyls
            userId={profileUser.uid}
            type="wishlist"
            isOwnProfile={isOwnProfile}
            username={profileUser.username}
            onOpenAddVinyl={handleOpenAddVinyl}
          />
        )}
      </div>

      {/* Modal d'ajout de vinyle */}
      {isOwnProfile && currentUser && (
        <AddVinylModal
          key={isModalOpen ? 'modal-open' : 'modal-closed'}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          userId={currentUser.id}
          targetType={activeTab === 'wishlist' ? 'wishlist' : 'collection'}
        />
      )}
    </div>
  )
}