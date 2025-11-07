'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface MessageMenuPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport: () => void;
  position?: { top: number; left: number };
  align?: 'left' | 'right';
  canEdit?: boolean;
  canDelete?: boolean;
}

export function MessageMenuPopover({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onReport,
  position,
  align = 'left',
  canEdit = false,
  canDelete = false,
}: MessageMenuPopoverProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    // Focus trap
    if (menuRef.current) {
      const firstButton = menuRef.current.querySelector('button');
      firstButton?.focus();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16 }}
          className="absolute z-50 bg-white dark:bg-neutral-900 shadow-xl rounded-xl overflow-hidden min-w-[180px]"
          style={
            position ? { top: position.top, left: position.left } : undefined
          }
          role="menu"
          aria-label="Message actions"
        >
          {/* Tail/arrow pointing to message */}
          <div
            className={`absolute -top-2 ${
              align === 'right' ? 'right-4' : 'left-4'
            } w-4 h-4 bg-white dark:bg-neutral-900 transform rotate-45`}
            style={{ boxShadow: '-2px -2px 4px rgba(0,0,0,0.05)' }}
          />

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
