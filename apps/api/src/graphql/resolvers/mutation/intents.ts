import type {
  AddressVisibility,
  IntentPlan,
  MembersVisibility,
  Prisma,
} from '@prisma/client';
import {
  Level as PrismaLevel,
  MeetingKind as PrismaMeetingKind,
  Mode as PrismaMode,
  NotificationEntity as PrismaNotificationEntity,
  NotificationKind as PrismaNotificationKind,
  Visibility as PrismaVisibility,
} from '@prisma/client';
import { GraphQLError } from 'graphql';
import { getUserEffectivePlan } from '../../../lib/billing';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import { promoteMultipleFromWaitlist } from '../../../lib/waitlist';
import {
  clearFeedbackRequest,
  enqueueFeedbackRequest,
  rescheduleFeedbackRequest,
} from '../../../workers/feedback/queue';
import {
  clearReminders,
  enqueueReminders,
  rescheduleReminders,
} from '../../../workers/reminders/queue';
import type {
  CreateIntentInput,
  Intent as GQLIntent,
  MutationResolvers,
  UpdateIntentInput,
} from '../../__generated__/resolvers-types';
import { mapIntent, mapNotification, pickLocation } from '../helpers';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_START_BUFFER_MS = 5 * 60 * 1000; // >= now + 5 min

export const NOTIFICATION_INCLUDE = {
  recipient: true,
  actor: true,
  intent: {
    include: {
      categories: true,
      tags: true,
      members: { include: { user: true, addedBy: true } },
      owner: true,
      canceledBy: true,
      deletedBy: true,
    },
  },
} satisfies Prisma.NotificationInclude;

const INTENT_INCLUDE = {
  categories: true,
  tags: true,
  members: { include: { user: true, addedBy: true } },
  owner: true,
  canceledBy: true,
  deletedBy: true,
  sponsorship: {
    include: {
      sponsor: true,
      intent: true,
    },
  },
} satisfies Prisma.IntentInclude;

/* ───────────────────────────── Validation ───────────────────────────── */

function assertStartEnd(startAt: Date, endAt: Date) {
  if (!(startAt instanceof Date) || isNaN(+startAt)) {
    throw new GraphQLError('`startAt` must be a valid Date.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'startAt' },
    });
  }
  if (!(endAt instanceof Date) || isNaN(+endAt)) {
    throw new GraphQLError('`endAt` must be a valid Date.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'endAt' },
    });
  }
  if (startAt >= endAt) {
    throw new GraphQLError('`startAt` must be earlier than `endAt`.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'startAt/endAt' },
    });
  }
  const now = Date.now();
  if (+startAt < now + MIN_START_BUFFER_MS) {
    throw new GraphQLError(
      '`startAt` must be at least 5 minutes in the future.',
      {
        extensions: { code: 'BAD_USER_INPUT', field: 'startAt' },
      }
    );
  }
}

/**
 * Validate join windows/cutoffs
 */
