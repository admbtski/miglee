import { FastifyPluginAsync } from 'fastify';
import mercurius from 'mercurius';
import { readFileSync } from 'fs';
import { join } from 'path';
import { makeExecutableSchema } from '@graphql-tools/schema';

import { resolvers } from '../graphql/resolvers/index';
import { createContext } from '../graphql/context';
import { env } from '../env';

export const mercuriusPlugin: FastifyPluginAsync = async (fastify) => {
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
    graphiql: env.NODE_ENV !== 'production',
    subscription: false,
  });
};
