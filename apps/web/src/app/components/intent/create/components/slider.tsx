// components/radius-slider/RadiusSlider.tsx
'use client';

import * as React from 'react';
import noUiSlider, { API, PipsMode } from 'nouislider';
import 'nouislider/dist/nouislider.css';

type Format = {
  to: (v: number) => string;
  from: (s: string) => number;
};

export type RadiusSliderProps = {
  /** Wartość w km (np. 0..20) */
  value: number;
  min: number;
  max: number;
  step?: number;

  disabled?: boolean;

  /** commit (mouseup/touchend/Enter) */
  onChange: (v: number) => void;
  /** live update (throttlowane rAF-em) */
  onUpdate?: (v: number) => void;

  /** Tooltips (domyślnie włączone) */
  tooltips?: boolean;
  /** Własny formatter tooltipów */
  format?: Partial<Format>;

  /** RTL */
  rtl?: boolean;

  /** A11y / style */
  id?: string;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;

  /** Pips (znaczniki) – co ile km dodać znacznik, np. 1 lub 5 */
  pipsStep?: number;
  /** Gęstość pipsów (0–5) */
  pipsDensity?: number;
};

export type RadiusSliderRef = {
  focus: () => void;
  api: API | null;
};

const EPS = 1e-6;

export const RadiusSlider = React.forwardRef<
  RadiusSliderRef,
  RadiusSliderProps
>(
  (
    {
      value,
      min,
      max,
      step = 0.1,
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
    const isSlidingRef = React.useRef(false); // guard na czas dragowania

    const fmt: Format = React.useMemo(
      () => ({
        to: (v: number) => `${Number(v).toFixed(step < 0.5 ? 1 : 0)} km`,
        from: (s: string) => parseFloat(String(s)),
        ...(format ?? {}),
      }),
      [format, step]
    );

    /** Wylicz pipsy co pipsStep km (mało elementów w DOM) */
    const pipsConfig = React.useMemo(() => {
      if (!pipsStep || pipsStep <= 0) return undefined;
      const values: number[] = [];
      // Zaokrąglij start do najbliższego wielokrotności pipsStep
      const start = Math.ceil((min - EPS) / pipsStep) * pipsStep; // stabilniejszy start
      for (let v = start; v <= max + EPS; v += pipsStep) {
        // zabezpieczenie przed błędami float
        const rounded = Math.round(v / pipsStep) * pipsStep;
        values.push(Number(rounded.toFixed(6)));
      }
      return {
        mode: PipsMode.Values as const,
        values,
        density: pipsDensity,
        format: { to: (x: number) => fmt.to(x) },
      };
    }, [min, max, pipsStep, pipsDensity, fmt]);

    // init
    React.useEffect(() => {
      if (!rootRef.current || apiRef.current) return;

      const api = noUiSlider.create(rootRef.current, {
        start: [value], // jeden uchwyt
        step,
        connect: [true, false],
        range: { min, max },
        keyboardSupport: true,
        behaviour: 'tap-drag',
        direction: rtl ? 'rtl' : 'ltr',
        animate: false, // mniej kosztowne animacje
        tooltips: tooltips
          ? [
              {
                to: (v) => fmt.to(Number(v)),
                from: (s) => fmt.from(String(s)),
              },
            ]
          : undefined,
        pips: pipsConfig,
      });

      apiRef.current = api;

      const handleUpdate = (vals: (string | number)[]) => {
        if (!onUpdate) return;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          const v = Number(vals[0]);
          if (Number.isFinite(v)) onUpdate(v);
        });
      };

      const handleCommit = (vals: (string | number)[]) => {
        const v = Number(vals[0]);
        if (Number.isFinite(v)) onChange(v);
      };

      const onStart = () => {
        isSlidingRef.current = true;
      };
      const onEnd = () => {
        isSlidingRef.current = false;
      };

      api.on('start', onStart);
      api.on('update', handleUpdate);
      api.on('change', handleCommit);
      api.on('set', handleCommit);
      api.on('end', onEnd);

      // A11y
      const handle = rootRef.current.querySelector<HTMLElement>('.noUi-handle');
      if (handle) {
        handle.setAttribute('role', 'slider');
        handle.setAttribute('aria-valuemin', String(min));
        handle.setAttribute('aria-valuemax', String(max));
        handle.setAttribute('tabindex', '0');
        handle.setAttribute('aria-label', 'Radius (km)');
      }

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        api.off('start');
        api.off('update');
        api.off('change');
        api.off('set');
        api.off('end');
        api.destroy();
        apiRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // external -> internal (nie nadpisuj podczas dragowania)
    React.useEffect(() => {
      const api = apiRef.current;
      if (!api) return;
      if (isSlidingRef.current) return;

      const cur = Number((api.get() as (string | number)[])[0]);
      if (!Number.isFinite(cur) || Math.abs(cur - value) > EPS) {
        api.set([value] as unknown as number[]);
      }
    }, [value]);

    // enable / disable
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

    // update options on the fly (range / step / rtl / pips)
    React.useEffect(() => {
      const api = apiRef.current;
      if (!api) return;

      api.updateOptions(
        {
          range: { min, max },
          step,
          direction: rtl ? 'rtl' : 'ltr',
          pips: pipsConfig,
        },
        // false → zachowaj pozycję uchwytu
        false
      );

      // uaktualnij aria w razie zmiany min/max
      const handle =
        rootRef.current?.querySelector<HTMLElement>('.noUi-handle');
      if (handle) {
        handle.setAttribute('aria-valuemin', String(min));
        handle.setAttribute('aria-valuemax', String(max));
      }
    }, [min, max, step, rtl, pipsConfig]);

    // a11y attrs + id
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
      (): RadiusSliderRef => ({
        api: apiRef.current,
        focus: () => {
          const el =
            rootRef.current?.querySelector<HTMLElement>('.noUi-handle');
          el?.focus();
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
            aria-roledescription="radius slider"
          />
        </div>
      </div>
    );
  }
);
RadiusSlider.displayName = 'RadiusSlider';
