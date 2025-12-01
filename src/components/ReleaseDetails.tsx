'use client';

import Image from 'next/image';
import type { Release } from '@/types/release';
import Button from './Button';

interface ReleaseDetailsProps {
  release: Release;
  onConfirm: () => void;
}

export default function ReleaseDetails({
  release,
  onConfirm,
}: ReleaseDetailsProps) {
  // Vérifie si l'année de sortie diffère de l'année de l'album original
  const isReissue = release.releaseYear !== release.year;

  return (
    <div className="space-y-6">
      {/* Cover et infos principales */}
      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Cover */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)] md:w-[300px]">
          <Image
            src={release.coverUrl}
            alt={`${release.title} - ${release.artist}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        </div>

        {/* Infos principales */}
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-[var(--foreground)]">
              {release.title}
            </h3>
            <p className="mt-1 text-lg font-medium text-[var(--foreground-muted)]">
              {release.artist}
            </p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              {isReissue ? (
                <>
                  Album original : {release.year} • Réédition : {release.releaseYear}
                </>
              ) : (
                release.year
              )}
            </p>
          </div>

          {/* Badge de réédition (optionnel) */}
          {isReissue && (
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-medium text-[var(--primary)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Réédition
            </div>
          )}

          {/* Détails de l'édition */}
          <div className="space-y-3 rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)] p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
              {`Détails de l'édition`}
            </h4>
            <div className="space-y-2">
              <DetailRow label="Label" value={release.label} />
              <DetailRow label="Numéro de catalogue" value={release.catalogNumber} />
              <DetailRow label="Pays" value={release.country} />
              <DetailRow label="Format" value={release.format} />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 border-t border-[var(--background-lighter)] pt-6 sm:flex-row sm:justify-end">
        <Button
          onClick={onConfirm}
          variant="primary"
          className="w-full sm:w-auto"
        >
          Ajouter cette édition
        </Button>
      </div>
    </div>
  );
}

// Composant helper pour les lignes de détails
function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-[var(--foreground-muted)]">
        {label}
      </span>
      <span className="text-sm font-medium text-[var(--foreground)] text-right">
        {value}
      </span>
    </div>
  );
}