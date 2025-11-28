import Link from 'next/link';
import { format } from 'date-fns';
import {
  Users,
  MapPin,
  Clock,
  Settings,
  XCircle,
  UserPlus,
  LogOut,
  Check,
  X,
  Shield,
  AlertCircle,
  Ban,
  Crown,
  UserCog,
  Eye,
} from 'lucide-react';
import type {
  IntentMemberStatus,
  IntentMemberRole,
} from '@/lib/api/__generated__/react-query-update';
import { BlurHashImage } from '@/components/ui/blurhash-image';
import { buildIntentCoverUrl } from '@/lib/media/url';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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

function getRoleBadge(role: IntentMemberRole) {
  switch (role) {
    case 'OWNER':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800">
          <Crown className="h-3 w-3" />
          OWNER
        </span>
      );
    case 'MODERATOR':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800">
          <Shield className="h-3 w-3" />
          MODERATOR
        </span>
      );
    case 'PARTICIPANT':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <UserCog className="h-3 w-3" />
          MEMBER
        </span>
      );
    default:
      return null;
  }
}

function getMemberStatusBadge(status: IntentMemberStatus) {
  switch (status) {
    case 'JOINED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <Check className="h-3 w-3" />
          JOINED
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
          <Clock className="h-3 w-3" />
          PENDING
        </span>
      );
    case 'INVITED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
          <UserPlus className="h-3 w-3" />
          INVITED
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <X className="h-3 w-3" />
          REJECTED
        </span>
      );
    case 'BANNED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <Ban className="h-3 w-3" />
          BANNED
        </span>
      );
    case 'LEFT':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          <LogOut className="h-3 w-3" />
          LEFT
        </span>
      );
    case 'WAITLIST':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          <Clock className="h-3 w-3" />
          WAITLIST
        </span>
      );
    default:
      return null;
  }
}

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
  const showLeave =
    membership.status === 'JOINED' &&
    membership.role === 'PARTICIPANT' &&
    !isDisabled;
  const showWithdraw = membership.status === 'PENDING' && !isDisabled;
  const showAcceptInvite = membership.status === 'INVITED' && !isDisabled;
  const showDeclineInvite = membership.status === 'INVITED' && !isDisabled;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        'rounded-[24px] border bg-white p-6 transition-all dark:bg-[#10121a] shadow-sm',
        isDeleted
          ? 'border-zinc-300 opacity-60 dark:border-zinc-700'
          : 'border-zinc-200/80 dark:border-white/5 hover:shadow-md'
      )}
    >
      {/* Banner for special statuses */}
      {getMembershipBanner(membership)}

      <div className="flex gap-6">
        {/* Cover Image */}
        {coverUrl && (
          <Link
            href={`/intent/${intent.id}`}
            className="shrink-0 overflow-hidden rounded-2xl transition-all hover:scale-[1.02]"
          >
            <BlurHashImage
              src={coverUrl}
              blurhash={intent.coverBlurhash}
              alt={intent.title}
              className="h-32 w-48 object-cover"
              width={192}
              height={128}
            />
          </Link>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/intent/${intent.id}`}
            className="block transition-opacity hover:opacity-90"
          >
            {/* Title + Event Status + Role */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
                {intent.title}
              </h3>
              {getStatusBadge(intentStatus)}
              {getRoleBadge(membership.role)}
              {getMemberStatusBadge(membership.status)}
            </div>

            {intent.description && (
              <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {intent.description}
              </p>
            )}

            {/* Event Details */}
            <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              {intent.startAt && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" strokeWidth={2} />
                  <span className="font-medium">
                    {format(new Date(intent.startAt), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
              )}

              {intent.address && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="h-4 w-4 shrink-0" strokeWidth={2} />
                  <span className="truncate">
                    {intent.address.split(',')[0]}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" strokeWidth={2} />
                <span className="font-medium">
                  {intent.joinedCount ?? 0} / {intent.max ?? '∞'}
                </span>
              </div>
            </div>
          </Link>

          {/* Actions */}
          {!isDisabled && (
            <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-white/5 flex flex-wrap gap-2">
              {/* Owner actions */}
              {showManage && actions.onManage && (
                <button
                  onClick={() => actions.onManage!(intent.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-indigo-500 hover:to-indigo-400 shadow-md hover:shadow-lg"
                >
                  <Settings className="h-4 w-4" strokeWidth={2} />
                  Manage
                </button>
              )}

              {showEdit && actions.onEdit && (
                <Link
                  href={`/intent/${intent.id}/manage`}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <Eye className="h-4 w-4" strokeWidth={2} />
                  View
                </Link>
              )}

              {showCancel && actions.onCancel && (
                <button
                  onClick={() => actions.onCancel!(intent.id)}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-red-300 dark:border-red-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <XCircle className="h-4 w-4" strokeWidth={2} />
                  Cancel
                </button>
              )}

              {/* Member actions */}
              {showLeave && actions.onLeave && (
                <button
                  onClick={() => actions.onLeave!(intent.id)}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-red-300 dark:border-red-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4" strokeWidth={2} />
                  Leave
                </button>
              )}

              {/* Pending actions */}
              {showWithdraw && actions.onWithdraw && (
                <button
                  onClick={() => actions.onWithdraw!(intent.id)}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-red-300 dark:border-red-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                  Withdraw
                </button>
              )}

              {/* Invited actions */}
              {showAcceptInvite && actions.onAcceptInvite && (
                <button
                  onClick={() => actions.onAcceptInvite!(intent.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 shadow-md"
                >
                  <Check className="h-4 w-4" strokeWidth={2} />
                  Accept
                </button>
              )}
              {showDeclineInvite && actions.onDeclineInvite && (
                <button
                  onClick={() => actions.onDeclineInvite!(intent.id)}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                  Decline
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
