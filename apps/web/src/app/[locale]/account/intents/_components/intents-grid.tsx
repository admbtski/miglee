/**
 * Grid component for displaying account intents
 */

'use client';

import { memo } from 'react';
import { AccountIntentCard } from './account-intent-card';
import { planForIndex } from '@/lib/adapters/plan-utils';
import type { IntentsResultCoreFragment_IntentsResult_items_Intent as IntentItem } from '@/lib/api/__generated__/react-query-update';

type IntentsGridProps = {
  items: IntentItem[];
  mode: 'owned' | 'member';
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onLeave: (id: string) => void;
  onCancel: (id: string) => void;
  onManage: (id: string) => void;
};

export const IntentsGrid = memo(function IntentsGrid({
  items,
  mode,
  onEdit,
  onDelete,
  onLeave,
  onCancel,
  onManage,
}: IntentsGridProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((it, index) => (
        <AccountIntentCard
          key={it.id}
          id={it.id}
          owned={mode === 'owned'}
          title={it.title}
          description={it.description}
          startAt={it.startAt}
          endAt={it.endAt}
          address={it.address}
          onlineUrl={it.onlineUrl}
          joinedCount={it.joinedCount}
          min={it.min}
          max={it.max}
          isCanceled={it.isCanceled}
          isDeleted={it.isDeleted}
          addressVisibility={it.addressVisibility}
          isFull={it.isFull}
          hasStarted={it.hasStarted}
          withinLock={it.withinLock}
          categories={it.categories?.map((c) => c.slug)}
          tags={it.tags?.map((t) => t.label)}
          levels={it.levels ?? []}
          isOngoing={it.isOngoing}
          isOnline={it.isOnline}
          isOnsite={it.isOnsite}
          isHybrid={it.isHybrid}
          plan={planForIndex(index)}
          joinOpensMinutesBeforeStart={it.joinOpensMinutesBeforeStart}
          joinCutoffMinutesBeforeStart={it.joinCutoffMinutesBeforeStart}
          allowJoinLate={it.allowJoinLate}
          lateJoinCutoffMinutesAfterStart={it.lateJoinCutoffMinutesAfterStart}
          joinManuallyClosed={it.joinManuallyClosed}
          onEdit={onEdit}
          onDelete={onDelete}
          onLeave={onLeave}
          onCancel={onCancel}
          onManage={onManage}
        />
      ))}
    </div>
  );
});
