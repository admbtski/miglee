/**
 * GraphQL/Mercurius Tracing Utilities
 *
 * Provides custom span creation for GraphQL operations and resolvers.
 * Complements auto-instrumentation with domain-specific context.
 */

import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import type { MercuriusContext } from 'mercurius';

const tracer = trace.getTracer('graphql');

/**
 * Create a span for GraphQL operation
 *
 * Usage in Mercurius preExecution hook:
 * ```ts
 * fastify.graphql.addHook('preExecution', async (schema, document, ctx) => {
 *   const span = createGraphQLOperationSpan(document, ctx);
 *   ctx.reply.request.__gqlSpan = span;
 * });
 *
 * fastify.graphql.addHook('onResolution', async (execution, ctx) => {
 *   const span = ctx.reply.request.__gqlSpan;
 *   span?.end();
 * });
 * ```
 */
export function createGraphQLOperationSpan(
  document: { definitions?: Array<{ name?: { value?: string }; operation?: string }> },
  context: MercuriusContext
) {
  const operation = document.definitions?.[0];
  const operationName = operation?.name?.value || 'anonymous';
  const operationType = operation?.operation || 'query';
  
  return tracer.startSpan(`GQL ${operationName}`, {
    kind: SpanKind.INTERNAL,
    attributes: {
      'graphql.operation.name': operationName,
      'graphql.operation.type': operationType,
      'graphql.document': JSON.stringify(document).slice(0, 1000), // Limit size
    },
  });
}

/**
 * Wrapper for resolvers to add automatic tracing
 *
 * Usage:
 * ```ts
 * const resolvers = {
 *   Query: {
 *     user: traceResolver('user', async (parent, args, ctx) => {
 *       return await ctx.prisma.user.findUnique({ where: { id: args.id } });
 *     }),
 *   },
 * };
 * ```
 */
export function traceResolver<TArgs = unknown, TResult = unknown>(
  resolverName: string,
  resolver: (parent: unknown, args: TArgs, context: unknown, info: unknown) => Promise<TResult>
) {
  return async (parent: unknown, args: TArgs, ctx: unknown, info: unknown): Promise<TResult> => {
    return tracer.startActiveSpan(
      `GQL resolver ${resolverName}`,
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          'graphql.resolver.name': resolverName,
          'graphql.resolver.args': JSON.stringify(args).slice(0, 500),
        },
      },
      async (span) => {
        try {
          const result = await resolver(parent, args, ctx, info);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          span.recordException(error as Error);
          span.setStatus({ 
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        } finally {
          span.end();
        }
      }
    );
  };
}

/**
 * Create span for specific resolver (manual control)
 *
 * Usage:
 * ```ts
 * async function myResolver(parent, args, ctx) {
 *   const span = createResolverSpan('myResolver', args);
 *   try {
 *     const result = await doWork();
 *     span.end();
 *     return result;
 *   } catch (error) {
 *     span.recordException(error);
 *     span.setStatus({ code: SpanStatusCode.ERROR });
 *     span.end();
 *     throw error;
 *   }
 * }
 * ```
 */
export function createResolverSpan(resolverName: string, args?: unknown) {
  return tracer.startSpan(`GQL resolver ${resolverName}`, {
    kind: SpanKind.INTERNAL,
    attributes: {
      'graphql.resolver.name': resolverName,
      ...(args && { 'graphql.resolver.args': JSON.stringify(args).slice(0, 500) }),
    },
  });
}

/**
 * Middleware to add GraphQL context to current span
 *
 * Call this early in resolvers to enrich the active span:
 * ```ts
 * async function myResolver(parent, args, ctx) {
 *   enrichSpanWithGraphQLContext('myResolver', args);
 *   // ... resolver logic
 * }
 * ```
 */
export function enrichSpanWithGraphQLContext(resolverName: string, args?: unknown): void {
  const span = trace.getSpan(context.active());
  
  if (span) {
    span.setAttribute('graphql.resolver.name', resolverName);
    if (args) {
      span.setAttribute('graphql.resolver.args', JSON.stringify(args).slice(0, 500));
    }
  }
}

/**
 * Record GraphQL error in span
 *
 * Usage in error handler:
 * ```ts
 * catch (error) {
 *   recordGraphQLError(error, { resolverName: 'myResolver', args });
 *   throw error;
 * }
 * ```
 */
export function recordGraphQLError(
  error: Error,
  context?: { resolverName?: string; args?: unknown }
): void {
  const span = trace.getSpan(context);
  
  if (span) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    
    if (context?.resolverName) {
      span.setAttribute('graphql.resolver.name', context.resolverName);
    }
  }
}