function assertJoinWindows(input: {
  allowJoinLate?: boolean | null;
  joinOpensMinutesBeforeStart?: number | null;
  joinCutoffMinutesBeforeStart?: number | null;
  lateJoinCutoffMinutesAfterStart?: number | null;
}) {
  // All minutes must be >= 0
  if (
    input.joinOpensMinutesBeforeStart != null &&
    input.joinOpensMinutesBeforeStart < 0
  ) {
    throw new GraphQLError('`joinOpensMinutesBeforeStart` must be >= 0.', {
      extensions: {
        code: 'BAD_USER_INPUT',
        field: 'joinOpensMinutesBeforeStart',
      },
    });
  }
  if (
    input.joinCutoffMinutesBeforeStart != null &&
    input.joinCutoffMinutesBeforeStart < 0
  ) {
    throw new GraphQLError('`joinCutoffMinutesBeforeStart` must be >= 0.', {
      extensions: {
        code: 'BAD_USER_INPUT',
        field: 'joinCutoffMinutesBeforeStart',
      },
    });
  }
  if (
    input.lateJoinCutoffMinutesAfterStart != null &&
    input.lateJoinCutoffMinutesAfterStart < 0
  ) {
    throw new GraphQLError('`lateJoinCutoffMinutesAfterStart` must be >= 0.', {
      extensions: {
        code: 'BAD_USER_INPUT',
        field: 'lateJoinCutoffMinutesAfterStart',
      },
    });
  }

  // If allowJoinLate=false => lateJoinCutoffMinutesAfterStart must be null
  if (
    input.allowJoinLate === false &&
    input.lateJoinCutoffMinutesAfterStart != null
  ) {
    throw new GraphQLError(
      'When `allowJoinLate` is false, `lateJoinCutoffMinutesAfterStart` must be null.',
      {
        extensions: {
          code: 'BAD_USER_INPUT',
          field: 'lateJoinCutoffMinutesAfterStart',
        },
      }
    );
  }

  // If both opens and cutoff are set => opens must be > cutoff (to have a real open window)
  if (
    input.joinOpensMinutesBeforeStart != null &&
    input.joinCutoffMinutesBeforeStart != null &&
    input.joinOpensMinutesBeforeStart <= input.joinCutoffMinutesBeforeStart
  ) {
    throw new GraphQLError(
      '`joinOpensMinutesBeforeStart` must be greater than `joinCutoffMinutesBeforeStart` to have a valid open window.',
      {
        extensions: {
          code: 'BAD_USER_INPUT',
          field: 'joinOpensMinutesBeforeStart',
        },
      }
    );
  }

  // Sensible max limits (e.g., <= 10080 minutes = 168 hours)
  const MAX_MINUTES = 10080;
  if (
    input.joinOpensMinutesBeforeStart != null &&
    input.joinOpensMinutesBeforeStart > MAX_MINUTES
  ) {
    throw new GraphQLError(
      `\`joinOpensMinutesBeforeStart\` must be <= ${MAX_MINUTES}.`,
      {
        extensions: {
          code: 'BAD_USER_INPUT',
          field: 'joinOpensMinutesBeforeStart',
        },
      }
    );
  }
  if (
    input.joinCutoffMinutesBeforeStart != null &&
    input.joinCutoffMinutesBeforeStart > MAX_MINUTES
  ) {
    throw new GraphQLError(
      `\`joinCutoffMinutesBeforeStart\` must be <= ${MAX_MINUTES}.`,
      {
        extensions: {
          code: 'BAD_USER_INPUT',
          field: 'joinCutoffMinutesBeforeStart',
        },
      }
    );
  }
  if (
    input.lateJoinCutoffMinutesAfterStart != null &&
    input.lateJoinCutoffMinutesAfterStart > MAX_MINUTES
  ) {
    throw new GraphQLError(
      `\`lateJoinCutoffMinutesAfterStart\` must be <= ${MAX_MINUTES}.`,
      {
        extensions: {
          code: 'BAD_USER_INPUT',
          field: 'lateJoinCutoffMinutesAfterStart',
        },
      }
    );
  }
}

function assertCreateInput(input: CreateIntentInput) {
  if (!input.categorySlugs?.length || input.categorySlugs.length > 3) {
    throw new GraphQLError('You must select between 1 and 3 categories.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'categorySlugs' },
    });
  }
  // time
  assertStartEnd(
    input.startAt as unknown as Date,
    input.endAt as unknown as Date
  );

  // join windows/cutoffs
  assertJoinWindows(input);

  // capacity
  if (input.mode === PrismaMode.ONE_TO_ONE) {
    if (input.min !== 2 || input.max !== 2) {
      throw new GraphQLError('For ONE_TO_ONE, min and max must both equal 2.', {
        extensions: { code: 'BAD_USER_INPUT', field: 'min/max' },
      });
    }
  } else if (
    typeof input.min === 'number' &&
    typeof input.max === 'number' &&
    input.min > input.max
  ) {
    throw new GraphQLError('`min` cannot be greater than `max`.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'min/max' },
    });
  }

  // meeting kind constraints
  const hasCoords = !!(
    input?.location &&
    (input.location.lat != null || input.location.lng != null)
  );
  const hasUrl =
    typeof input?.onlineUrl === 'string' && input.onlineUrl.length > 0;

  if (input.meetingKind === PrismaMeetingKind.ONLINE && !hasUrl) {
    throw new GraphQLError('`onlineUrl` is required for ONLINE meetings.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'onlineUrl' },
    });
  }
  if (input.meetingKind === PrismaMeetingKind.ONSITE && !hasCoords) {
    throw new GraphQLError(
      'Location (lat/lng) is required for ONSITE meetings.',
      {
        extensions: { code: 'BAD_USER_INPUT', field: 'location' },
      }
    );
  }
  if (
    input.meetingKind === PrismaMeetingKind.HYBRID &&
    !(hasUrl || hasCoords)
  ) {
    throw new GraphQLError(
      'HYBRID requires either location (lat/lng) or `onlineUrl`.',
      {
        extensions: { code: 'BAD_USER_INPUT', field: 'meetingKind' },
      }
    );
  }
}

