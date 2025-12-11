/**
 * Auth Query Resolvers
 */

import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type {
  QueryResolvers,
  SessionUser,
  UserEffectivePlan,
} from '../../__generated__/resolvers-types';

export const meQuery: QueryResolvers['me'] = resolverWithMetrics(
  'Query',
  'me',
  (_p, _a, { user }) => {
    if (!user) {
      return null;
    }

    // Return base session user fields - field resolvers handle the rest
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarKey: user.avatarKey ?? null,
      role: user.role,
      verifiedAt: user.verifiedAt ?? null,
      // Field resolvers handle these
      avatarBlurhash: null,
      effectivePlan: 'FREE' as UserEffectivePlan,
      profile: null,
    };

    return sessionUser;
  }
);
