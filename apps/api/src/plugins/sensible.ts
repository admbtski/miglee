import sensible from '@fastify/sensible';
import fastifyPlugin from 'fastify-plugin';
import { config, env } from '../env';

/**
 * Production-ready Sensible plugin configuration
 * Provides HTTP errors, assertions, and utility decorators
 */

export const sensiblePlugin = fastifyPlugin(
  async (fastify) => {
    fastify.log.info(
      `Registering Sensible plugin with ${env.NODE_ENV} configuration`
    );

    await fastify.register(sensible);

    // Add custom error formatting based on environment
    fastify.setErrorHandler((error, request, reply) => {
      // Log the error
      request.log.error(
        {
          err: error,
          requestId: request.id,
          url: request.url,
          method: request.method,
        },
        'Request error'
      );

      // Determine status code
      const statusCode = error.statusCode ?? 500;

      // Production: hide internal error details
      if (config.isProduction && statusCode >= 500) {
        return reply.status(statusCode).send({
          statusCode,
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        });
      }

      // Development or client errors: show full details
      return reply.status(statusCode).send({
        statusCode,
        error: error.name || 'Error',
        message: error.message,
        ...(config.isDevelopment && {
          stack: error.stack,
          validation: error.validation,
        }),
      });
    });
  },
  {
    name: 'sensible-plugin',
  }
);
