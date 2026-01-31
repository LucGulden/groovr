import { useAuth } from '../hooks/useAuth'
import FeedComponent from '../components/Feed'

export default function FeedPage() {
  const { user } = useAuth()

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