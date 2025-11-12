import type { IntentListItem, IntentHoverCallback } from '@/types/intent';
import type { EventCardProps } from '@/app/[[...slug]]/_components/event-card/index';
import { INTENTS_CONFIG } from '@/lib/constants/intents';
import { notEmptyString } from '@/lib/utils/intents';
import { planForIndex } from './plan-utils';

/**
 * Maps raw intent data from API to EventCard component props
 *
 * @param item - Raw intent data from API
 * @param index - Position in list (for plan calculation)
 * @param lang - Language code for category names
 * @param onHover - Optional hover callback for map synchronization
 * @returns Formatted props for EventCard component
 */
export function mapIntentToEventCardProps(
  item: IntentListItem,
  index: number,
  lang: string,
  onHover?: IntentHoverCallback
): EventCardProps {
  const tags = (item.tags ?? []).map((t) => t.label).filter(notEmptyString);

  const categories = (item.categories ?? [])
    .map((c) => c.names?.[lang] ?? Object.values(c.names ?? {})[0])
    .filter(notEmptyString);

  return {
    intentId: item.id,
    lat: item.lat,
    lng: item.lng,
    startISO: item.startAt,
    endISO: item.endAt,

    avatarUrl: item.owner?.imageUrl ?? INTENTS_CONFIG.FALLBACK_AVATAR,
    organizerName: item.owner?.name ?? item.owner?.email ?? 'Unknown organizer',
    verifiedAt: item.owner?.verifiedAt ?? undefined,

    title: item.title ?? '-',
    description: item.description ?? '-',

    address: item.address ?? undefined,
    onlineUrl: item.onlineUrl ?? undefined,

    joinedCount: item.joinedCount,
    min: item.min,
    max: item.max,

    tags,
    categories,

    isOngoing: item.isOngoing,
    isCanceled: item.isCanceled,
    isDeleted: item.isDeleted,
    hasStarted: item.hasStarted,
    withinLock: item.withinLock,
    lockReason: item.lockReason ?? undefined,
    canJoin: item.canJoin,
    isFull: item.isFull,

    isHybrid: item.isHybrid,
    isOnline: item.isOnline,
    isOnsite: item.isOnsite,

    levels: item.levels ?? [],
    addressVisibility: item.addressVisibility,
    membersVisibility: item.membersVisibility,
    members: (item.members ?? undefined) as any,

    plan: planForIndex(index),
    showSponsoredBadge: true,

    onJoin: () => {
      console.log('join intent', item.id);
    },
    onHover,
  };
}
