/**
 * Translations for Filter Modal
 * Supports: Polish (pl), English (en)
 */

export type FilterModalTranslations = {
  // Header
  title: string;
  clearAll: string;
  clearAllHint: string;
  noChangesToClear: string;

  // Sections
  sections: {
    search: {
      title: string;
      description: string;
      placeholder: string;
      loadingPlaceholder: string;
      tagsLabel: string;
      categoriesLabel: string;
    };
    location: {
      title: string;
      description: string;
      placeholder: string;
      distanceLabel: string;
      globalLabel: string;
    };
    dateRange: {
      title: string;
      description: string;
      quickSelect: string;
      customRange: string;
      startLabel: string;
      endLabel: string;
      presets: {
        now1h: string;
        tonight: string;
        tomorrow: string;
        weekend: string;
        sevenDays: string;
      };
      errors: {
        invalidFormat: string;
        endBeforeStart: string;
      };
    };
    settings: {
      title: string;
      description: string;
      status: {
        title: string;
        any: string;
        upcoming: string;
        ongoing: string;
        past: string;
      };
      meetingKind: {
        title: string;
        onsite: string;
        online: string;
        hybrid: string;
      };
      level: {
        title: string;
        beginner: string;
        intermediate: string;
        advanced: string;
      };
      joinMode: {
        title: string;
        open: string;
        request: string;
        inviteOnly: string;
      };
      organizer: {
        title: string;
        hint: string;
        verifiedOnly: string;
      };
    };
  };

  // Footer
  footer: {
    cancel: string;
    showResults: string;
    showResultsWithCount: string;
    results: string;
    result: string;
    noChanges: string;
    applyFilters: string;
  };

  // Pro Tip
  proTip: {
    title: string;
    message: string;
  };

  // Filter hints
  filterHints: {
    status: string;
    meetingKind: string;
    level: string;
    joinMode: string;
  };
};

