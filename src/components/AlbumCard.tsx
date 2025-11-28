import React from 'react';
import type { Album, AlbumSearchResult } from '@/types/album';
import ImageOptimized from './ImageOptimized';

interface AlbumCardProps {
  album: AlbumSearchResult | Album;
  actions?: React.ReactNode;
  onClick?: () => void;
  priority?: boolean; // Priority loading for first 3 albums (above-the-fold)
}

export default function AlbumCard({ album, actions, onClick, priority = false }: AlbumCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] transition-all hover:border-[var(--primary)] hover:shadow-lg hover:shadow-[var(--primary)]/20"
      onClick={onClick}
    >
      {/* Pochette */}
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--background)]">
        <ImageOptimized
          src={album.coverUrl}
          alt={`${album.title} par ${album.artist}`}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          priority={priority}
          className="h-full w-full object-cover transition-all duration-300 group-hover:scale-110"
        />

        {/* Overlay au hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {/* Actions personnalisées */}
          {actions && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Informations */}
      <div className="p-4">
        {/* Titre */}
        <h3 className="mb-1 line-clamp-1 font-semibold text-[var(--foreground)]" title={album.title}>
          {album.title}
        </h3>

        {/* Artiste */}
        <p className="mb-1 line-clamp-1 text-sm text-[var(--foreground-muted)]" title={album.artist}>
          {album.artist}
        </p>

        {/* Année */}
        <p className="text-xs text-[var(--foreground-muted)]">{album.year}</p>
      </div>

      {/* Lien Spotify (optionnel) */}
      {album.spotifyUrl && (
        <a
          href={album.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-2 top-2 rounded-full bg-black/60 p-2 opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/80 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </a>
      )}
    </div>
  );
}
