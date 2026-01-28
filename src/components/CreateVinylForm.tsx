import { useState } from 'react'
import { createVinyl, updateVinylCover } from '../lib/vinyls'
import { uploadVinylCover, generateImagePreview } from '../lib/covers'
import type { Album, Vinyl } from '../types/vinyl'
import VinylImage from './VinylImage'
import Button from './Button'

interface CreateVinylFormProps {
  album: Album;
  onVinylCreated: (vinyl: Vinyl) => void;
  onCancel: () => void;
  userId: string;
}

// Formats vinyle courants
const VINYL_FORMATS = [
  'LP',
  '2xLP',
  '3xLP',
  'LP Box Set',
  '7"',
  '10"',
  '12"',
  'EP',
  'Single',
  'Maxi-Single',
  'Picture Disc',
]

// Pays courants pour les pressages
const COUNTRIES = [
  'France',
  'USA',
  'UK',
  'Germany',
  'Japan',
  'Netherlands',
  'Italy',
  'Canada',
  'Australia',
  'Spain',
  'Belgium',
  'Sweden',
  'Other',
]

export default function CreateVinylForm({ album, onVinylCreated, onCancel, userId }: CreateVinylFormProps) {
  const [title, setTitle] = useState(album.title)
  const [year, setYear] = useState(album.year?.toString() || '');  const [label, setLabel] = useState('')
  const [catalogNumber, setCatalogNumber] = useState('')
  const [country, setCountry] = useState('')
  const [format, setFormat] = useState('')
  const [customCoverFile, setCustomCoverFile] = useState<File | null>(null)
  const [customCoverPreview, setCustomCoverPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tous les champs obligatoires sauf cover custom et catalog number
  const isValid = title.trim() && year.trim() && label.trim() && catalogNumber.trim() && country.trim() && format.trim()

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image')
      return
    }

    setCustomCoverFile(file)
    const preview = await generateImagePreview(file)
    setCustomCoverPreview(preview)
    setError(null)
  }

  const handleRemoveCover = () => {
    setCustomCoverFile(null)
    setCustomCoverPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Créer le vinyle
      const newVinyl = await createVinyl({
        albumId: album.id,
        title: title.trim(),
        artist: album.artist,
        year: parseInt(year, 10),
        label: label.trim(),
        catalogNumber: catalogNumber.trim(),
        country: country.trim(),
        format: format.trim(),
        coverUrl: album.cover_url, // Par défaut, utiliser la cover de l'album
        createdBy: userId,
      })

      // Si une cover custom a été uploadée, la remplacer
      if (customCoverFile) {
        try {
          const coverUrl = await uploadVinylCover(newVinyl.id, customCoverFile)
          await updateVinylCover(newVinyl.id, coverUrl)
          newVinyl.cover_url = coverUrl
        } catch (coverError) {
          console.error('Erreur upload cover custom:', coverError)
        }
      }

      onVinylCreated(newVinyl)
    } catch (err) {
      console.error('Erreur création vinyle:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
      setIsSubmitting(false)
    }
  }

  // Cover à afficher (custom ou album)
  const displayCover = customCoverPreview || album.cover_url

  return (
    <div className="w-full">
      {/* Album header */}
      <div className="mb-6 flex items-center gap-4 rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)] p-4">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
          <VinylImage
            src={album.cover_url || ''}
            alt={`${album.title} par ${album.artist}`}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h3 className="font-bold text-[var(--foreground)]">{album.title}</h3>
          <p className="text-sm text-[var(--foreground-muted)]">{album.artist}</p>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-500">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Colonne gauche : Cover */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Cover du pressage
            </label>
            <div className="mb-3 aspect-square w-full max-w-[200px] overflow-hidden rounded-lg bg-[var(--background-lighter)]">
              <VinylImage
                src={displayCover || ''}
                alt="Cover du pressage"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
                id="vinyl-cover-upload"
                disabled={isSubmitting}
              />
              <label
                htmlFor="vinyl-cover-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background-lighter)]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Cover alternative
              </label>
              {customCoverFile && (
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Retirer
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-[var(--foreground-muted)]">
              Par défaut, la cover de l'album est utilisée
            </p>
          </div>

          {/* Colonne droite : Champs */}
          <div className="space-y-4">
            {/* Titre du pressage */}
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                Titre du pressage *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: 2014 Forest Hills Drive (10 Years Anniversary)"
                className="w-full rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                disabled={isSubmitting}
                required
              />
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                Modifiez si édition spéciale ou titre différent
              </p>
            </div>
            {/* Année du pressage */}
            <div>
              <label htmlFor="year" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                Année du pressage *
              </label>
              <input
                type="number"
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Ex: 1969"
                min="1900"
                max={new Date().getFullYear()}
                className="w-full rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Label */}
            <div>
              <label htmlFor="label" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                Label *
              </label>
              <input
                type="text"
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Apple Records"
                className="w-full rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Numéro de catalogue */}
            <div>
              <label htmlFor="catalogNumber" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                Numéro de catalogue *
              </label>
              <input
                type="text"
                id="catalogNumber"
                value={catalogNumber}
                onChange={(e) => setCatalogNumber(e.target.value)}
                placeholder="Ex: PCS 7088"
                className="w-full rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Pays */}
            <div>
              <label htmlFor="country" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                Pays *
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                disabled={isSubmitting}
                required
              >
                <option value="">Sélectionner un pays</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Format */}
            <div>
              <label htmlFor="format" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                Format *
              </label>
              <select
                id="format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                disabled={isSubmitting}
                required
              >
                <option value="">Sélectionner un format</option>
                {VINYL_FORMATS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-3 pt-4">
          <Button 
            type="button" 
            onClick={onCancel} 
            disabled={isSubmitting} 
            variant="secondary" 
            className="flex-1"
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={!isValid || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Création...
              </span>
            ) : (
              'Créer le pressage'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}