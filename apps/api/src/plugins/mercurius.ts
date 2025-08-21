import { makeExecutableSchema } from '@graphql-tools/schema';
import { FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { readFileSync } from 'fs';
import mercurius from 'mercurius';
import { join } from 'path';
import { WebSocket } from 'ws';
import { config } from '../env';
import { createContext } from '../graphql/context';
import { resolvers } from '../graphql/resolvers/index';

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
      onConnect: async (data: {
        payload: { headers: { Authorization: string } };
      }) => {
        return data;
      },
      context: async (socket: WebSocket, req: FastifyRequest) => {
        await 1;
        return {
          req,
          // prisma,
        };
      },
    },
  });
});
