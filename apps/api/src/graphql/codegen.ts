import { CodegenConfig } from '@graphql-codegen/cli';
import { join } from 'path';

const config: CodegenConfig = {
  schema: join(
    process.cwd(),
    '../../packages/contracts/graphql/schema.graphql'
  ),
  generates: {
    './src/graphql/__generated__/resolvers-types.ts': {
      plugins: ['add', 'typescript', 'typescript-resolvers'],
      config: {
        content: "import { MercuriusContext } from 'mercurius';",
        useIndexSignature: true,
        avoidOptionals: true,
        useTypeImports: true,
        strictScalars: true,
        skipTypename: true,
        namingConvention: {
          typeNames: 'change-case-all#pascalCase',
          transformUnderscore: true,
        },
        // ⬇⬇⬇ MAPOWANIE SKALARÓW
        scalars: {
          DateTime: { input: 'Date | string | number', output: 'Date' },
          JSON: 'Record<string, any>',
          JSONObject: 'Record<string, any>',
        },
        contextType: 'MercuriusContext',
      },
    },
  },
};

export default config;

// import { CodegenConfig } from '@graphql-codegen/cli';
// import { join } from 'path';

// const config: CodegenConfig = {
//   schema: join(
//     process.cwd(),
//     '../../packages/contracts/graphql/schema.graphql'
//   ),
//   generates: {
//     './src/graphql/__generated__/resolvers-types.ts': {
//       plugins: ['add', 'typescript', 'typescript-resolvers'],
//       config: {
//         content: "import { MercuriusContext } from 'mercurius';",
//         useIndexSignature: true,
//         avoidOptionals: true,
//         useTypeImports: true,
//         strictScalars: true,
//         skipTypename: true,
//         namingConvention: {
//           typeNames: 'change-case-all#pascalCase',
//           transformUnderscore: true,
//         },
//         scalars: {
//           DateTime: {
//             input: 'Date | string | number',
//             output: 'Date',
//           },
//         },
//         contextType: 'MercuriusContext',
//       },
//     },
//   },
// };

// export default config;
