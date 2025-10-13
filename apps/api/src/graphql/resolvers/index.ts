import type { Resolvers } from '../__generated__/resolvers-types';
import { Mutation } from './mutation';
import { Query } from './query';
import { JSONObjectScalar, JSONScalar } from './scalars';
import { Subscription } from './subscription';

export const resolvers: Pick<
  Resolvers,
  'Query' | 'Mutation' | 'Subscription' | 'JSON' | 'JSONObject'
> = {
  JSON: JSONScalar,
  JSONObject: JSONObjectScalar,
  Query,
  Mutation,
  Subscription,
};
