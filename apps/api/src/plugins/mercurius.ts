import { makeExecutableSchema } from '@graphql-tools/schema';
import depthLimit from 'graphql-depth-limit';
import { FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  DocumentNode,
  getOperationAST,
  GraphQLError,
  TypeInfo,
  visit,
  visitWithTypeInfo,
  type ValueNode,
} from 'graphql';
import mercurius, { MercuriusContext } from 'mercurius';
import { join } from 'path';
import { WebSocket } from 'ws';
import {
  trace,
  SpanStatusCode,
  context as otelContext,
} from '@opentelemetry/api';
import { config, env } from '../env';
import { createContext } from '../graphql/context';
import { resolvers } from '../graphql/resolvers';
import { prisma } from '../lib/prisma';
import { redisEmitter } from '../lib/redis';

const tracer = trace.getTracer('graphql');

// =====================================  ========================================
// Security Configuration
// =============================================================================

// Query depth limit (prevents deeply nested queries)
const MAX_QUERY_DEPTH = config.isProduction ? 7 : 15;

// Query complexity limit (prevents expensive queries)
const MAX_QUERY_COMPLEXITY = config.isProduction ? 1000 : 5000;

// Introspection: disabled in production, enabled in development
const ALLOW_INTROSPECTION = !config.isProduction;

// Error codes that are safe to expose to clients
const SAFE_ERROR_CODES = new Set([
  'BAD_USER_INPUT',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_ERROR',
  'RATE_LIMIT_EXCEEDED',
  'CONFLICT',
  'GONE',
  'UNPROCESSABLE_ENTITY',
]);

// =============================================================================
// Error Formatter - Masks internal errors in production
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorFormatter = (execution: any, context: MercuriusContext) => {
  const errors = execution.errors ?? [];

  const formattedErrors = errors.map((error: GraphQLError) => {
    const extensions = error.extensions as Record<string, unknown> | undefined;
    const code = (extensions?.code as string) || 'INTERNAL_SERVER_ERROR';
    const isOperationalError = SAFE_ERROR_CODES.has(code);

    // Always log the full error
    context.reply.request.log.error(
      {
        err: error,
        code,
        path: error.path,
        stack: error.originalError?.stack,
      },
      `GraphQL Error: ${error.message}`
    );

    // In production, mask internal errors
    if (config.isProduction && !isOperationalError) {
      return new GraphQLError('An unexpected error occurred', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
        },
        path: error.path,
      });
    }

    // In development or for operational errors, return full details
    return new GraphQLError(error.message, {
      extensions: {
        code,
        ...(config.isDevelopment && {
          stack: error.originalError?.stack,
          originalError: error.originalError?.message,
        }),
        // Include field for validation errors
        ...(extensions?.field ? { field: extensions.field } : {}),
        ...(extensions?.argumentName
          ? { argumentName: extensions.argumentName }
          : {}),
      },
      path: error.path,
      nodes: config.isDevelopment ? error.nodes : undefined,
    });
  });

  const hasInternalError = formattedErrors.some(
    (e: GraphQLError) =>
      (e.extensions?.code as string) === 'INTERNAL_SERVER_ERROR'
  );

  return {
    statusCode: hasInternalError ? 500 : 200,
    response: {
      data: execution.data ?? null,
      errors: formattedErrors.length > 0 ? formattedErrors : undefined,
    },
  };
};

// =============================================================================
// Query Complexity Calculator
// =============================================================================

const calculateComplexity = (
  document: DocumentNode,
  schema: ReturnType<typeof makeExecutableSchema>
): number => {
  let complexity = 0;
  const typeInfo = new TypeInfo(schema);

  visit(
    document,
    visitWithTypeInfo(typeInfo, {
      Field: {
        enter(node) {
          // Base cost per field
          complexity += 1;

          // Additional cost for list fields
          const type = typeInfo.getType();
          if (type && type.toString().startsWith('[')) {
            complexity += 10;
          }

          // Check for pagination arguments (first, last, limit)
          const args = node.arguments ?? [];
          for (const arg of args) {
            if (['first', 'last', 'limit', 'take'].includes(arg.name.value)) {
              if (arg.value.kind === 'IntValue') {
                complexity += parseInt(arg.value.value, 10);
              }
            }
          }
        },
      },
    })
  );

  return complexity;
};

