/**
 * Media URL helpers for building image variant URLs
 */

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type CoverVariant = 'card' | 'detail';

// Get API base URL (without /graphql)
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql'
).replace(/\/graphql$/, '');

const AVATAR_PRESETS: Record<AvatarSize, { w: number; h: number }> = {
  sm: { w: 64, h: 64 },
  md: { w: 96, h: 96 },
  lg: { w: 160, h: 160 },
  xl: { w: 256, h: 256 },
};

const COVER_PRESETS: Record<CoverVariant, { w: number; h: number }> = {
  card: { w: 480, h: 270 }, // ~16:9
  detail: { w: 1280, h: 720 },
};

/**
 * Build avatar URL from avatarKey with size preset
 */
export function buildAvatarUrl(
  avatarKey: string | null | undefined,
  size: AvatarSize = 'md'
): string | null {
  if (!avatarKey) return null;
  const { w, h } = AVATAR_PRESETS[size];
  return `${API_BASE_URL}/img/${avatarKey}?w=${w}&h=${h}&fit=cover`;
}

/**
 * Build user cover URL from coverKey with variant preset
 */
export function buildUserCoverUrl(
  coverKey: string | null | undefined,
  variant: CoverVariant = 'detail'
): string | null {
  if (!coverKey) return null;
  const { w, h } = COVER_PRESETS[variant];
  return `${API_BASE_URL}/img/${coverKey}?w=${w}&h=${h}&fit=cover`;
}

/**
 * Build intent cover URL from coverKey with variant preset
 */
export function buildIntentCoverUrl(
  coverKey: string | null | undefined,
  variant: CoverVariant = 'card'
): string | null {
  if (!coverKey) return null;
  const { w, h } = COVER_PRESETS[variant];
  return `${API_BASE_URL}/img/${coverKey}?w=${w}&h=${h}&fit=cover`;
}

/**
 * Build custom image URL with specific dimensions
 */
export function buildImageUrl(
  key: string | null | undefined,
  params: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'inside';
    format?: 'webp' | 'jpeg';
  }
): string | null {
  if (!key) return null;

  const queryParams = new URLSearchParams();
  if (params.width) queryParams.set('w', params.width.toString());
  if (params.height) queryParams.set('h', params.height.toString());
  if (params.fit) queryParams.set('fit', params.fit);
  if (params.format) queryParams.set('format', params.format);

  return `${API_BASE_URL}/img/${key}?${queryParams.toString()}`;
}
