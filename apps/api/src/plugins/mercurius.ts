import { makeExecutableSchema } from '@graphql-tools/schema';
import { FastifyPluginAsync } from 'fastify';
import { readFileSync } from 'fs';
import mercurius from 'mercurius';
import { join } from 'path';
import { config } from '../env';
import { createContext } from '../graphql/context';
import { resolvers } from '../graphql/resolvers/index';

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
    graphiql: !config.isProduction,
    subscription: false,
  });
};
