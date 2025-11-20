import { QueryClient, QueryClientConfig } from '@tanstack/react-query';
import { createQueryClient as createQueryClientWithLogging } from '@/lib/utils/react-query-config';

// Safe SSR environment detection
const isServer = typeof window === 'undefined';

// const _DEFAULT_STALE_TIME = 60 * 1000;

function createQueryClient(_config?: QueryClientConfig): QueryClient {
  // Use our enhanced query client with logging and toast
  return createQueryClientWithLogging();
}

let browserQueryClient: QueryClient | undefined;

/**
 * Returns a QueryClient instance:
 * - A new one on the server (per request).
 * - A singleton in the browser (persisted across renders).
 *
 * Note: This function does not handle hydration.
 * Use `dehydrate` / `hydrate` from @tanstack/react-query for SSR state transfer.
 */
export function getQueryClient(config?: QueryClientConfig): QueryClient {
  if (isServer) {
    return createQueryClient(config);
  }

  if (!browserQueryClient) {
    browserQueryClient = createQueryClient(config);
  }

  return browserQueryClient;
}

/**
 * Resets the singleton QueryClient instance.
 * Useful in testing environments.
 */
export function resetQueryClient(): void {
  browserQueryClient = undefined;
}

/**
 * Creates a brand new QueryClient instance without touching the singleton.
 * Useful for isolated tests or special cases.
 */
export function newTestQueryClient(config?: QueryClientConfig): QueryClient {
  return createQueryClient(config);
}
