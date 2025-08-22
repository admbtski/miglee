import { FastifyReply, FastifyRequest } from 'fastify';
import { userMock } from '../mock/user-mock';

export async function createContext(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return {
    request,
    reply,
    user: userMock.user,
    pubsub: request.server.graphql.pubsub,
  };
}

type PromiseType<T> = T extends PromiseLike<infer U> ? U : T;

declare module 'mercurius' {
  interface MercuriusContext
    extends PromiseType<ReturnType<typeof createContext>> {}
}
