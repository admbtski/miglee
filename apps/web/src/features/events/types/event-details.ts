import type { JoinStateResult } from '@/features/events';

/**
 * Typ danych dla detalu wydarzenia
 * Rozszerzony o wszystkie potrzebne pola z schematu Prisma
 */
export type EventDetailsData = {
  // Identyfikatory
  id: string;

  // Hero
  title: string;
  organizer: {
    id: string;
    name: string;
    displayName?: string | null;
    avatarKey?: string | null;
    avatarBlurhash?: string | null;
    verifiedAt?: string | null;
  };

  // Media
  coverKey?: string | null;
  coverBlurhash?: string | null;

  // Terminy
  startISO: string; // startAt
  endISO: string; // endAt
  timezone?: string | null; // IANA timezone from owner

  // Miejsce / tryb
  meetingKind: 'ONSITE' | 'ONLINE' | 'HYBRID';
  address?: string | null;
  placeId?: string | null;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number | null;
  onlineUrl?: string | null;

  // Widoczności
  visibility: 'PUBLIC' | 'HIDDEN';
  addressVisibility: 'PUBLIC' | 'AFTER_JOIN' | 'HIDDEN';
  membersVisibility: 'PUBLIC' | 'AFTER_JOIN' | 'HIDDEN';

  // Dołączanie
  joinMode: 'OPEN' | 'REQUEST' | 'INVITE_ONLY';
  mode: 'ONE_TO_ONE' | 'GROUP';
  min?: number | null;
  max?: number | null;
  joinedCount: number;

  // Okna / cutoffy
  joinOpensMinutesBeforeStart?: number | null;
  joinCutoffMinutesBeforeStart?: number | null;
  allowJoinLate: boolean;
  lateJoinCutoffMinutesAfterStart?: number | null;
  joinManuallyClosed: boolean;
  joinManuallyClosedAt?: string | null;
  joinManualCloseReason?: string | null;

  // Treści
  description?: string | null;
  notes?: string | null;

  // Kontekst
  levels: Array<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>;
  categories: { slug: string; name: string }[];
  tags: { slug: string; label: string }[];

  // Status systemowy
  canceledAt?: string | null;
  cancelReason?: string | null;
  deletedAt?: string | null;
  deleteReason?: string | null;

  // Społeczność / aktywność
  members?: Array<{
    id: string;
    role: 'OWNER' | 'MODERATOR' | 'PARTICIPANT';
    status:
      | 'JOINED'
      | 'PENDING'
      | 'INVITED'
      | 'REJECTED'
      | 'BANNED'
      | 'LEFT'
      | 'KICKED'
      | 'WAITLIST';
    user: {
      id: string;
      name: string;
      avatarKey?: string | null;
      avatarBlurhash?: string | null;
      verifiedAt?: string | null;
      profile?: {
        displayName?: string | null;
      } | null;
    };
    note?: string | null;
    joinedAt?: string | null;
  }>;
  membersStats?: Partial<
    Record<'JOINED' | 'PENDING' | 'INVITED' | 'BANNED', number>
  >;
  commentsCount: number;
  messagesCount: number;
  reviews?: {
    total: number;
    avg?: number;
    breakdown?: Record<1 | 2 | 3 | 4 | 5, number>;
  };
  isFavourite?: boolean;
  savedCount?: number;

  // Sponsoring
  sponsorship?: {
    plan: 'FREE' | 'PLUS' | 'PRO';
    status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELED';
    sponsor: { id: string; name: string };
    startsAt?: string | null;
    endsAt?: string | null;
    boostsTotal?: number;
    boostsUsed?: number;
    localPushesTotal?: number;
    localPushesUsed?: number;
  };

  // Boost
  boostedAt?: string | null; // ISO timestamp of last boost;

  // Linki zaproszeń (owner/mod only)
  inviteLinks?: Array<{
    code: string;
    maxUses?: number | null;
    usedCount: number;
    expiresAt?: string | null;
  }>;

  // Computed (po stronie frontu)
  joinState: JoinStateResult;

  // User membership info (computed)
  userMembership?: {
    isOwner: boolean;
    isModerator: boolean;
    isJoined: boolean;
    isPending: boolean;
    isInvited: boolean;
    isRejected: boolean;
    isBanned: boolean;
    isWaitlisted: boolean;
    canSeeMembers: boolean;
    rejectReason?: string;
    banReason?: string;
  };

  // Timestamps
  createdAt: string;
  updatedAt: string;
};
