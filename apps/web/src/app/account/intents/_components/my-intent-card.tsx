import Link from 'next/link';
import { format } from 'date-fns';
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  Settings,
  Edit,
  XCircle,
  UserPlus,
  MessageSquare,
  Eye,
  LogOut,
  Check,
  X,
  Shield,
  AlertCircle,
  Ban,
  ListOrdered,
} from 'lucide-react';
import type {
  IntentMemberStatus,
  IntentMemberRole,
} from '@/lib/api/__generated__/react-query';
import { BlurHashImage } from '@/components/ui/blurhash-image';
import { buildIntentCoverUrl } from '@/lib/media/url';

/* ───────────────────────────── Types ───────────────────────────── */

export interface MyIntentCardIntent {
  id: string;
  title: string;
  description?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  address?: string | null;
  joinedCount?: number | null;
  max?: number | null;
  coverKey?: string | null;
  coverBlurhash?: string | null;
  canceledAt?: string | null;
  deletedAt?: string | null;
}

export interface MyIntentCardMembership {
  id: string;
  status: IntentMemberStatus;
  role: IntentMemberRole;
  joinedAt?: string | null;
  rejectReason?: string | null;
}

export interface MyIntentCardData {
  intent: MyIntentCardIntent;
  membership: MyIntentCardMembership;
}

export interface MyIntentCardActions {
  onManage?: (intentId: string) => void;
  onEdit?: (intentId: string) => void;
  onCancel?: (intentId: string) => void;
  onInvite?: (intentId: string) => void;
  onViewMembers?: (intentId: string) => void;
  onOpenChat?: (intentId: string) => void;
  onModerate?: (intentId: string) => void;
  onLeave?: (intentId: string) => void;
  onWithdraw?: (intentId: string) => void;
  onAcceptInvite?: (intentId: string) => void;
  onDeclineInvite?: (intentId: string) => void;
  onLeaveWaitlist?: (intentId: string) => void;
}

export interface MyIntentCardProps {
  data: MyIntentCardData;
  actions?: MyIntentCardActions;
}

/* ───────────────────────────── Helpers ───────────────────────────── */

function getIntentStatus(
  intent: MyIntentCardIntent
): 'upcoming' | 'ongoing' | 'finished' | 'canceled' | 'deleted' {
  if (intent.deletedAt) return 'deleted';
  if (intent.canceledAt) return 'canceled';

  const now = new Date();
  const start = intent.startAt ? new Date(intent.startAt) : null;
  const end = intent.endAt ? new Date(intent.endAt) : null;

  if (end && now >= end) return 'finished';
  if (start && now >= start && (!end || now < end)) return 'ongoing';
  return 'upcoming';
}

function getStatusBadge(
  status: 'upcoming' | 'ongoing' | 'finished' | 'canceled' | 'deleted'
) {
  switch (status) {
    case 'ongoing':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-600 dark:bg-green-400" />
          LIVE
        </span>
      );
    case 'finished':
      return (
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          FINISHED
        </span>
      );
    case 'canceled':
      return (
        <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
          CANCELED
        </span>
      );
    case 'deleted':
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
          DELETED
        </span>
      );
    default:
      return null;
  }
}

function getMembershipBanner(
  membership: MyIntentCardMembership
): React.ReactNode {
  switch (membership.status) {
    case 'REJECTED':
      return (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/20">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              Your request was rejected
            </p>
            {membership.rejectReason && (
              <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                {membership.rejectReason}
              </p>
            )}
          </div>
        </div>
      );
    case 'BANNED':
      return (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/20">
          <Ban className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm font-medium text-red-900 dark:text-red-100">
            You are banned from this Intent
          </p>
        </div>
      );
    default:
      return null;
  }
}

/* ───────────────────────────── Component ───────────────────────────── */

