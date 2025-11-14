'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Calendar,
  Clock,
  MapPin,
  Loader2,
  UserX,
  AlertCircle,
  FileQuestion,
  ChevronDown,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  useMyJoinRequestsQuery,
  useCancelJoinRequestMutation,
} from '@/lib/api/join-form';
import { IntentMemberStatus } from '@/lib/api/__generated__/react-query-update';

/**
 * Client component for viewing user's join requests
 * Shows PENDING, REJECTED, and optionally CANCELLED requests
 */
export function MyJoinRequestsClient() {
  const [statusFilter, setStatusFilter] = useState<
    IntentMemberStatus | undefined
  >(IntentMemberStatus.Pending);

  const {
    data: requests = [],
    isLoading,
    error,
  } = useMyJoinRequestsQuery({
    status: statusFilter,
    limit: 50,
  });

  const cancelRequest = useCancelJoinRequestMutation();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancelRequest = async (intentId: string) => {
    try {
      setCancellingId(intentId);
      await cancelRequest.mutateAsync({ intentId });
    } catch (error) {
      console.error('Failed to cancel request:', error);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: IntentMemberStatus) => {
    switch (status) {
      case IntentMemberStatus.Pending:
        return (
          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20">
            Oczekuje
          </Badge>
        );
      case IntentMemberStatus.Rejected:
        return (
          <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20">
            Odrzucone
          </Badge>
        );
      case IntentMemberStatus.Cancelled:
        return (
          <Badge
            variant="outline"
            className="bg-neutral-50 dark:bg-neutral-900/20"
          >
            Anulowane
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Moje prośby o dołączenie
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Zarządzaj swoimi prośbami o dołączenie do wydarzeń
        </p>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <Button
          variant={
            statusFilter === IntentMemberStatus.Pending ? 'default' : 'outline'
          }
          size="sm"
          onClick={() => setStatusFilter(IntentMemberStatus.Pending)}
        >
          Oczekujące
        </Button>
        <Button
          variant={
            statusFilter === IntentMemberStatus.Rejected ? 'default' : 'outline'
          }
          size="sm"
          onClick={() => setStatusFilter(IntentMemberStatus.Rejected)}
        >
          Odrzucone
        </Button>
        <Button
          variant={
            statusFilter === IntentMemberStatus.Cancelled
              ? 'default'
              : 'outline'
          }
          size="sm"
          onClick={() => setStatusFilter(IntentMemberStatus.Cancelled)}
        >
          Anulowane
        </Button>
        <Button
          variant={statusFilter === undefined ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter(undefined)}
        >
          Wszystkie
        </Button>
      </div>

      {/* Requests list */}
      {requests.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-12 text-center">
          <FileQuestion className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            Brak próśb
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {statusFilter === IntentMemberStatus.Pending
              ? 'Nie masz żadnych oczekujących próśb o dołączenie.'
              : statusFilter === IntentMemberStatus.Rejected
                ? 'Nie masz żadnych odrzuconych próśb.'
                : statusFilter === IntentMemberStatus.Cancelled
                  ? 'Nie masz żadnych anulowanych próśb.'
                  : 'Nie masz żadnych próśb o dołączenie.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4"
            >
              {/* Intent info */}
              <div className="flex items-start gap-4">
                <Avatar
                  url={request.intent.owner.imageUrl || ''}
                  alt={request.intent.owner.name}
                  size={48}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                        {request.intent.title}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        Organizator: {request.intent.owner.name}
                      </p>
                    </div>
                    {getStatusBadge(request.status as IntentMemberStatus)}
                  </div>

                  {request.intent.description && (
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-2 line-clamp-2">
                      {request.intent.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(request.intent.startAt).toLocaleDateString(
                          'pl-PL',
                          {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>
                        {new Date(request.intent.startAt).toLocaleTimeString(
                          'pl-PL',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Request info */}
              <div className="rounded-md bg-neutral-50 dark:bg-neutral-800/50 p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Wysłano:
                  </span>
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {formatDistanceToNow(
                      new Date(request.joinedAt || Date.now()),
                      {
                        addSuffix: true,
                        locale: pl,
                      }
                    )}
                  </span>
                </div>

                {request.status === IntentMemberStatus.Rejected &&
                  request.rejectReason && (
                    <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                        Powód odrzucenia:
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {request.rejectReason}
                      </p>
                    </div>
                  )}
              </div>

              {/* My answers */}
              {request.joinAnswers && request.joinAnswers.length > 0 && (
                <details className="group">
                  <summary className="flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-neutral-100 cursor-pointer">
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                    Moje odpowiedzi ({request.joinAnswers.length})
                  </summary>
                  <div className="mt-3 space-y-3 pl-6">
                    {request.joinAnswers.map((answer, index) => (
                      <div
                        key={answer.id}
                        className="space-y-1 rounded-md bg-neutral-50 dark:bg-neutral-800/50 p-3"
                      >
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {index + 1}. {answer.question.label}
                        </p>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">
                          {answer.question.type === 'MULTI_CHOICE' &&
                          Array.isArray(answer.answer)
                            ? answer.answer.join(', ')
                            : String(answer.answer)}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Actions */}
              {request.status === IntentMemberStatus.Pending && (
                <div className="flex items-center justify-end pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancelRequest(request.intentId)}
                    disabled={cancellingId === request.intentId}
                  >
                    {cancellingId === request.intentId ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Anulowanie...
                      </>
                    ) : (
                      <>
                        <UserX className="h-4 w-4 mr-2" />
                        Anuluj prośbę
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
