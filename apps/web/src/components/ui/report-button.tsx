'use client';

import { Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ReportButtonProps {
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ReportButton({
  onClick,
  size = 'md',
  className,
}: ReportButtonProps) {
  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={clsx(
        'inline-flex items-center justify-center rounded-full transition-all',
        'bg-black/20 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/30',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
        sizeClasses[size],
        className
      )}
      title="Zgłoś wydarzenie"
      aria-label="Zgłoś wydarzenie"
    >
      <Flag className={iconSizes[size]} />
    </motion.button>
  );
}
