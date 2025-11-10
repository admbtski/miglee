/**
 * Translations for the intents page
 * Currently supports Polish (pl) only
 * TODO: Add English (en) and other languages
 */

export const translations = {
  pl: {
    // Header
    loading: 'Ładowanie…',
    failedToLoad: 'Nie udało się załadować',
    allEventsIn: 'Wszystkie wydarzenia w',
    global: 'Globalnie',
    event: 'wydarzenie',
    events: 'wydarzenia',
    eventsMany: 'wydarzeń',
    updating: 'aktualizowanie…',

    // Empty state
    noResults: 'Brak wyników dla wybranych filtrów.',
    tryDifferentFilters: 'Spróbuj zmienić kryteria wyszukiwania',

    // Error state
    somethingWentWrong: 'Coś poszło nie tak',
    unknownError: 'Nieznany błąd',
    tryRefresh: 'Spróbuj odświeżyć stronę',

    // Load more
    loadMore: 'Załaduj więcej',
    allLoaded: 'Wszystko załadowane',

    // Search
    search: 'Szukaj',
    filters: 'Filtry',

    // Filters
    location: 'Lokalizacja',
    selectCity: 'Wybierz miasto, aby filtrować po odległości.',
    distance: 'Odległość',
    globally: 'Globalnie',
    dateRange: 'Zakres dat',
    usePresets: 'Skorzystaj z presetów lub ustaw własny zakres.',
    status: 'Status',
    meetingMode: 'Tryb spotkania',
    level: 'Poziom',
    organizer: 'Organizator',
    verifiedOnly: 'Tylko zweryfikowani',
    clearAll: 'Wyczyść wszystkie',
    apply: 'Zastosuj',
    cancel: 'Anuluj',
    noChanges: 'Brak zmian',

    // Date presets
    nowPlus1h: 'Teraz +1h',
    tonight: 'Dziś wieczorem',
    tomorrow: 'Jutro',
    weekend: 'Weekend',
    next7Days: 'Najbliższe 7 dni',

    // Validation
    invalidDateFormat: 'Nieprawidłowy format daty.',
    endBeforeStart:
      'Data zakończenia nie może być wcześniejsza niż rozpoczęcia.',

    // Accessibility
    closeModal: 'Zamknij',
    removeFilter: 'Usuń filtr',
    clearLocation: 'Wyczyść lokalizację',
    setDistance: 'Ustaw',
  },
} as const;

export type TranslationKey = keyof typeof translations.pl;
export type Language = keyof typeof translations;

/**
 * Get translation for a given key
 * @param key - Translation key
 * @param lang - Language code (default: 'pl')
 * @returns Translated string
 */
export function t(key: TranslationKey, lang: Language = 'pl'): string {
  return translations[lang][key] || key;
}

/**
 * Get plural form for a count
 * Polish has 3 plural forms
 */
export function pluralize(
  count: number,
  forms: [string, string, string],
  lang: Language = 'pl'
): string {
  if (lang !== 'pl') {
    // Simple English pluralization
    return count === 1 ? forms[0] : forms[2];
  }

  const mod10 = count % 10;
  const mod100 = count % 100;

  if (count === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return forms[1];
  }
  return forms[2];
}
