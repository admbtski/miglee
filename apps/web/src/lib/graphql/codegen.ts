import type { CodegenConfig } from '@graphql-codegen/cli';
import { join } from 'path';

const config: CodegenConfig = {
  schema: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql',
  documents: join(
    process.cwd(),
    '../../packages/contracts/graphql/operations/**/*.graphql'
  ),
  generates: {
    './src/lib/graphql/__generated__/react-query-update.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
      config: {
        useTypeImports: true,
        useImplementingTypes: true,
        dedupeFragments: true,
        emitLegacyCommonJSImports: false,
        extractAllFieldsToTypes: true,
        flattenGeneratedTypes: true,
        flattenGeneratedTypesIncludeFragments: true,
        inlineFragmentTypes: 'combine',
        namingConvention: {
          typeNames: 'change-case-all#pascalCase',
          transformUnderscore: true,
        },
        scalars: {
          DateTime: 'string',
          JSON: 'Record<string, any>',
          JSONObject: 'Record<string, any>',
        },
      },
    },
  },
  // gdybyś chwilowo nie miał żadnych *.graphql w operations
  ignoreNoDocuments: true,
};

export default config;
