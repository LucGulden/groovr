import { useState } from 'react'
import { createAlbum, updateAlbumCover } from '../lib/vinyls'
import { uploadAlbumCover, generateImagePreview } from '../lib/covers'
import type { Album } from '../types/vinyl'
import Button from './Button'

interface ManualAlbumFormProps {
  onAlbumCreated: (album: Album) => void;
  onBack: () => void;
  userId: string;
}

export default function ManualAlbumForm({ onAlbumCreated, onBack, userId }: ManualAlbumFormProps) {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [year, setYear] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = title.trim() && artist.trim() && year.trim() && coverFile

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image')
      return
    }

    setCoverFile(file)
    const preview = await generateImagePreview(file)
    setCoverPreview(preview)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Créer l'album d'abord (sans cover pour avoir l'ID)
      const newAlbum = await createAlbum({
        title: title.trim(),
        artist: artist.trim(),
        year: parseInt(year, 10),
        coverUrl: null,
        createdBy: userId,
      })

      // Upload la cover
      if (coverFile) {
        const coverUrl = await uploadAlbumCover(newAlbum.id, coverFile)
        await updateAlbumCover(newAlbum.id, coverUrl)
        newAlbum.coverUrl = coverUrl
      }

      onAlbumCreated(newAlbum)
    } catch (err) {
      console.error('Erreur création album:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      {/* Header avec bouton retour */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
        disabled={isSubmitting}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      {/* Erreur */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-500">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
        {/* Cover upload */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Cover de l'album *
          </label>
          <div className="flex items-start gap-4">
            <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--background-lighter)]">
              {coverPreview ? (
                <img src={coverPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[var(--foreground-muted)]">
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
                id="cover-upload"
                disabled={isSubmitting}
              />
              <label
                htmlFor="cover-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background-lighter)]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Choisir une image
              </label>
              <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                JPG, PNG ou WebP. Max 10MB.
              </p>
            </div>
          </div>
        </div>

        {/* Titre */}
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Titre de l'album *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Abbey Road"
            className="w-full rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Artiste */}
        <div>
          <label htmlFor="artist" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Artiste *
          </label>
          <input
            type="text"
            id="artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Ex: The Beatles"
            className="w-full rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Année */}
        <div>
          <label htmlFor="year" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Année de sortie *
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

        {/* Submit */}
        <Button type='submit' disabled={!isValid || isSubmitting} variant="primary" className="w-full">
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Création en cours...
            </span>
          ) : (
            'Créer l\'album'
          )}
        </Button>
      </form>
    </div>
  )
}