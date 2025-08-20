import sensible from '@fastify/sensible';
import { FastifyPluginAsync } from 'fastify';

// todo: improve comfig
export const sensiblePlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(sensible);
};
