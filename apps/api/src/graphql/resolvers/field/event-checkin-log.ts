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
  toGQLCheckinResultStatus,
} from '../helpers/checkin-types';
import type { CheckinResult as PrismaCheckinResultEnum } from '@prisma/client';

// Field resolvers handle enum conversions + relations
// Scalar fields are automatically resolved from parent object
export const EventCheckinLog: EventCheckinLogResolvers = {
  action: (parent: any) => toGQLCheckinAction(parent.action as unknown as any),
  method: (parent: any) => parent.method ? toGQLCheckinMethod(parent.method as unknown as any) : null,
  source: (parent: any) => toGQLCheckinSource(parent.source as unknown as any),
  result: (parent: any) => toGQLCheckinResultStatus(parent.result as unknown as PrismaCheckinResultEnum),

  actor: (parent: any) => {
    const actor = parent.actor;
    return actor ? mapUser(actor) : null;
  },
} as unknown as EventCheckinLogResolvers;
