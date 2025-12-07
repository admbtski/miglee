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
    transform: false,
  });

  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getFloatingProps } = useInteractions([dismiss, role]);

  // Update reference element when it changes or when opening
  useEffect(() => {
    if (referenceElement) {
      refs.setReference(referenceElement);
    }
  }, [referenceElement, refs, isOpen]);

  const handleEmojiClick = (emoji: string) => {
    onSelectEmoji(emoji);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && referenceElement && (
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
          className="z-50 bg-white dark:bg-zinc-900 shadow-xl rounded-full px-2 py-2 flex items-center gap-1"
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
              className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label={`React with ${emoji}`}
              title={emoji}
            >
              {emoji}
            </motion.button>
          ))}

          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1" />

          <motion.button
            onClick={() => {
              onOpenFullPicker?.();
              onClose();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="More reactions"
            title="More reactions"
          >
            <Plus className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
