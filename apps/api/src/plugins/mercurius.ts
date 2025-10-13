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
import { userMock } from '../mock/user-mock';
import { redisEmitter } from '../lib/redis';
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

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  await fastify.register(mercurius, {
    schema,
    context: createContext,
    graphiql: !config.isProduction,
    subscription: {
      emitter: redisEmitter,
      fullWsTransport: true,
      onDisconnect: () => fastify.log.info('WS disconnect'),
      onConnect: async (data: {
        payload: { headers: { Authorization: string } };
      }) => {
        await 1;
        // todo: decore auth and replace test123 with user
        return {
          test123: 'test123',
        };
      },
      context: async (socket: WebSocket, req: FastifyRequest) => {
        await 1;

        return {
          req,
          user: userMock.user,
          pubsub: fastify.graphql.pubsub,
        };
      },
    },
  });

  fastify.graphql.addHook('preExecution', async (schema, document, context) => {
    const ast = getOperationAST(document, undefined);
    const operation = ast?.operation ?? 'query'; // 'query' | 'mutation' | 'subscription'
    const operationName = ast?.name?.value ?? 'anonymous'; // nazwa operacji jeśli podana

    context.request.__gql = {
      start: process.hrtime.bigint(),
      operation,
      operationName,
    };
  });

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
