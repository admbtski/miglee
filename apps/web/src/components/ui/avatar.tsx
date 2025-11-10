/**
 * Reusable Avatar component
 */

import { INTENTS_CONFIG } from '@/lib/constants/intents';

export interface AvatarProps {
  url?: string | null;
  alt: string;
  size?: number;
  className?: string;
}

/**
 * Avatar component with fallback image
 */
export function Avatar({ url, alt, size = 48, className = '' }: AvatarProps) {
  const sizeClass = `w-${Math.floor(size / 4)} h-${Math.floor(size / 4)}`;

  return (
    <img
      src={url || INTENTS_CONFIG.FALLBACK_AVATAR}
      alt={alt}
      className={`object-cover rounded-full border border-neutral-200 dark:border-neutral-700 ${sizeClass} ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      loading="lazy"
      decoding="async"
    />
  );
}
