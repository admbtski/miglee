import type { FastifyPluginAsync } from 'fastify';
import multipart from '@fastify/multipart';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../env';
import { rateLimitPresets } from './rate-limit';

/**
 * Local upload endpoint for development/testing
 * Accepts file uploads and stores them temporarily on disk
 */
export const localUploadPlugin: FastifyPluginAsync = async (fastify) => {
  // Register multipart support if not already registered
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1,
    },
  });

  fastify.post(
    '/api/upload/local',
    {
      config: {
        rateLimit: rateLimitPresets.upload, // Strict limit for expensive I/O operations
      },
    },
    async (request, reply) => {
      const { uploadKey } = request.query as {
        uploadKey?: string;
      };

      if (!uploadKey) {
        return reply.code(400).send({ error: 'Missing uploadKey parameter' });
      }

      try {
        // Get the uploaded file
        const data = await request.file();

        if (!data) {
          return reply.code(400).send({ error: 'No file uploaded' });
        }

        // Validate MIME type
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/avif',
        ];
        if (!allowedTypes.includes(data.mimetype)) {
          return reply.code(400).send({
            error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
          });
        }

        // Read file buffer
        const buffer = await data.toBuffer();

        // Save to disk in tmp directory
        const tmpPath = path.join(
          config.uploadsTmpPath,
          uploadKey.replace('tmp/uploads/', '')
        );

        // Ensure directory exists
        await fs.mkdir(path.dirname(tmpPath), { recursive: true });

        // Write file
        await fs.writeFile(tmpPath, buffer);

        fastify.log.info(
          { uploadKey, tmpPath, size: buffer.length },
          'File saved to disk'
        );

        return reply.code(200).send({
          success: true,
          uploadKey,
          size: buffer.length,
        });
      } catch (error) {
        fastify.log.error({ error, uploadKey }, 'Local upload failed');
        return reply.code(500).send({
          error: 'Upload failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
};
