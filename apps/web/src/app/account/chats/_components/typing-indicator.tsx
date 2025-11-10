/**
 * Typing indicator component
 */

'use client';

import { memo } from 'react';

type TypingIndicatorProps = {
  names: string[];
};

export const TypingIndicator = memo(function TypingIndicator({
  names,
}: TypingIndicatorProps) {
  const text =
    names.length === 1 ? `${names[0]} pisze…` : `${names.join(', ')} piszą…`;

  return (
    <div className="tw-typing" aria-live="polite" aria-label="typing">
      <span className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
        {text}
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="tw-typing-dot" />
        <span className="tw-typing-dot" />
        <span className="tw-typing-dot" />
      </span>
    </div>
  );
});
