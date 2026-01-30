import type { Artist } from '../types/vinyl'

interface ArtistCardProps {
  artist: Artist;
  onClick: (artist: Artist) => void;
}

// Placeholder SVG pour artiste sans photo
const ArtistPlaceholder = () => (
  <svg
    viewBox="0 0 400 400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-full w-full"
  >
    {/* Fond */}
    <rect width="400" height="400" fill="var(--background-lighter)" />
    
    {/* Cercle de tête */}
    <circle cx="200" cy="140" r="50" fill="var(--primary)" opacity="0.3" />
    
    {/* Épaules/Buste */}
    <path
      d="M120 250 Q120 200 150 190 L200 180 L250 190 Q280 200 280 250 L280 320 Q280 340 260 340 L140 340 Q120 340 120 320 Z"
      fill="var(--primary)"
      opacity="0.3"
    />
    
    {/* Contour tête */}
    <circle 
      cx="200" 
      cy="140" 
      r="50" 
      fill="none" 
      stroke="var(--primary)" 
      strokeWidth="2" 
      opacity="0.6" 
    />
    
    {/* Ondes sonores */}
    <path
      d="M280 140 Q300 140 310 130"
      stroke="var(--foreground-muted)"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.4"
    />
    <path
      d="M280 150 Q305 150 320 145"
      stroke="var(--foreground-muted)"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.4"
    />
    <path
      d="M120 140 Q100 140 90 130"
      stroke="var(--foreground-muted)"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.4"
    />
    <path
      d="M120 150 Q95 150 80 145"
      stroke="var(--foreground-muted)"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.4"
    />
  </svg>
)

export default function ArtistCard({ artist, onClick }: ArtistCardProps) {
  return (
    <button
      onClick={() => onClick(artist)}
      className="group text-left transition-transform hover:scale-105"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[var(--background-lighter)] bg-[var(--background-lighter)]">
        {artist.imageUrl ? (
          <img
            src={artist.imageUrl}
            alt={artist.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <ArtistPlaceholder />
        )}
      </div>
      <h3 className="mt-3 truncate font-semibold text-[var(--foreground)]">
        {artist.name}
      </h3>
    </button>
  )
}