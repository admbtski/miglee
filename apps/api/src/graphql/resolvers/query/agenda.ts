import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';

/**
 * Get agenda items for an event
 * Public for viewing - agenda is visible to anyone who can see the event
 */
export const eventAgendaItemsQuery: QueryResolvers['eventAgendaItems'] = async (
  _parent,
  { eventId }
) => {
  const items = await prisma.eventAgendaItem.findMany({
    where: { eventId },
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
    orderBy: [{ startAt: { sort: 'asc', nulls: 'last' } }, { order: 'asc' }],
  });

  return items.map((item) => ({
    id: item.id,
    eventId: item.eventId,
    order: item.order,
    title: item.title,
    description: item.description,
    startAt: item.startAt,
    endAt: item.endAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
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
    })),
  }));
};
