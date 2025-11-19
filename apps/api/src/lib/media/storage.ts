import { Readable } from 'node:stream';
import { config } from '../../env';
import { getLocalMediaStorage } from './local-storage';
import { getS3MediaStorage } from './s3-storage';

/**
 * Unified interface for media storage (local filesystem or S3)
 */
export interface MediaStorage {
  /**
   * Save original image
   */
  saveOriginal(params: {
    key: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<{ key: string; url: string }>;

  /**
   * Get original image as stream
   */
  getOriginalStream(key: string): Promise<Readable | null>;

  /**
   * Save image variant (resized/processed version)
   */
  saveVariant(params: {
    originalKey: string;
    variantKey: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<{ key: string; url: string }>;

  /**
   * Get variant image as stream
   */
  getVariantStream(
    originalKey: string,
    variantKey: string
  ): Promise<Readable | null>;

  /**
   * Delete original and all its variants
   */
  deleteOriginalAndVariants?(key: string): Promise<void>;

  /**
   * Generate presigned upload URL (for S3) or local upload endpoint
   */
  generatePresignedUploadUrl?(params: {
    key: string;
    mimeType: string;
    maxSizeBytes?: number;
  }): Promise<{ uploadUrl: string; key: string }>;
}

/**
 * Factory function to get the configured storage provider
 */
export function getMediaStorage(): MediaStorage {
  switch (config.mediaStorageProvider) {
    case 'S3':
      return getS3MediaStorage();
    case 'LOCAL':
    default:
      return getLocalMediaStorage();
  }
}
