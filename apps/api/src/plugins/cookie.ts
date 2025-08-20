import cookie from '@fastify/cookie';
import { FastifyPluginAsync } from 'fastify';
import { config } from '../env';

// todo: improve comfig
export const cookiePlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cookie, {
    secret: config.jwtSecret,
    parseOptions: {
      sameSite: 'lax',
      httpOnly: true,
      secure: config.isProduction,
      path: '/',
    },
  });
};