export function MyIntentCard({ data, actions = {} }: MyIntentCardProps) {
  const { intent, membership } = data;
  const intentStatus = getIntentStatus(intent);
  const coverUrl = buildIntentCoverUrl(intent.coverKey, 'card');

  const isDeleted = intentStatus === 'deleted';
  const isCanceled = intentStatus === 'canceled';
  const isDisabled = isDeleted || membership.status === 'BANNED';

  // Determine available actions based on role and status
  const showManage = membership.role === 'OWNER' && !isDisabled;
  const showEdit = membership.role === 'OWNER' && !isDisabled;
  const showCancel = membership.role === 'OWNER' && !isDisabled && !isCanceled;
  const showInvite =
    (membership.role === 'OWNER' || membership.role === 'MODERATOR') &&
    !isDisabled;
  const showViewMembers =
    (membership.role === 'OWNER' ||
      membership.role === 'MODERATOR' ||
      membership.status === 'JOINED') &&
    !isDeleted;
  const showOpenChat = membership.status === 'JOINED' && !isDeleted;
  const showModerate = membership.role === 'MODERATOR' && !isDisabled;
  const showLeave =
    membership.status === 'JOINED' &&
    membership.role === 'PARTICIPANT' &&
    !isDisabled;
  const showWithdraw = membership.status === 'PENDING' && !isDisabled;
  const showAcceptInvite = membership.status === 'INVITED' && !isDisabled;
  const showDeclineInvite = membership.status === 'INVITED' && !isDisabled;

  return (
    <div
      className={`rounded-lg border bg-white p-6 transition-all dark:bg-zinc-900 ${
        isDeleted
          ? 'border-zinc-300 opacity-60 dark:border-zinc-700'
          : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      {/* Banner for special statuses */}
      {getMembershipBanner(membership)}

      <div className="flex items-start gap-4">
        {/* Cover Image */}
        {coverUrl && (
          <Link
            href={`/intent/${intent.id}`}
            className="shrink-0 overflow-hidden rounded-lg transition-opacity hover:opacity-80"
          >
            <BlurHashImage
              src={coverUrl}
              blurhash={intent.coverBlurhash}
              alt={intent.title}
              className="h-24 w-32 object-cover"
              width={128}
              height={96}
            />
          </Link>
        )}

        {/* Content */}
        <div className="flex-1">
          <Link
            href={`/intent/${intent.id}`}
            className="block transition-opacity hover:opacity-80"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {intent.title}
              </h3>
              {getStatusBadge(intentStatus)}
            </div>

            {intent.description && (
              <p className="mb-3 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                {intent.description}
              </p>
            )}

            {/* Event Details */}
            <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              {intent.startAt && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(new Date(intent.startAt), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
              )}

              {intent.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{intent.address}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>
                  {intent.joinedCount ?? 0} / {intent.max ?? '∞'}
                </span>
              </div>
            </div>
          </Link>

          {/* Actions */}
          {!isDisabled && (
            <div className="mt-4 flex flex-wrap gap-2">
              {/* Owner actions */}
              {showManage && actions.onManage && (
                <button
                  onClick={() => actions.onManage!(intent.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-pink-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-pink-700"
                >
                  <Settings className="h-4 w-4" />
                  Manage
                </button>
              )}
              {showEdit && actions.onEdit && (
                <button
                  onClick={() => actions.onEdit!(intent.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
              )}
              {showCancel && actions.onCancel && (
                <button
                  onClick={() => actions.onCancel!(intent.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-700 dark:bg-zinc-800 dark:text-red-300 dark:hover:bg-red-900/20"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </button>
              )}
              {showInvite && actions.onInvite && (
                <button
                  onClick={() => actions.onInvite!(intent.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite
                </button>
              )}

              {/* Moderator actions */}
              {showModerate && actions.onModerate && (
                <button
                  onClick={() => actions.onModerate!(intent.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <Shield className="h-4 w-4" />
                  Moderate
                </button>
              )}

              {/* Common actions */}
              {showViewMembers && actions.onViewMembers && (
                <button
                  onClick={() => actions.onViewMembers!(intent.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <Users className="h-4 w-4" />
                  Members
                </button>
              )}
              {showOpenChat && actions.onOpenChat && (
                <button
                  onClick={() => actions.onOpenChat!(intent.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </button>
              )}

              {/* Member actions */}
              {showLeave && actions.onLeave && (
                <button
                  onClick={() => actions.onLeave!(intent.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-700 dark:bg-zinc-800 dark:text-red-300 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4" />
                  Leave
                </button>
              )}

              {/* Pending actions */}
              {showWithdraw && actions.onWithdraw && (
                <button
                  onClick={() => actions.onWithdraw!(intent.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-700 dark:bg-zinc-800 dark:text-red-300 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                  Withdraw
                </button>
              )}

              {/* Invited actions */}
              {showAcceptInvite && actions.onAcceptInvite && (
                <button
                  onClick={() => actions.onAcceptInvite!(intent.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  <Check className="h-4 w-4" />
                  Accept
                </button>
              )}
              {showDeclineInvite && actions.onDeclineInvite && (
                <button
                  onClick={() => actions.onDeclineInvite!(intent.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <X className="h-4 w-4" />
                  Decline
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
