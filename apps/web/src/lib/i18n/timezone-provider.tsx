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

// Global timezones list - organized by region
export const commonTimezones = [
  // UTC
  'UTC',

  // Europe (West to East)
  'Atlantic/Reykjavik',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Dublin',
  'Europe/Paris',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Luxembourg',
  'Europe/Zurich',
  'Europe/Vienna',
  'Europe/Prague',
  'Europe/Warsaw',
  'Europe/Budapest',
  'Europe/Stockholm',
  'Europe/Copenhagen',
  'Europe/Oslo',
  'Europe/Helsinki',
  'Europe/Athens',
  'Europe/Bucharest',
  'Europe/Sofia',
  'Europe/Belgrade',
  'Europe/Zagreb',
  'Europe/Istanbul',
  'Europe/Kiev',
  'Europe/Minsk',
  'Europe/Moscow',

  // Americas - North America
  'America/Anchorage',
  'America/Los_Angeles',
  'America/Vancouver',
  'America/Phoenix',
  'America/Denver',
  'America/Chicago',
  'America/Mexico_City',
  'America/Toronto',
  'America/New_York',
  'America/Montreal',
  'America/Detroit',
  'America/Halifax',
  'America/Caracas',

  // Americas - Central & South America
  'America/Guatemala',
  'America/Costa_Rica',
  'America/Panama',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/La_Paz',
  'America/Sao_Paulo',
  'America/Rio_de_Janeiro',
  'America/Buenos_Aires',
  'America/Montevideo',

  // Caribbean
  'America/Havana',
  'America/Jamaica',
  'America/Puerto_Rico',

  // Middle East
  'Asia/Jerusalem',
  'Asia/Beirut',
  'Asia/Damascus',
  'Asia/Amman',
  'Asia/Baghdad',
  'Asia/Kuwait',
  'Asia/Riyadh',
  'Asia/Qatar',
  'Asia/Bahrain',
  'Asia/Dubai',
  'Asia/Muscat',
  'Asia/Tehran',

  // Central Asia
  'Asia/Yerevan',
  'Asia/Baku',
  'Asia/Tbilisi',
  'Asia/Ashgabat',
  'Asia/Tashkent',
  'Asia/Almaty',
  'Asia/Karachi',

  // South Asia
  'Asia/Kabul',
  'Asia/Kolkata',
  'Asia/Colombo',
  'Asia/Kathmandu',
  'Asia/Dhaka',

  // Southeast Asia
  'Asia/Yangon',
  'Asia/Bangkok',
  'Asia/Ho_Chi_Minh',
  'Asia/Jakarta',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Asia/Manila',

  // East Asia
  'Asia/Hong_Kong',
  'Asia/Taipei',
  'Asia/Shanghai',
  'Asia/Seoul',
  'Asia/Tokyo',
  'Asia/Pyongyang',
  'Asia/Ulaanbaatar',

  // Africa - North
  'Africa/Casablanca',
  'Africa/Tunis',
  'Africa/Algiers',
  'Africa/Tripoli',
  'Africa/Cairo',

  // Africa - West
  'Africa/Dakar',
  'Africa/Abidjan',
  'Africa/Accra',
  'Africa/Lagos',

  // Africa - Central
  'Africa/Kinshasa',
  'Africa/Luanda',

  // Africa - East
  'Africa/Nairobi',
  'Africa/Addis_Ababa',
  'Africa/Dar_es_Salaam',
  'Africa/Kampala',
  'Africa/Khartoum',

  // Africa - South
  'Africa/Johannesburg',
  'Africa/Maputo',
  'Africa/Harare',

  // Australia & Oceania
  'Australia/Perth',
  'Australia/Darwin',
  'Australia/Adelaide',
  'Australia/Brisbane',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Hobart',
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Guam',
  'Pacific/Honolulu',
  'Pacific/Tahiti',
  'Pacific/Tongatapu',
] as const;