function assertUpdateInput(input: UpdateIntentInput) {
  // null-protection on immutable-ish scalars
  if (input.title === null)
    throw new GraphQLError('`title` cannot be null.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'title' },
    });
  if (input.min === null)
    throw new GraphQLError('`min` cannot be null.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'min' },
    });
  if (input.max === null)
    throw new GraphQLError('`max` cannot be null.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'max' },
    });

  if (
    typeof input.min === 'number' &&
    typeof input.max === 'number' &&
    input.min > input.max
  ) {
    throw new GraphQLError('`min` cannot be greater than `max`.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'min/max' },
    });
  }
  if (input.mode === PrismaMode.ONE_TO_ONE) {
    if (
      (typeof input.min === 'number' && input.min !== 2) ||
      (typeof input.max === 'number' && input.max !== 2)
    ) {
      throw new GraphQLError('For ONE_TO_ONE, min and max must both equal 2.', {
        extensions: { code: 'BAD_USER_INPUT', field: 'min/max' },
      });
    }
  }
  // online URL nullability guard when ONLINE explicitly set
  if (
    input.meetingKind === PrismaMeetingKind.ONLINE &&
    input.onlineUrl === null
  ) {
    throw new GraphQLError('`onlineUrl` cannot be null for ONLINE.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'onlineUrl' },
    });
  }

  // HYBRID guard when neither url nor coords are provided/updated
  if (input.meetingKind === PrismaMeetingKind.HYBRID) {
    const hasCoords =
      input?.location &&
      ['lat', 'lng'].some((k) =>
        Object.prototype.hasOwnProperty.call(input.location, k)
      );
    const onlineUrlProvided = Object.prototype.hasOwnProperty.call(
      input,
      'onlineUrl'
    );
    const hasAny =
      (onlineUrlProvided &&
        typeof input.onlineUrl === 'string' &&
        input.onlineUrl.length > 0) ||
      hasCoords;
    if (!hasAny) {
      throw new GraphQLError(
        'HYBRID requires either location (lat/lng) or `onlineUrl`.',
        {
          extensions: { code: 'BAD_USER_INPUT', field: 'meetingKind' },
        }
      );
    }
  }

  // if both provided, validate time relationship
  if (input.startAt !== undefined && input.endAt !== undefined) {
    assertStartEnd(input.startAt as Date, input.endAt as Date);
  }

  // join windows/cutoffs validation
  assertJoinWindows(input);
}

/* ───────────────────────────── Guards ───────────────────────────── */

function assertNotReadOnly(intent: {
  canceledAt: Date | null;
  deletedAt: Date | null;
}) {
  if (intent.deletedAt) {
    throw new GraphQLError('Intent is deleted.', {
      extensions: { code: 'FAILED_PRECONDITION' },
    });
  }
  if (intent.canceledAt) {
    throw new GraphQLError('Intent is canceled and read-only.', {
      extensions: { code: 'FAILED_PRECONDITION' },
    });
  }
}

/* ───────────────────────────── Mutations ───────────────────────────── */

