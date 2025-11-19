'use client';

import { useState } from 'react';
import { Blurhash } from 'react-blurhash';

interface BlurHashImageProps {
  src: string | null | undefined;
  blurhash: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Image component with BlurHash placeholder
 * Shows blurhash while loading, then fades to actual image
 */
export function BlurHashImage({
  src,
  blurhash,
  alt,
  className = '',
  width,
  height,
}: BlurHashImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // No src = show placeholder or nothing
  if (!src) {
    if (blurhash) {
      return (
        <div className={`relative overflow-hidden ${className}`}>
          <Blurhash
            hash={blurhash}
            width="100%"
            height="100%"
            resolutionX={32}
            resolutionY={32}
            punch={1}
          />
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* BlurHash placeholder (shown while loading or on error) */}
      {blurhash && (!isLoaded || hasError) && (
        <div className="absolute inset-0">
          <Blurhash
            hash={blurhash}
            width="100%"
            height="100%"
            resolutionX={32}
            resolutionY={32}
            punch={1}
          />
        </div>
      )}

      {/* Actual image */}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`${className} transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            console.error(`Failed to load image: ${src}`);
          }}
          loading="lazy"
        />
      )}
    </div>
  );
}
