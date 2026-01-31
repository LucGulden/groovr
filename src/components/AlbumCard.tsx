import VinylImage from './VinylImage'
import type { Album } from '../types/vinyl'

interface AlbumCardProps {
  album: Album;
  onClick: (album: Album) => void;
}

export default function AlbumCard({ album, onClick }: AlbumCardProps) {
  return (
    <button
      onClick={() => onClick(album)}
      className="group text-left transition-transform hover:scale-105"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)]">
        <VinylImage
          src={album.coverUrl || ''}
          alt={`${album.title} par ${album.artist}`}
          className="h-full w-full object-cover transition-transform"
        />
      </div>
      <h3 className="mt-3 truncate font-semibold text-[var(--foreground)]">
        {album.title}
      </h3>
      <p className="truncate text-sm text-[var(--foreground-muted)]">
        {album.artist}
      </p>
      {album.year && (
        <p className="text-xs text-[var(--foreground-muted)]">{album.year}</p>
      )}
    </button>
  )
}