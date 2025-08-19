import { CodegenConfig } from '@graphql-codegen/cli';
import { join } from 'path';

const config: CodegenConfig = {
  schema: join(
    process.cwd(),
    '../../packages/contracts/graphql/schema.graphql'
  ),
  generates: {
    './src/graphql/__generated__/resolvers-types.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        contextType: '../context#GQLContext',
        mappers: {
          Event: '@prisma/client#Event',
        },
        useIndexSignature: true,
        scalars: {
          DateTime: {
            input: 'Date | string | number',
            output: 'Date',
          },
        },
        scalarsOverride: {
          DateTime: 'GraphQLScalarType',
        },
      },
    },
  },
};

export default config;
