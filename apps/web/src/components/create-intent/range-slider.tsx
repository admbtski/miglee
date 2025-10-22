'use client';

import * as React from 'react';
import noUiSlider, { API, PipsMode } from 'nouislider';
import 'nouislider/dist/nouislider.css';

type Format = {
  to: (v: number) => string;
  from: (s: string) => number;
};

export type RangeSliderProps = {
  value: [number, number];
  min: number;
  max: number;
  step?: number;
  minDistance?: number;
  disabled?: boolean;
  onChange: (v: [number, number]) => void;
  onUpdate?: (v: [number, number]) => void;
  tooltips?: boolean;
  format?: Partial<Format>;
  rtl?: boolean;
  id?: string;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  pipsStep?: number;
  pipsDensity?: number; // 0-5
};

export type RangeSliderRef = {
  focusStart: () => void;
  focusEnd: () => void;
  api: API | null;
};

export const RangeSlider = React.forwardRef<RangeSliderRef, RangeSliderProps>(
  (
    {
      value,
      min,
      max,
      step = 1,
      minDistance,
      disabled,
      onChange,
      onUpdate,
      tooltips = true,
      format,
      rtl = false,
      id,
      className,
      pipsStep,
      pipsDensity = 2,
      ...aria
    },
    ref
  ) => {
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const apiRef = React.useRef<API | null>(null);
    const rafRef = React.useRef<number | null>(null);

    const fmt: Format = React.useMemo(
      () => ({
        to: (v: number) => `${Math.round(v)}`,
        from: (s: string) => Number(s),
        ...(format ?? {}),
      }),
      [format]
    );

    const pipsConfig = React.useMemo(() => {
      if (!pipsStep || pipsStep <= 0) return undefined;
      return {
        mode: PipsMode.Steps as const,
        density: pipsDensity,
        stepped: true,
      };
    }, [pipsStep, pipsDensity]);

    React.useEffect(() => {
      if (!rootRef.current || apiRef.current) return;

      const api = noUiSlider.create(rootRef.current, {
        start: value,
        step,
        connect: true,
        range: { min, max },
        keyboardSupport: true,
        behaviour: 'tap-drag',
        direction: rtl ? 'rtl' : 'ltr',
        margin: typeof minDistance === 'number' ? minDistance : undefined,
        tooltips: tooltips
          ? [
              {
                to: (v) => fmt.to(Number(v)),
                from: (s) => fmt.from(String(s)),
              },
              {
                to: (v) => fmt.to(Number(v)),
                from: (s) => fmt.from(String(s)),
              },
            ]
          : undefined,
        pips: pipsConfig,
        animate: false,
      });

      apiRef.current = api;

      const handleUpdate = (vals: (string | number)[]) => {
        // Keep aria-valuenow/valuetext synced for SR users
        const handles =
          rootRef.current!.querySelectorAll<HTMLElement>('.noUi-handle');
        if (handles.length >= 2) {
          handles?.[0]?.setAttribute(
            'aria-valuenow',
            String(Math.round(Number(vals[0])))
          );
          handles?.[0]?.setAttribute('aria-valuetext', fmt.to(Number(vals[0])));
          handles?.[1]?.setAttribute(
            'aria-valuenow',
            String(Math.round(Number(vals[1])))
          );
          handles?.[1]?.setAttribute('aria-valuetext', fmt.to(Number(vals[1])));
        }

        if (!onUpdate) return;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          const a = Math.round(Number(vals[0]));
          const b = Math.round(Number(vals[1]));
          onUpdate([a, b]);
        });
      };

      const handleCommit = (vals: (string | number)[]) => {
        const a = Math.round(Number(vals[0]));
        const b = Math.round(Number(vals[1]));
        onChange([a, b]);
      };

      api.on('update', handleUpdate);
      api.on('change', handleCommit);
      api.on('set', handleCommit);

      const handles =
        rootRef.current.querySelectorAll<HTMLElement>('.noUi-handle');
      handles.forEach((h, idx) => {
        h.setAttribute('role', 'slider');
        h.setAttribute('aria-valuemin', String(min));
        h.setAttribute('aria-valuemax', String(max));
        h.setAttribute('tabindex', '0');
        h.setAttribute(
          'aria-label',
          idx === 0 ? 'Minimum value' : 'Maximum value'
        );
        h.setAttribute(
          'aria-valuenow',
          String(idx === 0 ? value[0] : value[1])
        );
        h.setAttribute(
          'aria-valuetext',
          fmt.to(idx === 0 ? value[0] : value[1])
        );
      });

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        api.off('update');
        api.off('change');
        api.off('set');
        api.destroy();
        apiRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useEffect(() => {
      const api = apiRef.current;
      if (!api) return;
      const arr = api.get() as (string | number)[];
      const cur: [number, number] = [
        Math.round(Number(arr[0])),
        Math.round(Number(arr[1])),
      ];
      if (cur[0] !== value[0] || cur[1] !== value[1]) {
        api.set(value as unknown as number[]);
      }
    }, [value]);

    React.useEffect(() => {
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

    React.useEffect(() => {
      const api = apiRef.current;
      if (!api) return;
      api.updateOptions(
        {
          range: { min, max },
          step,
          margin: typeof minDistance === 'number' ? minDistance : undefined,
          pips: pipsConfig,
        },
        false
      );

      const handles =
        rootRef.current?.querySelectorAll<HTMLElement>('.noUi-handle');
      handles?.forEach((h) => {
        h.setAttribute('aria-valuemin', String(min));
        h.setAttribute('aria-valuemax', String(max));
      });
    }, [min, max, step, minDistance, rtl, pipsConfig]);

    React.useEffect(() => {
      if (!rootRef.current) return;
      if (id) rootRef.current.id = id;
      Object.entries(aria).forEach(([k, v]) => {
        if (v == null) return;
        rootRef.current!.setAttribute(k, String(v));
      });
    }, [id, aria]);

    React.useImperativeHandle(
      ref,
      (): RangeSliderRef => ({
        api: apiRef.current,
        focusStart: () => {
          rootRef.current
            ?.querySelector<HTMLElement>('.noUi-handle-lower')
            ?.focus();
        },
        focusEnd: () => {
          rootRef.current
            ?.querySelector<HTMLElement>('.noUi-handle-upper')
            ?.focus();
        },
      }),
      []
    );

    return (
      <div className={className}>
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
);
RangeSlider.displayName = 'RangeSlider';