/** Create Intent */
export const createIntentMutation: MutationResolvers['createIntent'] =
  resolverWithMetrics(
    'Mutation',
    'createIntent',
    async (_p, { input }, { user, pubsub }): Promise<GQLIntent> => {
      const ownerId = user?.id;
      if (!ownerId) {
        throw new GraphQLError(
          'ownerId is required or an authenticated user must be present.',
          {
            extensions: { code: 'UNAUTHENTICATED' },
          }
        );
      }

      assertCreateInput(input);

      const loc = pickLocation(input.location) ?? {};

      const categoriesData: Prisma.CategoryCreateNestedManyWithoutIntentsInput =
        {
          connect: input.categorySlugs.map((slug: string) => ({ slug })),
        };
      const tagsData:
        | Prisma.TagCreateNestedManyWithoutIntentsInput
        | undefined = input.tagSlugs?.length
        ? { connect: input.tagSlugs.map((slug: string) => ({ slug })) }
        : undefined;

      // Get user's effective plan to inherit for the intent
      const userPlanInfo = await getUserEffectivePlan(ownerId);
      const inheritedPlan: IntentPlan = userPlanInfo.plan as IntentPlan;

      const full = await prisma.$transaction(async (tx) => {
        const intent = await tx.intent.create({
          data: {
            title: input.title,
            description: input.description ?? null,
            notes: input.notes ?? null,

            visibility: (input.visibility ??
              PrismaVisibility.PUBLIC) as PrismaVisibility,
            // joinMode może nie być w SDL — fallback na OPEN
            joinMode: (input as any).joinMode ?? 'OPEN',
            mode: input.mode as PrismaMode,
            min: input.min,
            max: input.max,

            startAt: input.startAt as Date,
            endAt: input.endAt as Date,
            allowJoinLate: input.allowJoinLate,
            joinOpensMinutesBeforeStart:
              input.joinOpensMinutesBeforeStart ?? null,
            joinCutoffMinutesBeforeStart:
              input.joinCutoffMinutesBeforeStart ?? null,
            lateJoinCutoffMinutesAfterStart:
              input.lateJoinCutoffMinutesAfterStart ?? null,

            meetingKind: input.meetingKind as PrismaMeetingKind,
            onlineUrl: input.onlineUrl ?? null,

            levels: (input.levels ?? []) as PrismaLevel[],

            addressVisibility: (input.addressVisibility ??
              'PUBLIC') as AddressVisibility,
            membersVisibility: (input.membersVisibility ??
              'PUBLIC') as MembersVisibility,

            ownerId,

            // Inherit user's plan
            sponsorshipPlan: inheritedPlan,

            ...loc,
            categories: categoriesData,
            ...(tagsData ? { tags: tagsData } : {}),
          },
        });

        await tx.intentMember.create({
          data: {
            intentId: intent.id,
            userId: ownerId,
            role: 'OWNER',
            status: 'JOINED',
            joinedAt: new Date(),
          },
        });

        // Create join form questions if provided
        const joinQuestions = (input as any).joinQuestions;
        if (
          joinQuestions &&
          Array.isArray(joinQuestions) &&
          joinQuestions.length > 0
        ) {
          // Validate max questions (5)
          if (joinQuestions.length > 5) {
            throw new GraphQLError('Maximum 5 join questions allowed', {
              extensions: { code: 'BAD_USER_INPUT' },
            });
          }

          // Create questions in order
          for (let i = 0; i < joinQuestions.length; i++) {
            const q = joinQuestions[i];

            // Validate label length
            if (q.label && q.label.length > 200) {
              throw new GraphQLError(
                'Question label must be at most 200 characters',
                {
                  extensions: { code: 'BAD_USER_INPUT' },
                }
              );
            }

            // Validate help text length
            if (q.helpText && q.helpText.length > 200) {
              throw new GraphQLError(
                'Question help text must be at most 200 characters',
                {
                  extensions: { code: 'BAD_USER_INPUT' },
                }
              );
            }

            await tx.intentJoinQuestion.create({
              data: {
                intentId: intent.id,
                order: i,
                type: q.type,
                label: q.label,
                helpText: q.helpText || null,
                required: q.required ?? true,
                options: q.options || null,
                maxLength: q.maxLength || null,
              },
            });
          }
        }

        // Create EventSponsorship if user has PLUS or PRO plan
        if (inheritedPlan === 'PLUS' || inheritedPlan === 'PRO') {
          await tx.eventSponsorship.create({
            data: {
              intentId: intent.id,
              sponsorId: ownerId,
              plan: inheritedPlan,
              status: 'ACTIVE',
              // Initialize boosts and pushes based on plan
              boostsTotal: inheritedPlan === 'PRO' ? 3 : 1,
              boostsUsed: 0,
              localPushesTotal: inheritedPlan === 'PRO' ? 3 : 1,
              localPushesUsed: 0,
            },
          });
        }

        const notification = await tx.notification.create({
          data: {
            kind: PrismaNotificationKind.INTENT_CREATED,
            title: 'Intent created',
            body: `Your intent "${intent.title}" has been successfully created.`,
            entityType: PrismaNotificationEntity.INTENT,
            entityId: intent.id,
            intentId: intent.id,
            recipientId: ownerId,
            actorId: ownerId,
            data: {
              intentId: intent.id,
              title: intent.title,
              startAt: intent.startAt,
            } as Prisma.InputJsonValue,
            dedupeKey: `intent_created:${ownerId}:${intent.id}`,
          },
          include: NOTIFICATION_INCLUDE,
        });

        await pubsub?.publish({
          topic: `NOTIFICATION_ADDED:${notification.recipientId}`,
          payload: { notificationAdded: mapNotification(notification) },
        });

        // Reminders (24h..15m)
        try {
          await enqueueReminders(intent.id, intent.startAt);
        } catch {
          // loguj w workerze/metrics; nie blokuj transakcji
        }

        // Feedback request (scheduled after event ends)
        try {
          await enqueueFeedbackRequest(intent.id, intent.endAt);
        } catch (err) {
          console.dir({ err });
          // Don't block transaction if feedback scheduling fails
        }

        const fullIntent = await tx.intent.findUniqueOrThrow({
          where: { id: intent.id },
          include: INTENT_INCLUDE,
        });

        return fullIntent;
      });

      return mapIntent(full, user.id);
    }
  );

