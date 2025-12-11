import type {
  AddressVisibility,
  EventPlan,
  MembersVisibility,
  Prisma,
} from '@prisma/client';
import {
  EventMemberRole,
  EventMemberStatus,
  JoinMode as PrismaJoinMode,
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
  CreateEventInput,
  Event as GQLEvent,
  MutationResolvers,
  UpdateEventInput,
} from '../../__generated__/resolvers-types';
import { mapEvent, mapNotification, pickLocation } from '../helpers';
import {
  requireEventModOrOwnerOrAppMod,
  requireEventOwnerOrAdmin,
  type AuthCheckUser,
} from '../shared/auth-guards';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_START_BUFFER_MS = 5 * 60 * 1000; // >= now + 5 min

/**
 * Notification include for event-related notifications.
 */
const NOTIFICATION_INCLUDE = {
  recipient: true,
  actor: true,
  event: {
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

/**
 * Event include for mutations.
 */
const EVENT_INCLUDE = {
  categories: true,
  tags: true,
  members: {
    include: {
      user: { include: { profile: true } },
      addedBy: { include: { profile: true } },
    },
  },
  owner: { include: { profile: true } },
  canceledBy: { include: { profile: true } },
  deletedBy: { include: { profile: true } },
  sponsorship: {
    include: {
      sponsor: { include: { profile: true } },
    },
  },
} satisfies Prisma.EventInclude;

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

/** NEW: validate capacity ranges based on mode */
function assertCapacity(input: {
  mode: string;
  min: number | null;
  max: number | null;
}) {
  const { mode, min, max } = input;

  // Mode-specific constraints
  if (mode === 'ONE_TO_ONE') {
    if (min !== 2 || max !== 2) {
      throw new GraphQLError('ONE_TO_ONE mode requires min=2 and max=2', {
        extensions: { code: 'BAD_USER_INPUT', field: 'mode' },
      });
    }
  } else if (mode === 'GROUP') {
    if (min === null || min < 1) {
      throw new GraphQLError('GROUP mode requires min >= 1', {
        extensions: { code: 'BAD_USER_INPUT', field: 'min' },
      });
    }
    if (max === null || max > 50) {
      throw new GraphQLError('GROUP mode requires max <= 50', {
        extensions: { code: 'BAD_USER_INPUT', field: 'max' },
      });
    }
  } else if (mode === 'CUSTOM') {
    // CUSTOM mode: validate ranges
    if (min !== null && (min < 1 || min > 99999)) {
      throw new GraphQLError('min must be between 1 and 99999', {
        extensions: { code: 'BAD_USER_INPUT', field: 'min' },
      });
    }
    if (max !== null && (max < 1 || max > 99999)) {
      throw new GraphQLError('max must be between 1 and 99999', {
        extensions: { code: 'BAD_USER_INPUT', field: 'max' },
      });
    }
    if (min !== null && max !== null && min > max) {
      throw new GraphQLError('min must be ≤ max', {
        extensions: { code: 'BAD_USER_INPUT', field: 'min' },
      });
    }
  }
}

/**
 * Validate join windows/cutoffs
 */
function assertJoinWindows(input: Record<string, unknown>) {
  const allowJoinLate = input.allowJoinLate as boolean | null | undefined;
  const joinOpensMinutesBeforeStart = input.joinOpensMinutesBeforeStart as
    | number
    | null
    | undefined;
  const joinCutoffMinutesBeforeStart = input.joinCutoffMinutesBeforeStart as
    | number
    | null
    | undefined;
  const lateJoinCutoffMinutesAfterStart =
    input.lateJoinCutoffMinutesAfterStart as number | null | undefined;

  // All minutes must be >= 0
  if (joinOpensMinutesBeforeStart != null && joinOpensMinutesBeforeStart < 0) {
    throw new GraphQLError('`joinOpensMinutesBeforeStart` must be >= 0.', {
      extensions: {
        code: 'BAD_USER_INPUT',
        field: 'joinOpensMinutesBeforeStart',
      },
    });
  }
  if (
    joinCutoffMinutesBeforeStart != null &&
    joinCutoffMinutesBeforeStart < 0
  ) {
    throw new GraphQLError('`joinCutoffMinutesBeforeStart` must be >= 0.', {
      extensions: {
        code: 'BAD_USER_INPUT',
        field: 'joinCutoffMinutesBeforeStart',
      },
    });
  }
  if (
    lateJoinCutoffMinutesAfterStart != null &&
    lateJoinCutoffMinutesAfterStart < 0
  ) {
    throw new GraphQLError('`lateJoinCutoffMinutesAfterStart` must be >= 0.', {
      extensions: {
        code: 'BAD_USER_INPUT',
        field: 'lateJoinCutoffMinutesAfterStart',
      },
    });
  }

  // If allowJoinLate=false => lateJoinCutoffMinutesAfterStart must be null
  if (allowJoinLate === false && lateJoinCutoffMinutesAfterStart != null) {
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
    joinOpensMinutesBeforeStart != null &&
    joinOpensMinutesBeforeStart > MAX_MINUTES
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
    joinCutoffMinutesBeforeStart != null &&
    joinCutoffMinutesBeforeStart > MAX_MINUTES
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
    lateJoinCutoffMinutesAfterStart != null &&
    lateJoinCutoffMinutesAfterStart > MAX_MINUTES
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

function assertCreateInput(
  input: CreateEventInput,
  computedMin: number | null,
  computedMax: number | null
) {
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

  // capacity validation (unified for all modes) - use computed values
  assertCapacity({
    mode: input.mode,
    min: computedMin,
    max: computedMax,
  });

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

function assertUpdateInput(input: UpdateEventInput) {
  // null-protection on immutable-ish scalars
  if (input.title === null)
    throw new GraphQLError('`title` cannot be null.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'title' },
    });

  // NOTE: min and max can be null in CUSTOM mode, so we don't reject null here
  // The assertCapacity function will validate them based on mode

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

function assertNotReadOnly(event: {
  canceledAt: Date | null;
  deletedAt: Date | null;
}) {
  if (event.deletedAt) {
    throw new GraphQLError('Event is deleted.', {
      extensions: { code: 'FAILED_PRECONDITION' },
    });
  }
  if (event.canceledAt) {
    throw new GraphQLError('Event is canceled and read-only.', {
      extensions: { code: 'FAILED_PRECONDITION' },
    });
  }
}

/* ───────────────────────────── Mutations ───────────────────────────── */

/** Create Event */
export const createEventMutation: MutationResolvers['createEvent'] =
  resolverWithMetrics(
    'Mutation',
    'createEvent',
    async (_p, { input }, { user, pubsub }): Promise<GQLEvent> => {
      const ownerId = user?.id;
      if (!ownerId) {
        throw new GraphQLError(
          'ownerId is required or an authenticated user must be present.',
          {
            extensions: { code: 'UNAUTHENTICATED' },
          }
        );
      }

      // Set default min/max based on mode if not provided
      const mode = input.mode as PrismaMode;
      let min = input.min;
      let max = input.max;

      if (min === undefined || min === null) {
        if (mode === PrismaMode.ONE_TO_ONE) {
          min = 2;
        } else if (mode === PrismaMode.GROUP) {
          min = 1;
        }
        // CUSTOM mode: min can be null (no default)
      }

      if (max === undefined || max === null) {
        if (mode === PrismaMode.ONE_TO_ONE) {
          max = 2;
        } else if (mode === PrismaMode.GROUP) {
          max = 50;
        }
        // CUSTOM mode: max can be null (no default)
      }

      assertCreateInput(input, min, max);

      const loc = pickLocation(input.location) ?? {};

      const categoriesData: Prisma.CategoryCreateNestedManyWithoutEventsInput =
        {
          connect: input.categorySlugs.map((slug: string) => ({ slug })),
        };

      // Get user's effective plan to inherit for the event
      const userPlanInfo = await getUserEffectivePlan(ownerId);
      const inheritedPlan: EventPlan = userPlanInfo.plan as EventPlan;

      const full = await prisma.$transaction(async (tx) => {
        const event = await tx.event.create({
          data: {
            // Publication status - new events start as DRAFT
            status: 'DRAFT',

            // Required fields from input
            title: input.title,
            startAt: input.startAt as Date,
            endAt: input.endAt as Date,

            // Optional fields from input
            description: input.description ?? null,
            meetingKind: input.meetingKind as PrismaMeetingKind,
            onlineUrl: input.onlineUrl ?? null,

            // Capacity
            mode: mode,
            min: min,
            max: max,

            // Privacy
            visibility: (input.visibility ??
              PrismaVisibility.PUBLIC) as PrismaVisibility,
            joinMode: ('joinMode' in input
              ? input.joinMode
              : 'OPEN') as PrismaJoinMode,

            // Defaults for fields not in simplified CreateEventInput
            // (can be updated later via UpdateEvent in manage panel)
            notes: null,
            levels: [] as PrismaLevel[],
            addressVisibility: 'PUBLIC' as AddressVisibility,
            membersVisibility: 'PUBLIC' as MembersVisibility,
            allowJoinLate: true,
            joinOpensMinutesBeforeStart: null,
            joinCutoffMinutesBeforeStart: null,
            lateJoinCutoffMinutesAfterStart: null,

            ownerId,

            // Inherit user's plan
            sponsorshipPlan: inheritedPlan,

            ...loc,
            categories: categoriesData,
          },
        });

        await tx.eventMember.create({
          data: {
            eventId: event.id,
            userId: ownerId,
            role: 'OWNER',
            status: 'JOINED',
            joinedAt: new Date(),
          },
        });

        // Create EventSponsorship if user has PLUS or PRO plan
        if (inheritedPlan === 'PLUS' || inheritedPlan === 'PRO') {
          await tx.eventSponsorship.create({
            data: {
              eventId: event.id,
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
            kind: PrismaNotificationKind.EVENT_CREATED,
            title: null,
            body: null,
            entityType: PrismaNotificationEntity.EVENT,
            entityId: event.id,
            eventId: event.id,
            recipientId: ownerId,
            actorId: ownerId,
            data: {
              eventId: event.id,
              eventTitle: event.title,
              startAt: event.startAt,
            } as Prisma.InputJsonValue,
            dedupeKey: `event_created:${ownerId}:${event.id}`,
          },
          include: NOTIFICATION_INCLUDE,
        });

        await pubsub?.publish({
          topic: `NOTIFICATION_ADDED:${notification.recipientId}`,
          payload: { notificationAdded: mapNotification(notification) },
        });

        // Reminders (24h..15m)
        try {
          await enqueueReminders(event.id, event.startAt);
        } catch {
          // loguj w workerze/metrics; nie blokuj transakcji
        }

        // Feedback request (scheduled after event ends)
        try {
          await enqueueFeedbackRequest(event.id, event.endAt);
        } catch {
          // Don't block transaction if feedback scheduling fails
        }

        const fullEvent = await tx.event.findUniqueOrThrow({
          where: { id: event.id },
          include: EVENT_INCLUDE,
        });

        return fullEvent;
      });

      return mapEvent(full, user.id);
    }
  );

/**
 * Update Event (publikacja EVENT_UPDATED + reschedule reminders)
 * Required level: EVENT_MOD_OR_OWNER or APP_MOD_OR_ADMIN
 */
export const updateEventMutation: MutationResolvers['updateEvent'] =
  resolverWithMetrics(
    'Mutation',
    'updateEvent',
    async (_p, { id, input }, { user, pubsub }): Promise<GQLEvent> => {
      const ownerId = user?.id;
      if (!ownerId) {
        throw new GraphQLError(
          'ownerId is required or an authenticated user must be present.',
          {
            extensions: { code: 'UNAUTHENTICATED' },
          }
        );
      }

      // Check authorization: EVENT_MOD_OR_OWNER or APP_MOD_OR_ADMIN
      await requireEventModOrOwnerOrAppMod(user, id);

      assertUpdateInput(input);

      const current = await prisma.event.findUnique({
        where: { id },
        select: {
          canceledAt: true,
          deletedAt: true,
          title: true,
          description: true,
          notes: true,
          startAt: true,
          endAt: true,
          mode: true,
          min: true,
          max: true,
          address: true,
          onlineUrl: true,
          meetingKind: true,
          visibility: true,
          joinMode: true,
          levels: true,
          addressVisibility: true,
          membersVisibility: true,
          joinOpensMinutesBeforeStart: true,
          joinCutoffMinutesBeforeStart: true,
          allowJoinLate: true,
          lateJoinCutoffMinutesAfterStart: true,
          categories: { select: { slug: true } },
          tags: { select: { slug: true } },
        },
      });
      if (!current) {
        throw new GraphQLError('Event not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      assertNotReadOnly(current);

      // Validate capacity with merged values (use existing if not provided in input)
      if (
        input.mode !== undefined ||
        input.min !== undefined ||
        input.max !== undefined
      ) {
        assertCapacity({
          mode: (input.mode ?? current.mode) as string,
          min: input.min !== undefined ? input.min : current.min,
          max: input.max !== undefined ? input.max : current.max,
        });
      }

      // odbiorcy przed update
      const members = await prisma.eventMember.findMany({
        where: {
          eventId: id,
          status: {
            in: [
              EventMemberStatus.JOINED,
              EventMemberStatus.PENDING,
              EventMemberStatus.INVITED,
              EventMemberStatus.WAITLIST,
            ],
          },
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
        | Prisma.CategoryUpdateManyWithoutEventsNestedInput
        | undefined =
        input.categorySlugs != null
          ? { set: input.categorySlugs.map((slug: string) => ({ slug })) }
          : undefined;

      const tagsUpdate:
        | Prisma.TagUpdateManyWithoutEventsNestedInput
        | undefined =
        input.tagSlugs != null
          ? { set: input.tagSlugs.map((slug) => ({ slug })) }
          : undefined;

      const data: Prisma.EventUpdateInput = {
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
          ? { joinMode: input.joinMode as PrismaJoinMode }
          : {}),
        ...(input.mode !== undefined ? { mode: input.mode as PrismaMode } : {}),
        ...(input.min !== undefined ? { min: input.min } : {}),
        ...(input.max !== undefined ? { max: input.max } : {}),

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
      const slotsAdded = maxIncreased ? input.max! - (current!.max ?? 0) : 0;

      const updated = await prisma.$transaction(async (tx) => {
        const event = await tx.event.update({
          where: { id },
          data,
          include: EVENT_INCLUDE,
        });

        // If max increased, try to promote people from waitlist
        if (maxIncreased && slotsAdded > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await promoteMultipleFromWaitlist(tx as any, id, slotsAdded);
        }

        return event;
      });

      if (
        updated.mode === 'ONE_TO_ONE' &&
        !(updated.min === 2 && updated.max === 2)
      ) {
        throw new GraphQLError('ONE_TO_ONE events must have min = max = 2.', {
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

      // publish EVENT_UPDATED
      if (recipients.length > 0) {
        const dedupeStamp = updated.updatedAt.toISOString();

        // Track what changed
        const changedFields: string[] = [];

        // Basic info
        if (input.title !== undefined && input.title !== current.title) {
          changedFields.push('title');
        }
        if (
          input.description !== undefined &&
          input.description !== current.description
        ) {
          changedFields.push('description');
        }
        if (input.notes !== undefined && input.notes !== current.notes) {
          changedFields.push('notes');
        }

        // Time
        if (
          input.startAt !== undefined &&
          new Date(input.startAt as Date).getTime() !==
            current.startAt?.getTime()
        ) {
          changedFields.push('startAt');
        }
        if (
          input.endAt !== undefined &&
          new Date(input.endAt as Date).getTime() !== current.endAt?.getTime()
        ) {
          changedFields.push('endAt');
        }

        // Location
        if (
          input.location?.address !== undefined &&
          input.location.address !== current.address
        ) {
          changedFields.push('address');
        }
        if (
          input.onlineUrl !== undefined &&
          input.onlineUrl !== current.onlineUrl
        ) {
          changedFields.push('onlineUrl');
        }
        if (
          input.meetingKind !== undefined &&
          input.meetingKind !== current.meetingKind
        ) {
          changedFields.push('meetingKind');
        }

        // Capacity
        if (input.min !== undefined && input.min !== current.min) {
          changedFields.push('min');
        }
        if (input.max !== undefined && input.max !== current.max) {
          changedFields.push('max');
        }

        // Visibility & Access
        if (
          input.visibility !== undefined &&
          input.visibility !== current.visibility
        ) {
          changedFields.push('visibility');
        }
        if (
          input.joinMode !== undefined &&
          input.joinMode !== current.joinMode
        ) {
          changedFields.push('joinMode');
        }
        if (
          input.addressVisibility !== undefined &&
          input.addressVisibility !== current.addressVisibility
        ) {
          changedFields.push('addressVisibility');
        }
        if (
          input.membersVisibility !== undefined &&
          input.membersVisibility !== current.membersVisibility
        ) {
          changedFields.push('membersVisibility');
        }

        // Join timing
        if (
          input.joinOpensMinutesBeforeStart !== undefined &&
          input.joinOpensMinutesBeforeStart !==
            current.joinOpensMinutesBeforeStart
        ) {
          changedFields.push('joinOpensMinutesBeforeStart');
        }
        if (
          input.joinCutoffMinutesBeforeStart !== undefined &&
          input.joinCutoffMinutesBeforeStart !==
            current.joinCutoffMinutesBeforeStart
        ) {
          changedFields.push('joinCutoffMinutesBeforeStart');
        }
        if (
          input.allowJoinLate !== undefined &&
          input.allowJoinLate !== current.allowJoinLate
        ) {
          changedFields.push('allowJoinLate');
        }
        if (
          input.lateJoinCutoffMinutesAfterStart !== undefined &&
          input.lateJoinCutoffMinutesAfterStart !==
            current.lateJoinCutoffMinutesAfterStart
        ) {
          changedFields.push('lateJoinCutoffMinutesAfterStart');
        }

        // Levels
        if (input.levels !== undefined) {
          const currentLevels = (current.levels || []).sort().join(',');
          const newLevels = (input.levels || []).sort().join(',');
          if (currentLevels !== newLevels) {
            changedFields.push('levels');
          }
        }

        // Categories
        if (input.categorySlugs !== undefined) {
          const currentCategories = current.categories
            .map((c) => c.slug)
            .sort()
            .join(',');
          const newCategories = (input.categorySlugs || []).sort().join(',');
          if (currentCategories !== newCategories) {
            changedFields.push('categories');
          }
        }

        // Tags
        if (input.tagSlugs !== undefined) {
          const currentTags = current.tags
            .map((t) => t.slug)
            .sort()
            .join(',');
          const newTags = (input.tagSlugs || []).sort().join(',');
          if (currentTags !== newTags) {
            changedFields.push('tags');
          }
        }

        // Create notification data with changes
        const notificationData = {
          eventId: id,
          eventTitle: updated.title,
          changedFields,
          changes: {
            ...(changedFields.includes('startAt')
              ? {
                  startAt: {
                    old: current.startAt?.toISOString(),
                    new: updated.startAt?.toISOString(),
                  },
                }
              : {}),
            ...(changedFields.includes('endAt')
              ? {
                  endAt: {
                    old: current.endAt?.toISOString(),
                    new: updated.endAt?.toISOString(),
                  },
                }
              : {}),
            ...(changedFields.includes('address')
              ? { address: { old: current.address, new: updated.address } }
              : {}),
            ...(changedFields.includes('max')
              ? { max: { old: current.max, new: updated.max } }
              : {}),
          },
        };

        await prisma.notification.createMany({
          data: recipients.map((recipientId) => ({
            kind: PrismaNotificationKind.EVENT_UPDATED,
            recipientId,
            actorId: user?.id ?? null,
            entityType: PrismaNotificationEntity.EVENT,
            entityId: id,
            eventId: id,
            title: null, // Use translation
            body: null, // Use translation with data
            data: notificationData,
            createdAt: new Date(),
            dedupeKey: `event_updated:${recipientId}:${id}:${dedupeStamp}`,
          })),
          skipDuplicates: true,
        });

        await Promise.all(
          recipients.map(async (recipientId) => {
            const n = await prisma.notification.findFirst({
              where: {
                recipientId,
                eventId: id,
                kind: PrismaNotificationKind.EVENT_UPDATED,
                dedupeKey: `event_updated:${recipientId}:${id}:${dedupeStamp}`,
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

      return mapEvent(updated, user?.id);
    }
  );

/**
 * Cancel Event – sprzątanie reminders + publikacje
 * Required level: EVENT_MOD_OR_OWNER or APP_MOD_OR_ADMIN
 */
export const cancelEventMutation: MutationResolvers['cancelEvent'] =
  resolverWithMetrics(
    'Mutation',
    'cancelEvent',
    async (_p, { id, reason }, { user, pubsub }) => {
      const actorId = user?.id;
      if (!actorId) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Check authorization: EVENT_MOD_OR_OWNER or APP_MOD_OR_ADMIN
      await requireEventModOrOwnerOrAppMod(user, id);

      const event = await prisma.event.findUnique({
        where: { id },
        include: { members: { select: { userId: true, status: true } } },
      });
      if (!event) {
        throw new GraphQLError('Event not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      if (event.deletedAt) {
        throw new GraphQLError('Event is deleted.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }
      if (event.canceledAt) {
        const full = await prisma.event.findUniqueOrThrow({
          where: { id },
          include: EVENT_INCLUDE,
        });
        return mapEvent(full, user.id);
      }

      const recipients = event.members
        .filter((m) => ['JOINED', 'PENDING', 'INVITED'].includes(m.status))
        .map((m) => m.userId);

      const full = await prisma.$transaction(async (tx) => {
        const updated = await tx.event.update({
          where: { id },
          data: {
            canceledAt: new Date(),
            canceledById: actorId,
            cancelReason: reason ?? null,
          },
          include: EVENT_INCLUDE,
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
              kind: PrismaNotificationKind.EVENT_CANCELED,
              recipientId,
              actorId,
              entityType: PrismaNotificationEntity.EVENT,
              entityId: id,
              eventId: id,
              title: 'Meeting canceled',
              body:
                reason && reason.trim().length > 0
                  ? `Organizer’s note: ${reason}`
                  : null,
              createdAt: new Date(),
              dedupeKey: `event_canceled:${recipientId}:${id}`,
            })),
            skipDuplicates: true,
          });

          await Promise.all(
            recipients.map(async (recipientId) => {
              const notification = await prisma.notification.findFirst({
                where: {
                  recipientId,
                  eventId: id,
                  kind: PrismaNotificationKind.EVENT_CANCELED,
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

      return mapEvent(full, user.id);
    }
  );

/**
 * Delete Event (SOFT) — z publikacją EVENT_DELETED
 * Required level: EVENT_OWNER or ADMIN_ONLY
 */
export const deleteEventMutation: MutationResolvers['deleteEvent'] =
  resolverWithMetrics(
    'Mutation',
    'deleteEvent',
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

      // Check authorization: EVENT_OWNER or ADMIN_ONLY
      await requireEventOwnerOrAdmin(user, id);

      const row = await prisma.event.findUnique({
        where: { id },
        select: { canceledAt: true, deletedAt: true },
      });
      if (!row)
        throw new GraphQLError('Event not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      if (row.deletedAt) return true;
      if (!row.canceledAt) {
        throw new GraphQLError('Event must be canceled before deletion.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }
      const age = Date.now() - new Date(row.canceledAt).getTime();
      if (age < THIRTY_DAYS_MS) {
        throw new GraphQLError(
          'Event can be deleted 30 days after cancellation.',
          {
            extensions: { code: 'FAILED_PRECONDITION' },
          }
        );
      }

      const members = await prisma.eventMember.findMany({
        where: {
          eventId: id,
          status: {
            in: [
              EventMemberStatus.WAITLIST,
              EventMemberStatus.PENDING,
              EventMemberStatus.INVITED,
              EventMemberStatus.JOINED,
            ],
          },
        },
        select: { userId: true },
      });
      const recipients = members.map((m) => m.userId);

      await prisma.event.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: actorId,
          deleteReason: null,
        },
      });

      if (recipients.length > 0) {
        const dedupe = `event_deleted:${Date.now()}`;

        await prisma.notification.createMany({
          data: recipients.map((recipientId) => ({
            kind: PrismaNotificationKind.EVENT_DELETED,
            recipientId,
            actorId,
            entityType: PrismaNotificationEntity.EVENT,
            entityId: id,
            eventId: id,
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
                eventId: id,
                kind: PrismaNotificationKind.EVENT_DELETED,
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

/** Close Event Join — ręczne zamknięcie zapisów */
export const closeEventJoinMutation: MutationResolvers['closeEventJoin'] =
  resolverWithMetrics(
    'Mutation',
    'closeEventJoin',
    async (_p, { eventId, reason }, { user }) => {
      const actorId = user?.id ?? null;
      if (!actorId) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Sprawdź czy event istnieje i czy user jest owner/moderator/admin
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          members: {
            where: { userId: actorId },
            select: { role: true },
          },
        },
      });

      if (!event) {
        throw new GraphQLError('Event not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (event.deletedAt) {
        throw new GraphQLError('Event is deleted.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      // Sprawdź uprawnienia: owner, moderator lub admin
      const isOwner = event.ownerId === actorId;
      const isModerator = event.members.some(
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
      const updated = await prisma.event.update({
        where: { id: eventId },
        data: {
          joinManuallyClosed: true,
          joinManuallyClosedAt: new Date(),
          joinManuallyClosedById: actorId,
          joinManualCloseReason: reason ?? null,
        },
        include: EVENT_INCLUDE,
      });

      return mapEvent(updated, actorId);
    }
  );

/** Reopen Event Join — ponowne otwarcie zapisów */
export const reopenEventJoinMutation: MutationResolvers['reopenEventJoin'] =
  resolverWithMetrics(
    'Mutation',
    'reopenEventJoin',
    async (_p, { eventId }, { user }) => {
      const actorId = user?.id ?? null;
      if (!actorId) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Sprawdź czy event istnieje i czy user jest owner/moderator/admin
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          members: {
            where: { userId: actorId },
            select: { role: true },
          },
        },
      });

      if (!event) {
        throw new GraphQLError('Event not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (event.deletedAt) {
        throw new GraphQLError('Event is deleted.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      // Sprawdź uprawnienia: owner, moderator lub admin
      const isOwner = event.ownerId === actorId;
      const isModerator = event.members.some(
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
      const updated = await prisma.event.update({
        where: { id: eventId },
        data: {
          joinManuallyClosed: false,
          joinManuallyClosedAt: null,
          joinManuallyClosedById: null,
          joinManualCloseReason: null,
        },
        include: EVENT_INCLUDE,
      });

      return mapEvent(updated, actorId);
    }
  );

/* ───────────────────────────── Publication Management ───────────────────────────── */

/**
 * Helper to check if user can manage event publication
 * Required level: EVENT_MOD_OR_OWNER or APP_MOD_OR_ADMIN
 */
async function assertCanManagePublication(
  eventId: string,
  actorId: string,
  user: AuthCheckUser | null | undefined
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      members: {
        where: { userId: actorId },
        select: { role: true, status: true },
      },
    },
  });

  if (!event) {
    throw new GraphQLError('Event not found.', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  if (event.deletedAt) {
    throw new GraphQLError('Event is deleted.', {
      extensions: { code: 'FAILED_PRECONDITION' },
    });
  }

  if (event.canceledAt) {
    throw new GraphQLError('Event is canceled.', {
      extensions: { code: 'FAILED_PRECONDITION' },
    });
  }

  // Global ADMIN or MODERATOR always has access
  if (user?.role === 'ADMIN' || user?.role === 'MODERATOR') {
    return event;
  }

  const isOwner = event.ownerId === actorId;
  const isJoinedModerator = event.members.some(
    (m) =>
      m.status === EventMemberStatus.JOINED &&
      (m.role === EventMemberRole.MODERATOR || m.role === EventMemberRole.OWNER)
  );

  if (!isOwner && !isJoinedModerator) {
    throw new GraphQLError('Only owner or moderator can manage publication.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  return event;
}

/** Publish Event immediately (DRAFT/SCHEDULED -> PUBLISHED) */
export const publishEventMutation: MutationResolvers['publishEvent'] =
  resolverWithMetrics(
    'Mutation',
    'publishEvent',
    async (_p, { id }, { user }) => {
      const actorId = user?.id;
      if (!actorId) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const event = await assertCanManagePublication(id, actorId, user);

      if (event.status === 'PUBLISHED') {
        // Already published, return as-is
        const full = await prisma.event.findUniqueOrThrow({
          where: { id },
          include: EVENT_INCLUDE,
        });
        return mapEvent(full, actorId);
      }

      const updated = await prisma.event.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          scheduledPublishAt: null, // Clear any scheduled time
        },
        include: EVENT_INCLUDE,
      });

      // Enqueue reminders now that event is published
      try {
        await enqueueReminders(updated.id, updated.startAt);
      } catch {
        // swallow - reminders are not critical
      }

      return mapEvent(updated, actorId);
    }
  );

/**
 * Schedule Event publication for a specific time (DRAFT -> SCHEDULED)
 * Required level: EVENT_MOD_OR_OWNER or APP_MOD_OR_ADMIN
 */
export const scheduleEventPublicationMutation: MutationResolvers['scheduleEventPublication'] =
  resolverWithMetrics(
    'Mutation',
    'scheduleEventPublication',
    async (_p, { id, publishAt }, { user }) => {
      const actorId = user?.id;
      if (!actorId) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const event = await assertCanManagePublication(id, actorId, user);

      // Validate publishAt is in the future
      const publishDate = new Date(publishAt);
      if (publishDate.getTime() <= Date.now()) {
        throw new GraphQLError(
          'Scheduled publish time must be in the future.',
          {
            extensions: { code: 'BAD_USER_INPUT', field: 'publishAt' },
          }
        );
      }

      // Validate publishAt is before startAt
      if (publishDate.getTime() >= event.startAt.getTime()) {
        throw new GraphQLError(
          'Scheduled publish time must be before event start time.',
          {
            extensions: { code: 'BAD_USER_INPUT', field: 'publishAt' },
          }
        );
      }

      if (event.status === 'PUBLISHED') {
        throw new GraphQLError('Event is already published.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      const updated = await prisma.event.update({
        where: { id },
        data: {
          status: 'SCHEDULED',
          scheduledPublishAt: publishDate,
        },
        include: EVENT_INCLUDE,
      });

      return mapEvent(updated, actorId);
    }
  );

/**
 * Cancel scheduled publication (SCHEDULED -> DRAFT)
 * Required level: EVENT_MOD_OR_OWNER or APP_MOD_OR_ADMIN
 */
export const cancelScheduledPublicationMutation: MutationResolvers['cancelScheduledPublication'] =
  resolverWithMetrics(
    'Mutation',
    'cancelScheduledPublication',
    async (_p, { id }, { user }) => {
      const actorId = user?.id;
      if (!actorId) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const event = await assertCanManagePublication(id, actorId, user);

      if (event.status !== 'SCHEDULED') {
        throw new GraphQLError('Event is not scheduled for publication.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      const updated = await prisma.event.update({
        where: { id },
        data: {
          status: 'DRAFT',
          scheduledPublishAt: null,
        },
        include: EVENT_INCLUDE,
      });

      return mapEvent(updated, actorId);
    }
  );

/**
 * Unpublish Event (PUBLISHED -> DRAFT)
 * Required level: EVENT_MOD_OR_OWNER or APP_MOD_OR_ADMIN
 */
export const unpublishEventMutation: MutationResolvers['unpublishEvent'] =
  resolverWithMetrics(
    'Mutation',
    'unpublishEvent',
    async (_p, { id }, { user }) => {
      const actorId = user?.id;
      if (!actorId) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const event = await assertCanManagePublication(id, actorId, user);

      if (event.status === 'DRAFT') {
        // Already draft, return as-is
        const full = await prisma.event.findUniqueOrThrow({
          where: { id },
          include: EVENT_INCLUDE,
        });
        return mapEvent(full, actorId);
      }

      const updated = await prisma.event.update({
        where: { id },
        data: {
          status: 'DRAFT',
          scheduledPublishAt: null,
        },
        include: EVENT_INCLUDE,
      });

      // Clear reminders when unpublishing
      try {
        await clearReminders(id);
      } catch {
        // swallow
      }

      return mapEvent(updated, actorId);
    }
  );