// =============================================================================
// Introspection Blocker (for production)
// =============================================================================

const blockIntrospection = (document: DocumentNode): GraphQLError | null => {
  if (ALLOW_INTROSPECTION) return null;

  let hasIntrospection = false;

  visit(document, {
    Field(node) {
      if (
        node.name.value === '__schema' ||
        node.name.value === '__type' ||
        node.name.value.startsWith('__')
      ) {
        hasIntrospection = true;
      }
    },
  });

  if (hasIntrospection) {
    return new GraphQLError('Introspection is disabled', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  return null;
};

// =============================================================================
// Scalar Resolvers
// =============================================================================

const scalarResolvers = {
  DateTime: {
    serialize: (value: Date | string | number) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (typeof value === 'string') {
        return value;
      }
      if (typeof value === 'number') {
        return new Date(value).toISOString();
      }
      throw new Error('Invalid DateTime value');
    },
    parseValue: (value: string | number) => {
      if (typeof value === 'string') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid DateTime string');
        }
        return date;
      }
      if (typeof value === 'number') {
        return new Date(value);
      }
      throw new Error('DateTime must be a string or number');
    },
    parseLiteral: (ast: ValueNode) => {
      if (ast.kind === 'StringValue') {
        const date = new Date(ast.value);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid DateTime string');
        }
        return date;
      }
      if (ast.kind === 'IntValue') {
        return new Date(parseInt(ast.value, 10));
      }
      throw new Error('DateTime must be a string or integer');
    },
  },
  JSON: {
    serialize: (value: unknown) => value,
    parseValue: (value: unknown) => value,
    parseLiteral: (ast: ValueNode) => {
      if (ast.kind === 'StringValue') {
        return JSON.parse(ast.value);
      }
      return null;
    },
  },
  JSONObject: {
    serialize: (value: unknown) => value,
    parseValue: (value: unknown) => value,
    parseLiteral: (ast: ValueNode) => {
      if (ast.kind === 'ObjectValue') {
        return ast.fields;
      }
      return null;
    },
  },
};

// =============================================================================
// Plugin Registration
// =============================================================================

