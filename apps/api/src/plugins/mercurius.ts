import { makeExecutableSchema } from '@graphql-tools/schema';
import { FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { readFileSync } from 'fs';
import mercurius from 'mercurius';
import { join } from 'path';
import { WebSocket } from 'ws';
import { config } from '../env';
import { createContext } from '../graphql/context';
import { resolvers } from '../graphql/resolvers';
import { redisEmitter } from '../lib/redis';
import { prisma } from '../lib/prisma';
import opentelemetry from '@opentelemetry/api';
import { getOperationAST } from 'graphql';

const meter = opentelemetry.metrics.getMeter('api');

const gqlOpsTotal = meter.createCounter('graphql_operations_total', {
  description: 'GraphQL operations by outcome',
});
const gqlOpDur = meter.createHistogram('graphql_operation_duration_seconds');

const gqlErrors = meter.createCounter('graphql_errors_total', {
  description: 'GraphQL errors',
});

// todo: improve comfig
export const mercuriusPlugin = fastifyPlugin(async (fastify) => {
  // Read schema from contracts package
  const schemaPath = join(
    process.cwd(),
    '../../packages/contracts/graphql/schema.graphql'
  );
  const typeDefs = readFileSync(schemaPath, 'utf-8');

  // Custom scalar resolvers
  const scalarResolvers = {
    DateTime: {
      serialize: (value: Date | string | number) => {
        // Convert Date to ISO string for response
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
        // Convert input value (from variables) to Date
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
      parseLiteral: (ast: any) => {
        // Convert literal value (from query string) to Date
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
      serialize: (value: any) => value,
      parseValue: (value: any) => value,
      parseLiteral: (ast: any) => {
        if (ast.kind === 'StringValue') {
          return JSON.parse(ast.value);
        }
        return null;
      },
    },
    JSONObject: {
      serialize: (value: any) => value,
      parseValue: (value: any) => value,
      parseLiteral: (ast: any) => {
        if (ast.kind === 'ObjectValue') {
          return ast.value;
        }
        return null;
      },
    },
  };

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: {
      ...resolvers,
      ...scalarResolvers,
    },
  });

  await fastify.register(mercurius, {
    schema,
    context: createContext,
    graphiql: !config.isProduction,
    subscription: {
      emitter: redisEmitter,
      fullWsTransport: true,
      onDisconnect: () => fastify.log.info('WS disconnect'),
      onConnect: async (_data: {
        payload: { headers: { Authorization: string } };
      }) => {
        await 1;
        // todo: decore auth and replace test123 with user
        return {
          test123: 'test123',
        };
      },
      context: async (_socket: WebSocket, req: FastifyRequest) => {
        // Get user from headers (same as createContext)
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
                role: user.role as any,
                avatarKey: user.avatarKey,
                verifiedAt: user.verifiedAt,
              }
            : null,
          pubsub: fastify.graphql.pubsub,
        };
      },
    },
  });

  fastify.graphql.addHook(
    'preExecution',
    async (_schema, document, context) => {
      const ast = getOperationAST(document, undefined);
      const operation = ast?.operation ?? 'query'; // 'query' | 'mutation' | 'subscription'
      const operationName = ast?.name?.value ?? 'anonymous'; // nazwa operacji jeśli podana

      context.request.__gql = {
        start: process.hrtime.bigint(),
        operation,
        operationName,
      };
    }
  );

  fastify.graphql.addHook('onResolution', async (execution, context) => {
    const meta = context.request.__gql;
    if (!meta) return;

    const durS = Number(process.hrtime.bigint() - meta.start) / 1e9;
    const outcome = execution.errors?.length ? 'error' : 'ok';

    gqlOpsTotal.add(1, {
      operation: meta.operation,
      operation_name: meta.operationName,
      outcome,
    });

    gqlOpDur.record(durS, {
      operation: meta.operation,
      operation_name: meta.operationName,
    });

    if (execution.errors?.length) {
      for (const e of execution.errors) {
        const code = (e as any)?.extensions?.code || 'UNKNOWN';
        gqlErrors.add(1, { operation: meta.operation, code });
      }
    }
  });
});
