/**
 * Date utilities using @formkit/tempo
 * API compatible with date-fns for easy migration
 */

import {
  format as tempoFormat,
  dayStart,
  addDay,
  addHour,
  addMinute,
  parse,
  diffDays,
  diffHours,
  diffMinutes,
  diffSeconds,
  isPast as tempoIsPast,
  isFuture as tempoIsFuture,
} from '@formkit/tempo';

// Locale mapping
export type DateLocale = 'pl' | 'en' | 'de';

// Relative time translations
const RELATIVE_TIME_TRANSLATIONS: Record<DateLocale, {
  seconds: string;
  minute: string;
  minutes: string;
  hour: string;
  hours: string;
  day: string;
  days: string;
  week: string;
  weeks: string;
  month: string;
  months: string;
  year: string;
  years: string;
  ago: string;
  inFuture: string;
  justNow: string;
}> = {
  en: {
    seconds: 'seconds',
    minute: 'minute',
    minutes: 'minutes',
    hour: 'hour',
    hours: 'hours',
    day: 'day',
    days: 'days',
    week: 'week',
    weeks: 'weeks',
    month: 'month',
    months: 'months',
    year: 'year',
    years: 'years',
    ago: 'ago',
    inFuture: 'in',
    justNow: 'just now',
  },
  pl: {
    seconds: 'sekund',
    minute: 'minutę',
    minutes: 'minut',
    hour: 'godzinę',
    hours: 'godzin',
    day: 'dzień',
    days: 'dni',
    week: 'tydzień',
    weeks: 'tygodni',
    month: 'miesiąc',
    months: 'miesięcy',
    year: 'rok',
    years: 'lat',
    ago: 'temu',
    inFuture: 'za',
    justNow: 'przed chwilą',
  },
  de: {
    seconds: 'Sekunden',
    minute: 'Minute',
    minutes: 'Minuten',
    hour: 'Stunde',
    hours: 'Stunden',
    day: 'Tag',
    days: 'Tage',
    week: 'Woche',
    weeks: 'Wochen',
    month: 'Monat',
    months: 'Monate',
    year: 'Jahr',
    years: 'Jahre',
    ago: 'vor',
    inFuture: 'in',
    justNow: 'gerade eben',
  },
};

/**
 * Format a date with the given format string
 * Uses date-fns compatible format tokens
 */
export function format(
  date: Date | string | number,
  formatStr: string,
  options?: { locale?: DateLocale | { code?: string } }
): string {
  const d = date instanceof Date ? date : new Date(date);
  
  // Extract locale code
  let locale: string = 'en';
  if (options?.locale) {
    if (typeof options.locale === 'string') {
      locale = options.locale;
    } else if (options.locale.code) {
      locale = options.locale.code;
    }
  }

  // Tempo uses similar format tokens to date-fns
  return tempoFormat(d, formatStr, locale);
}

/**
 * Format distance from now (e.g., "2 hours ago", "in 3 days")
 */
export function formatDistanceToNow(
  date: Date | string | number,
  options?: { addSuffix?: boolean; locale?: DateLocale | { code?: string } }
): string {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  
  // Extract locale code
  let localeCode: DateLocale = 'en';
  if (options?.locale) {
    if (typeof options.locale === 'string') {
      localeCode = options.locale as DateLocale;
    } else if (options.locale.code) {
      localeCode = options.locale.code as DateLocale;
    }
  }

  const t = RELATIVE_TIME_TRANSLATIONS[localeCode] || RELATIVE_TIME_TRANSLATIONS.en;
  const addSuffix = options?.addSuffix !== false;
  
  const isPastDate = d.getTime() < now.getTime();
  const seconds = Math.abs(diffSeconds(d, now));
  const minutes = Math.abs(diffMinutes(d, now));
  const hours = Math.abs(diffHours(d, now));
  const days = Math.abs(diffDays(d, now));
  
  let result: string;
  
  if (seconds < 60) {
    result = t.justNow;
    return result;
  } else if (minutes < 60) {
    const unit = minutes === 1 ? t.minute : t.minutes;
    result = `${minutes} ${unit}`;
  } else if (hours < 24) {
    const unit = hours === 1 ? t.hour : t.hours;
    result = `${hours} ${unit}`;
  } else if (days < 7) {
    const unit = days === 1 ? t.day : t.days;
    result = `${days} ${unit}`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    const unit = weeks === 1 ? t.week : t.weeks;
    result = `${weeks} ${unit}`;
  } else if (days < 365) {
    const months = Math.floor(days / 30);
    const unit = months === 1 ? t.month : t.months;
    result = `${months} ${unit}`;
  } else {
    const years = Math.floor(days / 365);
    const unit = years === 1 ? t.year : t.years;
    result = `${years} ${unit}`;
  }

  if (addSuffix) {
    if (isPastDate) {
      // Polish uses different word order: "2 godziny temu"
      // German uses: "vor 2 Stunden"
      if (localeCode === 'de') {
        result = `${t.ago} ${result}`;
      } else {
        result = `${result} ${t.ago}`;
      }
    } else {
      result = `${t.inFuture} ${result}`;
    }
  }

  return result;
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string | number): boolean {
  const d = date instanceof Date ? date : new Date(date);
  return tempoIsFuture(d);
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string | number): boolean {
  const d = date instanceof Date ? date : new Date(date);
  return tempoIsPast(d);
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string | number): boolean {
  const d = date instanceof Date ? date : new Date(date);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date | string | number): boolean {
  const d = date instanceof Date ? date : new Date(date);
  const yesterday = addDay(new Date(), -1);
  return (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  );
}

/**
 * Get the start of day for a date
 */
export function startOfDay(date: Date | string | number): Date {
  const d = date instanceof Date ? date : new Date(date);
  return dayStart(d);
}

/**
 * Check if date is valid
 */
export function isValid(date: unknown): boolean {
  if (date instanceof Date) {
    return !isNaN(date.getTime());
  }
  if (typeof date === 'string' || typeof date === 'number') {
    const d = new Date(date);
    return !isNaN(d.getTime());
  }
  return false;
}

/**
 * Add days to a date
 */
export { addDay };

/**
 * Add hours to a date
 */
export { addHour };

/**
 * Add minutes to a date
 */
export { addMinute };

/**
 * Parse a date string
 */
export { parse };

// Re-export locales for compatibility
// These are just identifiers - Tempo uses built-in locales
export const pl = { code: 'pl' } as const;
export const enUS = { code: 'en' } as const;
export const de = { code: 'de' } as const;
