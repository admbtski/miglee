import * as v from 'valibot';

/**
 * Environment variables for the web application.
 *
 * In Next.js, environment variables prefixed with NEXT_PUBLIC_ are exposed to the browser.
 * Server-only variables (without prefix) are only available on the server side.
 *
 * This file validates all environment variables at build/runtime and provides
 * type-safe access throughout the application.
 */

// =============================================================================
// Schema Definition
// =============================================================================

/**
 * Client-side environment variables (NEXT_PUBLIC_*)
 * These are embedded at build time and available in the browser.
 */
const clientEnvSchema = v.object({
  NEXT_PUBLIC_API_URL: v.pipe(
    v.optional(v.string(), 'http://localhost:4000/graphql'),
    v.url('NEXT_PUBLIC_API_URL must be a valid URL')
  ),

  NEXT_PUBLIC_WS_URL: v.pipe(
    v.optional(v.string(), 'ws://localhost:4000/graphql'),
    v.check(
      (val) => val.startsWith('ws://') || val.startsWith('wss://'),
      'NEXT_PUBLIC_WS_URL must start with ws:// or wss://'
    )
  ),

  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: v.optional(v.string()),

  NEXT_PUBLIC_SITE_URL: v.pipe(
    v.optional(v.string(), 'https://appname.com'),
    v.url()
  ),

  // Google Analytics (optional)
  NEXT_PUBLIC_GA_MEASUREMENT_ID: v.optional(v.string()),
});

/**
 * Server-side environment variables
 * These are only available in Server Components and API routes.
 */
const serverEnvSchema = v.object({
  NODE_ENV: v.optional(
    v.picklist(['development', 'production', 'test']),
    'development'
  ),

  // Internal API URL for server-side requests (bypasses external load balancer)
  INTERNAL_API_URL: v.optional(v.pipe(v.string(), v.url())),

  // Port for Next.js server (default 3000)
  PORT: v.pipe(
    v.optional(v.string(), '3000'),
    v.transform((val) => Number(val))
  ),

  // Hostname for Next.js server
  HOSTNAME: v.optional(v.string(), '0.0.0.0'),
});

// Type definitions
type ClientEnv = v.InferOutput<typeof clientEnvSchema>;
type ServerEnv = v.InferOutput<typeof serverEnvSchema>;

// =============================================================================
// Runtime Validation
// =============================================================================

/**
 * Validates and parses client-side environment variables.
 * This can be called in both client and server contexts.
 */
function getClientEnv(): ClientEnv {
  const result = v.safeParse(clientEnvSchema, {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  });

  if (!result.success) {
    console.error(
      '❌ Invalid client environment variables:',
      v.flatten(result.issues)
    );

    // In development, throw to catch issues early
    if (process.env.NODE_ENV === 'development') {
      throw new Error('Invalid client environment variables');
    }

    // Fallback to defaults in production
    return {
      NEXT_PUBLIC_API_URL: 'http://localhost:4000/graphql',
      NEXT_PUBLIC_WS_URL: 'ws://localhost:4000/graphql',
      NEXT_PUBLIC_SITE_URL: 'https://appname.com',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: undefined,
      NEXT_PUBLIC_GA_MEASUREMENT_ID: undefined,
    };
  }

  return result.output;
}

/**
 * Validates and parses server-side environment variables.
 * This should only be called on the server.
 */
function getServerEnv(): ServerEnv {
  // Skip validation on client-side - return defaults
  if (typeof window !== 'undefined') {
    return {
      NODE_ENV: 'development',
      INTERNAL_API_URL: undefined,
      PORT: 3000,
      HOSTNAME: '0.0.0.0',
    };
  }

  const result = v.safeParse(serverEnvSchema, {
    NODE_ENV: process.env.NODE_ENV,
    INTERNAL_API_URL: process.env.INTERNAL_API_URL,
    PORT: process.env.PORT,
    HOSTNAME: process.env.HOSTNAME,
  });

  if (!result.success) {
    console.error(
      '❌ Invalid server environment variables:',
      v.flatten(result.issues)
    );

    if (process.env.NODE_ENV === 'development') {
      throw new Error('Invalid server environment variables');
    }

    // Fallback to defaults in production
    return {
      NODE_ENV: 'development',
      INTERNAL_API_URL: undefined,
      PORT: 3000,
      HOSTNAME: '0.0.0.0',
    };
  }

  return result.output;
}

// =============================================================================
// Exports
// =============================================================================

/**
 * Client-side environment variables.
 * Safe to use in both client and server contexts.
 */
export const clientEnv = getClientEnv();

/**
 * Server-side environment variables.
 * Only available in Server Components, API routes, and getServerSideProps.
 */
export const serverEnv = getServerEnv();

/**
 * Combined environment configuration with derived values.
 */
export const env = {
  // Client variables
  ...clientEnv,

  // Server variables
  ...serverEnv,

  // Derived values
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',

  // API URLs
  apiUrl: clientEnv.NEXT_PUBLIC_API_URL,
  wsUrl: clientEnv.NEXT_PUBLIC_WS_URL,
  apiBaseUrl: clientEnv.NEXT_PUBLIC_API_URL.replace(/\/graphql$/, ''),

  // Site
  siteUrl: clientEnv.NEXT_PUBLIC_SITE_URL,

  // Maps
  googleMapsApiKey: clientEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  hasGoogleMaps: Boolean(clientEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),

  // Analytics
  gaMeasurementId: clientEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  hasAnalytics: Boolean(clientEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID),
} as const;

/**
 * Type for the environment configuration.
 */
export type Env = typeof env;
