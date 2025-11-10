/**
 * Date formatting and conversion utilities
 */

const MONTHS_PL_SHORT = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'lis',
  'gru',
] as const;

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

/**
 * Check if Date object is valid
 */
export const isValidDate = (d: Date): boolean =>
  d instanceof Date && !Number.isNaN(d.getTime());

/**
 * Parse ISO string to Date with fallback
 */
export const parseISO = (iso: string, fallback: Date = new Date()): Date => {
  const d = new Date(iso);
  return isValidDate(d) ? d : fallback;
};

/**
 * Format date range in Polish format
 * Example: "15 sty, 10:00 – 12:00" (same day) or "15 sty, 10:00 – 16 sty, 12:00" (different days)
 */
export function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const fmt = (d: Date) =>
    `${pad2(d.getDate())} ${MONTHS_PL_SHORT[d.getMonth()]}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

  return sameDay
    ? `${fmt(start)} – ${pad2(end.getHours())}:${pad2(end.getMinutes())}`
    : `${fmt(start)} – ${fmt(end)}`;
}

/**
 * Polish plural forms helper
 */
const plural = (n: number, forms: [string, string, string]): string => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14))
    return forms[1];
  return forms[2];
};

/**
 * Format duration in human-readable Polish format
 * Example: "2 h 30 minut" or "1 dzień 3 h"
 */
export function humanDuration(start: Date, end: Date): string {
  const ms = Math.max(0, end.getTime() - start.getTime());
  const total = Math.round(ms / 60000);
  const days = Math.floor(total / (60 * 24));
  const hours = Math.floor((total - days * 24 * 60) / 60);
  const mins = total % 60;
  const parts: string[] = [];

  if (days > 0) parts.push(`${days} ${plural(days, ['dzień', 'dni', 'dni'])}`);
  if (hours > 0) parts.push(`${hours} h`);
  if (mins > 0 && days === 0)
    parts.push(`${mins} ${plural(mins, ['minuta', 'minuty', 'minut'])}`);

  return parts.length ? parts.join(' ') : '< 1 min';
}

/**
 * Convert ISO (UTC) to local datetime-local input format
 */
export function isoToLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

/**
 * Convert datetime-local input value to ISO (UTC)
 */
export function localInputToISO(val?: string | null): string | null {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Convert Date object to ISO string
 */
export function dateToISO(d: Date): string {
  return new Date(d.getTime()).toISOString();
}

/**
 * Normalize ISO string (validate and return normalized or null)
 */
export function normalizeISO(v?: string | null): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
