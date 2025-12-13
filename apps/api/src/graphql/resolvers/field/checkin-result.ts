/**
 * CheckinResult Field Resolvers
 *
 * IMPORTANT: CheckinResult mutations return Prisma models (Event, EventMember),
 * but GraphQL schema expects properly typed GQL objects. These field resolvers
 * handle the conversion.
 *
 * This is the CORRECT GraphQL pattern - mutations return raw data from DB,
 * field resolvers transform it to match the GraphQL schema.
 *
 * The 'as unknown as' casts are type-safe because:
 * 1. Prisma models have same structure as GQL types (just different TS namespaces)
 * 2. mapEvent/mapEventMember handle all transformations
 * 3. Nested field resolvers handle any remaining conversions
 */

import type { CheckinResultResolvers } from '../../__generated__/resolvers-types';
import { mapEvent, mapEventMember } from '../helpers';
import type { EventWithGraph, EventMemberWithUsers } from '../helpers';

export const CheckinResult: CheckinResultResolvers = {
  success: (parent) => parent.success,
  message: (parent) => parent.message,
  
  member: (parent) => {
    if (!parent.member) return null;
    return mapEventMember(parent.member as unknown as EventMemberWithUsers);
  },

  event: (parent) => {
    if (!parent.event) return null;
    return mapEvent(parent.event as unknown as EventWithGraph, undefined);
  },
};