/** Update Intent (publikacja INTENT_UPDATED + reschedule reminders) */
// todo: can be updated only by owner
export const updateIntentMutation: MutationResolvers['updateIntent'] =
  resolverWithMetrics(
    'Mutation',
    'updateIntent',
    async (_p, { id, input }, { user, pubsub }): Promise<GQLIntent> => {
      const ownerId = user?.id;
      if (!ownerId) {
        throw new GraphQLError(
          'ownerId is required or an authenticated user must be present.',
          {
            extensions: { code: 'UNAUTHENTICATED' },
          }
        );
      }

      assertUpdateInput(input);

      const current = await prisma.intent.findUnique({
        where: { id },
        select: {
          canceledAt: true,
          deletedAt: true,
          startAt: true,
          mode: true,
          max: true,
        },
      });
      if (!current) {
        throw new GraphQLError('Intent not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      assertNotReadOnly(current);

      // odbiorcy przed update
      const members = await prisma.intentMember.findMany({
        where: {
          intentId: id,
          status: { in: ['JOINED', 'PENDING', 'INVITED'] },
        },
        select: { userId: true },
      });
      const recipients = members.map((m) => m.userId);

      const loc = input.location
        ? {
            ...(Object.prototype.hasOwnProperty.call(input.location, 'lat')
              ? { lat: input.location.lat }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(input.location, 'lng')
              ? { lng: input.location.lng }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(input.location, 'address')
              ? { address: input.location.address }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(input.location, 'placeId')
              ? { placeId: input.location.placeId }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(input.location, 'radiusKm')
              ? { radiusKm: input.location.radiusKm }
              : {}),
          }
        : {};

      const categoriesUpdate:
        | Prisma.CategoryUpdateManyWithoutIntentsNestedInput
        | undefined =
        input.categorySlugs != null
          ? { set: input.categorySlugs.map((slug: string) => ({ slug })) }
          : undefined;

      const tagsUpdate:
        | Prisma.TagUpdateManyWithoutIntentsNestedInput
        | undefined =
        input.tagSlugs != null
          ? { set: input.tagSlugs.map((slug) => ({ slug })) }
          : undefined;

      const data: Prisma.IntentUpdateInput = {
        ...(typeof input.title === 'string' ? { title: input.title } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),

        ...(input.visibility !== undefined
          ? { visibility: input.visibility as PrismaVisibility }
          : {}),
        ...(input.addressVisibility !== undefined
          ? { addressVisibility: input.addressVisibility as AddressVisibility }
          : {}),
        ...(input.membersVisibility !== undefined
          ? { membersVisibility: input.membersVisibility as MembersVisibility }
          : {}),
        ...(input.joinMode !== undefined
          ? { joinMode: (input as any).joinMode }
          : {}),
        ...(input.mode !== undefined ? { mode: input.mode as PrismaMode } : {}),
        ...(typeof input.min === 'number' ? { min: input.min } : {}),
        ...(typeof input.max === 'number' ? { max: input.max } : {}),

        ...(input.startAt !== undefined
          ? { startAt: input.startAt as Date }
          : {}),
        ...(input.endAt !== undefined ? { endAt: input.endAt as Date } : {}),
        ...(typeof input.allowJoinLate === 'boolean'
          ? { allowJoinLate: input.allowJoinLate }
          : {}),
        ...(input.joinOpensMinutesBeforeStart !== undefined
          ? { joinOpensMinutesBeforeStart: input.joinOpensMinutesBeforeStart }
          : {}),
        ...(input.joinCutoffMinutesBeforeStart !== undefined
          ? { joinCutoffMinutesBeforeStart: input.joinCutoffMinutesBeforeStart }
          : {}),
        ...(input.lateJoinCutoffMinutesAfterStart !== undefined
          ? {
              lateJoinCutoffMinutesAfterStart:
                input.lateJoinCutoffMinutesAfterStart,
            }
          : {}),

        ...(input.meetingKind !== undefined
          ? { meetingKind: input.meetingKind as PrismaMeetingKind }
          : {}),
        ...(input.onlineUrl !== undefined
          ? { onlineUrl: input.onlineUrl }
          : {}),
        ...(input.levels !== undefined
          ? { levels: input.levels as PrismaLevel[] }
          : {}),

        ...(Object.prototype.hasOwnProperty.call(loc, 'lat')
          ? { lat: loc.lat }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(loc, 'lng')
          ? { lng: loc.lng }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(loc, 'address')
          ? { address: loc.address }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(loc, 'placeId')
          ? { placeId: loc.placeId }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(loc, 'radiusKm')
          ? { radiusKm: loc.radiusKm }
          : {}),

        ...(categoriesUpdate ? { categories: categoriesUpdate } : {}),
        ...(tagsUpdate ? { tags: tagsUpdate } : {}),
      };

      // Check if max is increasing
      const maxIncreased =
        typeof input.max === 'number' &&
        current?.max &&
        input.max > current.max;
      const slotsAdded = maxIncreased ? input.max! - current!.max : 0;

      const updated = await prisma.$transaction(async (tx) => {
        const intent = await tx.intent.update({
          where: { id },
          data,
          include: INTENT_INCLUDE,
        });

        // If max increased, try to promote people from waitlist
        if (maxIncreased && slotsAdded > 0) {
          await promoteMultipleFromWaitlist(tx, id, slotsAdded);
        }

        return intent;
      });

      if (
        updated.mode === 'ONE_TO_ONE' &&
        !(updated.min === 2 && updated.max === 2)
      ) {
        throw new GraphQLError('ONE_TO_ONE intents must have min = max = 2.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      // reminders
      if (typeof input.startAt !== 'undefined') {
        try {
          await rescheduleReminders(updated.id, updated.startAt);
        } catch {
          // nie blokuj mutacji
        }
      }

      // Reschedule feedback if endAt changed
      if (typeof input.endAt !== 'undefined' && updated.endAt) {
        try {
          await rescheduleFeedbackRequest(updated.id, updated.endAt);
        } catch {
          // Don't block mutation if feedback rescheduling fails
        }
      }

      // publish INTENT_UPDATED
      if (recipients.length > 0) {
        const dedupeStamp = updated.updatedAt.toISOString();
        await prisma.notification.createMany({
          data: recipients.map((recipientId) => ({
            kind: PrismaNotificationKind.INTENT_UPDATED,
            recipientId,
            actorId: user?.id ?? null,
            entityType: PrismaNotificationEntity.INTENT,
            entityId: id,
            intentId: id,
            title: 'Meeting updated',
            body: 'Organizer updated meeting details.',
            createdAt: new Date(),
            dedupeKey: `intent_updated:${recipientId}:${id}:${dedupeStamp}`,
          })),
          skipDuplicates: true,
        });

        await Promise.all(
          recipients.map(async (recipientId) => {
            const n = await prisma.notification.findFirst({
              where: {
                recipientId,
                intentId: id,
                kind: PrismaNotificationKind.INTENT_UPDATED,
                dedupeKey: `intent_updated:${recipientId}:${id}:${dedupeStamp}`,
              },
              orderBy: { createdAt: 'desc' },
              include: NOTIFICATION_INCLUDE,
            });
            if (n) {
              await pubsub?.publish({
                topic: `NOTIFICATION_ADDED:${recipientId}`,
                payload: { notificationAdded: mapNotification(n) },
              });
            }
            await pubsub?.publish({
              topic: `NOTIFICATION_BADGE:${recipientId}`,
              payload: { notificationBadgeChanged: { recipientId } },
            });
          })
        );
      }

      return mapIntent(updated, user?.id);
    }
  );

/** Cancel Intent – sprzątanie reminders + publikacje */
// todo: can be canceled only by owner
export const cancelIntentMutation: MutationResolvers['cancelIntent'] =
  resolverWithMetrics(
    'Mutation',
    'cancelIntent',
    async (_p, { id, reason }, { user, pubsub }) => {
      const actorId = user?.id;
      if (!actorId) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const intent = await prisma.intent.findUnique({
        where: { id },
        include: { members: { select: { userId: true, status: true } } },
      });
      if (!intent) {
        throw new GraphQLError('Intent not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      if (intent.deletedAt) {
        throw new GraphQLError('Intent is deleted.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }
      if (intent.canceledAt) {
        const full = await prisma.intent.findUniqueOrThrow({
          where: { id },
          include: INTENT_INCLUDE,
        });
        return mapIntent(full, user.id);
      }

      const recipients = intent.members
        .filter((m) => ['JOINED', 'PENDING', 'INVITED'].includes(m.status))
        .map((m) => m.userId);

      const full = await prisma.$transaction(async (tx) => {
        const updated = await tx.intent.update({
          where: { id },
          data: {
            canceledAt: new Date(),
            canceledById: actorId,
            cancelReason: reason ?? null,
          },
          include: INTENT_INCLUDE,
        });

        try {
          await clearReminders(id);
        } catch {
          // swallow
        }

        // Clear feedback requests
        try {
          await clearFeedbackRequest(id);
        } catch {
          // swallow
        }

        if (recipients.length > 0) {
          await tx.notification.createMany({
            data: recipients.map((recipientId) => ({
              kind: PrismaNotificationKind.INTENT_CANCELED,
              recipientId,
              actorId,
              entityType: PrismaNotificationEntity.INTENT,
              entityId: id,
              intentId: id,
              title: 'Meeting canceled',
              body:
                reason && reason.trim().length > 0
                  ? `Organizer’s note: ${reason}`
                  : null,
              createdAt: new Date(),
              dedupeKey: `intent_canceled:${recipientId}:${id}`,
            })),
            skipDuplicates: true,
          });

          await Promise.all(
            recipients.map(async (recipientId) => {
              const notification = await prisma.notification.findFirst({
                where: {
                  recipientId,
                  intentId: id,
                  kind: PrismaNotificationKind.INTENT_CANCELED,
                },
                orderBy: { createdAt: 'desc' },
                include: NOTIFICATION_INCLUDE,
              });
              if (notification) {
                await pubsub?.publish({
                  topic: `NOTIFICATION_ADDED:${recipientId}`,
                  payload: { notificationAdded: mapNotification(notification) },
                });
                await pubsub?.publish({
                  topic: `NOTIFICATION_BADGE:${recipientId}`,
                  payload: { notificationBadgeChanged: { recipientId } },
                });
              }
            })
          );
        }

        return updated;
      });

      return mapIntent(full, user.id);
    }
  );

/** Delete Intent (SOFT) — z publikacją INTENT_DELETED */
// todo: can be deleted only by owner
export const deleteIntentMutation: MutationResolvers['deleteIntent'] =
  resolverWithMetrics(
    'Mutation',
    'deleteIntent',
    async (_p, { id }, { user, pubsub }) => {
      const actorId = user?.id ?? null;
      if (!actorId) {
        throw new GraphQLError(
          'actorId is required or an authenticated user must be present.',
          {
            extensions: { code: 'UNAUTHENTICATED' },
          }
        );
      }

      const row = await prisma.intent.findUnique({
        where: { id },
        select: { canceledAt: true, deletedAt: true },
      });
      if (!row)
        throw new GraphQLError('Intent not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      if (row.deletedAt) return true;
      if (!row.canceledAt) {
        throw new GraphQLError('Intent must be canceled before deletion.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }
      const age = Date.now() - new Date(row.canceledAt).getTime();
      if (age < THIRTY_DAYS_MS) {
        throw new GraphQLError(
          'Intent can be deleted 30 days after cancellation.',
          {
            extensions: { code: 'FAILED_PRECONDITION' },
          }
        );
      }

      const members = await prisma.intentMember.findMany({
        where: {
          intentId: id,
          status: { in: ['JOINED', 'PENDING', 'INVITED'] },
        },
        select: { userId: true },
      });
      const recipients = members.map((m) => m.userId);

      await prisma.intent.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: actorId,
          deleteReason: null,
        },
      });

      if (recipients.length > 0) {
        const dedupe = `intent_deleted:${Date.now()}`;

        await prisma.notification.createMany({
          data: recipients.map((recipientId) => ({
            kind: PrismaNotificationKind.INTENT_DELETED,
            recipientId,
            actorId,
            entityType: PrismaNotificationEntity.INTENT,
            entityId: id,
            intentId: id,
            title: 'Meeting deleted',
            body: null,
            createdAt: new Date(),
            dedupeKey: `${dedupe}:${recipientId}:${id}`,
          })),
          skipDuplicates: true,
        });

        await Promise.all(
          recipients.map(async (recipientId) => {
            const n = await prisma.notification.findFirst({
              where: {
                recipientId,
                intentId: id,
                kind: PrismaNotificationKind.INTENT_DELETED,
                dedupeKey: `${dedupe}:${recipientId}:${id}`,
              },
              orderBy: { createdAt: 'desc' },
              include: NOTIFICATION_INCLUDE,
            });
            if (n) {
              await pubsub?.publish({
                topic: `NOTIFICATION_ADDED:${recipientId}`,
                payload: { notificationAdded: mapNotification(n) },
              });
            }
            await pubsub?.publish({
              topic: `NOTIFICATION_BADGE:${recipientId}`,
              payload: { notificationBadgeChanged: { recipientId } },
            });
          })
        );
      }

      // Clear reminders and feedback
      try {
        await clearReminders(id);
      } catch {
        // swallow
      }
      try {
        await clearFeedbackRequest(id);
      } catch {
        // swallow
      }

      return true;
    }
  );

/** Close Intent Join — ręczne zamknięcie zapisów */
export const closeIntentJoinMutation: MutationResolvers['closeIntentJoin'] =
  resolverWithMetrics(
    'Mutation',
    'closeIntentJoin',
    async (_p, { intentId, reason }, { user }) => {
      const actorId = user?.id ?? null;
      if (!actorId) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Sprawdź czy intent istnieje i czy user jest owner/moderator/admin
      const intent = await prisma.intent.findUnique({
        where: { id: intentId },
        include: {
          members: {
            where: { userId: actorId },
            select: { role: true },
          },
        },
      });

      if (!intent) {
        throw new GraphQLError('Intent not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (intent.deletedAt) {
        throw new GraphQLError('Intent is deleted.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      // Sprawdź uprawnienia: owner, moderator lub admin
      const isOwner = intent.ownerId === actorId;
      const isModerator = intent.members.some(
        (m) => m.role === 'MODERATOR' || m.role === 'OWNER'
      );
      const isAdmin = user?.role === 'ADMIN';

      if (!isOwner && !isModerator && !isAdmin) {
        throw new GraphQLError(
          'Only owner, moderator or admin can close join.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }

      // Zamknij zapisy
      const updated = await prisma.intent.update({
        where: { id: intentId },
        data: {
          joinManuallyClosed: true,
          joinManuallyClosedAt: new Date(),
          joinManuallyClosedById: actorId,
          joinManualCloseReason: reason ?? null,
        },
        include: INTENT_INCLUDE,
      });

      return mapIntent(updated, actorId);
    }
  );

/** Reopen Intent Join — ponowne otwarcie zapisów */
export const reopenIntentJoinMutation: MutationResolvers['reopenIntentJoin'] =
  resolverWithMetrics(
    'Mutation',
    'reopenIntentJoin',
    async (_p, { intentId }, { user }) => {
      const actorId = user?.id ?? null;
      if (!actorId) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Sprawdź czy intent istnieje i czy user jest owner/moderator/admin
      const intent = await prisma.intent.findUnique({
        where: { id: intentId },
        include: {
          members: {
            where: { userId: actorId },
            select: { role: true },
          },
        },
      });

      if (!intent) {
        throw new GraphQLError('Intent not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (intent.deletedAt) {
        throw new GraphQLError('Intent is deleted.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      // Sprawdź uprawnienia: owner, moderator lub admin
      const isOwner = intent.ownerId === actorId;
      const isModerator = intent.members.some(
        (m) => m.role === 'MODERATOR' || m.role === 'OWNER'
      );
      const isAdmin = user?.role === 'ADMIN';

      if (!isOwner && !isModerator && !isAdmin) {
        throw new GraphQLError(
          'Only owner, moderator or admin can reopen join.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }

      // Otwórz zapisy ponownie
      const updated = await prisma.intent.update({
        where: { id: intentId },
        data: {
          joinManuallyClosed: false,
          joinManuallyClosedAt: null,
          joinManuallyClosedById: null,
          joinManualCloseReason: null,
        },
        include: INTENT_INCLUDE,
      });

      return mapIntent(updated, actorId);
    }
  );
