import { FastifyReply, FastifyRequest } from 'fastify';
import { userMock } from '../mock/user-mock';

export async function createContext(
  request: FastifyRequest,
  reply: FastifyReply
) {
  console.dir({ h: request.headers });
  return {
    request,
    reply,
    user: userMock.user,
  };
}

type PromiseType<T> = T extends PromiseLike<infer U> ? U : T;

declare module 'mercurius' {
  interface MercuriusContext
    extends PromiseType<ReturnType<typeof createContext>> {}
}
