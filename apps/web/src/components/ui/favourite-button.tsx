'use client';

import { Heart } from 'lucide-react';
import { useToggleFavouriteMutation } from '@/lib/api/favourites';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useState, useEffect } from 'react';

interface FavouriteButtonProps {
  intentId: string;
  isFavourite: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FavouriteButton({
  intentId,
  isFavourite: initialIsFavourite,
  size = 'md',
  className,
}: FavouriteButtonProps) {
  // Local state for optimistic UI
  const [isFavourite, setIsFavourite] = useState(initialIsFavourite);
  const { mutate: toggleFavourite, isPending } = useToggleFavouriteMutation();

  // Sync with prop changes (when data refetches)
  useEffect(() => {
    setIsFavourite(initialIsFavourite);
  }, [initialIsFavourite]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update - immediately toggle local state
    setIsFavourite((prev) => !prev);

    toggleFavourite(
      { intentId },
      {
        onError: () => {
          // Rollback on error
          setIsFavourite((prev) => !prev);
        },
      }
    );
  };

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
      onClick={handleClick}
      disabled={isPending}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={clsx(
        'inline-flex items-center justify-center rounded-full transition-all',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        isFavourite
          ? 'bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50'
          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700',
        className
      )}
      title={isFavourite ? 'Usuń z zapisanych' : 'Zapisz wydarzenie'}
      aria-label={isFavourite ? 'Usuń z zapisanych' : 'Zapisz wydarzenie'}
    >
      <Heart
        className={clsx(
          iconSizes[size],
          isFavourite && 'fill-current',
          isPending && 'animate-pulse'
        )}
      />
    </motion.button>
  );
}
