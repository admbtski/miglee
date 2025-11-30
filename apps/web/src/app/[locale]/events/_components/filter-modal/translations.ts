/**
 * Translations for Filter Modal
 * Supports: Polish (pl), English (en)
 *
 * REFACTORED: Separated time-based status from event settings
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
      nearMeLabel: string;
      customCityLabel: string;
      locationModeHint: string;
    };
    dateRange: {
      title: string;
      description: string;
      disabledByStatus: string;
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
    timeStatus: {
      title: string;
      description: string;
      hint: string;
      any: string;
      upcoming: string;
      ongoing: string;
      past: string;
    };
    eventSettings: {
      title: string;
      description: string;
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
    tooltipApply: string;
  };

  // Pro Tip
  proTip: {
    title: string;
    message: string;
  };

  // Filter hints
  filterHints: {
    timeStatus: string;
    meetingKind: string;
    level: string;
    joinMode: string;
  };

  // UX bottom hints
  uxHints: {
    combineFilters: string;
    timeReplacesRange: string;
  };
};

export const translations: Record<'pl' | 'en', FilterModalTranslations> = {
  pl: {
    // Header
    title: 'Filtry wyszukiwania',
    clearAll: 'Wyczyść wszystko',
    clearAllHint: 'Wyczyść wszystkie filtry i rozpocznij od nowa',
    noChangesToClear: 'Brak zmian do wyczyszczenia',

    // Sections
    sections: {
      search: {
        title: 'Wyszukiwanie i Kategorie',
        description: 'Wybierz kategorię, tag lub wpisz słowo kluczowe',
        placeholder: 'Szukaj tagów lub kategorii…',
        loadingPlaceholder: 'Ładowanie podpowiedzi…',
        tagsLabel: 'Tagi',
        categoriesLabel: 'Kategorie',
      },
      location: {
        title: 'Lokalizacja i Odległość',
        description: 'Wybierz tryb lokalizacji i promień wyszukiwania',
        placeholder: 'Wpisz miasto...',
        distanceLabel: 'Odległość',
        globalLabel: '🌍 Globalnie',
        nearMeLabel: '📍 W pobliżu',
        customCityLabel: '🏙 Własne miasto',
        locationModeHint:
          'Wybierz "Globalnie" dla wszystkich wydarzeń lub ustaw lokalizację',
      },
      dateRange: {
        title: 'Zakres Dat',
        description: 'Ustaw własny zakres dat dla wydarzeń',
        disabledByStatus:
          'Zakres dat jest wyłączony, gdy wybrano status czasowy',
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
      timeStatus: {
        title: 'Status Czasu',
        description: 'Filtruj według statusu czasowego wydarzenia',
        hint: 'Status oparty na czasie zastępuje ręcznie ustawiany zakres dat',
        any: 'Dowolny',
        upcoming: 'Nadchodzące',
        ongoing: 'W trakcie',
        past: 'Przeszłe',
      },
      eventSettings: {
        title: 'Ustawienia Wydarzenia',
        description: 'Filtruj według typu, poziomu i trybu dołączania',
        meetingKind: {
          title: 'Tryb spotkania',
          onsite: 'Stacjonarne',
          online: 'Online',
          hybrid: 'Hybrydowe',
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
          hint: 'Pokaż tylko wydarzenia od zweryfikowanych organizatorów',
          verifiedOnly: 'Tylko zweryfikowani organizatorzy',
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
      tooltipApply: 'Zastosuj wybrane filtry (Cmd/Ctrl + Enter)',
    },

    // Pro Tip
    proTip: {
      title: 'Wskazówka:',
      message:
        'Łącz wiele filtrów, aby szybciej znaleźć odpowiednie wydarzenia.',
    },

    // Filter hints
    filterHints: {
      timeStatus: 'Filtruj według czasu:',
      meetingKind: 'Przełącz tryb:',
      level: 'Przełącz poziom:',
      joinMode: 'Przełącz tryb dołączania:',
    },

    // UX bottom hints
    uxHints: {
      combineFilters:
        'Łącz wiele filtrów, aby szybciej znaleźć odpowiednie wydarzenia',
      timeReplacesRange: 'Filtry czasu zastępują zakres dat',
    },
  },

  en: {
    // Header
    title: 'Search Filters',
    clearAll: 'Clear All',
    clearAllHint: 'Clear all filters and start fresh',
    noChangesToClear: 'No changes to clear',

    // Sections
    sections: {
      search: {
        title: 'Search & Categories',
        description: 'Choose category, tag, or enter keyword',
        placeholder: 'Search tags or categories…',
        loadingPlaceholder: 'Loading suggestions…',
        tagsLabel: 'Tags',
        categoriesLabel: 'Categories',
      },
      location: {
        title: 'Location & Distance',
        description: 'Choose location mode and search radius',
        placeholder: 'Enter city...',
        distanceLabel: 'Distance',
        globalLabel: '🌍 Global',
        nearMeLabel: '📍 Near me',
        customCityLabel: '🏙 Custom city',
        locationModeHint: 'Choose "Global" for all events or set a location',
      },
      dateRange: {
        title: 'Date Range',
        description: 'Set custom date range for events',
        disabledByStatus: 'Date range is disabled when time status is selected',
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
      timeStatus: {
        title: 'Time Status',
        description: 'Filter by event time status',
        hint: 'Time-based status replaces manual date range',
        any: 'Any',
        upcoming: 'Upcoming',
        ongoing: 'Ongoing',
        past: 'Past',
      },
      eventSettings: {
        title: 'Event Settings',
        description: 'Filter by type, level, and join mode',
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
          hint: 'Show only events from verified organizers',
          verifiedOnly: 'Verified organizers only',
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
      tooltipApply: 'Apply selected filters (Cmd/Ctrl + Enter)',
    },

    // Pro Tip
    proTip: {
      title: 'Pro Tip:',
      message:
        'Combine multiple filters to quickly find the right events for you.',
    },

    // Filter hints
    filterHints: {
      timeStatus: 'Filter by time:',
      meetingKind: 'Toggle mode:',
      level: 'Toggle level:',
      joinMode: 'Toggle join mode:',
    },

    // UX bottom hints
    uxHints: {
      combineFilters:
        'Combine multiple filters to quickly find the right events',
      timeReplacesRange: 'Time filters replace date range',
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
