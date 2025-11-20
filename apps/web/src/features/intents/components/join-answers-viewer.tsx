'use client';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X, Calendar, MapPin } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { IntentJoinRequestsQuery } from '@/lib/api/__generated__/react-query-update';
import { buildAvatarUrl } from '@/lib/media/url';

type JoinRequest = IntentJoinRequestsQuery['intentJoinRequests']['items'][0];

interface JoinAnswersViewerProps {
  request: JoinRequest;
  onApprove: (userId: string) => void;
  onReject: (userId: string, reason?: string) => void;
  isProcessing?: boolean;
}

/**
 * Component for viewing join request answers and approving/rejecting
 * Used by intent owner/moderators
 */
export function JoinAnswersViewer({
  request,
  onApprove,
  onReject,
  isProcessing = false,
}: JoinAnswersViewerProps) {
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { member, answers } = request;
  const user = member.user;

  const handleApprove = () => {
    onApprove(member.userId);
  };

  const handleReject = () => {
    if (showRejectReason) {
      onReject(member.userId, rejectReason.trim() || undefined);
      setShowRejectReason(false);
      setRejectReason('');
    } else {
      setShowRejectReason(true);
    }
  };

  const handleCancelReject = () => {
    setShowRejectReason(false);
    setRejectReason('');
  };

  const formatAnswer = (answer: any, type: string) => {
    if (type === 'TEXT') {
      return answer;
    } else if (type === 'SINGLE_CHOICE') {
      return answer;
    } else if (type === 'MULTI_CHOICE') {
      if (Array.isArray(answer)) {
        return answer.join(', ');
      }
      return answer;
    }
    return String(answer);
  };

  return (
    <div className="space-y-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      {/* User info header */}
      <div className="flex items-start gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <Avatar
          url={buildAvatarUrl(user.avatarKey, 'md')}
          blurhash={user.avatarBlurhash}
          alt={user.name}
          size={48}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
              {user.name}
            </h4>
            {user.verifiedAt && (
              <Badge variant="outline" className="text-xs">
                Zweryfikowany
              </Badge>
            )}
          </div>

          {user.profile?.city && (
            <div className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>
                {user.profile.city}
                {user.profile.country && `, ${user.profile.country}`}
              </span>
            </div>
          )}

          {user.profile?.bioShort && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2">
              {user.profile.bioShort}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Wysłano{' '}
              {formatDistanceToNow(new Date(member.joinedAt || Date.now()), {
                addSuffix: true,
                locale: pl,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Answers */}
      {answers.length > 0 ? (
        <div className="space-y-4">
          <h5 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Odpowiedzi na pytania:
          </h5>
          {answers.map((answer, index) => (
            <div
              key={answer.id}
              className="space-y-1.5 rounded-md bg-neutral-50 dark:bg-neutral-800/50 p-3"
            >
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {index + 1}. {answer.question.label}
              </p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                {formatAnswer(answer.answer, answer.question.type)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">
          Brak odpowiedzi (formularz nie był wymagany)
        </p>
      )}

      {/* Reject reason input */}
      {showRejectReason && (
        <div className="space-y-2 pt-2">
          <Label htmlFor="reject-reason" className="text-sm">
            Powód odrzucenia (opcjonalnie)
          </Label>
          <Textarea
            id="reject-reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Np. Brak doświadczenia, nieodpowiednie odpowiedzi..."
            maxLength={500}
            rows={3}
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {rejectReason.length} / 500 znaków
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        {!showRejectReason ? (
          <>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex-1"
              variant="default"
            >
              <Check className="h-4 w-4 mr-2" />
              Zatwierdź
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing}
              className="flex-1"
              variant="destructive"
            >
              <X className="h-4 w-4 mr-2" />
              Odrzuć
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={handleCancelReject}
              disabled={isProcessing}
              variant="outline"
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing}
              variant="destructive"
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Potwierdź odrzucenie
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
