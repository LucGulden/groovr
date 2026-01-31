import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
      <div className="text-center">
        {/* Icon */}
        <div className="mb-6 text-8xl">🎵</div>

        {/* 404 Text */}
        <h1 className="mb-4 text-6xl font-bold text-[var(--foreground)]">404</h1>

        {/* Message */}
        <h2 className="mb-2 text-2xl font-semibold text-[var(--foreground)]">
          Page introuvable
        </h2>
        <p className="mb-8 text-lg text-[var(--foreground-muted)]">
          {'Cette page n\'existe pas ou a été supprimée'}
        </p>

        {/* Actions */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-8 py-3 font-semibold text-white transition-all hover:bg-[#d67118] active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            {'Retour à l\'accueil'}
          </Link>
        </div>

        {/* Decorative elements */}
        <div className="mt-16 flex items-center justify-center gap-2 text-[var(--foreground-muted)]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <span className="text-sm">La musique continue sur fillCrate</span>
        </div>
      </div>
    </div>
  )
}