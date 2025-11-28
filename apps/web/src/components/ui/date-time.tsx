'use client';

import { useTimezone } from '@/lib/i18n';

interface DateTimeProps {
  date: Date | string;
  format?: 'date' | 'time' | 'datetime' | 'custom';
  options?: Intl.DateTimeFormatOptions;
}

/**
 * Component to display dates/times in user's timezone
 * Backend sends ISO strings, this handles conversion automatically
 */
export function DateTime({
  date,
  format = 'datetime',
  options,
}: DateTimeProps) {
  const { formatDate, formatTime, formatDateTime, timezone } = useTimezone();

  if (!date) return null;

  try {
    if (format === 'custom' && options) {
      return <>{formatDate(date, options)}</>;
    }

    if (format === 'date') {
      return (
        <>
          {formatDate(date, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </>
      );
    }

    if (format === 'time') {
      return <>{formatTime(date)}</>;
    }

    // Default: datetime
    return <>{formatDateTime(date)}</>;
  } catch (error) {
    console.error('Error formatting date:', error);
    return <>{String(date)}</>;
  }
}

/**
 * Hook to get formatted date strings
 */
export function useDateTimeFormatter() {
  const { formatDate, formatTime, formatDateTime, timezone } = useTimezone();

  return {
    formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, options),
    formatTime: (date: Date | string) => formatTime(date),
    formatDateTime: (date: Date | string) => formatDateTime(date),
    timezone,
  };
}
