import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { getFollowing } from '../lib/follows'
import UserListItem from '../components/UserListItem'
import { type User } from '../types/user'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Following() {
  const { username } = useParams<{ username: string }>()
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [following, setFollowing] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Charger le profil utilisateur
  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        setNotFound(true)
        return
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .single()

        if (error || !data) {
          setNotFound(true)
          return
        }

        setProfileUser(data)
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error)
        setNotFound(true)
      }
    }

    fetchProfile()
  }, [username])

  // Charger la liste des abonnements
  useEffect(() => {
    const loadFollowing = async () => {
      if (!profileUser) return

      try {
        setLoading(true)
        const data = await getFollowing(profileUser.uid)
        setFollowing(data)
      } catch (error) {
        console.error('Erreur lors du chargement des abonnements:', error)
      } finally {
        setLoading(false)
      }
    }

    if (profileUser) {
      loadFollowing()
    }
  }, [profileUser])

  // Rafraîchir la liste après un follow/unfollow
  const handleFollowChange = async () => {
    if (!profileUser) return
    try {
      const data = await getFollowing(profileUser.uid)
      setFollowing(data)
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error)
    }
  }

  if (notFound) {
    return <Navigate to="/404" replace />
  }

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />
  }

  if (!profileUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header avec retour */}
        <div className="mb-6">
          <Link
            to={`/profile/${profileUser.username}`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--primary)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour au profil
          </Link>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Abonnements de {profileUser.username}
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {following.length} {following.length === 1 ? 'abonnement' : 'abonnements'}
          </p>
        </div>

        {/* Liste des abonnements */}
        {following.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
            <div className="mb-4 text-6xl">👤</div>
            <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
              Aucun abonnement
            </h3>
            <p className="text-[var(--foreground-muted)]">
              {profileUser.username} ne suit personne pour le moment
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {following.map((user) => (
              <UserListItem
                key={user.uid}
                user={user}
                showFollowButton={true}
                onFollowChange={handleFollowChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}