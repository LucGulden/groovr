import React from 'react';

interface AlbumGridSkeletonProps {
  count?: number;
}

/**
 * Skeleton loader pour la grille d'albums
 * Affiche un état de chargement avec animation pulse
 */
export function AlbumGridSkeleton({ count = 20 }: AlbumGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          {/* Image album (ratio 1:1) */}
          <div className="aspect-square w-full rounded-lg bg-[var(--background-lighter)]" />

          {/* Titre album */}
          <div className="mt-3 h-4 rounded bg-[var(--background-lighter)] w-3/4" />

          {/* Artiste */}
          <div className="mt-2 h-3 rounded bg-[var(--background-lighter)] w-1/2" />
        </div>
      ))}
    </div>
  );
}
