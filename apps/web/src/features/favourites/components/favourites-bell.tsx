// TODO: Replace hardcoded Polish strings with i18n translations (useI18n hook)
// Affected strings: "Zapisane wydarzenia", "Ładowanie…", "Nie masz jeszcze zapisanych wydarzeń.",
// "Kliknij ❤️ przy wydarzeniu, aby je zapisać.", "Zobacz", "Usuń", "Załaduj więcej", "Zobacz wszystkie"
'use client';

import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  offset,
  shift,
  size,
  useFloating,
  type Placement,
} from '@floating-ui/react';
import { Heart, ExternalLink, Trash2, Calendar, MapPin } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  useMyFavouritesInfiniteQuery,
  useToggleFavouriteMutation,
  flatFavouritesPages,
} from '@/features/favourites';
import type { MyFavouritesQuery } from '@/lib/api/__generated__/react-query-update';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocalePath } from '@/hooks/use-locale-path';

type FavouritesBellProps = {
  className?: string;
  placement?: Placement;
  strategy?: 'absolute' | 'fixed';
};

type FavouriteItem = NonNullable<
  MyFavouritesQuery['myFavourites']['items']
>[number];

export function FavouritesBell({
  className = '',
  placement = 'bottom-end',
  strategy = 'fixed',
}: FavouritesBellProps) {
  const router = useRouter();
  const { localePath } = useLocalePath();
  const [open, setOpen] = useState(false);

  // ========= Infinite Query =========
  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyFavouritesInfiniteQuery(
    { limit: 10 },
    {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    }
  );

  // Flatten all pages
  const items = useMemo(() => {
    return flatFavouritesPages(data?.pages);
  }, [data?.pages]);

  const headerCount = items.length;

  // ========= Optimistic UI =========
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const list: FavouriteItem[] = useMemo(() => {
    return items.filter((x) => !deletedIds.has(x.id));
  }, [items, deletedIds]);

  // ========= Floating + size =========
  const headerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (next) => {
      setOpen(next);
      if (next) void refetch();
    },
    placement,
    strategy,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip({ padding: 8, fallbackPlacements: ['top-end', 'bottom-start'] }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ availableHeight, elements }) {
          const root = elements.floating as HTMLElement;
          const headerH = headerRef.current?.offsetHeight ?? 0;
          const footerH = footerRef.current?.offsetHeight ?? 0;
          const innerMax = Math.max(0, availableHeight - headerH - footerH);

          root.style.maxHeight = `${availableHeight}px`;
          if (listRef.current)
            listRef.current.style.maxHeight = `${innerMax}px`;
        },
      }),
    ],
  });

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const onDown = (ev: MouseEvent) => {
      const refEl = refs.reference.current as HTMLElement | null;
      const floatEl = refs.floating.current as HTMLElement | null;
      const t = ev.target as Node;
      if (floatEl?.contains(t) || refEl?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, refs.reference, refs.floating]);

  // ========= Mutations =========
  const { mutate: toggleFavourite, isPending: toggling } =
    useToggleFavouriteMutation({
      onSuccess: () => void refetch(),
    });

  // ========= Handlers =========
  const toggle = useCallback(() => setOpen((v) => !v), []);

  const handleRemove = useCallback(
    (eventId: string, favouriteId: string) => {
      // Optimistic
      setDeletedIds((prev) => new Set(prev).add(favouriteId));
      toggleFavourite({ eventId });
    },
    [toggleFavourite]
  );

  const handleViewEvent = useCallback(
    (eventId: string) => {
      setOpen(false);
      router.push(localePath(`/event/${eventId}`));
    },
    [router, localePath]
  );

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="relative inline-flex">
      {/* Trigger */}
      <button
        ref={refs.setReference}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Favourites"
        aria-label="Favourites"
        className={[
          'relative inline-flex items-center justify-center rounded-full p-2',
          'transition-all duration-150 hover:bg-zinc-100 focus:outline-none',
          'focus-visible:ring-2 focus-visible:ring-rose-500/60 dark:hover:bg-zinc-800',
          'cursor-pointer',
          className,
        ].join(' ')}
      >
        <Heart className="h-5 w-5 text-zinc-700 dark:text-zinc-200" />
        {headerCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {headerCount > 99 ? '99+' : headerCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            role="dialog"
            aria-label="Favourites list"
            onClick={(e) => e.stopPropagation()}
            className={[
              'z-50 mt-2 w-[min(28rem,calc(100vw-1rem))] rounded-2xl border border-zinc-200 bg-white shadow-2xl',
              'dark:border-zinc-800 dark:bg-zinc-900',
              'sm:w-[28rem]',
            ].join(' ')}
          >
            {/* Header */}
            <div
              ref={headerRef}
              className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-semibold">Zapisane wydarzenia</h3>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {headerCount}
                </span>
              </div>
            </div>

            {/* Scroll area */}
            <div
              ref={listRef}
              className="overflow-y-auto [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.400)_transparent]"
              style={{ padding: '0.25rem 0.25rem 0.75rem 0.25rem' }}
            >
              {isLoading && (
                <div className="px-4 py-10 text-sm text-zinc-500">
                  Ładowanie…
                </div>
              )}

              {!isLoading && list.length === 0 && (
                <div className="px-6 py-10 text-center text-sm text-zinc-500">
                  Nie masz jeszcze zapisanych wydarzeń.
                  <br />
                  <span className="text-xs">
                    Kliknij ❤️ przy wydarzeniu, aby je zapisać.
                  </span>
                </div>
              )}

              {list.length > 0 && (
                <>
                  <ul className="space-y-1 px-1">
                    {list.map((fav) => {
                      const event = fav.event;
                      if (!event) return null;

                      return (
                        <li
                          key={fav.id}
                          className="group relative overflow-hidden rounded-xl border border-zinc-200/60 bg-white shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                        >
                          <div className="flex items-start gap-3 px-4 py-3">
                            {/* Icon */}
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-rose-100 dark:bg-rose-900/30">
                              <Calendar className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                            </div>

                            <div className="min-w-0 flex-1">
                              {/* Title */}
                              <div className="mb-1 line-clamp-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                {event.title}
                              </div>

                              {/* Date & Location */}
                              <div className="mb-2 space-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(
                                    new Date(event.startAt),
                                    'dd MMM yyyy, HH:mm',
                                    { locale: pl }
                                  )}
                                </div>
                                {event.address && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="line-clamp-1">
                                      {event.address}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleViewEvent(event.id)}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Zobacz
                                </button>
                                <button
                                  type="button"
                                  disabled={toggling}
                                  onClick={() => handleRemove(event.id, fav.id)}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:text-rose-400 dark:hover:bg-rose-900/30"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Usuń
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                    {/* Spacing */}
                    <li aria-hidden className="h-2" />
                  </ul>

                  {/* Load more */}
                  {hasNextPage && (
                    <div className="mt-2 flex justify-center px-2 pb-2">
                      <button
                        type="button"
                        disabled={isFetchingNextPage}
                        onClick={(e) => {
                          e.stopPropagation();
                          loadMore();
                        }}
                        className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        title="Załaduj więcej"
                      >
                        {isFetchingNextPage ? 'Ładowanie…' : 'Załaduj więcej'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div
              ref={footerRef}
              className="flex items-center justify-between border-t border-zinc-100 px-4 py-2.5 text-xs dark:border-zinc-800"
            >
              <Link
                href={localePath('/account/favourites')}
                className="rounded-md px-2 py-1 text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  router.push(localePath('/account/favourites'));
                }}
              >
                Zobacz wszystkie
              </Link>
            </div>
          </div>
        </FloatingFocusManager>
      )}
    </div>
  );
}
