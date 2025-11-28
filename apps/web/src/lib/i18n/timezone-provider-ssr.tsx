'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';

/**
 * Common timezones for quick selection
 */
export const commonTimezones = [
  'UTC',
  'Europe/Warsaw',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
] as const;

/**
 * Timezone Context
 */
interface TimezoneContextValue {
  timezone: string;
  updateTimezone: (tz: string) => Promise<void>;
  formatDate: (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
  ) => string;
  formatTime: (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
  ) => string;
  formatDateTime: (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
  ) => string;
}

const TimezoneContext = createContext<TimezoneContextValue | undefined>(
  undefined
);

/**
 * SSR-aware Timezone Provider
 *
 * Priority:
 * 1. User.timezone from database (for logged-in users) - passed as prop
 * 2. Browser-detected timezone (for anonymous users, detected once)
 * 3. UTC fallback
 *
 * IMPORTANT:
 * - For logged-in users: timezone comes from user profile, NOT browser
 * - Changes are saved to database via API call
 * - NO localStorage (timezone is part of user profile)
 */
interface TimezoneProviderSSRProps {
  timezone: string | null; // From user.timezone or null for anonymous
  children: ReactNode;
}

export function TimezoneProviderSSR({
  timezone: userTimezone,
  children,
}: TimezoneProviderSSRProps) {
  const [timezone, setTimezone] = useState<string>(() => {
    // If user has a timezone set, use it
    if (userTimezone) {
      return userTimezone;
    }

    // For anonymous users or SSR, default to UTC
    // Will be updated on client after mount
    return 'UTC';
  });

  // Detect browser timezone on client mount (anonymous users only)
  useEffect(() => {
    // Only detect if no user timezone is set (anonymous user)
    if (!userTimezone) {
      try {
        const detected =
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        setTimezone(detected);
      } catch (error) {
        console.error('Failed to detect timezone:', error);
      }
    }
  }, [userTimezone]);

  /**
   * Update timezone
   * For logged-in users: saves to database
   * For anonymous users: only updates local state
   */
  const updateTimezone = async (newTz: string) => {
    setTimezone(newTz);

    // TODO: If user is logged in, save to database
    // await updateUserTimezone(newTz);
    // For now, we'll implement the API call later

    console.log('[Timezone] Updated to:', newTz);
  };

  /**
   * Format date in user's timezone and locale
   */
  const formatDate = (
    date: Date | string,
    options: Intl.DateTimeFormatOptions = {}
  ) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      ...options,
    }).format(dateObj);
  };

  /**
   * Format time in user's timezone and locale
   */
  const formatTime = (
    date: Date | string,
    options: Intl.DateTimeFormatOptions = {}
  ) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    }).format(dateObj);
  };

  /**
   * Format date and time in user's timezone and locale
   */
  const formatDateTime = (
    date: Date | string,
    options: Intl.DateTimeFormatOptions = {}
  ) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    }).format(dateObj);
  };

  const value = useMemo(
    () => ({
      timezone,
      updateTimezone,
      formatDate,
      formatTime,
      formatDateTime,
    }),
    [timezone]
  );

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
}

/**
 * Hook to access timezone context
 */
export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error('useTimezone must be used within TimezoneProvider');
  }
  return context;
}
