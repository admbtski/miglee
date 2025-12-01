'use client';

import { useToggleFavouriteMutation } from '@/lib/api/favourites';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FavouriteButtonProps {
  intentId: string;
  isFavourite: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
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
    xs: 'h-6 w-6',
    sm: 'h-7 w-7',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const iconSizes = {
    xs: 'h-3 w-3',
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
        'bg-black/20 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/30',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        isFavourite && 'text-rose-400 hover:text-rose-300',
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
