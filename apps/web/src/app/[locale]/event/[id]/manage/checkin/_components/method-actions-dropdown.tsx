/**
 * Method Actions Dropdown Component
 * Dropdown for individual check-in method actions (uncheck, reject, block)
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  X,
  AlertTriangle,
  Ban,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import {
  CheckinMethod,
  EventMemberCoreFragment,
} from '@/lib/api/__generated__/react-query-update';
import {
  useUncheckInMemberMutation,
  useBlockMemberCheckinMutation,
  useUnblockMemberCheckinMutation,
  invalidateCheckinData,
} from '@/features/events/api/checkin';
import { toast } from '@/lib/utils/toast-manager';

interface MethodActionsDropdownProps {
  member: EventMemberCoreFragment;
  eventId: string;
  method: CheckinMethod;
  isActive: boolean;
  isBlocked: boolean;
  onReject: () => void;
}

export function MethodActionsDropdown({
  member,
  eventId,
  method,
  isActive,
  isBlocked,
  onReject,
}: MethodActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const uncheckMutation = useUncheckInMemberMutation({
    onSuccess: () => {
      toast.success('Check-in method removed');
      invalidateCheckinData(eventId);
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast.error('Failed to remove check-in', {
        description: error.message,
      });
    },
  });

  const blockMutation = useBlockMemberCheckinMutation({
    onSuccess: () => {
      toast.success('Method blocked');
      invalidateCheckinData(eventId);
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast.error('Failed to block method', {
        description: error.message,
      });
    },
  });

  const unblockMutation = useUnblockMemberCheckinMutation({
    onSuccess: () => {
      toast.success('Method unblocked');
      invalidateCheckinData(eventId);
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast.error('Failed to unblock method', {
        description: error.message,
      });
    },
  });

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleUncheck = async () => {
    await uncheckMutation.mutateAsync({
      input: {
        eventId,
        userId: member.userId,
        method,
      },
    });
  };

  const handleBlock = async () => {
    await blockMutation.mutateAsync({
      input: {
        eventId,
        userId: member.userId,
        method,
        blockAll: false,
      },
    });
  };

  const handleUnblock = async () => {
    await unblockMutation.mutateAsync({
      input: {
        eventId,
        userId: member.userId,
        method,
        unblockAll: false,
      },
    });
  };

  const isPending =
    uncheckMutation.isPending ||
    blockMutation.isPending ||
    unblockMutation.isPending;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800/90 text-white hover:bg-zinc-900 dark:bg-zinc-200/90 dark:text-zinc-900 dark:hover:bg-zinc-100"
        title="Method actions"
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <MoreVertical className="h-3 w-3" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          <div className="p-1">
            {/* Uncheck this method */}
            {isActive && (
              <button
                onClick={handleUncheck}
                disabled={isPending}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                <X className="h-4 w-4" />
                Remove this method
              </button>
            )}

            {/* Reject with reason */}
            <button
              onClick={() => {
                onReject();
                setIsOpen(false);
              }}
              disabled={isPending}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
            >
              <AlertTriangle className="h-4 w-4" />
              Reject with reason
            </button>

            <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />

            {/* Block/Unblock method */}
            {isBlocked ? (
              <button
                onClick={handleUnblock}
                disabled={isPending}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
              >
                <CheckCircle className="h-4 w-4" />
                Unblock this method
              </button>
            ) : (
              <button
                onClick={handleBlock}
                disabled={isPending}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Ban className="h-4 w-4" />
                Block this method
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
