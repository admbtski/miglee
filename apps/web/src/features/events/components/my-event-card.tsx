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
  Calendar,
} from 'lucide-react';
import { BlurHashImage } from '@/components/ui/blurhash-image';
import { buildEventCoverUrl } from '@/lib/media/url';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/provider-ssr';
import { useLocalePath } from '@/hooks/use-locale-path';
import type {
  MyEventCardData,
  MyEventCardActions,
  MyEventCardEvent,
  MyEventCardMembership,
  EventMemberStatus,
  EventMemberRole,
} from '../types/my-events';

/* ───────────────────────────── Props ───────────────────────────── */

export interface MyEventCardProps {
  data: MyEventCardData;
  actions?: MyEventCardActions;
}

// Re-export types for consumers
export type { MyEventCardData, MyEventCardActions };

/* ───────────────────────────── Helpers ───────────────────────────── */

function getRoleBadge(role: EventMemberRole) {
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

function getMemberStatusBadge(status: EventMemberStatus) {
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

function getEventStatus(
  event: MyEventCardEvent
): 'upcoming' | 'ongoing' | 'finished' | 'canceled' | 'deleted' {
  if (event.deletedAt) return 'deleted';
  if (event.canceledAt) return 'canceled';

  const now = new Date();
  const start = event.startAt ? new Date(event.startAt) : null;
  const end = event.endAt ? new Date(event.endAt) : null;

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
  membership: MyEventCardMembership,
  t: any
): React.ReactNode {
  switch (membership.status) {
    case 'REJECTED':
      return (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/20 mb-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              {t.myEvents.messages.requestRejected}
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
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/20 mb-4">
          <Ban className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm font-medium text-red-900 dark:text-red-100">
            {t.myEvents.messages.youAreBanned}
          </p>
        </div>
      );
    default:
      return null;
  }
}

/* ───────────────────────────── Component ───────────────────────────── */

export function MyEventCard({ data, actions = {} }: MyEventCardProps) {
  const { t } = useI18n();
  const { localePath } = useLocalePath();
  const { event, membership } = data;
  const eventStatus = getEventStatus(event);
  const coverUrl = buildEventCoverUrl(event.coverKey, 'card');

  const isDeleted = eventStatus === 'deleted';
  const isCanceled = eventStatus === 'canceled';
  const isDisabled = isDeleted || membership.status === 'BANNED';

  // Determine available actions based on role and status
  const showManage = membership.role === 'OWNER' && !isDisabled;
  const showView = !isDisabled; // Everyone can view the event (if not disabled)
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
      {getMembershipBanner(membership, t)}

      <div className="flex gap-6">
        {/* Cover Image - Always visible, properly scaled */}
        <Link
          href={localePath(`/event/${event.id}`)}
          className="shrink-0 overflow-hidden rounded-xl transition-all hover:scale-[1.02]"
        >
          {coverUrl ? (
            <div className="relative h-32 w-48 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <BlurHashImage
                src={coverUrl}
                blurhash={event.coverBlurhash}
                alt={event.title}
                className="h-full w-full object-cover"
                width={192}
                height={128}
              />
            </div>
          ) : (
            <div className="h-32 w-48 flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 rounded-xl">
              <Calendar className="h-12 w-12 text-zinc-400 dark:text-zinc-600" />
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Link
            href={localePath(`/event/${event.id}`)}
            className="block transition-opacity hover:opacity-90"
          >
            {/* Title + Event Status + Role */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
                {event.title}
              </h3>
              {getStatusBadge(eventStatus)}
              {getRoleBadge(membership.role)}
              {getMemberStatusBadge(membership.status)}
            </div>

            {event.description && (
              <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {event.description}
              </p>
            )}

            {/* Event Details */}
            <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              {event.startAt && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" strokeWidth={2} />
                  <span className="font-medium">
                    {format(new Date(event.startAt), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
              )}

              {event.address && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="h-4 w-4 shrink-0" strokeWidth={2} />
                  <span className="truncate">
                    {event.address.split(',')[0]}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" strokeWidth={2} />
                <span className="font-medium">
                  {event.joinedCount ?? 0} / {event.max ?? '∞'}
                </span>
              </div>
            </div>
          </Link>

          {/* Actions */}
          {!isDisabled && (
            <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-white/5 flex flex-wrap gap-2">
              {/* Owner actions */}
              {showManage && (
                <Link
                  href={localePath(`/event/${event.id}/manage`)}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-indigo-500 hover:to-indigo-400 shadow-md hover:shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Settings className="h-4 w-4" strokeWidth={2} />
                  {t.myEvents.actions.manage}
                </Link>
              )}

              {/* View button - available for everyone */}
              {showView && (
                <Link
                  href={localePath(`/event/${event.id}`)}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye className="h-4 w-4" strokeWidth={2} />
                  {t.myEvents.actions.view}
                </Link>
              )}

              {showCancel && actions.onCancel && (
                <button
                  onClick={() => actions.onCancel!(event.id)}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-red-300 dark:border-red-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <XCircle className="h-4 w-4" strokeWidth={2} />
                  {t.myEvents.actions.cancel}
                </button>
              )}

              {/* Member actions */}
              {showLeave && actions.onLeave && (
                <button
                  onClick={() => actions.onLeave!(event.id)}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-red-300 dark:border-red-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4" strokeWidth={2} />
                  {t.myEvents.actions.leave}
                </button>
              )}

              {/* Pending actions */}
              {showWithdraw && actions.onWithdraw && (
                <button
                  onClick={() => actions.onWithdraw!(event.id)}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-red-300 dark:border-red-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                  {t.myEvents.actions.withdraw}
                </button>
              )}

              {/* Invited actions */}
              {showAcceptInvite && actions.onAcceptInvite && (
                <button
                  onClick={() => actions.onAcceptInvite!(event.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 shadow-md"
                >
                  <Check className="h-4 w-4" strokeWidth={2} />
                  {t.myEvents.actions.accept}
                </button>
              )}
              {showDeclineInvite && actions.onDeclineInvite && (
                <button
                  onClick={() => actions.onDeclineInvite!(event.id)}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                  {t.myEvents.actions.decline}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
