import { createId } from '@paralleldrive/cuid2';
import { prisma } from '../prisma';
import { config } from '../../env';
import { getMediaStorage } from './storage';
import { processOriginalImage, validateImage } from './image-processing';

export type MediaPurpose =
  | 'USER_AVATAR'
  | 'USER_COVER'
  | 'EVENT_COVER'
  | 'GALLERY_IMAGE';

/**
 * Build storage key for media asset based on purpose and owner
 */
export function buildMediaKey(params: {
  purpose: MediaPurpose;
  ownerId?: string | null;
}): string {
  const id = createId();

  switch (params.purpose) {
    case 'USER_AVATAR':
      return `avatars/${params.ownerId || 'unknown'}/${id}`;
    case 'USER_COVER':
      return `covers/users/${params.ownerId || 'unknown'}/${id}`;
    case 'EVENT_COVER':
      return `covers/events/${params.ownerId || 'unknown'}/${id}`;
    case 'GALLERY_IMAGE':
      return `gallery/${params.ownerId || 'unknown'}/${id}`;
    default:
      return `media/${params.ownerId || 'unknown'}/${id}`;
  }
}

/**
 * Create MediaAsset from uploaded file buffer
 */
export async function createMediaAssetFromUpload(params: {
  ownerId?: string | null;
  purpose: MediaPurpose;
  tempBuffer: Buffer;
}): Promise<{
  mediaAssetId: string;
  key: string;
  blurhash: string | null;
  width: number;
  height: number;
}> {
  // Validate image
  const isValid = await validateImage(params.tempBuffer);
  if (!isValid) {
    throw new Error('Invalid image file');
  }

  const storage = getMediaStorage();

  // Process original image
  const processed = await processOriginalImage(params.tempBuffer, {
    maxWidth: config.imageMaxWidth,
    maxHeight: config.imageMaxHeight,
    format: config.imageFormat as 'webp' | 'avif',
    quality: config.imageQuality,
  });

  // Build storage key
  const key = buildMediaKey({
    purpose: params.purpose,
    ownerId: params.ownerId,
  });

  // Save to storage
  await storage.saveOriginal({
    key,
    buffer: processed.buffer,
    mimeType: processed.mimeType,
  });

  // Create MediaAsset record
  const asset = await prisma.mediaAsset.create({
    data: {
      key,
      blurhash: processed.blurhash,
      width: processed.width,
      height: processed.height,
      mimeType: processed.mimeType,
      ownerId: params.ownerId ?? null,
      purpose: params.purpose,
    },
  });

  return {
    mediaAssetId: asset.id,
    key: asset.key,
    blurhash: asset.blurhash,
    width: asset.width || 0,
    height: asset.height || 0,
  };
}

/**
 * Delete media asset and its storage files
 */
export async function deleteMediaAsset(key: string): Promise<void> {
  const storage = getMediaStorage();

  // Delete from storage (original + variants)
  if (storage.deleteOriginalAndVariants) {
    await storage.deleteOriginalAndVariants(key);
  }

  // Delete from database
  await prisma.mediaAsset.deleteMany({
    where: { key },
  });
}

/**
 * Get MediaAsset by key
 */
export async function getMediaAssetByKey(key: string) {
  return prisma.mediaAsset.findUnique({
    where: { key },
  });
}

/**
 * Find orphaned media assets (not referenced by any user/event)
 */
export async function findOrphanedMediaAssets(olderThanDays: number = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  // Get all media assets older than cutoff
  const allAssets = await prisma.mediaAsset.findMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
    select: {
      id: true,
      key: true,
      purpose: true,
      ownerId: true,
    },
  });

  const orphaned: typeof allAssets = [];

  for (const asset of allAssets) {
    let isOrphaned = false;

    switch (asset.purpose) {
      case 'USER_AVATAR': {
        // Check if any user has this avatarKey
        const userCount = await prisma.user.count({
          where: { avatarKey: asset.key },
        });
        isOrphaned = userCount === 0;
        break;
      }
      case 'USER_COVER': {
        // Check if any userProfile has this coverKey
        const profileCount = await prisma.userProfile.count({
          where: { coverKey: asset.key },
        });
        isOrphaned = profileCount === 0;
        break;
      }
      case 'EVENT_COVER': {
        // Check if any event has this coverKey
        const eventCount = await prisma.event.count({
          where: { coverKey: asset.key },
        });
        isOrphaned = eventCount === 0;
        break;
      }
      default:
        // For other purposes, consider orphaned if no explicit reference
        isOrphaned = true;
    }

    if (isOrphaned) {
      orphaned.push(asset);
    }
  }

  return orphaned;
}
