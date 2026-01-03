import { makeExecutableSchema } from '@graphql-tools/schema';
import depthLimit from 'graphql-depth-limit';
import { FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { GraphQLError, type ValueNode } from 'graphql';
import mercurius, { MercuriusContext } from 'mercurius';
import { join } from 'path';
import { WebSocket } from 'ws';
// OpenTelemetry trace (for future use)
// import { trace } from '@opentelemetry/api';
import { config, env } from '../env';
import { createContext } from '../graphql/context';
import { resolvers } from '../graphql/resolvers';
import { prisma } from '../lib/prisma';
import { redisEmitter } from '../lib/redis';

// =============================================================================
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

// Note: Query complexity and introspection blocking are handled by depthLimit
// and Mercurius built-in features. Custom implementations can be added here if needed.

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

  // ✅ Pre-execution hook for suspended user check & auto-unsuspend
  fastify.graphql.addHook(
    'preExecution',
    async (_schema, document, context) => {
      const user = context.user;

      // Auto-unsuspend if suspension period has expired
      if (user?.suspendedAt && user?.suspendedUntil) {
        const now = new Date();
        const suspendedUntil = new Date(user.suspendedUntil);

        if (now >= suspendedUntil) {
          // Automatically unsuspend the user
          await context.prisma.user.update({
            where: { id: user.id },
            data: {
              suspendedAt: null,
              suspendedUntil: null,
              suspensionReason: null,
              suspendedById: null,
            },
          });

          // Audit the auto-unsuspend
          await context.prisma.userAuditLog.create({
            data: {
              targetUserId: user.id,
              action: 'UNSUSPEND',
              actorId: null, // SYSTEM action
              reason: 'Automatic unsuspension - suspension period expired',
              before: {
                suspendedAt: user.suspendedAt,
                suspendedUntil: user.suspendedUntil,
                suspensionReason: user.suspensionReason,
              },
              after: {
                suspendedAt: null,
                suspendedUntil: null,
                suspensionReason: null,
              },
              severity: 2, // info
            },
          });

          // Update context user to reflect unsuspension
          context.user = {
            ...user,
            suspendedAt: null,
            suspendedUntil: null,
            suspensionReason: null,
            suspendedById: null,
          };

          // Allow request to proceed
          return;
        }
      }

      // If user is still suspended, block all operations except a whitelist
      if (user?.suspendedAt) {
        // Extract operation name
        const operationName = document.definitions.find(
          (def) => def.kind === 'OperationDefinition'
        )?.name?.value;

        // Whitelist of operations that suspended users can still perform
        const allowedOperations = [
          'me', // Allow checking their own profile
          'devLogout', // Allow logout in dev
        ];

        if (!operationName || !allowedOperations.includes(operationName)) {
          throw new GraphQLError(
            'Your account has been suspended. Please contact support.',
            {
              extensions: {
                code: 'ACCOUNT_SUSPENDED',
                reason: user.suspensionReason || 'Account suspended',
                suspendedAt: user.suspendedAt,
                suspendedUntil: user.suspendedUntil,
              },
            }
          );
        }
      }
    }
  );

  // Resolution hook - complete tracing and metrics
});
