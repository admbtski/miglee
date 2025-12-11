import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'node:stream';
import { config } from '../../env';
import type { MediaStorage } from './storage';

/**
 * S3-compatible storage implementation (AWS S3, Cloudflare R2, MinIO, etc.)
 */
export class S3MediaStorage implements MediaStorage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly baseUrl: string;

  constructor() {
    if (!config.s3Bucket || !config.s3Region) {
      throw new Error(
        'S3_BUCKET and S3_REGION are required when MEDIA_STORAGE_PROVIDER=S3'
      );
    }

    this.bucket = config.s3Bucket;

    // Initialize S3 client
    this.client = new S3Client({
      region: config.s3Region,
      endpoint: config.s3Endpoint,
      credentials:
        config.s3AccessKeyId && config.s3SecretAccessKey
          ? {
              accessKeyId: config.s3AccessKeyId,
              secretAccessKey: config.s3SecretAccessKey,
            }
          : undefined,
    });

    // Determine base URL for public access
    if (config.cdnEnabled && config.cdnBaseUrl) {
      this.baseUrl = config.cdnBaseUrl;
    } else if (config.assetsBaseUrl) {
      this.baseUrl = config.assetsBaseUrl;
    } else if (config.s3Endpoint) {
      this.baseUrl = `${config.s3Endpoint}/${this.bucket}`;
    } else {
      this.baseUrl = `https://${this.bucket}.s3.${config.s3Region}.amazonaws.com`;
    }
  }

  async saveOriginal(params: {
    key: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<{ key: string; url: string }> {
    const s3Key = `original/${params.key}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: params.buffer,
        ContentType: params.mimeType,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    return {
      key: params.key,
      url: `${this.baseUrl}/${s3Key}`,
    };
  }

  async getOriginalStream(key: string): Promise<Readable | null> {
    const s3Key = `original/${key}`;

    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: s3Key,
        })
      );

      if (response.Body instanceof Readable) {
        return response.Body;
      }

      // Convert other types to Readable
      // AWS SDK v3 Body type is complex union - cast required
      if (response.Body) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Readable.from(response.Body as any);
      }

      return null;
    } catch (error: unknown) {
      const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async saveVariant(params: {
    originalKey: string;
    variantKey: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<{ key: string; url: string }> {
    const s3Key = `variants/${params.originalKey}/${params.variantKey}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: params.buffer,
        ContentType: params.mimeType,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    return {
      key: `${params.originalKey}/${params.variantKey}`,
      url: `${this.baseUrl}/${s3Key}`,
    };
  }

  async getVariantStream(
    originalKey: string,
    variantKey: string
  ): Promise<Readable | null> {
    const s3Key = `variants/${originalKey}/${variantKey}`;

    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: s3Key,
        })
      );

      if (response.Body instanceof Readable) {
        return response.Body;
      }

      // AWS SDK v3 Body type is complex union - cast required
      if (response.Body) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Readable.from(response.Body as any);
      }

      return null;
    } catch (error: unknown) {
      const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async deleteOriginalAndVariants(key: string): Promise<void> {
    // Delete original
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: `original/${key}`,
        })
      );
    } catch {
      // Ignore errors
    }

    // List and delete all variants
    try {
      const listResponse = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: `variants/${key}/`,
        })
      );

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        await this.client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: {
              Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key! })),
            },
          })
        );
      }
    } catch {
      // Ignore errors
    }
  }

  async generatePresignedUploadUrl(params: {
    key: string;
    mimeType: string;
    maxSizeBytes?: number;
  }): Promise<{ uploadUrl: string; key: string }> {
    const s3Key = `original/${params.key}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
      ContentType: params.mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    // Generate presigned URL valid for 15 minutes
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: 900, // 15 minutes
    });

    return {
      uploadUrl,
      key: params.key,
    };
  }
}

// Singleton instance
let s3StorageInstance: S3MediaStorage | null = null;

export function getS3MediaStorage(): S3MediaStorage {
  if (!s3StorageInstance) {
    s3StorageInstance = new S3MediaStorage();
  }
  return s3StorageInstance;
}
