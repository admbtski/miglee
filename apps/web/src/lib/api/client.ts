import { GraphQLClient } from 'graphql-request';
import { env } from '@/lib/env';
import { injectTraceHeaders } from '@appname/observability/browser';

export const gqlClient = new GraphQLClient(env.apiUrl, {
  credentials: 'include',
  mode: 'cors',
  // Inject trace headers into all GraphQL requests
  requestMiddleware: (request) => {
    // Inject trace headers by merging into existing headers
    // We modify in-place to avoid breaking the request object structure
    try {
      const traceHeaders = injectTraceHeaders(
        request.headers as Record<string, string>
      );

      if (request.headers && typeof request.headers === 'object') {
        Object.assign(request.headers, traceHeaders);
      }
    } catch (error) {
      // Silently fail if trace injection fails
      console.debug('[Observability] Failed to inject trace headers:', error);
    }

    // Return the modified request (not a copy!)
    return request;
  },
});
