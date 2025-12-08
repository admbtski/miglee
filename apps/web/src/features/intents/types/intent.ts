import type {
  AddressVisibility,
  IntentAppearance,
  IntentMember,
  Level,
  MembersVisibility,
} from '@/lib/api/__generated__/react-query-update';

/**
 * Flattened intent data structure for list display
 */
export type IntentListItem = {
  id: string;
  title?: string | null;
  description?: string | null;
  startAt: string;
  endAt: string;
  address?: string | null;
  onlineUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number | null;

  // Cover image
  coverKey?: string | null;
  coverBlurhash?: string | null;

  joinedCount: number;
  min: number;
  max: number;

  tags: Array<{ label: string }>;
  categories: Array<{ names: Record<string, string> }>;

  isOngoing: boolean;
  isCanceled: boolean;
  isDeleted: boolean;
  hasStarted: boolean;
  isFull: boolean;
  withinLock: boolean;
  lockReason?: string | null;
  canJoin: boolean;
  appearance?: IntentAppearance | null;

  // Join window settings
  joinOpensMinutesBeforeStart?: number | null;
  joinCutoffMinutesBeforeStart?: number | null;
  allowJoinLate?: boolean;
  lateJoinCutoffMinutesAfterStart?: number | null;
  joinManuallyClosed?: boolean;

  isHybrid: boolean;
  isOnline: boolean;
  isOnsite: boolean;

  levels: Level[];
  addressVisibility: AddressVisibility;
  membersVisibility: MembersVisibility;

  // Boost/Sponsorship
  boostedAt?: string | null; // ISO timestamp of last boost

  isFavourite?: boolean;
  savedCount?: number;

  owner?: {
    avatarKey?: string | null;
    avatarBlurhash?: string | null;
    name?: string | null;
    email?: string | null;
    verifiedAt?: string | null;
    profile?: {
      displayName?: string | null;
    };
  } | null;

  members?: IntentMember[] | null;
};

/**
 * Props for event card hover callback
 */
export type IntentHoverCallback = (
  intentId: string | null,
  lat?: number | null,
  lng?: number | null
) => void;

/**
 * State for currently hovered intent
 */
export type HoveredIntentState = {
  id: string;
  lat: number | null;
  lng: number | null;
} | null;
