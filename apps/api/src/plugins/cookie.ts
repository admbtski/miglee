import cookie, { FastifyCookieOptions } from '@fastify/cookie';
import fastifyPlugin from 'fastify-plugin';
import { config, env } from '../env';

/**
 * Production-ready Cookie configuration
 * Provides secure cookie handling for both production and development
 */

// Extract domain from APP_URL for production cookie domain
const getCookieDomain = (): string | undefined => {
  if (!config.isProduction) return undefined;

  try {
    const url = new URL(config.appUrl);
    // Return domain without port, with leading dot for subdomain support
    const hostname = url.hostname;
    // Don't set domain for localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return undefined;
    }
    return hostname;
  } catch {
    return undefined;
  }
};

// Production cookie options - strict security
const productionCookieOptions: FastifyCookieOptions = {
  secret: config.jwtSecret,
  parseOptions: {
    // SameSite: Strict provides best CSRF protection
    // Use 'lax' if you need cookies sent on top-level navigations
    sameSite: 'lax',
    // HttpOnly prevents JavaScript access (XSS protection)
    httpOnly: true,
    // Secure ensures cookies only sent over HTTPS
    secure: true,
    // Path restricts cookie to specific path
    path: '/',
    // Domain for cross-subdomain cookie sharing (optional)
    domain: getCookieDomain(),
    // Max age in seconds (7 days default for session-like cookies)
    // Note: This is a default; individual cookies can override
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  hook: 'onRequest', // Parse cookies on every request
};

// Development cookie options - relaxed for easier development
const developmentCookieOptions: FastifyCookieOptions = {
  secret: config.jwtSecret,
  parseOptions: {
    // Lax allows cookies on navigations (easier for dev)
    sameSite: 'lax',
    // Keep httpOnly even in dev for realistic behavior
    httpOnly: true,
    // Allow HTTP in development
    secure: false,
    path: '/',
    // No domain restriction in development
    domain: undefined,
    // Shorter max age for development
    maxAge: 24 * 60 * 60, // 1 day
  },
  hook: 'onRequest',
};

export const cookiePlugin = fastifyPlugin(
  async (fastify) => {
    const options = config.isProduction
      ? productionCookieOptions
      : developmentCookieOptions;

    fastify.log.info(
      `Registering Cookie plugin with ${env.NODE_ENV} configuration`
    );

    await fastify.register(cookie, options);
  },
  {
    name: 'cookie-plugin',
  }
);
