import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, rm, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { config } from '../../env';
import type { MediaStorage } from './storage';

/**
 * Local filesystem storage implementation
 * Structure:
 * - {UPLOADS_PATH}/original/{key}.webp
 * - {UPLOADS_PATH}/cache/{originalKey}/{variantKey}.webp
 */
export class LocalMediaStorage implements MediaStorage {
  private readonly basePath: string;
  private readonly baseUrl: string;

  constructor() {
    this.basePath = config.uploadsPath;
    // For local dev, assume we serve from /uploads on the same server
    this.baseUrl =
      config.assetsBaseUrl || `http://${config.host}:${config.port}`;
  }

  async saveOriginal(params: {
    key: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<{ key: string; url: string }> {
    const ext = this.getExtensionFromMimeType(params.mimeType);
    const filePath = join(this.basePath, 'original', `${params.key}${ext}`);

    await mkdir(dirname(filePath), { recursive: true });
    await pipeline(Readable.from(params.buffer), createWriteStream(filePath));

    return {
      key: params.key,
      url: `${this.baseUrl}/uploads/original/${params.key}${ext}`,
    };
  }

  async getOriginalStream(key: string): Promise<Readable | null> {
    // Try common extensions
    for (const ext of ['.webp', '.avif', '.jpg', '.jpeg', '.png']) {
      const filePath = join(this.basePath, 'original', `${key}${ext}`);
      try {
        await access(filePath);
        return createReadStream(filePath);
      } catch {
        // File doesn't exist, try next extension
      }
    }
    return null;
  }

  async saveVariant(params: {
    originalKey: string;
    variantKey: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<{ key: string; url: string }> {
    const ext = this.getExtensionFromMimeType(params.mimeType);
    const filePath = join(
      this.basePath,
      'cache',
      params.originalKey,
      `${params.variantKey}${ext}`
    );

    await mkdir(dirname(filePath), { recursive: true });
    await pipeline(Readable.from(params.buffer), createWriteStream(filePath));

    return {
      key: `${params.originalKey}/${params.variantKey}`,
      url: `${this.baseUrl}/uploads/cache/${params.originalKey}/${params.variantKey}${ext}`,
    };
  }

  async getVariantStream(
    originalKey: string,
    variantKey: string
  ): Promise<Readable | null> {
    // Try common extensions
    for (const ext of ['.webp', '.avif', '.jpg', '.jpeg', '.png']) {
      const filePath = join(
        this.basePath,
        'cache',
        originalKey,
        `${variantKey}${ext}`
      );
      try {
        await access(filePath);
        return createReadStream(filePath);
      } catch {
        // File doesn't exist, try next extension
      }
    }
    return null;
  }

  async deleteOriginalAndVariants(key: string): Promise<void> {
    // Delete original
    const originalDir = join(this.basePath, 'original');
    for (const ext of ['.webp', '.avif', '.jpg', '.jpeg', '.png']) {
      const filePath = join(originalDir, `${key}${ext}`);
      try {
        await rm(filePath, { force: true });
      } catch {
        // Ignore errors
      }
    }

    // Delete all variants
    const variantsDir = join(this.basePath, 'cache', key);
    try {
      await rm(variantsDir, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  }

  async generatePresignedUploadUrl(params: {
    key: string;
    mimeType: string;
    maxSizeBytes?: number;
  }): Promise<{ uploadUrl: string; key: string }> {
    // For local storage, we return a URL to our own upload endpoint
    // The actual upload will be handled by a Fastify route
    const uploadUrl = `${this.baseUrl}/api/upload/local?key=${encodeURIComponent(params.key)}&mimeType=${encodeURIComponent(params.mimeType)}`;

    return {
      uploadUrl,
      key: params.key,
    };
  }

  private getExtensionFromMimeType(mimeType: string): string {
    switch (mimeType) {
      case 'image/webp':
        return '.webp';
      case 'image/avif':
        return '.avif';
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      default:
        return '.webp';
    }
  }
}

// Singleton instance
let localStorageInstance: LocalMediaStorage | null = null;

export function getLocalMediaStorage(): LocalMediaStorage {
  if (!localStorageInstance) {
    localStorageInstance = new LocalMediaStorage();
  }
  return localStorageInstance;
}
