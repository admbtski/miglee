/**
 * React Query Configuration with integrated logging and toast notifications
 */

import { QueryClient, MutationCache, QueryCache } from '@tanstack/react-query';
import { devLogger } from './dev-logger';
import { toast } from './toast-manager';

// Check if error is a network error
function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Network') ||
      error.message.includes('Failed to fetch')
    );
  }
  return false;
}

// Check if error is an auth error
function isAuthError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const err = error as any;
    return (
      err.status === 401 ||
      err.statusCode === 401 ||
      err.message?.includes('Unauthorized') ||
      err.message?.includes('Not authenticated')
    );
  }
  return false;
}

// Create QueryClient with integrated logging and toasts
export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        const queryKey = Array.from(query.queryKey);
        const startTime = query.state.dataUpdatedAt || Date.now();
        const duration = Date.now() - startTime;

        // Log error
        devLogger.queryError(queryKey, error, duration);

        // Show toast for specific errors
        if (isNetworkError(error)) {
          toast.networkError();
        } else if (isAuthError(error)) {
          // Don't show toast for auth errors - handled by auth system
          devLogger.authError(error);
        } else {
          // Show generic error toast for user-facing queries
          const queryName = Array.isArray(queryKey) ? queryKey[0] : 'data';
          if (typeof queryName === 'string' && !queryName.startsWith('_')) {
            // Skip internal queries (starting with _)
            toast.queryError(queryName, error, { silent: false });
          }
        }
      },
      onSuccess: (data, query) => {
        const queryKey = Array.from(query.queryKey);
        const startTime = (query.state as any).dataUpdatedAt || Date.now();
        const duration = Date.now() - startTime;

        // Log success (only in debug mode to avoid spam)
        if (
          typeof window !== 'undefined' &&
          localStorage.getItem('debug') === 'true'
        ) {
          devLogger.querySuccess(queryKey, data, duration);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, variables, _context, mutation) => {
        const mutationKey = (mutation.options as any).mutationKey || 'unknown';
        const startTime = (mutation.state as any).submittedAt || Date.now();
        const duration = Date.now() - startTime;

        // Log error
        devLogger.mutationError(mutationKey, error, variables, duration);

        // Show toast based on error type
        if (isNetworkError(error)) {
          toast.networkError();
        } else if (isAuthError(error)) {
          toast.permissionDenied('perform this action');
        } else {
          // Show generic error toast
          const actionName = Array.isArray(mutationKey)
            ? mutationKey[0]
            : mutationKey;
          toast.mutationError(String(actionName), error);
        }
      },
      onSuccess: (data, _variables, _context, mutation) => {
        const mutationKey = (mutation.options as any).mutationKey || 'unknown';
        const startTime = (mutation.state as any).submittedAt || Date.now();
        const duration = Date.now() - startTime;

        // Log success
        devLogger.mutationSuccess(mutationKey, data, duration);

        // Show success toast if mutation has a success message
        const meta = mutation.options.meta as any;
        if (meta?.successMessage) {
          toast.mutationSuccess(meta.successMessage, {
            logData: data,
          });
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: (failureCount, error) => {
          // Don't retry on auth errors
          if (isAuthError(error)) {
            return false;
          }
          // Retry network errors up to 2 times
          if (isNetworkError(error)) {
            return failureCount < 2;
          }
          // Retry other errors once
          return failureCount < 1;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false, // Don't retry mutations by default
        onError: (error) => {
          // Global mutation error handler
          devLogger.error('Mutation failed', {
            category: 'mutation',
            error,
          });
        },
      },
    },
  });
}

// Helper to create mutation with automatic toast
export function createMutationWithToast<TData, TVariables>(config: {
  mutationFn: (variables: TVariables) => Promise<TData>;
  mutationKey?: string[];
  successMessage?: string | ((data: TData, variables: TVariables) => string);
  errorMessage?: string | ((error: unknown, variables: TVariables) => string);
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: unknown, variables: TVariables) => void;
  invalidateQueries?: string[][];
  silent?: boolean;
}) {
  return {
    mutationFn: config.mutationFn,
    mutationKey: config.mutationKey,
    meta: {
      successMessage: config.successMessage,
      errorMessage: config.errorMessage,
      silent: config.silent,
    },
    onSuccess: (data: TData, variables: TVariables, _context: any) => {
      // Show success toast
      if (!config.silent && config.successMessage) {
        const message =
          typeof config.successMessage === 'function'
            ? config.successMessage(data, variables)
            : config.successMessage;
        toast.mutationSuccess(message);
      }

      // Call custom onSuccess
      config.onSuccess?.(data, variables);
    },
    onError: (error: unknown, variables: TVariables, _context: any) => {
      // Show error toast
      if (!config.silent && config.errorMessage) {
        const message =
          typeof config.errorMessage === 'function'
            ? config.errorMessage(error, variables)
            : config.errorMessage;
        toast.mutationError(message, error);
      }

      // Call custom onError
      config.onError?.(error, variables);
    },
  };
}

// Helper for optimistic updates with logging
export function createOptimisticUpdate<TData, TVariables>(config: {
  queryKey: string[];
  updater: (oldData: TData | undefined, variables: TVariables) => TData;
  onError?: (
    error: unknown,
    variables: TVariables,
    context: { previousData?: TData }
  ) => void;
}) {
  return {
    onMutate: async (variables: TVariables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: config.queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData>(config.queryKey);

      // Optimistically update
      queryClient.setQueryData<TData>(config.queryKey, (old) =>
        config.updater(old, variables)
      );

      // Log optimistic update
      devLogger.cacheUpdated(config.queryKey, variables);

      return { previousData };
    },
    onError: (
      error: unknown,
      variables: TVariables,
      context: { previousData?: TData }
    ) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(config.queryKey, context.previousData);
        devLogger.warning('Optimistic update rolled back', {
          category: 'cache',
          data: { queryKey: config.queryKey, error },
        });
      }

      config.onError?.(error, variables, context);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: config.queryKey });
      devLogger.cacheInvalidated(config.queryKey);
    },
  };
}

// Global query client instance
export const queryClient = createQueryClient();

// Export for window access
if (typeof window !== 'undefined') {
  (window as any).queryClient = queryClient;
}
