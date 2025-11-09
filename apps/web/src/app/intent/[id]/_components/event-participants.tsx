import type { EventDetailsData } from '@/types/event-details';
import { ShieldCheck, Users as UserGroup } from 'lucide-react';

type EventParticipantsProps = {
  event: EventDetailsData;
};

export function EventParticipants({ event }: EventParticipantsProps) {
  const canSeeMembers = event.membersVisibility === 'PUBLIC' || event.members;

  if (!canSeeMembers) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Uczestnicy
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {event.membersVisibility === 'AFTER_JOIN'
            ? 'Lista uczestników widoczna po dołączeniu'
            : 'Lista uczestników ukryta'}
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
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Uczestnicy
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <UserGroup className="h-5 w-5" />
          <span>
            {event.joinedCount} / {event.max}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Owners */}
        {owners.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Organizator
            </h3>
            <div className="space-y-2">
              {owners.map((member) => (
                <MemberRow key={member.id} member={member} />
              ))}
            </div>
          </div>
        )}

        {/* Moderators */}
        {moderators.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Moderatorzy
            </h3>
            <div className="space-y-2">
              {moderators.map((member) => (
                <MemberRow key={member.id} member={member} />
              ))}
            </div>
          </div>
        )}

        {/* Participants */}
        {participants.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Uczestnicy ({participants.length})
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {participants.map((member) => (
                <MemberRow key={member.id} member={member} compact />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {members.length === 0 && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Brak uczestników
          </p>
        )}
      </div>

      {/* Capacity Progress */}
      <div className="mt-6">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Zapełnienie</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {Math.round((event.joinedCount / event.max) * 100)}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-blue-600 transition-all dark:bg-blue-500"
            style={{
              width: `${Math.min((event.joinedCount / event.max) * 100, 100)}%`,
            }}
          />
        </div>
        {event.min > 0 && event.joinedCount < event.min && (
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
  return (
    <div
      className={`flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-900 ${
        compact ? '' : 'border border-gray-100 dark:border-gray-700'
      }`}
    >
      {member.user.imageUrl ? (
        <img
          src={member.user.imageUrl}
          alt={member.user.name}
          className={`rounded-full object-cover ${compact ? 'h-8 w-8' : 'h-10 w-10'}`}
        />
      ) : (
        <div
          className={`flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 ${
            compact ? 'h-8 w-8' : 'h-10 w-10'
          }`}
        >
          <span
            className={`font-semibold text-gray-600 dark:text-gray-300 ${
              compact ? 'text-xs' : 'text-sm'
            }`}
          >
            {member.user.name[0]?.toUpperCase()}
          </span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p
            className={`truncate font-medium text-gray-900 dark:text-gray-100 ${
              compact ? 'text-sm' : ''
            }`}
          >
            {member.user.name}
          </p>
          {member.user.verifiedAt && (
            <ShieldCheck
              className="h-4 w-4 flex-shrink-0 text-blue-500"
              title="Zweryfikowany"
            />
          )}
        </div>
        {!compact && member.note && (
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {member.note}
          </p>
        )}
      </div>
    </div>
  );
}
