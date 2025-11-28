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
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
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
      <div className="rounded-2xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-8 text-center shadow-sm">
        <UserPlus className="h-10 w-10 text-zinc-400 mx-auto mb-4" />
        <h4 className="font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Brak oczekujących próśb
        </h4>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[50ch] mx-auto">
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
