import compress from '@fastify/compress';
import fastifyPlugin from 'fastify-plugin';
import { constants } from 'zlib';
import { config } from '../env';

/**
 * Compression plugin - gzip/brotli for responses
 *
 * Features:
 * - Brotli compression (better compression than gzip, supported by modern browsers)
 * - Gzip fallback for older browsers
 * - Smart threshold - only compress responses > 1KB
 * - GraphQL response optimization
 */
export const compressionPlugin = fastifyPlugin(async (fastify) => {
  await fastify.register(compress, {
    // Brotli for modern browsers, gzip for fallback
    encodings: ['br', 'gzip', 'deflate'],

    // Only compress responses larger than 1KB (1024 bytes)
    // Smaller responses may actually get bigger with compression overhead
    threshold: 1024,

    // Brotli quality (0-11, higher = better compression but slower)
    // Production: 4 (balanced)
    // Development: 1 (fast)
    brotliOptions: {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: config.isProduction ? 4 : 1,
      },
    },

    // Gzip compression level (0-9, higher = better compression but slower)
    // Production: 6 (default, balanced)
    // Development: 1 (fast)
    zlibOptions: {
      level: config.isProduction ? 6 : 1,
    },

    // Custom filter - which routes to compress
    customTypes: /^(text\/|application\/(json|graphql|javascript|xml))/,

    // Don't compress if already compressed or if Content-Encoding is set
    removeContentLengthHeader: false,
  });

  fastify.log.info(
    {
      brotli: config.isProduction ? 'quality=4' : 'quality=1',
      gzip: config.isProduction ? 'level=6' : 'level=1',
      threshold: '1KB',
    },
    'Compression plugin registered'
  );
});
