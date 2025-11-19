import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { createHash } from 'node:crypto';
import { getMediaStorage } from '../lib/media/storage';
import { processImageVariant } from '../lib/media/image-processing';
import { config } from '../env';

/**
 * Image variants endpoint: GET /img/:key
 * Serves images with on-demand resizing and caching
 */
const imageVariantsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: { '*': string };
    Querystring: {
      w?: string;
      h?: string;
      fit?: 'cover' | 'contain' | 'inside';
      format?: 'webp' | 'jpeg';
    };
  }>('/img/*', async (request, reply) => {
    const key = request.params['*'];
    const { w, h, fit = 'cover', format } = request.query;

    fastify.log.info(
      { key, w, h, fit, format },
      '[image-variants] Request received'
    );

    // Validate at least one dimension is provided
    if (!w && !h) {
      return reply
        .code(400)
        .send({ error: 'At least one of w or h is required' });
    }

    // Parse and validate dimensions
    const width = w ? parseInt(w, 10) : undefined;
    const height = h ? parseInt(h, 10) : undefined;

    if (
      (width && (isNaN(width) || width <= 0 || width > config.imageMaxWidth)) ||
      (height &&
        (isNaN(height) || height <= 0 || height > config.imageMaxHeight))
    ) {
      return reply.code(400).send({ error: 'Invalid dimensions' });
    }

    // Round dimensions to reduce variant proliferation
    const roundedWidth = width ? Math.round(width) : undefined;
    const roundedHeight = height ? Math.round(height) : undefined;

    // Generate variant key (hash of parameters)
    const variantKey = generateVariantKey({
      width: roundedWidth,
      height: roundedHeight,
      fit,
      format: format || config.imageFormat,
    });

    const storage = getMediaStorage();

    // Try to get existing variant
    let stream = await storage.getVariantStream(key, variantKey);

    if (stream) {
      // Variant exists, serve it
      const mimeType =
        (format || config.imageFormat) === 'webp' ? 'image/webp' : 'image/jpeg';
      reply.header('Content-Type', mimeType);
      reply.header('Cache-Control', 'public, max-age=31536000, immutable');
      reply.header('ETag', `"${key}-${variantKey}"`);
      return reply.send(stream);
    }

    // Variant doesn't exist, generate it
    try {
      // Get original image
      const originalStream = await storage.getOriginalStream(key);

      if (!originalStream) {
        // Original not found, redirect to placeholder
        return reply.redirect(307, '/static/placeholder.png');
      }

      // Read original to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of originalStream) {
        chunks.push(Buffer.from(chunk));
      }
      const originalBuffer = Buffer.concat(chunks);

      // Process variant
      const variant = await processImageVariant(originalBuffer, {
        width: roundedWidth,
        height: roundedHeight,
        fit,
        format: format || (config.imageFormat as 'webp' | 'jpeg'),
        quality: config.imageQuality,
      });

      // Save variant for future requests
      await storage.saveVariant({
        originalKey: key,
        variantKey,
        buffer: variant.buffer,
        mimeType: variant.mimeType,
      });

      // Serve the generated variant
      reply.header('Content-Type', variant.mimeType);
      reply.header('Cache-Control', 'public, max-age=31536000, immutable');
      reply.header('ETag', `"${key}-${variantKey}"`);
      return reply.send(variant.buffer);
    } catch (error) {
      fastify.log.error({ error, key }, 'Failed to generate image variant');
      return reply.redirect(307, '/static/placeholder.png');
    }
  });
};

/**
 * Generate variant key from parameters (deterministic hash)
 */
function generateVariantKey(params: {
  width?: number;
  height?: number;
  fit: string;
  format: string;
}): string {
  const str = `${params.width || 'auto'}x${params.height || 'auto'}-${params.fit}-${params.format}`;
  return createHash('sha256').update(str).digest('hex').substring(0, 16);
}

export default fp(imageVariantsPlugin, {
  name: 'image-variants',
});
