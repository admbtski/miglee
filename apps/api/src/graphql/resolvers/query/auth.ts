import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import { QueryResolvers } from '../../__generated__/resolvers-types';

export const meQuery: QueryResolvers['me'] = resolverWithMetrics(
  'Query',
  'me',
  async (_p, _a, { user }) => await user!
);
