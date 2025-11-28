# Internationalization (i18n) & Timezone System

## Overview

This project implements a complete internationalization and timezone management system with:

- **3 languages**: English (en), Polish (pl), German (de)
- **Automatic timezone detection** with manual override
- **Backend ISO format handling** - all dates from API are in ISO format and converted client-side

## Architecture

### Providers

1. **I18nProvider** - Manages language selection
2. **TimezoneProvider** - Manages timezone settings
3. **ThemeProvider** - Manages dark/light theme (already existing)

All providers are initialized in `app/layout.tsx` and available throughout the app.

## Usage

### Translations

```typescript
import { useTranslations, useI18n } from '@/lib/i18n';

function MyComponent() {
  // Get translations
  const t = useTranslations();

  // Get locale and change function
  const { locale, setLocale } = useI18n();

  return (
    <div>
      <h1>{t.settings.title}</h1>
      <button onClick={() => setLocale('pl')}>
        Switch to Polish
      </button>
    </div>
  );
}
```

### Timezone & Date Formatting

```typescript
import { useTimezone } from '@/lib/i18n';
import { DateTime } from '@/components/ui/date-time';

function MyComponent() {
  const { formatDateTime, formatDate, formatTime, timezone } = useTimezone();

  // Backend sends ISO string: "2024-01-15T14:30:00Z"
  const isoDate = "2024-01-15T14:30:00Z";

  return (
    <div>
      {/* Component way */}
      <DateTime date={isoDate} format="datetime" />

      {/* Hook way */}
      <p>{formatDateTime(isoDate)}</p>
      <p>{formatDate(isoDate)}</p>
      <p>{formatTime(isoDate)}</p>

      <p>Current timezone: {timezone}</p>
    </div>
  );
}
```

### Custom Date Formatting

```typescript
import { DateTime } from '@/components/ui/date-time';

<DateTime
  date={isoString}
  format="custom"
  options={{
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }}
/>
```

## Adding New Translations

### 1. Add to English (source)

Edit `apps/web/src/lib/i18n/locales/en.ts`:

```typescript
export const en = {
  common: {
    // ... existing
    newKey: 'New Value',
  },
  // ... rest
} as const;
```

### 2. Add to Other Languages

Update `pl.ts` and `de.ts` with translations:

```typescript
export const pl: Translations = {
  common: {
    // ... existing
    newKey: 'Nowa Wartość',
  },
  // ... rest
};
```

### 3. Use in Code

```typescript
const t = useTranslations();
return <div>{t.common.newKey}</div>;
```

## Adding New Languages

1. Create new locale file: `apps/web/src/lib/i18n/locales/fr.ts`
2. Export translations with `Translations` type
3. Add to `provider.tsx`:

```typescript
import { fr } from './locales/fr';

export type Locale = 'en' | 'pl' | 'de' | 'fr';

const translations: Record<Locale, Translations> = {
  en,
  pl,
  de,
  fr,
};

export const localeNames: Record<Locale, string> = {
  en: 'English',
  pl: 'Polski',
  de: 'Deutsch',
  fr: 'Français',
};
```

4. Update `settings/page.tsx` to include new language option

## Timezone Features

### Automatic Detection

By default, the system detects user's browser timezone:

```typescript
const { autoTimezone, setAutoTimezone, timezone } = useTimezone();

// Enable auto-detection
setAutoTimezone(true); // Uses Intl.DateTimeFormat().resolvedOptions().timeZone

// Manual override
setAutoTimezone(false);
setTimezone('Europe/Warsaw');
```

### Common Timezones

Pre-defined list of common timezones available in `commonTimezones` export from `@/lib/i18n`.

### Backend Integration

**Important**: Backend should always send dates in ISO 8601 format:

```json
{
  "createdAt": "2024-01-15T14:30:00Z",
  "eventStart": "2024-02-20T19:00:00Z"
}
```

Frontend automatically handles conversion to user's timezone.

## Storage

All settings are persisted in `localStorage`:

- **locale**: `'en' | 'pl' | 'de'`
- **timezone**: IANA timezone string (e.g., `'Europe/Warsaw'`)
- **autoTimezone**: `'true' | 'false'`
- **theme**: `'system' | 'light' | 'dark'` (existing)

## Settings Page

Full implementation available at `/account/settings` with:

- Language selector
- Timezone selector with auto-detection toggle
- Date format preferences
- Week start preferences
- Theme selection

## Type Safety

All translations are fully typed. TypeScript will error if:

- You try to access non-existent translation key
- Translation structure doesn't match between languages
- You pass wrong locale code

## Performance

- All providers use `useMemo` to prevent unnecessary re-renders
- Translations are tree-shakeable
- No runtime translation loading - all bundled
- LocalStorage reads only on mount

## Future Enhancements

- [ ] Add more languages
- [ ] Pluralization support
- [ ] Interpolation support (variables in translations)
- [ ] RTL language support
- [ ] Translation management UI
- [ ] Missing translation warnings in dev mode
