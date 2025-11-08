'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Pencil, Trash2 } from 'lucide-react';
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

interface MessageMenuPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport: () => void;
  align?: 'left' | 'right';
  canEdit?: boolean;
  canDelete?: boolean;
  referenceElement: HTMLElement | null;
}

export function MessageMenuPopover({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onReport,
  align = 'left',
  canEdit = false,
  canDelete = false,
  referenceElement,
}: MessageMenuPopoverProps) {
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      if (!open) onClose();
    },
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    placement: align === 'right' ? 'bottom-end' : 'bottom-start',
    strategy: 'absolute',
    transform: true,
  });

  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'menu' });

  const { getFloatingProps } = useInteractions([dismiss, role]);

  useEffect(() => {
    if (isOpen && referenceElement) {
      refs.setReference(referenceElement);
    }
  }, [isOpen, referenceElement, refs]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleEdit = () => {
    onEdit?.();
    onClose();
  };

  const handleDelete = () => {
    onDelete?.();
    onClose();
  };

  const handleReport = () => {
    onReport();
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
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{
            duration: 0.18,
            type: 'spring',
            stiffness: 400,
            damping: 25,
          }}
          className="z-50 bg-white dark:bg-neutral-900 shadow-xl rounded-xl overflow-hidden min-w-[180px] border border-neutral-200 dark:border-neutral-800"
          role="menu"
          aria-label="Message actions"
          {...getFloatingProps()}
        >
          <div className="relative bg-white dark:bg-neutral-900">
            {canEdit && (
              <button
                onClick={handleEdit}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                role="menuitem"
                style={{ minHeight: '48px' }}
              >
                <Pencil className="h-5 w-5 text-indigo-500" />
                <span className="font-medium">Edit</span>
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                role="menuitem"
                style={{ minHeight: '48px' }}
              >
                <Trash2 className="h-5 w-5 text-red-500" />
                <span className="font-medium">Delete</span>
              </button>
            )}

            {(canEdit || canDelete) && (
              <div className="h-px bg-neutral-200 dark:bg-neutral-800" />
            )}

            <button
              onClick={handleReport}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              role="menuitem"
              style={{ minHeight: '48px' }}
            >
              <Flag className="h-5 w-5 text-red-500" />
              <span className="font-medium">Report</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
