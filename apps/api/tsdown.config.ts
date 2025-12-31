import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'workers/reminders/worker': 'src/workers/reminders/worker.ts',
    'workers/feedback/worker': 'src/workers/feedback/worker.ts',
    'workers/audit-archive/worker': 'src/workers/audit-archive/worker.ts',
  },
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  splitting: true,
  treeshake: true,
  dts: false, // Skip declaration files for faster builds
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
  esbuildOptions(options) {
    // Handle __dirname and __filename in ESM
    options.define = {
      ...options.define,
    };
  },
  async onSuccess() {
    const { copyFileSync, mkdirSync, readdirSync, existsSync } = await import(
      'fs'
    );
    const { dirname, join } = await import('path');

    // Copy GraphQL schema
    const schemaSource = '../../packages/contracts/graphql/schema.graphql';
    const schemaDest = 'dist/schema.graphql';

    try {
      mkdirSync(dirname(schemaDest), { recursive: true });
      copyFileSync(schemaSource, schemaDest);
      console.log('✓ Copied schema.graphql to dist/');
    } catch (err) {
      console.error('Failed to copy schema.graphql:', err);
    }

    // Copy Prisma query engine (.node files)
    const prismaClientDir = 'src/prisma-client';
    if (existsSync(prismaClientDir)) {
      const files = readdirSync(prismaClientDir);
      const nodeFiles = files.filter((f) => f.endsWith('.node'));

      for (const file of nodeFiles) {
        const src = join(prismaClientDir, file);
        const dest = join('dist', file);
        try {
          copyFileSync(src, dest);
          console.log(`✓ Copied ${file} to dist/`);
        } catch (err) {
          console.error(`Failed to copy ${file}:`, err);
        }
      }
    }
  },
});
