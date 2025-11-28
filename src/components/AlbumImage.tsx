import ImageOptimized from './ImageOptimized';

interface AlbumImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
}

export default function AlbumImage({
  src,
  alt,
  className = '',
  width,
  height,
  fill = false,
  sizes,
  priority = false,
}: AlbumImageProps) {
  return (
    <ImageOptimized
      src={src}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
