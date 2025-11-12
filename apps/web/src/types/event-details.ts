import type { JoinStateResult } from '@/lib/utils/intent-join-state';

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
    avatarUrl?: string | null;
    verifiedAt?: string | null;
  };

  // Terminy
  startISO: string; // startAt
  endISO: string; // endAt
  tz?: string | null;

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
  min: number;
  max: number;
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
      | 'KICKED';
    user: {
      id: string;
      name: string;
      imageUrl?: string | null;
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

  // Sponsoring
  sponsorship?: {
    plan: 'BASIC' | 'PLUS' | 'PRO';
    status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELED';
    highlightOn: boolean;
    sponsor: { id: string; name: string };
    startedAt?: string | null;
    endsAt?: string | null;
  };

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
    canSeeMembers: boolean;
  };

  // Timestamps
  createdAt: string;
  updatedAt: string;
};
