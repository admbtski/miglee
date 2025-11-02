import { BadgeCheck } from 'lucide-react';

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
const isValidDate = (d: Date) =>
  d instanceof Date && !Number.isNaN(d.getTime());
const parseISO = (iso: string, fallback: Date = new Date()) => {
  const d = new Date(iso);
  return isValidDate(d) ? d : fallback;
};

export function VerifiedPill({ verifiedAt }: { verifiedAt?: string }) {
  if (!verifiedAt) return null;
  const d = parseISO(verifiedAt);
  const text = isValidDate(d)
    ? `Zweryfikowany organizator (od ${pad2(d.getDate())} ${MONTHS_PL_SHORT[d.getMonth()]} ${d.getFullYear()})`
    : 'Zweryfikowany organizator';
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full
                 bg-sky-50 text-sky-700 ring-1 ring-sky-200
                 dark:bg-sky-900/20 dark:text-sky-300 dark:ring-sky-800/60"
      title={text}
    >
      <BadgeCheck className="w-3.5 h-3.5" />
      Zweryfikowany
    </span>
  );
}
