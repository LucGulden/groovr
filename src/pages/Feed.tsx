import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import FeedComponent from '../components/Feed'

export default function FeedPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  // Protection de la route : rediriger vers /login si non authentifié
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  // Afficher un spinner pendant le chargement
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    )
  }

  // Ne rien afficher si l'utilisateur n'est pas connecté (redirection en cours)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">
            Fil d'actualité
          </h1>
          <p className="text-[var(--foreground-muted)]">
            Découvrez les derniers ajouts de la communauté
          </p>
        </div>

        {/* Feed */}
        <FeedComponent userId={user.id} profileFeed={false} />
      </div>
    </div>
  )
}