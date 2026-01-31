import { useState } from 'react'
import SearchAlbumsTab from '../components/SearchAlbumsTab'
import SearchArtistsTab from '../components/SearchArtistsTab'
import SearchUsersTab from '../components/SearchUsersTab'

type SearchTab = 'albums' | 'artists' | 'users';

export default function Search() {
  const [activeTab, setActiveTab] = useState<SearchTab>('albums')
  const [query, setQuery] = useState('')

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header avec input de recherche */}
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold text-[var(--foreground)]">
            Rechercher
          </h1>

          {/* Barre de recherche */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <svg
                className="h-5 w-5 text-[var(--foreground-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === 'albums'
                  ? 'Rechercher un album ou un artiste...'
                  : activeTab === 'artists'
                  ? 'Rechercher un artiste...'
                  : 'Rechercher par nom d\'utilisateur ou nom...'
              }
              className="w-full rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] py-3 pl-12 pr-4 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-[var(--background-lighter)]">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('albums')}
              className={`relative py-4 text-sm font-semibold transition-colors ${
                activeTab === 'albums'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Albums
              {activeTab === 'albums' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('artists')}
              className={`relative py-4 text-sm font-semibold transition-colors ${
                activeTab === 'artists'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Artistes
              {activeTab === 'artists' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`relative py-4 text-sm font-semibold transition-colors ${
                activeTab === 'users'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Utilisateurs
              {activeTab === 'users' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
          </div>
        </div>

        {/* Contenu des tabs */}
        {activeTab === 'albums' && <SearchAlbumsTab query={query} />}
        {activeTab === 'artists' && <SearchArtistsTab query={query} />}
        {activeTab === 'users' && <SearchUsersTab query={query} />}
      </div>
    </div>
  )
}