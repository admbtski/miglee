'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
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

const QUICK_EMOJIS = ['❤️', '😂', '😯', '😢', '😡', '👍'];

interface ReactionsBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  onOpenFullPicker?: () => void;
  referenceElement: HTMLElement | null;
}

export function ReactionsBar({
  isOpen,
  onClose,
  onSelectEmoji,
  onOpenFullPicker,
  referenceElement,
}: ReactionsBarProps) {
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      if (!open) onClose();
    },
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    placement: 'top',
    strategy: 'absolute',
  });

  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getFloatingProps } = useInteractions([dismiss, role]);

  useEffect(() => {
    if (isOpen && referenceElement) {
      refs.setReference(referenceElement);
    }
  }, [isOpen, referenceElement, refs]);

  const handleEmojiClick = (emoji: string) => {
    onSelectEmoji(emoji);
    onClose();
  };

  // Don't render if no reference element
  if (!referenceElement) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={refs.setFloating}
          style={floatingStyles}
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{
            duration: 0.18,
            type: 'spring',
            stiffness: 400,
            damping: 25,
          }}
          className="z-50 bg-white dark:bg-neutral-900 shadow-xl rounded-full px-2 py-2 flex items-center gap-1"
          role="toolbar"
          aria-label="Quick reactions"
          {...getFloatingProps()}
        >
          {QUICK_EMOJIS.map((emoji) => (
            <motion.button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label={`React with ${emoji}`}
              title={emoji}
            >
              {emoji}
            </motion.button>
          ))}

          <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1" />

          <motion.button
            onClick={() => {
              onOpenFullPicker?.();
              onClose();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="More reactions"
            title="More reactions"
          >
            <Plus className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
