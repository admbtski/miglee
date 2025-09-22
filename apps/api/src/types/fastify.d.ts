// types/fastify-metrics.d.ts (upewnij się że TS to widzi)
import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    __metrics?: {
      start: bigint;
      route: string;
      counted: boolean;
    };
    __gql?: {
      start: bigint;
      operation: string;
      operationName: string;
    };
  }
}
