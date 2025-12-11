import cors, { FastifyCorsOptions } from '@fastify/cors';
import fastifyPlugin from 'fastify-plugin';
import { config, env } from '../env';
import { buildCorsChecker } from '../lib/cors';

/**
 * Production-ready CORS configuration
 * Provides secure cross-origin resource sharing for both production and development
 */

// Allowed HTTP methods
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

// Allowed request headers
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
  'Cache-Control',
  'X-Request-Id',
];

// Headers exposed to the client
const EXPOSED_HEADERS = [
  'Content-Length',
  'Content-Type',
  'X-Request-Id',
  'X-RateLimit-Limit',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
];

// Create origin checker based on environment
const allowOrigin = buildCorsChecker(
  config.corsOrigins.join(','),
  config.isDevelopment
);

// Production CORS options - strict security
const productionCorsOptions: FastifyCorsOptions = {
  origin: (origin, callback) => {
    try {
      if (allowOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`), false);
      }
    } catch (error) {
      callback(error as Error, false);
    }
  },
  credentials: true,
  methods: ALLOWED_METHODS,
  allowedHeaders: ALLOWED_HEADERS,
  exposedHeaders: EXPOSED_HEADERS,
  maxAge: 86400, // 24 hours - cache preflight requests
  preflight: true,
  strictPreflight: true,
  hideOptionsRoute: true,
};

// Development CORS options - more permissive for easier development
const developmentCorsOptions: FastifyCorsOptions = {
  origin: (origin, callback) => {
    try {
      // In development, allow all origins but still log for debugging
      if (allowOrigin(origin)) {
        callback(null, true);
      } else {
        // In dev mode, still allow but with a warning
        callback(null, true);
      }
    } catch (error) {
      callback(error as Error, false);
    }
  },
  credentials: true,
  methods: ALLOWED_METHODS,
  allowedHeaders: [...ALLOWED_HEADERS, '*'], // Allow any header in dev
  exposedHeaders: EXPOSED_HEADERS,
  maxAge: 600, // 10 minutes - shorter cache for development
  preflight: true,
  strictPreflight: false, // Less strict in development
  hideOptionsRoute: false, // Show OPTIONS routes in dev for debugging
};

export const corsPlugin = fastifyPlugin(
  async (fastify) => {
    const options = config.isProduction
      ? productionCorsOptions
      : developmentCorsOptions;

    fastify.log.info(
      `Registering CORS plugin with ${env.NODE_ENV} configuration`
    );

    if (config.isProduction) {
      fastify.log.info(
        `Allowed CORS origins: ${config.corsOrigins.join(', ')}`
      );
    }

    await fastify.register(cors, options);
  },
  {
    name: 'cors-plugin',
  }
);
