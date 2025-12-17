'use client';

import {
  JoinRequestModal,
  useEventJoinQuestionsQuery,
  useRequestJoinEventWithAnswersMutation,
} from '@/features/join-form';
import {
  useCancelJoinRequestMutation,
  useJoinWaitlistOpenMutation,
  useLeaveEventMutationMembers,
  useLeaveWaitlistMutation,
  useMyMembershipForEventQuery,
  useRequestJoinEventMutation,
} from '@/features/events';
import { formatOpensIn } from '@/features/events';
import type { EventDetailsData } from '@/features/events';
import { useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  Clock,
  Lock,
  MessageCircle,
  UserCheck,
  UserMinus,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type EventJoinSectionProps = {
  event: EventDetailsData;
  onOpenChat?: () => void;
};

export function EventJoinSection({ event, onOpenChat }: EventJoinSectionProps) {
  const {
    joinState,
    userMembership: eventUserMembership,
    membersVisibility,
  } = event;

  // Determine if we need to fetch membership separately
  // For PUBLIC visibility, we use event.userMembership directly
  // For HIDDEN or AFTER_JOIN, we need to fetch it separately when userMembership is empty
  const needsSeparateFetch = useMemo(() => {
    if (membersVisibility === 'PUBLIC') return false;
    // For HIDDEN or AFTER_JOIN, fetch if userMembership is not available
    return !eventUserMembership;
  }, [membersVisibility, eventUserMembership]);

  // Fetch membership separately when needed
  const { data: fetchedMembership } = useMyMembershipForEventQuery(
    { eventId: event.id },
    { enabled: needsSeparateFetch }
  );

  // Use fetched membership if we needed to fetch, otherwise use event's userMembership
  const userMembership = useMemo(() => {
    if (!needsSeparateFetch) {
      return eventUserMembership;
    }

    // Map fetched membership to the same shape as eventUserMembership
    const member = fetchedMembership?.myMembershipForEvent;
    if (!member) return null;

    return {
      isOwner: member.role === 'OWNER',
      isModerator: member.role === 'MODERATOR',
      isJoined: member.status === 'JOINED',
      isPending: member.status === 'PENDING',
      isInvited: member.status === 'INVITED',
      isRejected: member.status === 'REJECTED',
      isBanned: member.status === 'BANNED',
      isWaitlisted: member.status === 'WAITLIST',
      rejectReason: member.rejectReason ?? null,
      banReason: null, // Not available in EventMember type
    };
  }, [needsSeparateFetch, eventUserMembership, fetchedMembership]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const queryClient = useQueryClient();

  const requestJoinMutation = useRequestJoinEventMutation();
  const requestJoinWithAnswersMutation =
    useRequestJoinEventWithAnswersMutation();
  const leaveEventMutation = useLeaveEventMutationMembers();
  const cancelRequestMutation = useCancelJoinRequestMutation();
  const joinWaitlistMutation = useJoinWaitlistOpenMutation();
  const leaveWaitlistMutation = useLeaveWaitlistMutation();

  // Fetch join questions for this event
  const { data: questions = [] } = useEventJoinQuestionsQuery({
    eventId: event.id,
  });

  const handleJoinAction = async () => {
    if (isProcessing) return;

    // If user is already joined or pending, handle those actions directly
    if (userMembership?.isJoined) {
      // Owner cannot leave their own event - they must cancel or delete it
      if (userMembership?.isOwner) {
        alert(
          'Jako właściciel nie możesz opuścić wydarzenia. Możesz je anulować lub usunąć w panelu zarządzania.'
        );
        return;
      }

      setIsProcessing(true);
      try {
        await leaveEventMutation.mutateAsync({ eventId: event.id });
        await queryClient.invalidateQueries({
          queryKey: ['event-detail', event.id],
        });
      } catch (error) {
        console.error('Leave action failed:', error);
        alert('Wystąpił błąd. Spróbuj ponownie.');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (userMembership?.isPending) {
      setIsProcessing(true);
      try {
        await cancelRequestMutation.mutateAsync({ eventId: event.id });
        await queryClient.invalidateQueries({
          queryKey: ['event-detail', event.id],
        });
      } catch (error) {
        console.error('Cancel request failed:', error);
        alert('Wystąpił błąd. Spróbuj ponownie.');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (userMembership?.isWaitlisted) {
      setIsProcessing(true);
      try {
        await leaveWaitlistMutation.mutateAsync({ eventId: event.id });
        await queryClient.invalidateQueries({
          queryKey: ['event-detail', event.id],
        });
      } catch (error) {
        console.error('Leave waitlist failed:', error);
        alert('Wystąpił błąd. Spróbuj ponownie.');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Check if event is full and OPEN mode -> join waitlist
    if (joinState.isFull && event.joinMode === 'OPEN' && joinState.canJoin) {
      setIsProcessing(true);
      try {
        await joinWaitlistMutation.mutateAsync({ eventId: event.id });
        await queryClient.invalidateQueries({
          queryKey: ['event-detail', event.id],
        });
      } catch (error) {
        console.error('Join waitlist failed:', error);
        alert('Wystąpił błąd. Spróbuj ponownie.');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // For new join requests, check if there are questions
    if (questions.length > 0) {
      // Show modal with questions
      setShowJoinModal(true);
    } else {
      // No questions, submit directly
      setIsProcessing(true);
      try {
        await requestJoinMutation.mutateAsync({ eventId: event.id });
        await queryClient.invalidateQueries({
          queryKey: ['event-detail', event.id],
        });
      } catch (error) {
        console.error('Join action failed:', error);
        alert('Wystąpił błąd. Spróbuj ponownie.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSubmitWithAnswers = async (
    answers: Array<{ questionId: string; answer: any }>
  ) => {
    try {
      await requestJoinWithAnswersMutation.mutateAsync({
        input: {
          eventId: event.id,
          answers,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: ['event-detail', event.id],
      });
    } catch (error) {
      console.error('Join with answers failed:', error);
      alert('Wystąpił błąd. Spróbuj ponownie.');
      throw error;
    }
  };

  // Determine button label and state
  const getButtonConfig = () => {
    // Owner cannot leave their own event
    if (userMembership?.isOwner) {
      return null;
    }

    if (userMembership?.isJoined) {
      return {
        label: 'Opuść wydarzenie',
        icon: UserMinus,
        variant: 'secondary' as const,
        disabled: false,
      };
    }

    if (userMembership?.isWaitlisted) {
      return {
        label: 'Opuść listę oczekujących',
        icon: XCircle,
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

    if (userMembership?.isRejected) {
      return {
        label: 'Prośba odrzucona',
        icon: XCircle,
        variant: 'disabled' as const,
        disabled: true,
      };
    }

    if (userMembership?.isBanned) {
      return {
        label: 'Zbanowany',
        icon: Lock,
        variant: 'disabled' as const,
        disabled: true,
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

    // If event is full and OPEN mode, show waitlist CTA
    if (joinState.isFull && event.joinMode === 'OPEN' && joinState.canJoin) {
      return {
        label: 'Dołącz do listy oczekujących',
        icon: UserPlus,
        variant: 'primary' as const,
        disabled: false,
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
    <div className="rounded-2xl border border-zinc-200 bg-white/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/40 transition-all duration-300">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Zapisy
      </h2>

      {/* Membership Status */}
      {userMembership?.isOwner && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-sm dark:bg-blue-950">
          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100">
              Jesteś właścicielem tego wydarzenia
            </p>
            <p className="mt-1 text-blue-700 dark:text-blue-300">
              Nie możesz opuścić własnego wydarzenia. Aby zakończyć wydarzenie,
              możesz je anulować lub usunąć w panelu zarządzania.
            </p>
          </div>
        </div>
      )}

      {userMembership?.isJoined && !userMembership?.isOwner && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-green-50 p-3 text-sm dark:bg-green-950">
          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">
              Jesteś uczestnikiem tego wydarzenia
            </p>
          </div>
        </div>
      )}

      {userMembership?.isWaitlisted && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-purple-50 p-3 text-sm dark:bg-purple-950">
          <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600 dark:text-purple-400" />
          <div>
            <p className="font-medium text-purple-900 dark:text-purple-100">
              Jesteś na liście oczekujących
            </p>
            <p className="mt-1 text-purple-700 dark:text-purple-300">
              Zostaniesz automatycznie dodany gdy zwolni się miejsce
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

      {userMembership?.isRejected && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm dark:bg-red-950">
          <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <p className="font-medium text-red-900 dark:text-red-100">
              Twoja prośba została odrzucona
            </p>
            {userMembership.rejectReason && (
              <p className="mt-1 text-red-700 dark:text-red-300">
                Powód: {userMembership.rejectReason}
              </p>
            )}
          </div>
        </div>
      )}

      {userMembership?.isBanned && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm dark:bg-red-950">
          <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <p className="font-medium text-red-900 dark:text-red-100">
              Zostałeś zbanowany w tym wydarzeniu
            </p>
            {userMembership.banReason && (
              <p className="mt-1 text-red-700 dark:text-red-300">
                Powód: {userMembership.banReason}
              </p>
            )}
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
          {joinState.isFull && !userMembership?.isWaitlisted && (
            <div className="flex items-start gap-2 rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
              <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-600 dark:text-zinc-400" />
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  Brak wolnych miejsc
                </p>
                {event.joinMode === 'OPEN' && joinState.canJoin && (
                  <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                    Możesz dołączyć do listy oczekujących
                  </p>
                )}
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

      {/* CTA Button - hidden for owners */}
      {buttonConfig && (
        <button
          onClick={handleJoinAction}
          disabled={buttonConfig.disabled || isProcessing}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-md font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 ${
            buttonConfig.variant === 'primary'
              ? 'bg-zinc-900 text-white hover:opacity-90 active:opacity-80 dark:bg-white dark:text-zinc-900'
              : buttonConfig.variant === 'secondary'
                ? 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                : 'cursor-not-allowed bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'
          }`}
        >
          <buttonConfig.icon className="h-4 w-4" />
          {isProcessing ? 'Przetwarzanie...' : buttonConfig.label}
        </button>
      )}

      {/* Chat Button - for joined members */}
      {event.userMembership?.isJoined && onOpenChat && (
        <button
          onClick={onOpenChat}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 text-md font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Otwórz czat wydarzenia</span>
          {event.messagesCount > 0 && (
            <span className="ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white dark:bg-blue-500">
              {event.messagesCount}
            </span>
          )}
        </button>
      )}

      {/* Reason */}
      {joinState.reason && (
        <p className="mt-2 text-center text-xs text-zinc-600 dark:text-zinc-400">
          {joinState.reason}
        </p>
      )}

      {/* Join Windows Info */}
      {(event.joinOpensMinutesBeforeStart != null ||
        event.joinCutoffMinutesBeforeStart != null ||
        event.allowJoinLate) && (
        <div className="mt-6 space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Okna zapisów
          </h3>

          {event.joinOpensMinutesBeforeStart != null && (
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">Otwarcie:</span>{' '}
              {event.joinOpensMinutesBeforeStart} min przed startem
            </div>
          )}

          {event.joinCutoffMinutesBeforeStart != null && (
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">Zamknięcie:</span>{' '}
              {event.joinCutoffMinutesBeforeStart} min przed startem
            </div>
          )}

          {event.allowJoinLate && (
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">Dołączenie po starcie:</span> Tak
              {event.lateJoinCutoffMinutesAfterStart != null &&
                ` (do ${event.lateJoinCutoffMinutesAfterStart} min po starcie)`}
            </div>
          )}

          {!event.allowJoinLate && (
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">Dołączenie po starcie:</span> Nie
            </div>
          )}
        </div>
      )}

      {/* Join Request Modal with Questions */}
      <JoinRequestModal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        eventId={event.id}
        questions={questions as any}
        onSubmit={handleSubmitWithAnswers}
        eventTitle={event.title}
      />
    </div>
  );
}