export const mercuriusPlugin = fastifyPlugin(async (fastify) => {
  // Schema path resolution for different environments:
  // - Production (bundled): dist/schema.graphql next to index.js
  // - Development (tsx): source path packages/contracts/...

  // Get current file's directory (works with ESM)
  // In production (bundled): this is /app/runtime/dist/ in Docker
  // In development (tsx): this is apps/api/src/plugins/
  const currentDir = dirname(fileURLToPath(import.meta.url));

  // In production (bundled by tsdown), schema is copied to same folder as bundle
  const bundledSchemaPath = join(currentDir, 'schema.graphql');

  // In development (tsx), use relative path from this file
  const devSchemaPath = join(
    currentDir,
    '../../../../packages/contracts/graphql/schema.graphql'
  );

  // Try bundled path first (production), then dev path
  let schemaPath: string;
  if (existsSync(bundledSchemaPath)) {
    schemaPath = bundledSchemaPath;
  } else if (existsSync(devSchemaPath)) {
    schemaPath = devSchemaPath;
  } else {
    throw new Error(
      `GraphQL schema not found at ${bundledSchemaPath} or ${devSchemaPath}`
    );
  }

  const typeDefs = readFileSync(schemaPath, 'utf-8');

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: {
      ...resolvers,
      ...scalarResolvers,
    },
  });

  fastify.log.info(
    `Registering Mercurius plugin with ${env.NODE_ENV} configuration`
  );
  fastify.log.info(
    `GraphQL security: depth=${MAX_QUERY_DEPTH}, complexity=${MAX_QUERY_COMPLEXITY}, introspection=${ALLOW_INTROSPECTION}, graphiql=${!config.isProduction}`
  );

  await fastify.register(mercurius, {
    schema,
    context: createContext,

    // ✅ GraphiQL disabled in production
    graphiql: !config.isProduction,

    // ✅ Error formatter - masks internal errors
    errorFormatter,

    // ✅ Validation rules - depth limit
    validationRules: [depthLimit(MAX_QUERY_DEPTH)],

    // ✅ Automatic Persisted Queries (APQ)
    // Apollo-style automatic persisted queries
    // Clients can send query hash instead of full query string
    // Max cache size: 1000 queries (memory-based cache)
    persistedQueryProvider: mercurius.persistedQueryDefaults.automatic(1000),

    subscription: {
      emitter: redisEmitter,
      fullWsTransport: true,
      onDisconnect: () => fastify.log.trace('WS disconnect'),
      onConnect: async (_data: {
        payload: { headers: { Authorization: string } };
      }) => {
        await 1;
        return {
          test123: 'test123',
        };
      },
      context: async (_socket: WebSocket, req: FastifyRequest) => {
        const userId = (req.headers['x-user-id'] as string | undefined)?.trim();

        const user = userId
          ? await prisma.user.findUnique({ where: { id: userId } })
          : null;

        return {
          req,
          user: user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role as 'USER' | 'MODERATOR' | 'ADMIN',
                avatarKey: user.avatarKey,
                verifiedAt: user.verifiedAt,
                locale: user.locale,
                timezone: user.timezone,
              }
            : null,
          pubsub: fastify.graphql.pubsub,
        };
      },
    },
  });

  // =============================================================================
  // GraphQL Hooks
  // =============================================================================

  // ✅ Pre-execution hook for introspection blocking, complexity check, and tracing
  fastify.graphql.addHook(
    'preExecution',
    async (execSchema, document, context) => {
      const ast = getOperationAST(document, undefined);
      const operation = ast?.operation ?? 'query';
      const operationName = ast?.name?.value ?? 'anonymous';

      // Create OpenTelemetry span for GraphQL operation
      const span = tracer.startSpan(`GQL ${operationName}`, {
        attributes: {
          'graphql.operation.name': operationName,
          'graphql.operation.type': operation,
        },
      });

      // Store metadata for metrics and span cleanup
      context.request.__gql = {
        start: process.hrtime.bigint(),
        operation,
        operationName,
        span, // Store span for later cleanup
      };

      // ✅ Block introspection in production
      const introspectionError = blockIntrospection(document);
      if (introspectionError) {
        span.recordException(introspectionError);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: 'Introspection blocked',
        });
        span.end();

        return {
          document,
          errors: [introspectionError],
        };
      }

      // ✅ Check query complexity
      const complexity = calculateComplexity(document, execSchema);
      span.setAttribute('graphql.operation.complexity', complexity);

      if (complexity > MAX_QUERY_COMPLEXITY) {
        context.request.log.warn(
          { complexity, max: MAX_QUERY_COMPLEXITY, operationName },
          'Query complexity exceeded'
        );

        const error = new GraphQLError(
          `Query complexity ${complexity} exceeds maximum allowed ${MAX_QUERY_COMPLEXITY}`,
          {
            extensions: {
              code: 'BAD_USER_INPUT',
              complexity,
              maxComplexity: MAX_QUERY_COMPLEXITY,
            },
          }
        );

        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: 'Complexity exceeded',
        });
        span.end();

        return {
          document,
          errors: [error],
        };
      }

      // Log complexity in development for debugging
      if (config.isDevelopment && complexity > 100) {
        context.request.log.debug(
          { complexity, operationName },
          'Query complexity'
        );
      }

      return { document };
    }
  );

  // Resolution hook - complete tracing and metrics
  fastify.graphql.addHook('onResolution', async (execution, context) => {
    const meta = context.request.__gql;
    if (!meta) return;

    const durationS = Number(process.hrtime.bigint() - meta.start) / 1e9;
    const outcome = execution.errors?.length ? 'error' : 'ok';
    const span = meta.span;

    if (span) {
      // Add duration and outcome to span
      span.setAttribute('graphql.execution.duration_ms', durationS * 1000);
      span.setAttribute('graphql.execution.outcome', outcome);

      // Record errors if any
      if (execution.errors?.length) {
        execution.errors.forEach((error) => {
          span.recordException(error);
        });
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: execution.errors[0].message,
        });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }

      // End the span
      span.end();
    }
  });
});
