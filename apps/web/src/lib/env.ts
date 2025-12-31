import { z } from 'zod';

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
const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url('NEXT_PUBLIC_API_URL must be a valid URL')
    .default('http://localhost:4000/graphql'),

  NEXT_PUBLIC_WS_URL: z
    .string()
    .default('ws://localhost:4000/graphql')
    .refine(
      (val) => val.startsWith('ws://') || val.startsWith('wss://'),
      'NEXT_PUBLIC_WS_URL must start with ws:// or wss://'
    ),

  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),

  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://appname.com'),

  // Google Analytics (optional)
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
});

/**
 * Server-side environment variables
 * These are only available in Server Components and API routes.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Internal API URL for server-side requests (bypasses external load balancer)
  INTERNAL_API_URL: z.string().url().optional(),

  // Port for Next.js server (default 3000)
  PORT: z.coerce.number().default(3000),

  // Hostname for Next.js server
  HOSTNAME: z.string().default('0.0.0.0'),
});

// =============================================================================
// Runtime Validation
// =============================================================================

/**
 * Validates and parses client-side environment variables.
 * This can be called in both client and server contexts.
 */
function getClientEnv() {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  });

  if (!parsed.success) {
    console.error(
      '❌ Invalid client environment variables:',
      parsed.error.flatten().fieldErrors
    );

    // In development, throw to catch issues early
    if (process.env.NODE_ENV === 'development') {
      throw new Error('Invalid client environment variables');
    }
  }

  return parsed.data!;
}

/**
 * Validates and parses server-side environment variables.
 * This should only be called on the server.
 */
function getServerEnv() {
  // Skip validation on client-side
  if (typeof window !== 'undefined') {
    return {} as z.infer<typeof serverEnvSchema>;
  }

  const parsed = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    INTERNAL_API_URL: process.env.INTERNAL_API_URL,
    PORT: process.env.PORT,
    HOSTNAME: process.env.HOSTNAME,
  });

  if (!parsed.success) {
    console.error(
      '❌ Invalid server environment variables:',
      parsed.error.flatten().fieldErrors
    );

    if (process.env.NODE_ENV === 'development') {
      throw new Error('Invalid server environment variables');
    }
  }

  return parsed.data!;
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

  // Server variables (will be empty object on client)
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

