import React, { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  username: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Génère une couleur déterministe basée sur le username
 */
function getColorFromUsername(username: string): string {
  const colors = [
    '#E67E22', // Orange (primary)
    '#8B4513', // Marron (secondary)
    '#3498db', // Bleu
    '#e74c3c', // Rouge
    '#2ecc71', // Vert
    '#9b59b6', // Violet
    '#f39c12', // Jaune orangé
    '#1abc9c', // Turquoise
  ];

  // Générer un index basé sur le username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;

  return colors[index];
}

/**
 * Extrait les initiales du username
 */
function getInitials(username: string): string {
  if (!username) return '?';

  // Prendre les 2 premiers caractères du username
  return username.substring(0, 2).toUpperCase();
}

export default function Avatar({ src, username, size = 'md', className = '' }: AvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-24 w-24 text-3xl',
  };

  const backgroundColor = getColorFromUsername(username);
  const initials = getInitials(username);

  if (src) {
    return (
      <div className="relative">
        {/* Shimmer placeholder */}
        {!imageLoaded && (
          <div className={`${sizeClasses[size]} rounded-full border-2 border-[var(--primary)] overflow-hidden ${className}`}>
            <div className="h-full w-full animate-pulse bg-gradient-to-r from-[var(--background-lighter)] via-[var(--background)] to-[var(--background-lighter)]">
              <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            </div>
          </div>
        )}

        <img
          src={src}
          alt={username}
          className={`${sizeClasses[size]} rounded-full border-2 border-[var(--primary)] object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0 absolute top-0 left-0'
          } ${className}`}
          onLoad={() => setImageLoaded(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full border-2 border-[var(--primary)] font-bold text-white ${className}`}
      style={{ backgroundColor }}
    >
      {initials}
    </div>
  );
}
