import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import EditProfileForm from '../components/EditProfileForm'
import LoadingSpinner from '../components/LoadingSpinner'
import { getUserByUid } from '../lib/user'
import type { User } from '../types/user'

export default function Settings() {
  const { user: authUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  // Charger les données utilisateur depuis public.users
  useEffect(() => {
    const loadUser = async () => {
      if (!authUser) {
        setLoading(false)
        return
      }

      const userData = await getUserByUid(authUser.id)
      setUser(userData)
      setLoading(false)
    }

    loadUser()
  }, [authUser])

  const handleSuccess = () => {
    setShowSuccessToast(true)
    setTimeout(() => {
      setShowSuccessToast(false)
      // Rafraîchir la page pour voir les changements
      window.location.reload()
    }, 2000)
  }

  // Afficher un spinner pendant le chargement des données user
  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />
  }

  // Guard TypeScript (hooks déjà appelés)
  if (!authUser || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-[var(--foreground)]">
              Paramètres du profil
            </h1>
            <p className="text-[var(--foreground-muted)]">
              Modifiez vos informations personnelles
            </p>
          </div>
          <Link
            to={`/profile/${user.username}`}
            className="flex items-center gap-2 rounded-full border-2 border-[var(--foreground-muted)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Voir mon profil
          </Link>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-[var(--background-lighter)] bg-[var(--background-light)] p-6 md:p-8">
          <EditProfileForm user={user} onSuccess={handleSuccess} />
        </div>

        {/* Toast de succès */}
        {showSuccessToast && (
          <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 px-6 py-4 shadow-lg backdrop-blur-sm">
            <svg
              className="h-6 w-6 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold text-green-500">Profil mis à jour !</p>
              <p className="text-sm text-green-500/80">Vos modifications ont été enregistrées</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}