/**
 * Date and capacity formatting utilities
 */

export const MONTHS_PL_SHORT = [
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

export const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

export const isValidDate = (d: Date) =>
  d instanceof Date && !Number.isNaN(d.getTime());

export const parseISO = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isValidDate(d) ? d : null;
};

export const formatDateTime = (d: Date) =>
  `${pad2(d.getDate())} ${MONTHS_PL_SHORT[d.getMonth()]} • ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

export const formatDateRange = (
  startISO?: string | null,
  endISO?: string | null
) => {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  if (!start || !end) return '—';
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  return sameDay
    ? `${formatDateTime(start)} – ${pad2(end.getHours())}:${pad2(end.getMinutes())}`
    : `${formatDateTime(start)} – ${formatDateTime(end)}`;
};

export const capacityLabel = (joined: number, min: number, max: number) =>
  `${joined} / ${min}-${max}`;