export const translations: Record<'pl' | 'en', FilterModalTranslations> = {
  pl: {
    // Header
    title: 'Filtry wyszukiwania',
    clearAll: 'Wyczyść wszystko',
    clearAllHint: 'Wyczyść wszystkie filtry',
    noChangesToClear: 'Brak zmian do wyczyszczenia',

    // Sections
    sections: {
      search: {
        title: 'Wyszukiwanie i Kategorie',
        description: 'Znajdź wydarzenia według tagów i kategorii',
        placeholder: 'Szukaj tagów lub kategorii…',
        loadingPlaceholder: 'Ładowanie podpowiedzi…',
        tagsLabel: 'Tagi',
        categoriesLabel: 'Kategorie',
      },
      location: {
        title: 'Lokalizacja i Odległość',
        description: 'Ustaw lokalizację i promień wyszukiwania',
        placeholder: 'Wpisz miasto...',
        distanceLabel: 'Odległość',
        globalLabel: 'Globalnie',
      },
      dateRange: {
        title: 'Zakres dat',
        description: 'Filtruj wydarzenia według daty rozpoczęcia i zakończenia',
        quickSelect: 'Szybki wybór',
        customRange: 'Własny zakres',
        startLabel: 'Data i godzina rozpoczęcia',
        endLabel: 'Data i godzina zakończenia',
        presets: {
          now1h: 'Teraz +1h',
          tonight: 'Dziś wieczorem',
          tomorrow: 'Jutro',
          weekend: 'Weekend',
          sevenDays: 'Następne 7 dni',
        },
        errors: {
          invalidFormat: 'Nieprawidłowy format daty.',
          endBeforeStart:
            'Data zakończenia nie może być wcześniejsza niż rozpoczęcia.',
        },
      },
      settings: {
        title: 'Ustawienia wydarzenia',
        description: 'Filtruj według statusu, typu spotkania, poziomu i więcej',
        status: {
          title: 'Status',
          any: 'Dowolny',
          upcoming: 'Nadchodzące',
          ongoing: 'W trakcie',
          past: 'Przeszłe',
        },
        meetingKind: {
          title: 'Tryb spotkania',
          onsite: 'Stacjonarnie',
          online: 'Online',
          hybrid: 'Hybrydowo',
        },
        level: {
          title: 'Poziom',
          beginner: 'Początkujący',
          intermediate: 'Średniozaawansowany',
          advanced: 'Zaawansowany',
        },
        joinMode: {
          title: 'Tryb dołączania',
          open: 'Otwarte',
          request: 'Na prośbę',
          inviteOnly: 'Tylko zaproszenia',
        },
        organizer: {
          title: 'Organizator',
          hint: 'Pokaż tylko zweryfikowanych organizatorów.',
          verifiedOnly: 'Tylko zweryfikowani',
        },
      },
    },

    // Footer
    footer: {
      cancel: 'Anuluj',
      showResults: 'Pokaż wyniki',
      showResultsWithCount: 'Pokaż wyniki ({count})',
      results: 'wyników',
      result: 'wynik',
      noChanges: 'Brak zmian',
      applyFilters: 'Zastosuj filtry',
    },

    // Pro Tip
    proTip: {
      title: 'Wskazówka:',
      message:
        'Użyj Cmd/Ctrl+Enter aby szybko zastosować filtry. Łącz wiele filtrów, aby zawęzić wyszukiwanie.',
    },

    // Filter hints
    filterHints: {
      status: 'Filtruj:',
      meetingKind: 'Przełącz:',
      level: 'Przełącz:',
      joinMode: 'Przełącz:',
    },
  },

  en: {
    // Header
    title: 'Search Filters',
    clearAll: 'Clear All',
    clearAllHint: 'Clear all filters',
    noChangesToClear: 'No changes to clear',

    // Sections
    sections: {
      search: {
        title: 'Search & Categories',
        description: 'Find events by tags and categories',
        placeholder: 'Search tags or categories…',
        loadingPlaceholder: 'Loading suggestions…',
        tagsLabel: 'Tags',
        categoriesLabel: 'Categories',
      },
      location: {
        title: 'Location & Distance',
        description: 'Set location and search radius',
        placeholder: 'Enter city...',
        distanceLabel: 'Distance',
        globalLabel: 'Global',
      },
      dateRange: {
        title: 'Date Range',
        description: 'Filter events by start and end date',
        quickSelect: 'Quick Select',
        customRange: 'Custom Range',
        startLabel: 'Start Date & Time',
        endLabel: 'End Date & Time',
        presets: {
          now1h: 'Now +1h',
          tonight: 'Tonight',
          tomorrow: 'Tomorrow',
          weekend: 'Weekend',
          sevenDays: 'Next 7 days',
        },
        errors: {
          invalidFormat: 'Invalid date format.',
          endBeforeStart: 'End date cannot be earlier than start date.',
        },
      },
      settings: {
        title: 'Event Settings',
        description: 'Filter by status, meeting type, level, and more',
        status: {
          title: 'Status',
          any: 'Any',
          upcoming: 'Upcoming',
          ongoing: 'Ongoing',
          past: 'Past',
        },
        meetingKind: {
          title: 'Meeting Type',
          onsite: 'Onsite',
          online: 'Online',
          hybrid: 'Hybrid',
        },
        level: {
          title: 'Level',
          beginner: 'Beginner',
          intermediate: 'Intermediate',
          advanced: 'Advanced',
        },
        joinMode: {
          title: 'Join Mode',
          open: 'Open',
          request: 'Request',
          inviteOnly: 'Invite Only',
        },
        organizer: {
          title: 'Organizer',
          hint: 'Show only verified organizers.',
          verifiedOnly: 'Verified only',
        },
      },
    },

    // Footer
    footer: {
      cancel: 'Cancel',
      showResults: 'Show results',
      showResultsWithCount: 'Show results ({count})',
      results: 'results',
      result: 'result',
      noChanges: 'No changes',
      applyFilters: 'Apply filters',
    },

    // Pro Tip
    proTip: {
      title: 'Pro Tip:',
      message:
        'Use Cmd/Ctrl+Enter to quickly apply filters. Combine multiple filters to narrow down your search.',
    },

    // Filter hints
    filterHints: {
      status: 'Filter:',
      meetingKind: 'Toggle:',
      level: 'Toggle:',
      joinMode: 'Toggle:',
    },
  },
};

/**
 * Get translations for a specific locale
 * Defaults to Polish if locale is not found
 */
export function getFilterModalTranslations(
  locale: 'pl' | 'en' = 'pl'
): FilterModalTranslations {
  return translations[locale] || translations.pl;
}
