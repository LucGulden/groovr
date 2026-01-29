import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Avatar from './Avatar'
import { useNotificationsStore } from '../stores/notificationsStore'
import { useUserStore } from '../stores/userStore'

export default function Navigation() {
  const { user, signOut, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const { unreadCount } = useNotificationsStore()
  const { appUser } = useUserStore()

  // Fermer les menus en cliquant en dehors
  useEffect(() => {
    if (!dropdownOpen && !mobileMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen, mobileMenuOpen])

  const handleSignOut = async () => {
    try {
      await signOut()
      setDropdownOpen(false)
      setMobileMenuOpen(false)
      navigate('/')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const username = appUser?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || ''

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      {/* Navigation Desktop */}
      <header className="sticky top-0 z-50 border-b border-[var(--background-lighter)] bg-[var(--background)]/95 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-80">
            <span>🎵</span>
            <span className="text-[var(--foreground)]">FillCrate</span>
          </Link>

          {/* Navigation links - Desktop */}
          {user && (
            <div className="hidden items-center gap-8 lg:flex">
              <Link
                to="/"
                className={`relative py-2 text-sm font-semibold transition-colors ${
                  isActive('/')
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
                title="Accueil"
              >
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <span>Accueil</span>
                </div>
                {isActive('/') && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
                )}
              </Link>

              <Link
                to="/search"
                className={`relative py-2 text-sm font-semibold transition-colors ${
                  isActive('/search')
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
                title="Rechercher"
              >
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>Rechercher</span>
                </div>
                {isActive('/search') && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
                )}
              </Link>

              <Link
                to="/notifications"
                className={`relative py-2 text-sm font-semibold transition-colors ${
                  isActive('/notifications')
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
                title="Notifications"
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span>Notifications</span>
                </div>
                {isActive('/notifications') && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
                )}
              </Link>
            </div>
          )}

          {/* Auth buttons / User menu */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--background-lighter)]" />
            ) : user ? (
              <>
                {/* Menu Burger - Tablette */}
                {user && mobileMenuOpen && (
                  <div
                    ref={mobileMenuRef}
                    className="border-t border-[var(--background-lighter)] bg-[var(--background-light)] lg:hidden"
                  >
                    <div className="mx-auto max-w-7xl px-6 py-4">
                      <div className="space-y-2">
                        <Link
                          to="/"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                            isActive('/')
                              ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                              : 'text-[var(--foreground)] hover:bg-[var(--background-lighter)]'
                          }`}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                          </svg>
                          <span className="font-medium">Accueil</span>
                        </Link>

                        <Link
                          to="/search"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                            isActive('/search')
                              ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                              : 'text-[var(--foreground)] hover:bg-[var(--background-lighter)]'
                          }`}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                          <span className="font-medium">Rechercher</span>
                        </Link>

                        <Link
                          to="/notifications"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                            isActive('/notifications')
                              ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                              : 'text-[var(--foreground)] hover:bg-[var(--background-lighter)]'
                          }`}
                        >
                          <div className="relative">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                              />
                            </svg>
                            {unreadCount > 0 && (
                              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                            )}
                          </div>
                          <span className="font-medium">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="ml-auto text-sm text-[var(--foreground-muted)]">
                              {unreadCount}
                            </span>
                          )}
                        </Link>

                        <div className="my-2 h-px bg-[var(--background-lighter)]" />

                        <Link
                          to={`/profile/${username}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-[var(--foreground)] hover:bg-[var(--background-lighter)]"
                        >
                          <Avatar src={appUser?.photo_url} username={username} size="sm" />
                          <span className="font-medium">Mon profil</span>
                        </Link>

                        <Link
                          to="/settings"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-[var(--foreground)] hover:bg-[var(--background-lighter)]"
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
                          <span className="font-medium">Paramètres</span>
                        </Link>

                        <button
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-500 hover:bg-[var(--background-lighter)]"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          <span className="font-medium">Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
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
                  className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[#d67118] md:px-6"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Menu Burger - Tablette */}
        {user && mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="border-t border-[var(--background-lighter)] bg-[var(--background-light)] lg:hidden"
          >
            <div className="mx-auto max-w-7xl px-6 py-4">
              <div className="space-y-2">
                <Link
                  to="/"
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                    isActive('/')
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--background-lighter)]'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <span className="font-medium">Accueil</span>
                </Link>

                <Link
                  to="/search"
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                    isActive('/search')
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--background-lighter)]'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span className="font-medium">Rechercher</span>
                </Link>

                <Link
                  to="/notifications"
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                    isActive('/notifications')
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--background-lighter)]'
                  }`}
                >
                  <div className="relative">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="ml-auto text-sm text-[var(--foreground-muted)]">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                <div className="my-2 h-px bg-[var(--background-lighter)]" />

                <Link
                  to={`/profile/${username}`}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-[var(--foreground)] hover:bg-[var(--background-lighter)]"
                >
                  <Avatar src={appUser?.photo_url} username={username} size="sm" />
                  <span className="font-medium">Mon profil</span>
                </Link>

                <Link
                  to="/settings"
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-[var(--foreground)] hover:bg-[var(--background-lighter)]"
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
                  <span className="font-medium">Paramètres</span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-500 hover:bg-[var(--background-lighter)]"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="font-medium">Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Navigation Mobile - Barre en bas */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--background-lighter)] bg-[var(--background)]/95 backdrop-blur-sm md:hidden">
          <div className="flex items-center justify-around px-4 py-3">
            <Link
              to="/"
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive('/')
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)]'
              }`}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="text-xs font-medium">Accueil</span>
            </Link>

            <Link
              to="/search"
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive('/search')
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)]'
              }`}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="text-xs font-medium">Rechercher</span>
            </Link>

            <Link
              to="/notifications"
              className={`relative flex flex-col items-center gap-1 transition-colors ${
                isActive('/notifications')
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)]'
              }`}
            >
              <div className="relative">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">Notifications</span>
            </Link>

            <Link
              to={`/profile/${username}`}
              className={`flex flex-col items-center gap-1 transition-colors ${
                location.pathname.startsWith('/profile')
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)]'
              }`}
            >
              <Avatar src={appUser?.photo_url} username={username} size="sm" />
              <span className="text-xs font-medium">Profil</span>
            </Link>
          </div>
        </nav>
      )}
    </>
  )
}