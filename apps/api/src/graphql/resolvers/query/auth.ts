import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import {
  QueryResolvers,
  SessionUser,
} from '../../__generated__/resolvers-types';

export const meQuery: QueryResolvers['me'] = resolverWithMetrics(
  'Query',
  'me',
  (_p, _a, { user }) => {
    if (!user) {
      return null;
    }

    const sessionUser: SessionUser = {
      email: user?.email,
      id: user?.id,
      imageUrl: user?.imageUrl,
      name: user?.name,
      role: user?.role,
      verifiedAt: user?.verifiedAt,
    };

    return sessionUser;
  }
);
