import type { EventDetailsData } from '@/types/event-details';
import { ShieldCheck, Users as UserGroup } from 'lucide-react';
import Link from 'next/link';
import { buildAvatarUrl } from '@/lib/media/url';
import { Avatar } from '@/components/ui/avatar';
import { useMemo } from 'react';
import { formatCapacityDetail } from '@/lib/utils/capacity-formatter';
import { CapacityStatusCard } from './capacity-status-card';

type EventParticipantsProps = {
  event: EventDetailsData;
};

export function EventParticipants({ event }: EventParticipantsProps) {
  const canSeeMembers =
    event.userMembership?.canSeeMembers ?? event.membersVisibility === 'PUBLIC';

  // Format capacity details using comprehensive formatter
  const capacityDetails = useMemo(
    () =>
      formatCapacityDetail(
        event.joinedCount,
        event.min,
        event.max,
        event.mode as 'ONE_TO_ONE' | 'GROUP' | 'CUSTOM'
      ),
    [event.joinedCount, event.min, event.max, event.mode]
  );

  if (!canSeeMembers) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/40 transition-all duration-300">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Uczestnicy
        </h2>
        {/* Capacity Status Info */}
        <div className="mb-6">
          <CapacityStatusCard capacityDetails={capacityDetails} />
        </div>
        <p className="text-md text-zinc-600 dark:text-zinc-400">
          {event.membersVisibility === 'AFTER_JOIN'
            ? 'Lista uczestników będzie widoczna po dołączeniu.'
            : 'Lista uczestników jest ukryta przez organizatora.'}
        </p>
      </div>
    );
  }

  const members = event.members ?? [];
  const owners = members.filter(
    (m) => m.role === 'OWNER' && m.status === 'JOINED'
  );
  const moderators = members.filter(
    (m) => m.role === 'MODERATOR' && m.status === 'JOINED'
  );
  const participants = members.filter(
    (m) => m.role === 'PARTICIPANT' && m.status === 'JOINED'
  );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/40 transition-all duration-300">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Uczestnicy
        </h2>
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <UserGroup className="h-5 w-5" />
          <span className="font-medium">{capacityDetails.participants}</span>
        </div>
      </div>

      {/* Capacity Status Info */}
      <div className="mb-6">
        <CapacityStatusCard capacityDetails={capacityDetails} />
      </div>

      <div className="space-y-6">
        {/* Owners */}
        {owners.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Owner {owners.length > 1 ? `(${owners.length})` : ''}
            </h3>
            <ul className="space-y-3">
              {owners.map((member) => (
                <MemberRow key={member.id} member={member} />
              ))}
            </ul>
          </div>
        )}

        {/* Moderators */}
        {moderators.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Moderatorzy ({moderators.length})
            </h3>
            <ul className="space-y-3">
              {moderators.map((member) => (
                <MemberRow key={member.id} member={member} />
              ))}
            </ul>
          </div>
        )}

        {/* Participants */}
        {participants.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Uczestnicy ({participants.length})
            </h3>
            <ul className="space-y-3">
              {participants.slice(0, 10).map((member) => (
                <MemberRow key={member.id} member={member} compact />
              ))}
            </ul>
            {participants.length > 10 && (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                + {participants.length - 10} więcej
              </p>
            )}
          </div>
        )}

        {/* Empty State */}
        {members.length === 0 && (
          <div className="text-sm text-zinc-400 dark:text-zinc-600">
            Brak uczestników
          </div>
        )}
      </div>

      {/* Capacity Progress */}
      <div className="mt-6">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Zapełnienie</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {event.max === null
              ? '∞'
              : `${Math.round((event.joinedCount / event.max) * 100)}%`}
          </span>
        </div>
        {event.max !== null && (
          <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full bg-blue-600 transition-all dark:bg-blue-500"
              style={{
                width: `${Math.min((event.joinedCount / event.max) * 100, 100)}%`,
              }}
            />
          </div>
        )}
        {event.max === null && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Wydarzenie bez limitu uczestników
          </p>
        )}
        {event.min !== null &&
          event.min > 0 &&
          event.joinedCount < event.min && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Wydarzenie dojdzie do skutku od {event.min} osób
            </p>
          )}
      </div>
    </div>
  );
}

type MemberRowProps = {
  member: NonNullable<EventDetailsData['members']>[number];
  compact?: boolean;
};

function MemberRow({ member, compact = false }: MemberRowProps) {
  const displayName = member.user.profile?.displayName || member.user.name;
  const profileUrl = `/u/${member.user.name}`;

  return (
    <li className="flex items-center gap-3" data-u-id={member.user.id}>
      <Link href={profileUrl} className="flex-shrink-0">
        {member.user.avatarKey ? (
          <Avatar
            url={buildAvatarUrl(member.user.avatarKey, compact ? 'xs' : 'xs')}
            blurhash={member.user.avatarBlurhash}
            alt={displayName}
            size={compact ? 32 : 44}
            className={`rounded-full border border-zinc-200 object-cover transition-opacity hover:opacity-80 dark:border-zinc-700 `}
          />
        ) : (
          <div
            className={`flex items-center justify-center rounded-full border border-zinc-200 bg-zinc-200 transition-opacity hover:opacity-80 dark:border-zinc-700 dark:bg-zinc-700 ${
              compact ? 'h-8 w-8' : 'h-11 w-11'
            }`}
          >
            <span
              className={`font-semibold text-zinc-600 dark:text-zinc-300 ${
                compact ? 'text-xs' : 'text-sm'
              }`}
            >
              {displayName[0]?.toUpperCase()}
            </span>
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Link
              href={profileUrl}
              className={`truncate font-medium text-zinc-800 transition-colors hover:text-blue-600 dark:text-zinc-200 dark:hover:text-blue-400 ${
                compact ? 'text-sm' : 'text-base'
              }`}
            >
              {displayName}
            </Link>
            {member.user.verifiedAt && (
              <ShieldCheck
                className="h-4 w-4 flex-shrink-0 text-blue-500"
                aria-label="Zweryfikowany"
              />
            )}
          </div>
          <Link
            href={profileUrl}
            className={`truncate text-zinc-500 transition-colors hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 ${
              compact ? 'text-xs' : 'text-sm'
            }`}
          >
            @{member.user.name}
          </Link>
        </div>
        {!compact && member.note && (
          <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {member.note}
          </p>
        )}
      </div>
    </li>
  );
}
