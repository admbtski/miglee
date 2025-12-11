import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/pino';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import { config } from '../../../env';
import { getMediaStorage } from '../../../lib/media/storage';
import {
  createMediaAssetFromUpload,
  buildMediaKey,
  deleteMediaAsset,
} from '../../../lib/media/media-service';
import type { MutationResolvers } from '../../__generated__/resolvers-types';

/**
 * Generate presigned upload URL or local upload endpoint
 */
export const getUploadUrl: MutationResolvers['getUploadUrl'] =
  resolverWithMetrics(
    'Mutation',
    'getUploadUrl',
    async (_parent, args, ctx) => {
      const { purpose, entityId } = args;

      // Check authentication
      if (!ctx.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      // Validate purpose and authorization
      const ownerId = await validateUploadPurpose(
        purpose,
        entityId,
        ctx.user.id
      );

      // Build storage key
      const key = buildMediaKey({ purpose, ownerId });

      // Get storage provider
      const storage = getMediaStorage();

      // For S3: Generate presigned URL directly to S3
      if (config.mediaStorageProvider === 'S3') {
        if (!storage.generatePresignedUploadUrl) {
          throw new GraphQLError(
            'S3 storage provider does not support presigned uploads',
            {
              extensions: { code: 'INTERNAL_SERVER_ERROR' },
            }
          );
        }

        const uploadKey = `tmp/uploads/${key.split('/').pop()}`; // Extract just the CUID part
        const result = await storage.generatePresignedUploadUrl({
          key: uploadKey,
          mimeType: 'image/webp', // We'll process to webp anyway
          maxSizeBytes: 10 * 1024 * 1024, // 10MB
        });

        return {
          uploadUrl: result.uploadUrl,
          uploadKey: uploadKey,
          provider: 'S3',
        };
      }

      // For LOCAL: Return local upload endpoint
      if (config.mediaStorageProvider === 'LOCAL') {
        const uploadKey = `tmp/uploads/${key.split('/').pop()}`; // Extract just the CUID part
        const baseUrl =
          config.assetsBaseUrl || `http://localhost:${config.port || 4000}`;
        const uploadUrl = `${baseUrl}/api/upload/local?uploadKey=${encodeURIComponent(uploadKey)}`;

        return {
          uploadUrl,
          uploadKey,
          provider: 'LOCAL',
        };
      }

      throw new GraphQLError(
        `Unsupported storage provider: ${config.mediaStorageProvider}`,
        {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        }
      );
    }
  );

/**
 * Confirm media upload and attach to entity
 */
export const confirmMediaUpload: MutationResolvers['confirmMediaUpload'] =
  resolverWithMetrics(
    'Mutation',
    'confirmMediaUpload',
    async (_parent, args, ctx) => {
      const { purpose, entityId, uploadKey } = args;

      // Check authentication
      if (!ctx.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      // Validate purpose and authorization
      const ownerId = await validateUploadPurpose(
        purpose,
        entityId,
        ctx.user.id
      );

      // For LOCAL storage, we need to read the uploaded file from uploadCache
      // For S3, the file is already uploaded, we need to fetch it
      const storage = getMediaStorage();
      let buffer: Buffer;

      // Check if this is a LOCAL upload (file on disk)
      if (config.mediaStorageProvider === 'LOCAL') {
        const fs = await import('fs/promises');
        const path = await import('path');

        const tmpPath = path.join(
          config.uploadsTmpPath,
          uploadKey.replace('tmp/uploads/', '')
        );

        ctx.request.log.info(
          { uploadKey, tmpPath },
          'Reading temp file from disk'
        );

        try {
          buffer = await fs.readFile(tmpPath);
          ctx.request.log.info(
            { uploadKey, size: buffer.length },
            'File read from disk'
          );
        } catch (error) {
          ctx.request.log.error(
            { uploadKey, tmpPath, error },
            'File not found on disk'
          );
          throw new GraphQLError('Uploaded file not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
      } else {
        // For S3, fetch from tmp/uploads location
        const stream = await storage.getOriginalStream(uploadKey);
        if (!stream) {
          throw new GraphQLError('Uploaded file not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // Read stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.from(chunk));
        }
        buffer = Buffer.concat(chunks);
      }

      // Create MediaAsset (this will process and save the image)
      ctx.request.log.info(
        { purpose, ownerId, bufferSize: buffer.length },
        'Creating MediaAsset'
      );

      const asset = await createMediaAssetFromUpload({
        ownerId,
        purpose,
        tempBuffer: buffer,
      });

      ctx.request.log.info(
        {
          assetId: asset.mediaAssetId,
          key: asset.key,
          blurhash: asset.blurhash,
        },
        'MediaAsset created'
      );

      // Update entity with new key
      ctx.request.log.info(
        { purpose, entityId, key: asset.key, userId: ctx.user.id },
        'Updating entity with media key'
      );

      await updateEntityWithMediaKey(purpose, entityId, asset.key, ctx.user.id);

      ctx.request.log.info(
        { purpose, entityId, key: asset.key },
        'Entity updated successfully'
      );

      // Delete temporary file
      if (config.mediaStorageProvider === 'LOCAL') {
        const fs = await import('fs/promises');
        const path = await import('path');
        const tmpPath = path.join(
          config.uploadsTmpPath,
          uploadKey.replace('tmp/uploads/', '')
        );

        try {
          await fs.unlink(tmpPath);
          ctx.request.log.info({ uploadKey, tmpPath }, 'Temp file deleted');
        } catch (error) {
          ctx.request.log.warn(
            { uploadKey, tmpPath, error },
            'Failed to delete temp file'
          );
        }
      } else {
        // For S3, delete temp object
        try {
          await storage.deleteOriginalAndVariants?.(uploadKey);
          ctx.request.log.info({ uploadKey }, 'Temp S3 object deleted');
        } catch (error) {
          ctx.request.log.warn(
            { uploadKey, error },
            'Failed to delete temp S3 object'
          );
        }
      }

      return {
        success: true,
        mediaKey: asset.key,
        mediaAssetId: asset.mediaAssetId,
      };
    }
  );

/**
 * Validate upload purpose and check authorization
 * Returns ownerId for the media asset
 */
async function validateUploadPurpose(
  purpose: string,
  entityId: string | null | undefined,
  userId: string
): Promise<string> {
  switch (purpose) {
    case 'USER_AVATAR': {
      // User can only upload their own avatar
      if (entityId && entityId !== userId) {
        throw new GraphQLError('Cannot upload avatar for another user', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      return userId;
    }

    case 'USER_COVER': {
      // User can only upload their own cover
      if (entityId && entityId !== userId) {
        throw new GraphQLError('Cannot upload cover for another user', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      return userId;
    }

    case 'EVENT_COVER': {
      if (!entityId) {
        throw new GraphQLError('entityId is required for EVENT_COVER', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Check if user is global admin first
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role === 'ADMIN') {
        // Global admin can upload cover for any event
        return entityId;
      }

      // Check if user is owner or moderator of the event
      const event = await prisma.event.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          ownerId: true,
          members: {
            where: {
              userId,
              role: { in: ['OWNER', 'MODERATOR'] },
            },
            select: { id: true },
          },
        },
      });

      if (!event) {
        throw new GraphQLError('Event not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const isOwnerOrMod = event.ownerId === userId || event.members.length > 0;
      if (!isOwnerOrMod) {
        throw new GraphQLError(
          'Only event owner, moderator, or admin can upload cover',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }

      return entityId;
    }

    default:
      throw new GraphQLError(`Unsupported purpose: ${purpose}`, {
        extensions: { code: 'BAD_USER_INPUT' },
      });
  }
}

/**
 * Update entity with new media key and delete old media
 */
async function updateEntityWithMediaKey(
  purpose: string,
  entityId: string | null | undefined,
  newKey: string,
  userId: string
): Promise<void> {
  logger.debug(
    { purpose, entityId, newKey, userId },
    'updateEntityWithMediaKey called'
  );

  switch (purpose) {
    case 'USER_AVATAR': {
      logger.debug('Handling USER_AVATAR');

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatarKey: true },
      });

      logger.debug({ userId, oldKey: user?.avatarKey }, 'Found user');

      const oldKey = user?.avatarKey;

      // Update user
      logger.debug({ newKey }, 'Updating user with newKey');
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { avatarKey: newKey },
      });

      logger.debug(
        { id: updated.id, avatarKey: updated.avatarKey },
        'User updated'
      );

      // Delete old media asset
      if (oldKey && oldKey !== newKey) {
        logger.debug({ oldKey }, 'Deleting old media asset');
        await deleteMediaAsset(oldKey).catch((err) => {
          logger.error({ err }, 'Failed to delete old avatar');
        });
      }
      break;
    }

    case 'USER_COVER': {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: { coverKey: true },
      });

      const oldKey = profile?.coverKey;

      // Upsert user profile
      await prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          coverKey: newKey,
        },
        update: {
          coverKey: newKey,
        },
      });

      // Delete old media asset
      if (oldKey && oldKey !== newKey) {
        await deleteMediaAsset(oldKey).catch((err) => {
          logger.error({ err }, 'Failed to delete old cover');
        });
      }
      break;
    }

    case 'EVENT_COVER': {
      if (!entityId) {
        throw new GraphQLError('entityId is required for EVENT_COVER', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const event = await prisma.event.findUnique({
        where: { id: entityId },
        select: { coverKey: true },
      });

      const oldKey = event?.coverKey;

      // Update event
      await prisma.event.update({
        where: { id: entityId },
        data: { coverKey: newKey },
      });

      // Delete old media asset
      if (oldKey && oldKey !== newKey) {
        await deleteMediaAsset(oldKey).catch((err) => {
          logger.error({ err }, 'Failed to delete old event cover');
        });
      }
      break;
    }
  }
}
