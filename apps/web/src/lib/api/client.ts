import { GraphQLClient } from 'graphql-request';
import { env } from '@/lib/env';
import { injectTraceHeaders } from '@appname/observability/browser';

export const gqlClient = new GraphQLClient(env.apiUrl, {
  credentials: 'include',
  mode: 'cors',
  // Inject trace headers into all GraphQL requests
  requestMiddleware: (request) => {
    const headers = injectTraceHeaders(
      request.headers as Record<string, string>
    );
    return {
      ...request,
      headers,
    };
  },
});
