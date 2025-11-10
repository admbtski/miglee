import type {
  AddressVisibility,
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
  canJoin: boolean;

  isHybrid: boolean;
  isOnline: boolean;
  isOnsite: boolean;

  levels: Level[];
  addressVisibility: AddressVisibility;
  membersVisibility: MembersVisibility;

  owner?: {
    imageUrl?: string | null;
    name?: string | null;
    email?: string | null;
    verifiedAt?: string | null;
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
