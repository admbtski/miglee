import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'workers/reminders/worker': 'src/workers/reminders/worker.ts',
    'workers/feedback/worker': 'src/workers/feedback/worker.ts',
    'workers/audit-archive/worker': 'src/workers/audit-archive/worker.ts',
  },
  format: 'esm',
  target: 'node24',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: false,
  minify: true,
  treeshake: true,
  hash: false, // Stable filenames for Docker
  external: [
    // Native modules that shouldn't be bundled
    'sharp',
    'pg',
    'pg-native',
    // Prisma runtime (has native bindings) - Prisma 7.x uses /runtime/client
    '@prisma/client',
    '@prisma/client/runtime/client',
  ],
  noExternal: [
    // Bundle workspace packages
    '@appname/contracts',
    // Bundle the generated prisma-client (TypeScript code)
    /prisma-client/,
    // Bundle CJS packages that have ESM interop issues
    'mercurius',
    'fastify-raw-body',
    'mqemitter-redis',
  ],
  // Copy GraphQL schema and Prisma query engine files
  copy: [
    {
      from: '../../packages/contracts/graphql/schema.graphql',
      to: 'dist',
      verbose: true,
    },
    {
      from: 'src/prisma-client/*.node',
      to: 'dist',
      flatten: true,
      verbose: true,
    },
  ],
});
