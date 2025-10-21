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
  /** Minimalny dystans między uchwytami (w jednostkach slidera). */
  minDistance?: number;
  disabled?: boolean;
  /** Wywoływane na „commit” (mouseup/touchend/Enter) – tak jak miałeś. */
  onChange: (v: [number, number]) => void;
  /** Opcjonalnie: live callback przy każdym ruchu (throttlowane przez rAF). */
  onUpdate?: (v: [number, number]) => void;

  /** Tooltips (domyślnie: włączone z prostym formatem). Ustaw false by wyłączyć. */
  tooltips?: boolean;
  /** Własny formatter tooltipów. */
  format?: Partial<Format>;

  /** RTL wsparcie (odwraca kierunek) */
  rtl?: boolean;

  /** A11y i style */
  id?: string;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;

  /** Pips (znaczniki): np. co 10 jednostek */
  pipsStep?: number;
  pipsDensity?: number; // 0-5
};

export type RangeSliderRef = {
  /** focus na lewym/prawym uchwycie */
  focusStart: () => void;
  focusEnd: () => void;
  /** dostęp do instancji noUiSlider jeśli potrzebny */
  api: API | null;
};

/**
 * Ulepszony wrapper na noUiSlider:
 * - controlled value (dwukierunkowy)
 * - a11y atrybuty na kontenerze + możliwość focusowania uchwytów
 * - onChange (commit) + onUpdate (live)
 * - minDistance, RTL, tooltips, pips
 */
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

    // Domyślny format tooltipów
    const fmt: Format = React.useMemo(
      () => ({
        to: (v: number) => `${Math.round(v)}`,
        from: (s: string) => Number(s),
        ...(format ?? {}),
      }),
      [format]
    );

    // Init – tylko raz
    React.useEffect(() => {
      if (!rootRef.current || apiRef.current) return;

      const api = noUiSlider.create(rootRef.current, {
        start: value,
        step,
        connect: true,
        range: { min, max },
        // zachowanie
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
        pips:
          pipsStep && pipsStep > 0
            ? {
                mode: PipsMode.Steps,
                density: pipsDensity,
                stepped: true,
              }
            : undefined,
      });

      apiRef.current = api;

      // live update (throttle przez rAF)
      const handleUpdate = (vals: (string | number)[]) => {
        if (!onUpdate) return;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          const a = Math.round(Number(vals[0]));
          const b = Math.round(Number(vals[1]));
          onUpdate([a, b]);
        });
      };

      // commit
      const handleCommit = (vals: (string | number)[]) => {
        const a = Math.round(Number(vals[0]));
        const b = Math.round(Number(vals[1]));
        onChange([a, b]);
      };

      api.on('update', handleUpdate);
      api.on('change', handleCommit);
      api.on('set', handleCommit);

      // A11y: role/roledescription już w JSX; dodatkowe handle-labels:
      // noUi tworzy handle jako <div class="noUi-handle noUi-handle-lower|upper">
      // Możesz dodać aria-label na uchwytach:
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

    // Sync external -> internal
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

    // Enable / disable
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

    // Update min/max/step/minDistance/rtl w locie (jeśli zmienisz propsy)
    React.useEffect(() => {
      const api = apiRef.current;
      if (!api) return;
      api.updateOptions(
        {
          range: { min, max },
          step,
          margin: typeof minDistance === 'number' ? minDistance : undefined,
          direction: rtl ? 'rtl' : 'ltr',
        },
        // nie resetuj pozycji
        false
      );
    }, [min, max, step, minDistance, rtl]);

    // a11y attributes and id
    React.useEffect(() => {
      if (!rootRef.current) return;
      if (id) rootRef.current.id = id;
      Object.entries(aria).forEach(([k, v]) => {
        if (v == null) return;
        rootRef.current!.setAttribute(k, String(v));
      });
    }, [id, aria]);

    // forwardRef API
    React.useImperativeHandle(
      ref,
      (): RangeSliderRef => ({
        api: apiRef.current,
        focusStart: () => {
          const el =
            rootRef.current?.querySelector<HTMLElement>('.noUi-handle-lower');
          el?.focus();
        },
        focusEnd: () => {
          const el =
            rootRef.current?.querySelector<HTMLElement>('.noUi-handle-upper');
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
            aria-roledescription="range slider"
          />
        </div>
      </div>
    );
  }
);
RangeSlider.displayName = 'RangeSlider';
