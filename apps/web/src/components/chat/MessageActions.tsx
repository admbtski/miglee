'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, CornerUpLeft, Smile } from 'lucide-react';

interface MessageActionsProps {
  isVisible: boolean;
  align?: 'left' | 'right';
  onReply: () => void;
  onOpenReactions: () => void;
  onOpenMenu: () => void;
  reactionsButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export function MessageActions({
  isVisible,
  align = 'left',
  onReply,
  onOpenReactions,
  onOpenMenu,
  reactionsButtonRef,
}: MessageActionsProps) {
  return (
    <div className="w-[120px]">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className={`flex items-center gap-1 ${
              align === 'right' ? 'justify-end' : 'justify-start'
            }`}
          >
            <button
              onClick={onOpenMenu}
              className="flex items-center justify-center h-8 w-8 rounded-full text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label="More actions"
              title="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            <button
              onClick={onReply}
              className="flex items-center justify-center h-8 w-8 rounded-full text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label="Reply"
              title="Reply"
            >
              <CornerUpLeft className="h-4 w-4" />
            </button>

            <button
              ref={reactionsButtonRef}
              onClick={onOpenReactions}
              className="flex items-center justify-center h-8 w-8 rounded-full text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label="Add reaction"
              title="Add reaction"
            >
              <Smile className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
