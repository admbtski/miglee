'use client';

import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';

type Props = {
  onClick: () => void;
  label?: string;
  className?: string;
};

export function FloatingAdminButton({
  onClick,
  label = 'Admin',
  className = '',
}: Props) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ y: 24, opacity: 0, scale: 0.98 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      className={[
        'fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full',
        'bg-indigo-600 px-4 py-3 text-white shadow-lg ring-1 ring-black/5',
        'hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
        'dark:bg-indigo-500 dark:hover:bg-indigo-400',
        className,
      ].join(' ')}
      aria-label={label}
      title={label}
    >
      <Shield className="h-5 w-5" />
      <span className="text-sm font-semibold">{label}</span>
    </motion.button>
  );
}
