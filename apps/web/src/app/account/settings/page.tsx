'use client';

import { useMemo, useState, memo, useCallback } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { SectionCard } from '@/components/ui/section-card';
import { useTheme } from '@/features/theme/provider/theme-provider';

/* ─────────────────────────  Settings Page  ───────────────────────── */

export default function SettingsPage() {
  const { theme, setTheme: setGlobalTheme } = useTheme();

  // Demo state
  const [language, setLanguage] = useState('en-GB');
  const [autoTz, setAutoTz] = useState(true);
  const [tz, setTz] = useState('Europe/London');
  const [dateFormat, setDateFormat] = useState<'MDY' | 'DMY'>('MDY');
  const [weekStart, setWeekStart] = useState('Monday');
  const [weekend, setWeekend] = useState('Sunday');

  // Example lists (trim as you like)
  const languages = [
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'en-US', label: 'English (US)' },
    { value: 'pl-PL', label: 'Polski' },
  ];
  const timezones = useMemo(
    () => [
      'Europe/London',
      'Europe/Warsaw',
      'Europe/Berlin',
      'UTC',
      'America/New_York',
      'Asia/Tokyo',
    ],
    []
  );
  const weekdays = ['Monday', 'Sunday', 'Saturday'];
  const weekends = ['Sunday', 'Saturday', 'Friday'];

  const handleSave = useCallback(() => {
    // TODO: Call your mutation / REST endpoint
    console.log('save settings', {
      language,
      autoTz,
      tz,
      dateFormat,
      weekStart,
      weekend,
      theme,
    });
  }, [language, autoTz, tz, dateFormat, weekStart, weekend, theme]);

  const handleReset = useCallback(() => {
    setLanguage('en-GB');
    setAutoTz(true);
    setTz('Europe/London');
    setDateFormat('MDY');
    setWeekStart('Monday');
    setWeekend('Sunday');
    setGlobalTheme('system');
  }, [setGlobalTheme]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Settings
        </h1>
        <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
          Customize your workspace and personal preferences
        </p>
      </div>

      <SectionCard title="Language">
        <Row
          label="Language"
          help="Change the language used in the user interface."
        >
          <Select value={language} onChange={setLanguage} options={languages} />
        </Row>
      </SectionCard>

      <SectionCard title="Time zone">
        <Row label="Time zone">
          <div className="flex flex-wrap items-center gap-3">
            <Toggle
              checked={autoTz}
              onChange={setAutoTz}
              label="Automatic time zone"
            />
            <Select
              value={tz}
              onChange={setTz}
              options={timezones.map((x) => ({
                value: x,
                label: x.replace('_', ' '),
              }))}
              disabled={autoTz}
            />
          </div>
        </Row>
      </SectionCard>

      <SectionCard title="Date & week">
        <Row label="Date Format">
          <RadioGroup
            value={dateFormat}
            onChange={(v) => setDateFormat(v as 'MDY' | 'DMY')}
            options={[
              { value: 'MDY', label: 'MM/DD/YYYY' },
              { value: 'DMY', label: 'DD/MM/YYYY' },
            ]}
          />
        </Row>

        <Row
          label="Week start"
          help="This will change how all calendars in your app look."
        >
          <Select
            value={weekStart}
            onChange={setWeekStart}
            options={weekdays.map((d) => ({ value: d, label: d }))}
          />
        </Row>

        <Row label="Weekend">
          <Select
            value={weekend}
            onChange={setWeekend}
            options={weekends.map((d) => ({ value: d, label: d }))}
          />
        </Row>
      </SectionCard>

      <SectionCard title="Appearance">
        <div className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Theme mode
        </div>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Choose how the app looks to you. Select a single theme, or sync with
          your system and automatically switch between day and night themes.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <ThemeCard
            icon={Monitor}
            title="System"
            active={theme === 'system'}
            onClick={() => setGlobalTheme('system')}
            imgHint="System preview"
          />
          <ThemeCard
            icon={Sun}
            title="Light"
            active={theme === 'light'}
            onClick={() => setGlobalTheme('light')}
            preview="light"
            imgHint="Light preview"
          />
          <ThemeCard
            icon={Moon}
            title="Dark"
            active={theme === 'dark'}
            onClick={() => setGlobalTheme('dark')}
            preview="dark"
            imgHint="Dark preview"
          />
        </div>
      </SectionCard>

      <div className="flex flex-wrap items-center gap-3 pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          Save changes
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────  Building blocks  ───────────────────────── */

const Row = memo(function Row({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-[180px_1fr]">
      <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </div>
      <div>
        {children}
        {help && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {help}
          </p>
        )}
      </div>
    </div>
  );
});

const Select = memo(function Select({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div className="relative max-w-md">
      <select
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'w-full appearance-none rounded-xl border px-4 py-2.5 text-sm outline-none',
          'border-zinc-200 bg-white placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500/30',
          'dark:border-zinc-800 dark:bg-zinc-900',
          disabled ? 'opacity-60' : '',
        ].join(' ')}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="absolute -translate-y-1/2 pointer-events-none right-3 top-1/2 text-zinc-500">
        ▼
      </span>
    </div>
  );
});

const Toggle = memo(function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3"
      aria-pressed={checked}
    >
      <span
        className={[
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          checked ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700',
        ].join(' ')}
      >
        <span
          className={[
            'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </span>
      {label && <span className="text-sm">{label}</span>}
    </button>
  );
});

const RadioGroup = memo(function RadioGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm',
              active
                ? 'border-indigo-400 bg-indigo-600/10 text-indigo-600 dark:text-indigo-300'
                : 'border-zinc-300 bg-transparent text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900',
            ].join(' ')}
          >
            <span
              className={[
                'grid h-4 w-4 place-items-center rounded-full border',
                active
                  ? 'border-indigo-500'
                  : 'border-zinc-400 dark:border-zinc-600',
              ].join(' ')}
            >
              <span
                className={[
                  'h-2.5 w-2.5 rounded-full',
                  active ? 'bg-indigo-500' : 'bg-transparent',
                ].join(' ')}
              />
            </span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
});

const ThemeCard = memo(function ThemeCard({
  title,
  icon: Icon,
  active,
  onClick,
  preview,
  imgHint,
}: {
  title: string;
  icon: any;
  active?: boolean;
  onClick: () => void;
  preview?: 'light' | 'dark';
  imgHint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group w-full rounded-xl border p-2 text-left transition-colors',
        active
          ? 'border-indigo-400 ring-2 ring-indigo-400/40'
          : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900',
      ].join(' ')}
    >
      <div className="overflow-hidden rounded-xl">
        <div
          className={[
            'h-28 w-full',
            preview === 'dark'
              ? 'bg-[linear-gradient(180deg,#0f1115_0%,#12151b_100%)]'
              : 'bg-[linear-gradient(180deg,#ffffff_0%,#f4f4f5_100%)]',
          ].join(' ')}
          aria-label={imgHint}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <span
            className={[
              'grid h-8 w-8 place-items-center rounded-lg',
              active
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
            ].join(' ')}
          >
            <Icon className="w-4 h-4" />
          </span>
          <div className="font-medium">{title}</div>
        </div>
        {active && (
          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-semibold text-white">
            Active
          </span>
        )}
      </div>
    </button>
  );
});
