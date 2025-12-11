import helmet, { FastifyHelmetOptions } from '@fastify/helmet';
import fastifyPlugin from 'fastify-plugin';
import { config, env } from '../env';

/**
 * Production-ready Helmet configuration
 * Provides security headers for both production and development environments
 */

// Helper to get allowed origins from config
const getAllowedOrigins = (): string[] => {
  const origins: string[] = ["'self'"];

  // Add configured CORS origins
  if (config.corsOrigins && config.corsOrigins.length > 0) {
    config.corsOrigins.forEach((origin) => {
      if (origin !== '*') {
        origins.push(origin);
      }
    });
  }

  // Add app and API URLs
  if (config.appUrl) origins.push(config.appUrl);
  if (config.apiUrl) origins.push(config.apiUrl);

  // Add CDN URL if enabled
  if (config.cdnEnabled && config.cdnBaseUrl) {
    origins.push(config.cdnBaseUrl);
  }

  // Add assets base URL
  if (config.assetsBaseUrl) {
    origins.push(config.assetsBaseUrl);
  }

  // Remove duplicates and filter empty values
  return [...new Set(origins.filter(Boolean))];
};

// Production CSP configuration - strict security
const productionCSP = {
  useDefaults: false,
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'img-src': [...getAllowedOrigins(), 'data:', 'blob:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': [...getAllowedOrigins(), 'wss:', 'ws:'], // WebSocket support
    'media-src': [...getAllowedOrigins(), 'blob:'],
    'object-src': ["'none'"],
    'frame-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
    'child-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'upgrade-insecure-requests': [],
  },
};

// Development CSP configuration - relaxed for hot-reload and debugging
const developmentCSP = {
  useDefaults: false,
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts for HMR
    'style-src': ["'self'", "'unsafe-inline'"], // Allow inline styles for dev
    'img-src': ["'self'", 'data:', 'blob:', 'http:', 'https:'],
    'font-src': ["'self'", 'data:', 'http:', 'https:'],
    'connect-src': ["'self'", 'ws:', 'wss:', 'http:', 'https:'], // Allow all connections for dev
    'media-src': ["'self'", 'blob:', 'http:', 'https:'],
    'object-src': ["'none'"],
    'frame-src': ["'self'"],
    'frame-ancestors': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
    'child-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
  },
};

// Production helmet options
const productionOptions: FastifyHelmetOptions = {
  contentSecurityPolicy: productionCSP,

  // HSTS - enforce HTTPS for 1 year, include subdomains
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },

  // Prevent clickjacking
  frameguard: {
    action: 'deny',
  },

  // Prevent MIME type sniffing
  noSniff: true,

  // Control referrer information
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // Disable DNS prefetching
  dnsPrefetchControl: {
    allow: false,
  },

  // IE-specific download protection
  ieNoOpen: true,

  // Prevent Adobe Flash and PDF cross-domain requests
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },

  // Cross-origin policies for enhanced isolation
  crossOriginEmbedderPolicy: false, // May break external images - enable if fully isolated
  crossOriginOpenerPolicy: {
    policy: 'same-origin',
  },
  crossOriginResourcePolicy: {
    policy: 'same-origin',
  },

  // Hide X-Powered-By header (Fastify already does this, but for safety)
  hidePoweredBy: true,

  // Origin-Agent-Cluster header for process isolation
  originAgentCluster: true,

  // X-XSS-Protection (deprecated but still useful for older browsers)
  xssFilter: true,
};

// Development helmet options - relaxed but still secure
const developmentOptions: FastifyHelmetOptions = {
  contentSecurityPolicy: developmentCSP,

  // Disable HSTS in development (using HTTP locally)
  strictTransportSecurity: false,

  // Allow iframes in development for debugging tools
  frameguard: {
    action: 'sameorigin',
  },

  // Keep these enabled even in development
  noSniff: true,

  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  dnsPrefetchControl: {
    allow: true, // Allow in dev for faster loading
  },

  ieNoOpen: true,

  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },

  // Relaxed cross-origin policies for development
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,

  hidePoweredBy: true,
  originAgentCluster: true,
  xssFilter: true,
};

export const helmetPlugin = fastifyPlugin(
  async (fastify) => {
    const options = config.isProduction
      ? productionOptions
      : developmentOptions;

    fastify.log.info(
      `Registering Helmet plugin with ${env.NODE_ENV} configuration`
    );

    await fastify.register(helmet, options);
  },
  {
    name: 'helmet-plugin',
  }
);
