import sensible from '@fastify/sensible';
import fastifyPlugin from 'fastify-plugin';

// todo: improve comfig
export const sensiblePlugin = fastifyPlugin(async (fastify) => {
  await fastify.register(sensible);
});
