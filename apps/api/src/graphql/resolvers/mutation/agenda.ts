/**
 * Agenda Resolvers
 * Handles event agenda (slots with hosts)
 */

import { GraphQLError } from 'graphql';
import type {
  MutationResolvers,
  EventAgendaItem,
} from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';

const MAX_AGENDA_ITEMS = 50;
const MAX_HOSTS_PER_ITEM = 10;
const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_HOST_NAME_LENGTH = 120;

/**
 * Update (replace) all agenda items for an event
 * Only owner/moderators can update agenda
 * This is a bulk replace operation - all existing items are deleted and replaced
 */
export const updateEventAgendaMutation: MutationResolvers['updateEventAgenda'] =
  async (_parent, { input }, { user }) => {
    if (!user) {
      throw new GraphQLError('You must be logged in to update agenda', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const { eventId, items } = input;

    // Validate items count
    if (items.length > MAX_AGENDA_ITEMS) {
      throw new GraphQLError(
        `Cannot add more than ${MAX_AGENDA_ITEMS} agenda items`,
        {
          extensions: { code: 'BAD_USER_INPUT' },
        }
      );
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue; // Skip undefined items

      // Title validation
      if (!item.title || item.title.trim().length === 0) {
        throw new GraphQLError(`items[${i}].title: Title cannot be empty`, {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (item.title.trim().length < MIN_TITLE_LENGTH) {
        throw new GraphQLError(
          `items[${i}].title: Title must be at least ${MIN_TITLE_LENGTH} characters`,
          {
            extensions: { code: 'BAD_USER_INPUT' },
          }
        );
      }
      if (item.title.length > MAX_TITLE_LENGTH) {
        throw new GraphQLError(
          `items[${i}].title: Title cannot exceed ${MAX_TITLE_LENGTH} characters`,
          {
            extensions: { code: 'BAD_USER_INPUT' },
          }
        );
      }

      // Description validation
      if (
        item.description &&
        item.description.length > MAX_DESCRIPTION_LENGTH
      ) {
        throw new GraphQLError(
          `items[${i}].description: Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`,
          {
            extensions: { code: 'BAD_USER_INPUT' },
          }
        );
      }

      // Time validation: if one is set, both must be set
      if ((item.startAt && !item.endAt) || (!item.startAt && item.endAt)) {
        throw new GraphQLError(
          `items[${i}]: If startAt is set, endAt must also be set (and vice versa)`,
          {
            extensions: { code: 'BAD_USER_INPUT' },
          }
        );
      }

      // End must be after start
      if (item.startAt && item.endAt) {
        const start = new Date(item.startAt);
        const end = new Date(item.endAt);
        if (end <= start) {
          throw new GraphQLError(`items[${i}]: endAt must be after startAt`, {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
      }

      // Hosts validation
      if (item.hosts && item.hosts.length > MAX_HOSTS_PER_ITEM) {
        throw new GraphQLError(
          `items[${i}]: Cannot have more than ${MAX_HOSTS_PER_ITEM} hosts per item`,
          {
            extensions: { code: 'BAD_USER_INPUT' },
          }
        );
      }

      if (item.hosts) {
        for (let j = 0; j < item.hosts.length; j++) {
          const host = item.hosts[j];
          if (!host) continue; // Skip undefined hosts

          if (host.kind === 'USER') {
            if (!host.userId) {
              throw new GraphQLError(
                `items[${i}].hosts[${j}]: userId is required for USER kind`,
                {
                  extensions: { code: 'BAD_USER_INPUT' },
                }
              );
            }
          } else if (host.kind === 'MANUAL') {
            if (!host.name || host.name.trim().length === 0) {
              throw new GraphQLError(
                `items[${i}].hosts[${j}]: name is required for MANUAL kind`,
                {
                  extensions: { code: 'BAD_USER_INPUT' },
                }
              );
            }
            if (host.name.length > MAX_HOST_NAME_LENGTH) {
              throw new GraphQLError(
                `items[${i}].hosts[${j}]: name cannot exceed ${MAX_HOST_NAME_LENGTH} characters`,
                {
                  extensions: { code: 'BAD_USER_INPUT' },
                }
              );
            }
          }
        }
      }
    }

    // Check if event exists and user has permissions
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        ownerId: true,
        members: {
          where: {
            userId: user.id,
            status: 'JOINED',
            role: {
              in: ['OWNER', 'MODERATOR'],
            },
          },
          select: { role: true },
        },
      },
    });

    if (!event) {
      throw new GraphQLError('Event not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check permissions (owner, event moderator, global moderator, or admin)
    const isOwner = event.ownerId === user.id;
    const isEventModerator = event.members.some((m) => m.role === 'MODERATOR');
    const isGlobalModerator = user.role === 'MODERATOR';
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isEventModerator && !isGlobalModerator && !isAdmin) {
      throw new GraphQLError(
        'Only event owner, moderators, or administrators can manage agenda',
        {
          extensions: { code: 'FORBIDDEN' },
        }
      );
    }

    // Validate that all USER hosts exist
    const userIds = items
      .flatMap((item) => item.hosts || [])
      .filter((host) => host.kind === 'USER' && host.userId)
      .map((host) => host.userId as string);

    if (userIds.length > 0) {
      const existingUsers = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true },
      });
      const existingUserIds = new Set(existingUsers.map((u) => u.id));

      for (const userId of userIds) {
        if (!existingUserIds.has(userId)) {
          throw new GraphQLError(`User with id ${userId} not found`, {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
      }
    }

    // Delete all existing agenda items and create new ones in a transaction
    const updatedItems = await prisma.$transaction(async (tx) => {
      // Delete all existing agenda items (cascade deletes hosts)
      await tx.eventAgendaItem.deleteMany({
        where: { eventId },
      });

      // Create new items with hosts
      const createdItems = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item) continue; // Skip undefined items

        const createdItem = await tx.eventAgendaItem.create({
          data: {
            eventId,
            order: i,
            title: item.title.trim(),
            description: item.description?.trim() || null,
            startAt: item.startAt ? new Date(item.startAt) : null,
            endAt: item.endAt ? new Date(item.endAt) : null,
            hosts: {
              create: (item.hosts || []).map((host, hostIndex) => ({
                order: hostIndex,
                kind: host.kind,
                userId: host.kind === 'USER' ? host.userId : null,
                name: host.kind === 'MANUAL' ? host.name?.trim() : null,
                avatarUrl: host.kind === 'MANUAL' ? host.avatarUrl : null,
              })),
            },
          },
          include: {
            hosts: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarKey: true,
                  },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        });

        createdItems.push(createdItem);
      }

      return createdItems;
    });

    // Type assertion for items with hosts included
    type ItemWithHosts = (typeof updatedItems)[number] & {
      hosts: Array<{
        id: string;
        agendaItemId: string;
        order: number;
        kind: string;
        userId: string | null;
        user: { id: string; name: string; avatarKey: string | null } | null;
        name: string | null;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
      }>;
    };

    return (updatedItems as ItemWithHosts[]).map((item) => ({
      id: item.id,
      eventId: item.eventId,
      order: item.order,
      title: item.title,
      description: item.description,
      startAt: item.startAt,
      endAt: item.endAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      event: null, // Field resolver handles this
      hosts: item.hosts.map((host) => ({
        id: host.id,
        agendaItemId: host.agendaItemId,
        order: host.order,
        kind: host.kind,
        userId: host.userId,
        user: host.user,
        name: host.name,
        avatarUrl: host.avatarUrl,
        createdAt: host.createdAt,
        updatedAt: host.updatedAt,
        agendaItem: null, // Field resolver handles this
      })),
    })) as unknown as EventAgendaItem[];
  };
