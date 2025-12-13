/**
 * EventCheckinLog Field Resolvers
 *
 * IMPORTANT: Handles conversion of Prisma enums to GraphQL enums.
 *
 * Prisma and GraphQL use the SAME enum values (SELF_MANUAL, CHECK_IN, etc.)
 * but TypeScript sees them as different types because they come from different
 * namespaces (@prisma/client vs __generated__/resolvers-types).
 *
 * The 'as unknown as any' casts are safe because:
 * 1. Enum values are identical strings
 * 2. toGQL* helper functions validate and convert properly
 * 3. This is standard pattern for cross-namespace enum conversion in TypeScript
 */

import type { EventCheckinLogResolvers } from '../../__generated__/resolvers-types';
import { mapUser } from '../helpers';
import {
  toGQLCheckinAction,
  toGQLCheckinMethod,
  toGQLCheckinSource,
  toGQLCheckinResult,
} from '../helpers/checkin-types';

export const EventCheckinLog: EventCheckinLogResolvers = {
  // Convert Prisma enums to GraphQL enums (same values, different TS types)
  action: (parent) => {
    return toGQLCheckinAction(parent.action as unknown as any);
  },

  method: (parent) => {
    if (!parent.method) return null;
    return toGQLCheckinMethod(parent.method as unknown as any);
  },

  source: (parent) => {
    return toGQLCheckinSource(parent.source as unknown as any);
  },

  result: (parent) => {
    return toGQLCheckinResult(parent.result as unknown as any);
  },

  // Actor relation - included from query, mapUser handles conversion
  actor: (parent) => {
    const actor = (parent as any).actor;
    if (!actor) return null;
    return mapUser(actor);
  },
};
