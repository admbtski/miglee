import type { Translations } from './en';

export const pl: Translations = {
  // Common
  common: {
    save: 'Zapisz',
    cancel: 'Anuluj',
    delete: 'Usuń',
    edit: 'Edytuj',
    create: 'Utwórz',
    update: 'Aktualizuj',
    search: 'Szukaj',
    loading: 'Ładowanie...',
    error: 'Błąd',
    success: 'Sukces',
    close: 'Zamknij',
    back: 'Wstecz',
    next: 'Dalej',
    previous: 'Poprzedni',
    confirm: 'Potwierdź',
    yes: 'Tak',
    no: 'Nie',
  },

  // Settings
  settings: {
    title: 'Ustawienia',
    subtitle: 'Dostosuj swój obszar roboczy i preferencje osobiste',
    language: {
      title: 'Język',
      label: 'Język',
      description: 'Zmień język używany w interfejsie użytkownika.',
    },
    timezone: {
      title: 'Strefa czasowa',
      label: 'Strefa czasowa',
      automatic: 'Automatyczna strefa czasowa',
      description:
        'Wszystkie daty i czasy będą wyświetlane w Twojej lokalnej strefie czasowej.',
    },
    dateWeek: {
      title: 'Data i tydzień',
      dateFormat: 'Format daty',
      weekStart: 'Początek tygodnia',
      weekStartHelp: 'To zmieni wygląd wszystkich kalendarzy w aplikacji.',
      weekend: 'Weekend',
    },
    appearance: {
      title: 'Wygląd',
      themeMode: 'Tryb motywu',
      description:
        'Wybierz, jak aplikacja ma wyglądać. Wybierz pojedynczy motyw lub synchronizuj z systemem i automatycznie przełączaj między motywami dziennymi i nocnymi.',
      system: 'System',
      light: 'Jasny',
      dark: 'Ciemny',
      active: 'Aktywny',
    },
    actions: {
      saveChanges: 'Zapisz zmiany',
      reset: 'Resetuj',
    },
  },

  // Navigation
  nav: {
    dashboard: 'Panel',
    intents: 'Wydarzenia',
    account: 'Konto',
    settings: 'Ustawienia',
  },
} as const;
