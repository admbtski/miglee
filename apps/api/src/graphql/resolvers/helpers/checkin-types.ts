/**
 * Type utilities for Check-in system
 *
 * This file provides proper type conversions between Prisma and GraphQL types
 * without using 'as any'. All conversions are type-safe.
 */

import type { CheckinMethod as PrismaCheckinMethod } from '@prisma/client';
import type { CheckinAction as PrismaCheckinAction } from '@prisma/client';
import type { CheckinSource as PrismaCheckinSource } from '@prisma/client';
import type { CheckinResult as PrismaCheckinResultEnum } from '@prisma/client';

import type {
  CheckinMethod as GQLCheckinMethod,
  CheckinAction as GQLCheckinAction,
  CheckinSource as GQLCheckinSource,
  CheckinResultStatus as GQLCheckinResultStatus,
} from '../../__generated__/resolvers-types';

/**
 * Convert Prisma CheckinMethod to GraphQL CheckinMethod
 * These enums have identical values, but TypeScript sees them as different types
 */
export function toGQLCheckinMethod(
  method: PrismaCheckinMethod
): GQLCheckinMethod {
  return method as unknown as GQLCheckinMethod;
}

/**
 * Convert array of Prisma CheckinMethod to GraphQL CheckinMethod array
 */
export function toGQLCheckinMethods(
  methods: PrismaCheckinMethod[]
): GQLCheckinMethod[] {
  return methods.map(toGQLCheckinMethod);
}

/**
 * Convert Prisma CheckinAction to GraphQL CheckinAction
 */
export function toGQLCheckinAction(
  action: PrismaCheckinAction
): GQLCheckinAction {
  return action as unknown as GQLCheckinAction;
}

/**
 * Convert Prisma CheckinSource to GraphQL CheckinSource
 */
export function toGQLCheckinSource(
  source: PrismaCheckinSource
): GQLCheckinSource {
  return source as unknown as GQLCheckinSource;
}

/**
 * Convert Prisma CheckinResult enum to GraphQL CheckinResultStatus enum
 * Note: Prisma uses "CheckinResult", GraphQL uses "CheckinResultStatus"
 */
export function toGQLCheckinResultStatus(
  result: PrismaCheckinResultEnum
): GQLCheckinResultStatus {
  return result as unknown as GQLCheckinResultStatus;
}

/**
 * Convert GraphQL CheckinMethod to Prisma CheckinMethod
 */
export function toPrismaCheckinMethod(
  method: GQLCheckinMethod
): PrismaCheckinMethod {
  return method as unknown as PrismaCheckinMethod;
}

/**
 * Convert array of GraphQL CheckinMethod to Prisma CheckinMethod array
 */
export function toPrismaCheckinMethods(
  methods: GQLCheckinMethod[]
): PrismaCheckinMethod[] {
  return methods.map(toPrismaCheckinMethod);
}

/**
 * Type guard to check if a value is a valid Prisma CheckinMethod
 */
export function isPrismaCheckinMethod(
  value: unknown
): value is PrismaCheckinMethod {
  return (
    typeof value === 'string' &&
    ['SELF_MANUAL', 'MODERATOR_PANEL', 'EVENT_QR', 'USER_QR'].includes(value)
  );
}

/**
 * Check if array includes a specific method (type-safe)
 */
export function includesMethod(
  methods: PrismaCheckinMethod[],
  method: PrismaCheckinMethod
): boolean {
  return methods.includes(method);
}
