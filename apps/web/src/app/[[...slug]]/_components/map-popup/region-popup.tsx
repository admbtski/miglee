/**
 * Popup container for displaying multiple intents in a region
 */

import clsx from 'clsx';
import { PopupItem, PopupIntent } from './popup-item';
import { PopupItemSkeleton } from './popup-item-skeleton';

export interface RegionPopupProps {
  intents: PopupIntent[];
  onIntentClick?: (id: string) => void;
  isLoading?: boolean;
}

export function RegionPopup({
  intents,
  onIntentClick,
  isLoading,
}: RegionPopupProps) {
  return (
    <div
      className={clsx(
        'max-w-[280px] max-h-[420px] overflow-y-auto font-sans relative',
        'bg-white dark:bg-zinc-900',
        'rounded-2xl shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800'
      )}
    >
      <div className="p-2 grid gap-2">
        {isLoading ? (
          // Show 3 skeletons while loading
          <>
            <PopupItemSkeleton />
            <PopupItemSkeleton />
            <PopupItemSkeleton />
          </>
        ) : (
          intents.map((it, index) => (
            <PopupItem
              key={it.id}
              intent={{
                ...it,
                plan: (function planForIndex(i: number) {
                  if (i % 7 === 0) return 'premium';
                  if (i % 5 === 0) return 'plus';
                  if (i % 3 === 0) return 'basic';
                  return 'default';
                })(index),
              }}
              onClick={onIntentClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
