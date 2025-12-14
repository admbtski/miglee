/**
 * Reject Check-in Modal Component
 * Allows moderator to reject check-in with reason and optional blocking
 */

'use client';

import { useState } from 'react';
import { X, AlertTriangle, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/lib/utils/toast-manager';
import {
  useRejectMemberCheckinMutation,
  invalidateCheckinData,
} from '@/features/events/api/checkin';
import { CheckinMethod } from '@/lib/api/__generated__/react-query-update';
import { useQueryClient } from '@tanstack/react-query';

interface RejectCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  userId: string;
  userName: string;
  method: CheckinMethod | null; // null = reject all
}

export function RejectCheckinModal({
  isOpen,
  onClose,
  eventId,
  userId,
  userName,
  method,
}: RejectCheckinModalProps) {
  const [reason, setReason] = useState('');
  const [showToUser, setShowToUser] = useState(true);
  const [blockAction, setBlockAction] = useState<'none' | 'method' | 'all'>(
    'none'
  );

  const queryClient = useQueryClient();
  const rejectMutation = useRejectMemberCheckinMutation({
    onSuccess: () => {
      toast.success('Check-in rejected', {
        description: `${userName}'s check-in has been rejected`,
      });
      invalidateCheckinData(queryClient, eventId);
      handleClose();
    },
    onError: (error: Error) => {
      toast.error('Failed to reject check-in', {
        description: error.message,
      });
    },
  });

  const handleClose = () => {
    setReason('');
    setShowToUser(true);
    setBlockAction('none');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await rejectMutation.mutateAsync({
      input: {
        eventId,
        userId,
        reason: reason.trim() || undefined,
        showReasonToUser: showToUser,
        blockMethod: blockAction === 'method' && method ? method : undefined,
        blockAll: blockAction === 'all',
      },
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 p-6 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Reject Check-in
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {userName}
                  {method && (
                    <span className="ml-1 text-amber-600 dark:text-amber-400">
                      ({method.replace('_', ' ')})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Reason for rejection
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter the reason for rejecting this check-in..."
                rows={4}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-500">
                Optional - provide context for your decision
              </p>
            </div>

            {/* Show to user */}
            <div className="flex items-start gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
              <input
                type="checkbox"
                id="showToUser"
                checked={showToUser}
                onChange={(e) => setShowToUser(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700"
              />
              <label
                htmlFor="showToUser"
                className="flex-1 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <span className="font-medium">Show reason to user</span>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">
                  User will see the reason in their notification
                </p>
              </label>
            </div>

            {/* Block action */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Additional action
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 cursor-pointer hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50">
                  <input
                    type="radio"
                    name="blockAction"
                    value="none"
                    checked={blockAction === 'none'}
                    onChange={(e) =>
                      setBlockAction(e.target.value as 'none' | 'method' | 'all')
                    }
                    className="h-4 w-4 border-zinc-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Just reject
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500">
                      User can try to check-in again
                    </div>
                  </div>
                </label>

                {method && (
                  <label className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 cursor-pointer hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50">
                    <input
                      type="radio"
                      name="blockAction"
                      value="method"
                      checked={blockAction === 'method'}
                      onChange={(e) =>
                        setBlockAction(
                          e.target.value as 'none' | 'method' | 'all'
                        )
                      }
                      className="h-4 w-4 border-zinc-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Block this method
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-500">
                        Block {method.replace('_', ' ')} for this user
                      </div>
                    </div>
                  </label>
                )}

                <label className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 cursor-pointer hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30">
                  <input
                    type="radio"
                    name="blockAction"
                    value="all"
                    checked={blockAction === 'all'}
                    onChange={(e) =>
                      setBlockAction(e.target.value as 'none' | 'method' | 'all')
                    }
                    className="h-4 w-4 border-zinc-300 text-red-600 focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-red-900 dark:text-red-100">
                      <Ban className="h-4 w-4" />
                      Block all methods
                    </div>
                    <div className="text-xs text-red-700 dark:text-red-300">
                      User won't be able to check-in at all
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={rejectMutation.isPending}
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rejectMutation.isPending}
                className="flex-1 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject Check-in'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
