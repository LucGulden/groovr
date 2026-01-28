interface ModeChoiceProps {
  onSelectSpotify: () => void;
  onSelectManual: () => void;
  onCancel: () => void;
}

export default function ModeChoice({ onSelectSpotify, onSelectManual, onCancel }: ModeChoiceProps) {
  return (
    <div className="py-8">
      <div className="mb-8 text-center">
        <div className="mb-4 text-6xl">💿</div>
        <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
          Créer un nouvel album
        </h3>
        <p className="text-[var(--foreground-muted)]">
          Comment souhaitez-vous ajouter cet album ?
        </p>
      </div>

      <div className="mx-auto max-w-md space-y-4">
        <button
          onClick={onSelectSpotify}
          className="flex w-full items-center gap-4 rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] p-4 text-left transition-colors hover:border-[var(--primary)] hover:bg-[var(--background-lighter)]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1DB954]/20 text-[#1DB954]">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          <div>
            <div className="font-semibold text-[var(--foreground)]">Importer depuis Spotify</div>
            <div className="text-sm text-[var(--foreground-muted)]">
              Rechercher et importer les infos automatiquement
            </div>
          </div>
        </button>

        <button
          onClick={onSelectManual}
          className="flex w-full items-center gap-4 rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] p-4 text-left transition-colors hover:border-[var(--primary)] hover:bg-[var(--background-lighter)]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]/20 text-[var(--primary)]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-[var(--foreground)]">Saisie manuelle</div>
            <div className="text-sm text-[var(--foreground-muted)]">
              Entrer les informations manuellement
            </div>
          </div>
        </button>

        <button
          onClick={onCancel}
          className="w-full rounded-lg py-3 text-center text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}