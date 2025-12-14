/**
 * User Check-in Component
 * Allows users to check in to events they've joined
 */

'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  useCheckInSelfMutation,
  useUncheckInSelfMutation,
  useRotateMemberCheckinTokenMutation,
} from '@/features/events/api/checkin';
import { UserQRCode } from './user-qr-code';
import { useMeQuery } from '@/features/auth/hooks/auth';

interface UserCheckinSectionProps {
  eventId: string;
  isJoined: boolean;
  checkinEnabled: boolean;
  checkinMethods: string[];
  isCheckedIn: boolean;
  userCheckinMethods: string[];
  isBlocked: boolean;
  rejectionReason?: string | null;
  memberCheckinToken?: string | null;
  eventName?: string;
}

export function UserCheckinSection({
  eventId,
  isJoined,
  checkinEnabled,
  checkinMethods,
  isCheckedIn,
  userCheckinMethods,
  isBlocked,
  rejectionReason,
  memberCheckinToken,
  eventName = 'Event',
}: UserCheckinSectionProps) {
  const [showQR, setShowQR] = useState(false);
  const [localToken, setLocalToken] = useState(memberCheckinToken);
  const { data: authData } = useMeQuery();

  const checkInMutation = useCheckInSelfMutation();
  const uncheckInMutation = useUncheckInSelfMutation();
  const rotateTokenMutation = useRotateMemberCheckinTokenMutation({
    onSuccess: (data) => {
      if (data.rotateMemberCheckinToken?.memberCheckinToken) {
        setLocalToken(data.rotateMemberCheckinToken.memberCheckinToken);
        toast.success('QR code generated successfully');
      }
    },
    onError: (error) => {
      toast.error('Failed to generate QR code', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });

  // Auto-generate token if USER_QR is enabled but token doesn't exist
  useEffect(() => {
    const canUseUserQR = checkinMethods.includes('USER_QR');
    const userId = authData?.me?.id;
    if (
      canUseUserQR &&
      !localToken &&
      !isBlocked &&
      userId &&
      !rotateTokenMutation.isPending
    ) {
      rotateTokenMutation.mutate({ eventId, memberId: userId });
    }
  }, [checkinMethods, localToken, isBlocked, eventId, authData?.me?.id]);

  // Update local token when prop changes
  useEffect(() => {
    if (memberCheckinToken) {
      setLocalToken(memberCheckinToken);
    }
  }, [memberCheckinToken]);

  // Don't show if check-in is disabled or user is not joined
  if (!checkinEnabled || !isJoined) {
    return null;
  }

  const canSelfCheckin = checkinMethods.includes('SELF_MANUAL');
  const canUseUserQR = checkinMethods.includes('USER_QR');
  const hasManualCheckin = userCheckinMethods.includes('SELF_MANUAL');
  const isLoading = checkInMutation.isPending || uncheckInMutation.isPending;

  const handleCheckin = async () => {
    try {
      const result = await checkInMutation.mutateAsync({ eventId });
      if (result.checkInSelf?.success) {
        toast.success('Check-in successful!', {
          description: result.checkInSelf.message || undefined,
        });
      } else {
        toast.error('Check-in failed', {
          description: result.checkInSelf?.message || undefined,
        });
      }
    } catch (error) {
      toast.error('Check-in failed', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  const handleUncheck = async () => {
    try {
      const result = await uncheckInMutation.mutateAsync({ eventId });
      if (result.uncheckInSelf?.success) {
        toast.success('Check-in removed', {
          description: result.uncheckInSelf.message || undefined,
        });
      } else {
        toast.error('Failed to remove check-in', {
          description: result.uncheckInSelf?.message || undefined,
        });
      }
    } catch (error) {
      toast.error('Failed to remove check-in', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Your Presence
        </h3>
      </div>

      {/* Blocked Status */}
      {isBlocked && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
        >
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-red-900 dark:text-red-100">
                Check-in Blocked
              </div>
              <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                Check-in has been blocked by the organizer.
              </div>
              {rejectionReason && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400 italic">
                  Reason: {rejectionReason}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Rejection Notice */}
      {!isBlocked && rejectionReason && !isCheckedIn && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-amber-900 dark:text-amber-100">
                Previous Check-in Rejected
              </div>
              <div className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Your last check-in was rejected by the organizer.
              </div>
              <div className="mt-2 text-sm text-amber-600 dark:text-amber-400 italic">
                Reason: {rejectionReason}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Checked-in Status */}
      {isCheckedIn && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-emerald-900 dark:text-emerald-100">
                You&apos;re checked in! ✓
              </div>
              <div className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                Your presence at this event has been confirmed.
              </div>
              {userCheckinMethods.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {userCheckinMethods.map((method) => (
                    <span
                      key={method}
                      className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-200"
                    >
                      {method === 'SELF_MANUAL' && 'Manual'}
                      {method === 'MODERATOR_PANEL' && 'By Organizer'}
                      {method === 'EVENT_QR' && 'Event QR'}
                      {method === 'USER_QR' && 'Personal QR'}
                    </span>
                  ))}
                </div>
              )}
              {hasManualCheckin && canSelfCheckin && !isBlocked && (
                <button
                  onClick={handleUncheck}
                  disabled={isLoading}
                  className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 disabled:opacity-50"
                >
                  {isLoading ? 'Removing...' : 'Remove my check-in'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Check-in Button */}
      {!isCheckedIn && !isBlocked && canSelfCheckin && (
        <motion.button
          onClick={handleCheckin}
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-center font-semibold text-white shadow-lg shadow-indigo-500/30 transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Checking in...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5" />
              I&apos;m at the event!
            </span>
          )}
        </motion.button>
      )}

      {/* User QR Code Section */}
      {canUseUserQR && !isBlocked && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  My QR Code
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {localToken
                    ? 'Show this to the organizer'
                    : 'Generating your QR code...'}
                </div>
              </div>
            </div>
            {localToken && (
              <button
                onClick={() => setShowQR(!showQR)}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                {showQR ? 'Hide' : 'Show'} QR
              </button>
            )}
          </div>

          <AnimatePresence>
            {showQR && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                {localToken && authData?.me ? (
                  <UserQRCode
                    eventId={eventId}
                    userId={authData.me.id}
                    memberId={authData.me.id}
                    token={localToken}
                    eventName={eventName}
                    userName={authData.me.name || 'User'}
                  />
                ) : (
                  <div className="flex items-center justify-center p-8">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Generating your QR code...
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Instructions */}
      {!isCheckedIn && !isBlocked && (
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/40 p-4 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            How to check in:
          </div>
          <ul className="space-y-1 list-disc list-inside">
            {canSelfCheckin && (
              <li>Click the &quot;I&apos;m at the event!&quot; button above</li>
            )}
            {canUseUserQR && <li>Show your QR code to the event staff</li>}
            {checkinMethods.includes('EVENT_QR') && (
              <li>Scan the event QR code at the entrance</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
