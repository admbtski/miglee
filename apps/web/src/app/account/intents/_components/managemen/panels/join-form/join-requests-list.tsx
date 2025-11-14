'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, UserPlus, ChevronDown } from 'lucide-react';
import { JoinAnswersViewer } from '@/features/intents/components/join-answers-viewer';
import {
  useApproveJoinRequestMutation,
  useRejectJoinRequestMutation,
} from '@/lib/api/join-form';
import type { IntentJoinRequestsQuery } from '@/lib/api/__generated__/react-query-update';

type JoinRequest = IntentJoinRequestsQuery['intentJoinRequests']['items'][0];

interface JoinRequestsListProps {
  intentId: string;
  requests: JoinRequest[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
}

/**
 * List of pending join requests with answers
 * Used by intent owner/moderators
 */
export function JoinRequestsList({
  intentId,
  requests,
  isLoading,
  error,
  hasMore,
  onLoadMore,
  isLoadingMore,
}: JoinRequestsListProps) {
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  const approveRequest = useApproveJoinRequestMutation();
  const rejectRequest = useRejectJoinRequestMutation();

  const handleApprove = async (userId: string) => {
    try {
      setProcessingUserId(userId);
      await approveRequest.mutateAsync({
        input: {
          intentId,
          userId,
        },
      });
    } catch (error) {
      console.error('Failed to approve request:', error);
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleReject = async (userId: string, reason?: string) => {
    try {
      setProcessingUserId(userId);
      await rejectRequest.mutateAsync({
        input: {
          intentId,
          userId,
          reason,
        },
      });
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      setProcessingUserId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-900 dark:text-red-100">
              Błąd ładowania
            </h4>
            <p className="text-sm text-red-800 dark:text-red-200 mt-1">
              Nie udało się załadować próśb. Spróbuj ponownie.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-6 text-center">
        <UserPlus className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          Brak oczekujących próśb
        </h4>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Gdy ktoś wyśle prośbę o dołączenie, zobaczysz ją tutaj.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {requests.map((request) => (
          <JoinAnswersViewer
            key={request.member.id}
            request={request}
            onApprove={handleApprove}
            onReject={handleReject}
            isProcessing={processingUserId === request.member.userId}
          />
        ))}
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ładowanie...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Załaduj więcej
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
