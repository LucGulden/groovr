import { useState } from 'react'

interface VinylImageProps {
  src: string;
  alt: string;
  className?: string;
}

// Placeholder SVG pour vinyles sans pochette
const VinylPlaceholder = () => (
  <svg
    viewBox="0 0 400 400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-full w-full"
  >
    {/* Fond */}
    <rect width="400" height="400" fill="var(--background)" />
    
    {/* Disque vinyle */}
    <circle cx="200" cy="200" r="150" fill="#1a1a1a" />
    
    {/* Sillons du vinyle */}
    <circle cx="200" cy="200" r="140" fill="none" stroke="#2a2a2a" strokeWidth="2" />
    <circle cx="200" cy="200" r="130" fill="none" stroke="#2a2a2a" strokeWidth="2" />
    <circle cx="200" cy="200" r="120" fill="none" stroke="#2a2a2a" strokeWidth="2" />
    <circle cx="200" cy="200" r="110" fill="none" stroke="#2a2a2a" strokeWidth="2" />
    <circle cx="200" cy="200" r="100" fill="none" stroke="#2a2a2a" strokeWidth="2" />
    <circle cx="200" cy="200" r="90" fill="none" stroke="#2a2a2a" strokeWidth="2" />
    
    {/* Label central */}
    <circle cx="200" cy="200" r="70" fill="var(--primary)" opacity="0.2" />
    <circle cx="200" cy="200" r="65" fill="none" stroke="var(--primary)" strokeWidth="1" opacity="0.5" />
    
    {/* Trou central */}
    <circle cx="200" cy="200" r="15" fill="var(--background)" />
    <circle cx="200" cy="200" r="15" fill="none" stroke="#2a2a2a" strokeWidth="1" />
    
    {/* Icône note de musique */}
    <path
      d="M220 180v40c0 8.284-6.716 15-15 15s-15-6.716-15-15 6.716-15 15-15c2.485 0 4.83.606 6.891 1.679V175l20-5v10z"
      fill="var(--primary)"
      opacity="0.6"
    />
    <circle cx="220" cy="175" r="5" fill="var(--primary)" opacity="0.6" />
  </svg>
)

export default function VinylImage({ src, alt, className = '' }: VinylImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Si pas d'URL ou erreur de chargement, afficher le placeholder
  if (!src || imageError) {
    return (
      <div className={className}>
        <VinylPlaceholder />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Placeholder pendant le chargement */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${
          imageLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <VinylPlaceholder />
      </div>
      
      {/* Image réelle */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onError={() => setImageError(true)}
        onLoad={() => setImageLoaded(true)}
      />
    </div>
  )
}