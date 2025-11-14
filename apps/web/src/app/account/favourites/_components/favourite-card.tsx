'use client';

import { Heart, Calendar, MapPin, Users, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useToggleFavouriteMutation } from '@/lib/api/favourites';
import type { MyFavouritesQuery } from '@/lib/api/__generated__/react-query-update';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

type FavouriteItem = NonNullable<
  MyFavouritesQuery['myFavourites']['items']
>[number];

interface FavouriteCardProps {
  favourite: FavouriteItem;
}

export function FavouriteCard({ favourite }: FavouriteCardProps) {
  const router = useRouter();
  const intent = favourite.intent;

  const { mutate: toggleFavourite, isPending } = useToggleFavouriteMutation();

  if (!intent) return null;

  const handleRemove = () => {
    toggleFavourite({ intentId: intent.id });
  };

  const handleView = () => {
    router.push(`/intent/${intent.id}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Header */}
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 flex-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {intent.title}
          </h3>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className="shrink-0 rounded-full p-1.5 text-rose-500 transition hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-900/30"
            title="Usuń z zapisanych"
          >
            <Heart className="h-5 w-5 fill-current" />
          </button>
        </div>

        {/* Description */}
        {intent.description && (
          <p className="mb-3 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {intent.description}
          </p>
        )}

        {/* Meta info */}
        <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              {format(new Date(intent.startAt), 'dd MMM yyyy, HH:mm', {
                locale: pl,
              })}
            </span>
          </div>

          {intent.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{intent.address}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0" />
            <span>
              {intent.joinedCount} / {intent.max} uczestników
            </span>
          </div>
        </div>

        {/* Categories */}
        {intent.categories && intent.categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {intent.categories.slice(0, 3).map((cat) => (
              <span
                key={cat.id}
                className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
              >
                {(cat.names as any)?.pl || cat.slug}
              </span>
            ))}
            {intent.categories.length > 3 && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                +{intent.categories.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        <button
          type="button"
          onClick={handleView}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <ExternalLink className="h-4 w-4" />
          Zobacz wydarzenie
        </button>
      </div>
    </motion.div>
  );
}
