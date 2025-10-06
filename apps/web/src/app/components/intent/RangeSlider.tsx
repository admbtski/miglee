'use client';

import { useEffect, useRef } from 'react';
import noUiSlider, { API } from 'nouislider';
import 'nouislider/dist/nouislider.css';

type Props = {
  value: [number, number];
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onChange: (v: [number, number]) => void;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  className?: string;
};

export function RangeSlider({
  value,
  min,
  max,
  step = 1,
  disabled,
  onChange,
  id,
  className,
  ...aria
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<API | null>(null);

  // init once
  useEffect(() => {
    if (!rootRef.current || apiRef.current) return;

    const api = noUiSlider.create(rootRef.current, {
      start: value,
      step,
      connect: true,
      range: { min, max },
      keyboardSupport: true,
      behaviour: 'tap-drag',
      tooltips: [
        { to: (v) => `${Math.round(Number(v))}`, from: (v) => Number(v) },
        { to: (v) => `${Math.round(Number(v))}`, from: (v) => Number(v) },
      ],
    });

    apiRef.current = api;

    const handle = (vals: (string | number)[]) => {
      const a = Math.round(Number(vals[0]));
      const b = Math.round(Number(vals[1]));
      onChange([a, b]);
    };

    api.on('change', handle);
    api.on('set', handle);

    return () => {
      api.off('change');
      api.off('set');
      api.destroy();
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync external -> internal when value changes
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const [curA, curB] = (api.get() as any[]).map((v) => Math.round(Number(v)));
    if (curA !== value[0] || curB !== value[1])
      api.set(value as unknown as number[]);
  }, [value]);

  // enable / disable
  useEffect(() => {
    const api = apiRef.current;
    if (!api || !rootRef.current) return;
    if (disabled) {
      rootRef.current.setAttribute('data-disabled', 'true');
      api.disable();
    } else {
      rootRef.current.removeAttribute('data-disabled');
      api.enable();
    }
  }, [disabled]);

  // a11y attrs
  useEffect(() => {
    if (!rootRef.current) return;
    if (id) rootRef.current.id = id;
    Object.entries(aria).forEach(([k, v]) => {
      if (v == null) return;
      rootRef.current!.setAttribute(k, String(v));
    });
  }, [id, aria]);

  return (
    <div className={className}>
      {/* <div className="mb-1 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
        <span>{min}</span>
        <span>{max}</span>
      </div> */}

      <div className="noUi-shell rounded-[22px] border border-zinc-200 bg-white/60 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/40">
        <div
          ref={rootRef}
          className="noUi-tailwind"
          role="group"
          aria-roledescription="range slider"
        />
      </div>
    </div>
  );
}
