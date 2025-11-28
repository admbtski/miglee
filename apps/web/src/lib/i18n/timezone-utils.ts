import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Timezone utilities for converting between UTC and user timezones
 *
 * CRITICAL RULES:
 * 1. Database always stores dates in UTC
 * 2. User sees dates in their timezone
 * 3. All conversions happen via these utilities
 */

/**
 * Convert user's local time to UTC for saving to database
 *
 * @param localDate - Date in user's timezone
 * @param userTimezone - User's IANA timezone (e.g., "Europe/Warsaw")
 * @returns Date in UTC
 *
 * @example
 * // User in Warsaw enters "2024-01-15 14:00"
 * const utcDate = localToUTC(new Date('2024-01-15T14:00:00'), 'Europe/Warsaw');
 * // Returns UTC date (13:00 in winter, 12:00 in summer due to DST)
 */
export function localToUTC(localDate: Date, userTimezone: string): Date {
  return fromZonedTime(localDate, userTimezone);
}

/**
 * Convert UTC date from database to user's timezone
 *
 * @param utcDate - Date in UTC (from database)
 * @param userTimezone - User's IANA timezone
 * @returns Date in user's timezone
 *
 * @example
 * // Database has "2024-01-15T13:00:00Z"
 * const localDate = utcToLocal(new Date('2024-01-15T13:00:00Z'), 'Europe/Warsaw');
 * // Returns date at 14:00 Warsaw time
 */
export function utcToLocal(utcDate: Date | string, userTimezone: string): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return toZonedTime(date, userTimezone);
}

/**
 * Format date in user's timezone with locale-aware formatting
 *
 * @param date - Date to format (can be UTC or local)
 * @param timezone - User's IANA timezone
 * @param formatStr - Format string (date-fns format)
 * @param locale - Optional locale for formatting
 * @returns Formatted date string
 *
 * @example
 * formatInTimezone(
 *   new Date('2024-01-15T13:00:00Z'),
 *   'Europe/Warsaw',
 *   'PPpp'
 * );
 * // "Jan 15, 2024, 2:00:00 PM"
 */
export function formatInTimezone(
  date: Date | string,
  timezone: string,
  formatStr: string = 'PPpp'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, timezone, formatStr);
}

/**
 * Get current time in user's timezone
 *
 * @param userTimezone - User's IANA timezone
 * @returns Current date/time in user's timezone
 */
export function nowInTimezone(userTimezone: string): Date {
  return toZonedTime(new Date(), userTimezone);
}

/**
 * Parse ISO string from backend and return Date object
 * Backend always sends ISO strings in UTC
 *
 * @param isoString - ISO 8601 string from backend
 * @returns Date object
 */
export function parseISOString(isoString: string): Date {
  return new Date(isoString);
}

/**
 * Format date for display in UI (using Intl.DateTimeFormat)
 * Preferred for simple date/time formatting
 *
 * @param date - Date to format
 * @param timezone - User's IANA timezone
 * @param locale - User's locale (e.g., 'en', 'pl', 'de')
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted string
 */
export function formatForDisplay(
  date: Date | string,
  timezone: string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    ...options,
  }).format(dateObj);
}

/**
 * Get timezone offset in hours
 * Useful for displaying "GMT+1" style labels
 *
 * @param timezone - IANA timezone
 * @param date - Date to check offset for (important for DST)
 * @returns Offset in hours (e.g., 1, -5, 5.5)
 */
export function getTimezoneOffset(
  timezone: string,
  date: Date = new Date()
): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
}

/**
 * Get timezone abbreviation (e.g., "CET", "EST")
 *
 * @param timezone - IANA timezone
 * @param date - Date to check abbreviation for
 * @returns Timezone abbreviation
 */
export function getTimezoneAbbreviation(
  timezone: string,
  date: Date = new Date()
): string {
  const formatted = formatInTimeZone(date, timezone, 'zzz');
  return formatted;
}
