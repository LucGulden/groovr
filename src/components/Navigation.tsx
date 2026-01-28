import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Avatar from './Avatar.tsx'
import { getUnreadCount, subscribeToNotifications } from '../lib/notifications.ts'
import { getUserByUid } from '../lib/user'
import type { User as AppUser } from '../types/user'

export default function Navigation() {
  const { user, signOut, loading } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsCount, setNotificationsCount] = useState(0)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Ajouter un useEffect pour charger les données utilisateur
  useEffect(() => {
    if (!user) return

    getUserByUid(user.id).then(setAppUser).catch(console.error)
  }, [user])

  // Écouter les mises à jour du profil
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (user) {
        getUserByUid(user.id).then(setAppUser).catch(console.error)
      }
    }

    window.addEventListener('profile-updated', handleProfileUpdate)
    return () => window.removeEventListener('profile-updated', handleProfileUpdate)
  }, [user])

  useEffect(() => {
    if (!user) return

    // Charger le count initial
    getUnreadCount(user.id).then(setNotificationsCount).catch((error) => {
      console.error('Erreur lors du chargement du count:', error)
    })

    // Écouter les nouvelles notifications en temps réel
    const unsubscribe = subscribeToNotifications(
      user.id,
      (notification) => {
        console.log('🔔 NOTIFICATION REÇUE:', notification)
        setNotificationsCount((prev) => {
          console.log('📊 Count avant:', prev, '→ après:', prev + 1)
          return prev + 1
        })
      },
      (error) => console.error('❌ Erreur subscription:', error),
    )

    // Écouter l'event "notifications marquées comme lues"
    const handleNotificationsRead = () => setNotificationsCount(0)
    window.addEventListener('notifications-read', handleNotificationsRead)

    return () => {
      unsubscribe()
      window.removeEventListener('notifications-read', handleNotificationsRead)
    }
  }, [user])

  // Fermer le dropdown en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  const handleSignOut = async () => {
    try {
      await signOut()
      setDropdownOpen(false)
      navigate('/')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const username = appUser?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || ''

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--background-lighter)] bg-[var(--background)]/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-80">
          <span>🎵</span>
          <span className="text-[var(--foreground)]">FillCrate</span>
        </Link>

        {/* Navigation links - Desktop - Affichés seulement si connecté */}
        {user && (
          <div className="hidden items-center gap-6 md:flex">
            <Link
              to="/feed"
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              Feed
            </Link>
            <Link
              to="/search"
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              Rechercher
            </Link>
            <Link
              to="/notifications"
              className="relative text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {notificationsCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {notificationsCount > 9 ? '9+' : notificationsCount}
                </span>
              )}
            </Link>
          </div>
        )}

        {/* Auth buttons / User menu */}
        <div className="flex items-center gap-4">
          {loading ? (
            // Spinner pendant le chargement
            <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--background-lighter)]" />
          ) : user ? (
            // Utilisateur connecté - Avatar avec dropdown
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 rounded-full transition-opacity hover:opacity-80"
              >
                <Avatar src={appUser?.photo_url} username={username} size="md" />
                <span className="hidden text-sm font-medium text-[var(--foreground)] md:block">
                  {username}
                </span>
                <svg
                  className={`h-4 w-4 text-[var(--foreground-muted)] transition-transform ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] py-2 shadow-xl">
                  <Link
                    to={`/profile/${username}`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-[var(--foreground)] hover:bg-[var(--background-lighter)]"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Mon profil
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-[var(--foreground)] hover:bg-[var(--background-lighter)]"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Paramètres
                  </Link>

                  <div className="my-1 h-px bg-[var(--background-lighter)]" />

                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 px-4 py-3 text-red-500 hover:bg-[var(--background-lighter)]"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Utilisateur non connecté
            <>
              <Link
                to="/login"
                className="hidden text-[var(--foreground-muted)] hover:text-[var(--foreground)] md:block"
              >
                Connexion
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-[var(--primary)] px-6 py-2 font-medium text-white hover:bg-[#d67118]"
              >
                Inscription
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}