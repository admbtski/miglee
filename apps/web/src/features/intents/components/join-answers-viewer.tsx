'use client';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X, Clock, MapPin } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all hover:shadow-md"
    >
      {/* User info header */}
      <div className="flex items-start gap-4 p-5 border-b border-zinc-200 dark:border-zinc-800">
        <Avatar
          url={buildAvatarUrl(user.avatarKey, 'md')}
          blurhash={user.avatarBlurhash}
          alt={user.name}
          size={48}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
              {user.name}
            </h4>
            {user.verifiedAt && (
              <Badge variant="outline" className="text-xs">
                Zweryfikowany
              </Badge>
            )}
          </div>

          {user.profile?.city && (
            <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 mt-1.5">
              <MapPin className="h-4 w-4 text-zinc-500" />
              <span>
                {user.profile.city}
                {user.profile.country && `, ${user.profile.country}`}
              </span>
            </div>
          )}

          {user.profile?.bioShort && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2">
              {user.profile.bioShort}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-2.5">
            <Clock className="h-3.5 w-3.5 text-zinc-400" />
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
      <div className="pt-4 pb-2 px-5">
        {answers.length > 0 ? (
          <div className="space-y-4">
            <h5 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Odpowiedzi na pytania:
            </h5>
            {answers.map((answer, index) => (
              <div
                key={answer.id}
                className="space-y-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4"
              >
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {index + 1}. {answer.question.label}
                </p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {formatAnswer(answer.answer, answer.question.type)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
            Brak odpowiedzi (formularz nie był wymagany)
          </p>
        )}
      </div>

      {/* Reject reason input */}
      {showRejectReason && (
        <div className="space-y-2 px-5 pb-4">
          <Label htmlFor="reject-reason" className="text-sm font-medium">
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
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-right">
            {rejectReason.length} / 500 znaków
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 p-5 border-t border-zinc-200 dark:border-zinc-800">
        {!showRejectReason ? (
          <>
            <motion.div
              className="flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                className="w-full h-12"
                variant="default"
              >
                <Check className="h-4 w-4 mr-2" />
                Zatwierdź
              </Button>
            </motion.div>
            <motion.div
              className="flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleReject}
                disabled={isProcessing}
                className="w-full h-12"
                variant="destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Odrzuć
              </Button>
            </motion.div>
          </>
        ) : (
          <>
            <Button
              onClick={handleCancelReject}
              disabled={isProcessing}
              variant="outline"
              className="flex-1 h-12"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing}
              variant="destructive"
              className="flex-1 h-12"
            >
              <X className="h-4 w-4 mr-2" />
              Potwierdź odrzucenie
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
