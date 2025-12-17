'use client';

import { Heart, Calendar, MapPin, Users, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { pl, enUS, de } from 'date-fns/locale';
import { motion } from 'framer-motion';
import Link from 'next/link';

import {
  useToggleFavouriteMutation,
  type FavouriteItem,
} from '@/features/favourites';
import { useI18n } from '@/lib/i18n/provider-ssr';
import { useLocalePath } from '@/hooks/use-locale-path';

/* ───────────────────────────── Props ───────────────────────────── */

export interface FavouriteCardProps {
  favourite: FavouriteItem;
}

/* ───────────────────────────── Helpers ───────────────────────────── */

function getDateLocale(locale: string) {
  switch (locale) {
    case 'pl':
      return pl;
    case 'de':
      return de;
    case 'en':
    default:
      return enUS;
  }
}

/* ───────────────────────────── Component ───────────────────────────── */

export function FavouriteCard({ favourite }: FavouriteCardProps) {
  const { locale, t } = useI18n();
  const { localePath } = useLocalePath();
  const event = favourite.event;

  const { mutate: toggleFavourite, isPending } = useToggleFavouriteMutation();

  const dateLocale = getDateLocale(locale);

  if (!event) return null;

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Guard: don't trigger if already pending
    if (isPending) return;

    toggleFavourite({ eventId: event.id });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-[24px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm transition-all hover:shadow-lg"
    >
      <Link href={localePath(`/event/${event.id}`)} className="block">
        {/* Favourite Button */}
        <button
          type="button"
          onClick={handleRemove}
          disabled={isPending}
          className="absolute top-3 right-3 z-10 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm p-2 text-rose-500 transition-all hover:bg-white hover:scale-110 disabled:opacity-50 shadow-md"
          title={t.favourites.removeFromFavourites}
        >
          <Heart className="h-5 w-5 fill-current" strokeWidth={2} />
        </button>

        {/* Content */}
        <div className="p-6">
          <h3 className="mb-3 line-clamp-2 text-lg font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50 leading-tight pr-8">
            {event.title}
          </h3>

          {/* Description */}
          {event.description && (
            <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {event.description}
            </p>
          )}

          {/* Meta info */}
          <div className="space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="font-medium">
                {format(new Date(event.startAt), 'dd MMM yyyy, HH:mm', {
                  locale: dateLocale,
                })}
              </span>
            </div>

            {event.address && (
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="h-4 w-4 shrink-0" strokeWidth={2} />
                <span className="truncate">{event.address.split(',')[0]}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="font-medium">
                {event.joinedCount} / {event.max} {t.favourites.participants}
              </span>
            </div>
          </div>

          {/* Categories */}
          {event.categories && event.categories.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-white/5 flex flex-wrap gap-1.5">
              {event.categories.slice(0, 3).map((cat) => (
                <span
                  key={cat.id}
                  className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300"
                >
                  {(cat.names as any)?.[locale] || cat.slug}
                </span>
              ))}
              {event.categories.length > 3 && (
                <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  +{event.categories.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] px-6 py-4">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
            <Eye className="h-4 w-4" strokeWidth={2} />
            {t.favourites.viewEvent}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
