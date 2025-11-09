import type { EventDetailsData } from '@/types/event-details';
import { formatOpensIn } from '@/lib/utils/intent-join-state';
import {
  Clock,
  Lock,
  CheckCircle,
  XCircle,
  UserPlus,
  UserMinus,
  UserCheck,
} from 'lucide-react';
import {
  useRequestJoinIntentMutation,
  useLeaveIntentMutationMembers,
  useCancelJoinRequestMutation,
} from '@/lib/api/intent-members';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

type EventJoinSectionProps = {
  event: EventDetailsData;
};

export function EventJoinSection({ event }: EventJoinSectionProps) {
  const { joinState, userMembership } = event;
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const requestJoinMutation = useRequestJoinIntentMutation();
  const leaveIntentMutation = useLeaveIntentMutationMembers();
  const cancelRequestMutation = useCancelJoinRequestMutation();

  const handleJoinAction = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      if (userMembership?.isJoined) {
        // Leave intent
        await leaveIntentMutation.mutateAsync({ intentId: event.id });
      } else if (userMembership?.isPending) {
        // Cancel pending request
        await cancelRequestMutation.mutateAsync({ intentId: event.id });
      } else {
        // Request to join (works for both OPEN and REQUEST modes)
        await requestJoinMutation.mutateAsync({ intentId: event.id });
      }

      // Invalidate intent detail query to refresh data
      await queryClient.invalidateQueries({
        queryKey: ['intent-detail', event.id],
      });
    } catch (error) {
      console.error('Join action failed:', error);
      alert('Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Determine button label and state
  const getButtonConfig = () => {
    if (userMembership?.isJoined) {
      return {
        label: 'Opuść wydarzenie',
        icon: UserMinus,
        variant: 'secondary' as const,
        disabled: false,
      };
    }

    if (userMembership?.isPending) {
      return {
        label: 'Anuluj prośbę',
        icon: XCircle,
        variant: 'secondary' as const,
        disabled: false,
      };
    }

    if (userMembership?.isInvited) {
      return {
        label: 'Zaakceptuj zaproszenie',
        icon: UserCheck,
        variant: 'primary' as const,
        disabled: false,
      };
    }

    if (event.joinMode === 'INVITE_ONLY' && !userMembership?.isInvited) {
      return {
        label: 'Tylko z zaproszenia',
        icon: Lock,
        variant: 'disabled' as const,
        disabled: true,
      };
    }

    return {
      label: joinState.ctaLabel,
      icon: UserPlus,
      variant: joinState.canJoin ? ('primary' as const) : ('disabled' as const),
      disabled: !joinState.canJoin,
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="sticky top-4 rounded-2xl border border-neutral-200 bg-white/70 p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        Zapisy
      </h2>

      {/* Membership Status */}
      {userMembership?.isJoined && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-green-50 p-3 text-sm dark:bg-green-950">
          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">
              Jesteś uczestnikiem tego wydarzenia
            </p>
          </div>
        </div>
      )}

      {userMembership?.isPending && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm dark:bg-amber-950">
          <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-100">
              Twoja prośba oczekuje na akceptację
            </p>
          </div>
        </div>
      )}

      {userMembership?.isInvited && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-sm dark:bg-blue-950">
          <UserCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100">
              Zostałeś zaproszony do tego wydarzenia
            </p>
          </div>
        </div>
      )}

      {/* Join State Info */}
      {!userMembership?.isJoined && !userMembership?.isPending && (
        <div className="mb-4 space-y-2">
          {/* Before Open */}
          {joinState.isBeforeOpen && joinState.opensInMs && (
            <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-sm dark:bg-blue-950">
              <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Zapisy otwierają się {formatOpensIn(joinState.opensInMs)}
                </p>
              </div>
            </div>
          )}

          {/* Manually Closed */}
          {joinState.isManuallyClosed && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm dark:bg-red-950">
              <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">
                  Zapisy zamknięte ręcznie
                </p>
                {event.joinManualCloseReason && (
                  <p className="mt-1 text-red-700 dark:text-red-300">
                    {event.joinManualCloseReason}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Pre-Cutoff Closed */}
          {joinState.isPreCutoffClosed && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm dark:bg-amber-950">
              <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Zapisy zamknięte przed startem
                </p>
              </div>
            </div>
          )}

          {/* Full */}
          {joinState.isFull && (
            <div className="flex items-start gap-2 rounded-xl bg-neutral-50 p-3 text-sm dark:bg-neutral-900">
              <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-600 dark:text-neutral-400" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  Brak wolnych miejsc
                </p>
              </div>
            </div>
          )}

          {/* Late Join Open */}
          {joinState.isLateJoinOpen && (
            <div className="flex items-start gap-2 rounded-xl bg-green-50 p-3 text-sm dark:bg-green-950">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Możliwe dołączenie po starcie
                </p>
              </div>
            </div>
          )}

          {/* Can Join */}
          {joinState.canJoin && (
            <div className="flex items-start gap-2 rounded-xl bg-green-50 p-3 text-sm dark:bg-green-950">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Zapisy otwarte
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={handleJoinAction}
        disabled={buttonConfig.disabled || isProcessing}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-md font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 ${
          buttonConfig.variant === 'primary'
            ? 'bg-neutral-900 text-white hover:opacity-90 active:opacity-80 dark:bg-white dark:text-neutral-900'
            : buttonConfig.variant === 'secondary'
              ? 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
              : 'cursor-not-allowed bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500'
        }`}
      >
        <buttonConfig.icon className="h-4 w-4" />
        {isProcessing ? 'Przetwarzanie...' : buttonConfig.label}
      </button>

      {/* Reason */}
      {joinState.reason && !joinState.canJoin && (
        <p className="mt-2 text-center text-xs text-neutral-600 dark:text-neutral-400">
          {joinState.reason}
        </p>
      )}

      {/* Join Windows Info */}
      {(event.joinOpensMinutesBeforeStart != null ||
        event.joinCutoffMinutesBeforeStart != null ||
        event.allowJoinLate) && (
        <div className="mt-6 space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Okna zapisów
          </h3>

          {event.joinOpensMinutesBeforeStart != null && (
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              <span className="font-medium">Otwarcie:</span>{' '}
              {event.joinOpensMinutesBeforeStart} min przed startem
            </div>
          )}

          {event.joinCutoffMinutesBeforeStart != null && (
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              <span className="font-medium">Zamknięcie:</span>{' '}
              {event.joinCutoffMinutesBeforeStart} min przed startem
            </div>
          )}

          {event.allowJoinLate && (
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              <span className="font-medium">Dołączenie po starcie:</span> Tak
              {event.lateJoinCutoffMinutesAfterStart != null &&
                ` (do ${event.lateJoinCutoffMinutesAfterStart} min po starcie)`}
            </div>
          )}

          {!event.allowJoinLate && (
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              <span className="font-medium">Dołączenie po starcie:</span> Nie
            </div>
          )}
        </div>
      )}
    </div>
  );
}
