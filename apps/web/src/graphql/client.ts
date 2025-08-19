import { GraphQLClient } from 'graphql-request';

const endpoint =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql';

export const gqlClient = new GraphQLClient(endpoint, {
  credentials: 'include',
});
