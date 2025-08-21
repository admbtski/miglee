import cookie from '@fastify/cookie';
import fastifyPlugin from 'fastify-plugin';
import { config } from '../env';

// todo: improve comfig
export const cookiePlugin = fastifyPlugin(async (fastify) => {
  await fastify.register(cookie, {
    secret: config.jwtSecret,
    parseOptions: {
      sameSite: 'lax',
      httpOnly: true,
      secure: config.isProduction,
      path: '/',
    },
  });
});
