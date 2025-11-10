/**
 * Date preset utilities for filter modal
 */

import { dateToISO } from './date';

export type DatePreset = 'now1h' | 'tonight' | 'tomorrow' | 'weekend' | '7days';

export interface DateRange {
  startISO: string;
  endISO: string;
}

/**
 * Calculate date range for a given preset
 */
export function getDateRangeForPreset(preset: DatePreset): DateRange {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (preset) {
    case 'now1h': {
      end.setHours(end.getHours() + 1);
      break;
    }
    case 'tonight': {
      // 18:00–22:00 dzisiaj, jeśli już po 22, to jutro 18–22
      const base = new Date(now);
      if (base.getHours() >= 22) base.setDate(base.getDate() + 1);
      base.setHours(18, 0, 0, 0);
      start.setTime(base.getTime());
      const e = new Date(base);
      e.setHours(22, 0, 0, 0);
      end.setTime(e.getTime());
      break;
    }
    case 'tomorrow': {
      const t = new Date(now);
      t.setDate(t.getDate() + 1);
      t.setHours(9, 0, 0, 0);
      start.setTime(t.getTime());
      const e = new Date(t);
      e.setHours(21, 0, 0, 0);
      end.setTime(e.getTime());
      break;
    }
    case 'weekend': {
      // najbliższa sobota 10:00 → niedziela 22:00
      const d = new Date(now);
      const day = d.getDay(); // 0=nd, 6=sb
      const deltaToSat =
        (6 - day + 7) % 7 || (day === 6 && d.getHours() < 10 ? 0 : 7);
      const sat = new Date(d);
      sat.setDate(d.getDate() + deltaToSat);
      sat.setHours(10, 0, 0, 0);
      const sun = new Date(sat);
      sun.setDate(sat.getDate() + 1);
      sun.setHours(22, 0, 0, 0);
      start.setTime(sat.getTime());
      end.setTime(sun.getTime());
      break;
    }
    case '7days': {
      const s = new Date(now);
      s.setHours(0, 0, 0, 0);
      const e = new Date(s);
      e.setDate(e.getDate() + 7);
      e.setHours(23, 59, 0, 0);
      start.setTime(s.getTime());
      end.setTime(e.getTime());
      break;
    }
  }

  return {
    startISO: dateToISO(start),
    endISO: dateToISO(end),
  };
}

/**
 * Get all available presets with labels
 */
export const DATE_PRESETS = [
  { id: 'now1h' as DatePreset, label: 'Teraz +1h' },
  { id: 'tonight' as DatePreset, label: 'Dziś wieczorem' },
  { id: 'tomorrow' as DatePreset, label: 'Jutro' },
  { id: 'weekend' as DatePreset, label: 'Weekend' },
  { id: '7days' as DatePreset, label: 'Najbliższe 7 dni' },
] as const;
