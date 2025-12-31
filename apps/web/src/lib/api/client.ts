import { GraphQLClient } from 'graphql-request';
import { env } from '@/lib/env';

export const gqlClient = new GraphQLClient(env.apiUrl, {
  credentials: 'include',
  mode: 'cors',
});
