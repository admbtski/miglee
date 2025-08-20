import { FastifyReply, FastifyRequest } from 'fastify';
import { MercuriusContext } from 'mercurius';

// export interface GQLContext extends MercuriusContext {
//   request: FastifyRequest;
//   reply: FastifyReply;
// }

export async function createContext(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return {
    request,
    reply,
  };
}

type PromiseType<T> = T extends PromiseLike<infer U> ? U : T;

declare module 'mercurius' {
  interface MercuriusContext
    extends PromiseType<ReturnType<typeof createContext>> {}
}
