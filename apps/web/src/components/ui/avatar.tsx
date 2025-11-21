/**
 * Reusable Avatar component with BlurHash support
 */

import { INTENTS_CONFIG } from '@/lib/constants/intents';
import { BlurHashImage } from './blurhash-image';

export interface AvatarProps {
  url?: string | null;
  blurhash?: string | null;
  alt: string;
  size?: number;
  className?: string;
}

/**
 * Avatar component with fallback image and BlurHash placeholder
 */
export function Avatar({
  url,
  blurhash,
  alt,
  size = 48,
  className = '',
}: AvatarProps) {
  const sizeClass = `w-${Math.floor(size / 4)} h-${Math.floor(size / 4)}`;
  const finalUrl = url || INTENTS_CONFIG.FALLBACK_AVATAR;

  return (
    <BlurHashImage
      src={finalUrl}
      blurhash={blurhash}
      alt={alt}
      width={size}
      height={size}
      className={`object-cover rounded-full border border-zinc-200 dark:border-zinc-700 ${sizeClass} ${className}`}
    />
  );
}
