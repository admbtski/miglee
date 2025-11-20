import type { IntentListItem, IntentHoverCallback } from '@/types/intent';
import type { EventCardProps } from '@/app/[[...slug]]/_components/event-card';
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
  const categories = (item.categories ?? [])
    .map((c) => c.names?.[lang] ?? Object.values(c.names ?? {})[0])
    .filter(notEmptyString);

  return {
    // Core identification
    intentId: item.id,
    lat: item.lat,
    lng: item.lng,

    // Event details
    startISO: item.startAt,
    endISO: item.endAt,
    title: item.title ?? '-',
    description: item.description ?? '-',
    categories,
    address: item.address ?? undefined,

    // Organizer info
    avatarKey: item.owner?.avatarKey ?? null,
    avatarBlurhash: item.owner?.avatarBlurhash ?? null,
    organizerName: item.owner?.name ?? item.owner?.email ?? 'Unknown organizer',
    verifiedAt: item.owner?.verifiedAt ?? undefined,
    plan: planForIndex(index),

    // Cover image
    coverKey: item.coverKey ?? null,
    coverBlurhash: item.coverBlurhash ?? null,

    // Capacity & joining
    joinedCount: item.joinedCount,
    min: item.min,
    max: item.max,
    canJoin: item.canJoin,
    isFull: item.isFull,

    // Event state
    isOngoing: item.isOngoing,
    isCanceled: item.isCanceled,
    isDeleted: item.isDeleted,
    hasStarted: item.hasStarted,

    // Join window settings
    joinOpensMinutesBeforeStart: item.joinOpensMinutesBeforeStart ?? null,
    joinCutoffMinutesBeforeStart: item.joinCutoffMinutesBeforeStart ?? null,
    allowJoinLate: item.allowJoinLate ?? true,
    lateJoinCutoffMinutesAfterStart:
      item.lateJoinCutoffMinutesAfterStart ?? null,
    joinManuallyClosed: item.joinManuallyClosed ?? false,

    // Location type
    isHybrid: item.isHybrid,
    isOnline: item.isOnline,
    isOnsite: item.isOnsite,
    addressVisibility: item.addressVisibility,

    // UI options
    isFavourite: item.isFavourite ?? false,

    // Callbacks
    onHover,
  };
}
