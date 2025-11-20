'use client';

import type { EventDetailsData } from '@/types/event-details';
import { Lock, XCircle, UserPlus, UserMinus, UserCheck } from 'lucide-react';
import {
  useRequestJoinIntentMutation,
  useLeaveIntentMutationMembers,
  useCancelJoinRequestMutation,
  useJoinWaitlistOpenMutation,
  useLeaveWaitlistMutation,
} from '@/lib/api/intent-members';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useIntentJoinQuestionsQuery,
  useRequestJoinIntentWithAnswersMutation,
} from '@/lib/api/join-form';
import { JoinRequestModal } from '@/features/intents/components/join-request-modal';
import { FavouriteButton } from '@/components/ui/favourite-button';

type StickyJoinButtonProps = {
  event: EventDetailsData;
};

export function StickyJoinButton({ event }: StickyJoinButtonProps) {
  const { joinState, userMembership } = event;
  const [isProcessing, setIsProcessing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const queryClient = useQueryClient();

  const requestJoinMutation = useRequestJoinIntentMutation();
  const requestJoinWithAnswersMutation =
    useRequestJoinIntentWithAnswersMutation();
  const leaveIntentMutation = useLeaveIntentMutationMembers();
  const cancelRequestMutation = useCancelJoinRequestMutation();
  const joinWaitlistMutation = useJoinWaitlistOpenMutation();
  const leaveWaitlistMutation = useLeaveWaitlistMutation();

  // Fetch join questions for this event
  const { data: questions = [] } = useIntentJoinQuestionsQuery({
    intentId: event.id,
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
        await leaveIntentMutation.mutateAsync({ intentId: event.id });
        await queryClient.invalidateQueries({
          queryKey: ['intent-detail', event.id],
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
        await cancelRequestMutation.mutateAsync({ intentId: event.id });
        await queryClient.invalidateQueries({
          queryKey: ['intent-detail', event.id],
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
        await leaveWaitlistMutation.mutateAsync({ intentId: event.id });
        await queryClient.invalidateQueries({
          queryKey: ['intent-detail', event.id],
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
        await joinWaitlistMutation.mutateAsync({ intentId: event.id });
        await queryClient.invalidateQueries({
          queryKey: ['intent-detail', event.id],
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
        await requestJoinMutation.mutateAsync({ intentId: event.id });
        await queryClient.invalidateQueries({
          queryKey: ['intent-detail', event.id],
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
          intentId: event.id,
          answers,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: ['intent-detail', event.id],
      });
    } catch (error) {
      console.error('Join with answers failed:', error);
      alert('Wystąpił błąd. Spróbuj ponownie.');
      throw error;
    }
  };

  // Determine button label and state
  const getButtonConfig = () => {
    // Owner cannot leave their own event - hide button
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

  // Don't show sticky bar for owners
  if (!buttonConfig) {
    return null;
  }

  return (
    <>
      {/* Sticky Bottom Bar - Aligned to left column */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="container mx-auto max-w-6xl px-4 py-3">
          {/* Match the grid layout from event-detail-client */}
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Left column - sticky bar */}
            <div className="pointer-events-auto rounded-t-2xl border border-b-0 border-neutral-200 bg-white/95 backdrop-blur-lg shadow-lg dark:border-neutral-800 dark:bg-neutral-900/95 p-3">
              <div className="flex items-center gap-3">
                {/* Event Title - Left */}
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {event.title}
                  </h3>
                </div>

                {/* Favourite Button - Center */}
                <div className="flex-shrink-0">
                  <FavouriteButton
                    intentId={event.id}
                    isFavourite={event.isFavourite ?? false}
                    size="md"
                  />
                </div>

                {/* Join Button - Right */}
                <button
                  onClick={handleJoinAction}
                  disabled={buttonConfig.disabled || isProcessing}
                  className={`flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 ${
                    buttonConfig.variant === 'primary'
                      ? 'bg-neutral-900 text-white hover:opacity-90 active:opacity-80 dark:bg-white dark:text-neutral-900'
                      : buttonConfig.variant === 'secondary'
                        ? 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                        : 'cursor-not-allowed bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500'
                  }`}
                >
                  <buttonConfig.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {isProcessing ? 'Przetwarzanie...' : buttonConfig.label}
                  </span>
                  <span className="sm:hidden">
                    {isProcessing
                      ? '...'
                      : userMembership?.isJoined
                        ? 'Opuść'
                        : userMembership?.isPending
                          ? 'Anuluj'
                          : userMembership?.isWaitlisted
                            ? 'Opuść'
                            : 'Dołącz'}
                  </span>
                </button>
              </div>
            </div>

            {/* Right column - empty spacer */}
            <div className="hidden lg:block" />
          </div>
        </div>
      </div>

      {/* Join Request Modal with Questions */}
      <JoinRequestModal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        intentId={event.id}
        questions={questions as any}
        onSubmit={handleSubmitWithAnswers}
        eventTitle={event.title}
      />
    </>
  );
}
