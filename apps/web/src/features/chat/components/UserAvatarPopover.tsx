/**
 * User Avatar Popover
 * Shows user info and profile link when clicking on avatar
 */

// TODO i18n: All strings need translation keys

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useDismiss,
  useRole,
  useInteractions,
} from '@floating-ui/react';
import { useParams } from 'next/navigation';
import { buildAvatarUrl } from '@/lib/media/url';

interface UserAvatarPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  referenceElement: HTMLElement | null;
}

export function UserAvatarPopover({
  isOpen,
  onClose,
  user,
  referenceElement,
}: UserAvatarPopoverProps) {
  const params = useParams();
  const locale = params?.locale || 'pl';

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      if (!open) onClose();
    },
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    placement: 'top-start',
    strategy: 'absolute',
    transform: false,
  });

  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getFloatingProps } = useInteractions([dismiss, role]);

  useEffect(() => {
    if (referenceElement) {
      refs.setReference(referenceElement);
    }
  }, [referenceElement, refs, isOpen]);

  const avatarUrl = user.avatar ? buildAvatarUrl(user.avatar, 'sm') : null;

  return (
    <AnimatePresence>
      {isOpen && referenceElement && (
        <motion.div
          ref={refs.setFloating}
          style={floatingStyles}
          initial={{ scale: 0.96, opacity: 0, y: 4 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 4 }}
          transition={{
            duration: 0.18,
            type: 'spring',
            stiffness: 400,
            damping: 25,
          }}
          className="z-50 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 min-w-[200px]"
          {...getFloatingProps()}
        >
          {/* User Info */}
          <div className="flex items-center gap-3 mb-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-zinc-800"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold ring-2 ring-zinc-100 dark:ring-zinc-800">
                {user.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {user.name}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                @{user.name}
              </p>
            </div>
          </div>

          {/* Actions */}
          <Link
            href={`/${locale}/u/${user.name}`}
            onClick={onClose}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <User className="w-4 h-4" />
            {/* TODO i18n */}
            Zobacz profil
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Clickable Avatar component for chat messages
 */
interface ChatAvatarProps {
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  size?: 'sm' | 'md';
  onClick?: () => void;
  avatarRef?: React.RefObject<HTMLButtonElement | null>;
}

export function ChatAvatar({
  user,
  size = 'sm',
  onClick,
  avatarRef,
}: ChatAvatarProps) {
  const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  const avatarUrl = user.avatar ? buildAvatarUrl(user.avatar, 'xs') : null;

  return (
    <button
      ref={avatarRef}
      type="button"
      onClick={onClick}
      className={`${sizeClasses} rounded-full flex-shrink-0 transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900`}
      aria-label={`View ${user.name}'s profile`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={user.name}
          className={`${sizeClasses} rounded-full object-cover ring-2 ring-white dark:ring-zinc-800`}
        />
      ) : (
        <div
          className={`${sizeClasses} rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white ${textSize} font-semibold ring-2 ring-white dark:ring-zinc-800`}
        >
          {user.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
    </button>
  );
}
