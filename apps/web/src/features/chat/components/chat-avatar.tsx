/**
 * Chat Avatar - wrapper for Avatar component with token support
 */

import { Avatar as BaseAvatar } from '@/components/ui/avatar';
import { buildAvatarUrl } from '@/lib/media/url';

interface ChatAvatarProps {
  token?: string | null;
  alt?: string;
  size?: number;
  className?: string;
}

export function Avatar({ token, alt = 'Avatar', size, className }: ChatAvatarProps) {
  const url = token ? buildAvatarUrl(token) : null;
  
  return (
    <BaseAvatar
      url={url}
      alt={alt}
      size={size}
      className={className}
    />
  );
}

