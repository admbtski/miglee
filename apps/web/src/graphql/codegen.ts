import { CodegenConfig } from '@graphql-codegen/cli';
import { join } from 'path';

const config: CodegenConfig = {
  schema: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql',
  documents: join(
    process.cwd(),
    '../../packages/contracts/graphql/operations/**/*.graphql'
  ),
  generates: {
    './src/graphql/__generated__/': {
      preset: 'client',
      plugins: [],
    },
    './src/graphql/__generated__/react-query.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-query',
      ],
      config: {
        fetcher: {
          func: '../client#gqlClient.request',
          isReactHook: false,
        },
        exposeFetcher: true,
        exposeQueryKeys: true,
        addSuspenseQuery: true,
        reactQueryVersion: 5,
      },
    },
  },
};

export default config;
