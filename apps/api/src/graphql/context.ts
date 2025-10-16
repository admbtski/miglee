import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { Role } from './__generated__/resolvers-types';

export async function createContext(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.headers['x-user-id'] as string | undefined)?.trim();

  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : null;

  return {
    request,
    reply,
    user: user
      ? {
          id: user.id,
          name: user.name!,
          email: user.email!,
          role: user.role as Role,
          imageUrl: user.imageUrl,
          verifiedAt: user.verifiedAt,
        }
      : null,
    pubsub: request.server.graphql.pubsub,
  };
}

type PromiseType<T> = T extends PromiseLike<infer U> ? U : T;

declare module 'mercurius' {
  interface MercuriusContext
    extends PromiseType<ReturnType<typeof createContext>> {}
}
