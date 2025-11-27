import React, { useState } from 'react';

interface AlbumImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function AlbumImage({ src, alt, className = '' }: AlbumImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="relative">
      {/* Shimmer placeholder */}
      {!imageLoaded && (
        <div className={`absolute inset-0 overflow-hidden rounded-lg ${className}`}>
          <div className="h-full w-full animate-pulse bg-gradient-to-r from-[var(--background-lighter)] via-[var(--background)] to-[var(--background-lighter)] bg-[length:200%_100%]">
            <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>
        </div>
      )}

      <img
        src={src}
        alt={alt}
        className={`transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
      />
    </div>
  );
}
