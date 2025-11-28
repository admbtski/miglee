'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type TimezoneContextType = {
  timezone: string;
  setTimezone: (tz: string) => void;
  autoTimezone: boolean;
  setAutoTimezone: (auto: boolean) => void;
  formatDate: (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
  ) => string;
  formatDateTime: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
};

const TimezoneContext = createContext<TimezoneContextType | null>(null);

function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const [timezone, setTimezoneState] = useState<string>('UTC');
  const [autoTimezone, setAutoTimezoneState] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const storedAuto = localStorage.getItem('autoTimezone');
      const storedTz = localStorage.getItem('timezone');

      if (storedAuto === 'false') {
        setAutoTimezoneState(false);
        if (storedTz) {
          setTimezoneState(storedTz);
        }
      } else {
        setAutoTimezoneState(true);
        setTimezoneState(getBrowserTimezone());
      }
    } catch {}
    setMounted(true);
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (!mounted) return;

    try {
      localStorage.setItem('autoTimezone', autoTimezone.toString());
      if (!autoTimezone) {
        localStorage.setItem('timezone', timezone);
      }
    } catch {}
  }, [timezone, autoTimezone, mounted]);

  // Update timezone when autoTimezone changes
  useEffect(() => {
    if (autoTimezone) {
      setTimezoneState(getBrowserTimezone());
    }
  }, [autoTimezone]);

  const value = useMemo<TimezoneContextType>(
    () => ({
      timezone,
      setTimezone: (tz: string) => {
        setTimezoneState(tz);
        setAutoTimezoneState(false);
      },
      autoTimezone,
      setAutoTimezone: (auto: boolean) => {
        setAutoTimezoneState(auto);
        if (auto) {
          setTimezoneState(getBrowserTimezone());
        }
      },
      formatDate: (
        date: Date | string,
        options?: Intl.DateTimeFormatOptions
      ) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('default', {
          timeZone: timezone,
          ...options,
        }).format(d);
      },
      formatDateTime: (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('default', {
          timeZone: timezone,
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(d);
      },
      formatTime: (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('default', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
        }).format(d);
      },
    }),
    [timezone, autoTimezone]
  );

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const ctx = useContext(TimezoneContext);
  if (!ctx)
    throw new Error('useTimezone must be used inside <TimezoneProvider>');
  return ctx;
}

// Common timezones list
export const commonTimezones = [
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Warsaw',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Vienna',
  'Europe/Prague',
  'Europe/Budapest',
  'Europe/Stockholm',
  'Europe/Copenhagen',
  'Europe/Helsinki',
  'Europe/Oslo',
  'Europe/Zurich',
  'Europe/Athens',
  'Europe/Bucharest',
  'Europe/Sofia',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Buenos_Aires',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Seoul',
  'Asia/Bangkok',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
] as const;
