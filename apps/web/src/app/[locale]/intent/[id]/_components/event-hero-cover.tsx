'use client';

import { Calendar, Clock, Users } from 'lucide-react';
import { buildIntentCoverUrl } from '@/lib/media/url';
import { BlurHashImage } from '@/components/ui/blurhash-image';
import { FavouriteButton } from '@/components/ui/favourite-button';

interface EventHeroCoverProps {
  eventId: string;
  title: string;
  coverKey?: string | null;
  coverBlurhash?: string | null;
  startISO: string;
  joinedCount: number;
  max: number;
  isFavourite: boolean;
  categories: Array<{ slug: string; name: string }>;
}

export function EventHeroCover({
  eventId,
  title,
  coverKey,
  coverBlurhash,
  startISO,
  joinedCount,
  max,
  isFavourite,
  categories,
}: EventHeroCoverProps) {
  const startDate = new Date(startISO);

  return (
    <div className="relative h-[220px] overflow-hidden rounded-[20px] bg-gradient-to-br from-zinc-100 to-zinc-200 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:from-zinc-800 dark:to-zinc-900 dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)] md:h-[340px]">
      {coverKey ? (
        <BlurHashImage
          src={buildIntentCoverUrl(coverKey, 'detail') || ''}
          blurhash={coverBlurhash}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
          width={1280}
          height={720}
        />
      ) : (
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/20 dark:to-violet-900/20" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/15 to-black/55" />

      <div className="absolute right-4 top-4 z-10 md:right-6 md:top-6">
        <FavouriteButton
          intentId={eventId}
          isFavourite={isFavourite}
          size="md"
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 px-4 pb-5 md:px-8 md:pb-7">
        <div className="mx-auto max-w-6xl">
          {categories.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {categories.slice(0, 2).map((cat) => (
                <span
                  key={cat.slug}
                  className="inline-flex items-center rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          <h1 className="line-clamp-3 text-2xl font-semibold leading-tight tracking-tight text-white md:text-[32px] md:leading-tight">
            {title}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/80">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 opacity-80" />
              <span>
                {startDate.toLocaleDateString('pl-PL', {
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
            </div>
            <span className="text-white/40">·</span>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 opacity-80" />
              <span>
                {startDate.toLocaleTimeString('pl-PL', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <span className="text-white/40">·</span>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 opacity-80" />
              <span>
                {joinedCount} / {max}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
