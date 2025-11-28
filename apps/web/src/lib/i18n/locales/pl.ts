export const pl = {
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
    subtitle: 'Dostosuj swój obszar roboczy i osobiste preferencje',
    language: {
      title: 'Język / Language / Sprache',
      label: 'Język',
      description: 'Zmień język używany w interfejsie użytkownika',
      changed: 'Język został zmieniony',
      error: 'Nie udało się zmienić języka',
    },
    timezone: {
      title: 'Strefa czasowa',
      label: 'Strefa czasowa',
      automatic: 'Automatyczna strefa czasowa',
      description:
        'Wybierz swoją strefę czasową dla poprawnego wyświetlania dat',
      detected: 'Wykryta strefa',
      changed: 'Strefa czasowa została zmieniona',
      error: 'Nie udało się zmienić strefy czasowej',
    },
    theme: {
      title: 'Motyw',
      description: 'Wybierz motyw jasny, ciemny lub automatyczny',
      light: 'Jasny',
      dark: 'Ciemny',
      system: 'Automatyczny',
      changed: 'Motyw został zmieniony',
    },
    info: {
      tip: 'Wskazówka',
      tipMessage:
        'Zmiany języka i strefy czasowej są zapisywane w Twoim profilu i synchronizowane na wszystkich urządzeniach.',
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
