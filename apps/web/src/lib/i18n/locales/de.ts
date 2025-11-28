export const de = {
  // Common
  common: {
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    create: 'Erstellen',
    update: 'Aktualisieren',
    search: 'Suchen',
    loading: 'Wird geladen...',
    error: 'Fehler',
    success: 'Erfolg',
    close: 'Schließen',
    back: 'Zurück',
    next: 'Weiter',
    previous: 'Vorherige',
    confirm: 'Bestätigen',
    yes: 'Ja',
    no: 'Nein',
  },

  // Settings
  settings: {
    title: 'Einstellungen',
    subtitle:
      'Passen Sie Ihren Arbeitsbereich und persönliche Einstellungen an',
    language: {
      title: 'Język / Language / Sprache',
      label: 'Sprache',
      description: 'Ändern Sie die Sprache der Benutzeroberfläche',
      changed: 'Sprache wurde geändert',
      error: 'Sprache konnte nicht geändert werden',
    },
    timezone: {
      title: 'Zeitzone',
      label: 'Zeitzone',
      automatic: 'Automatische Zeitzone',
      description: 'Wählen Sie Ihre Zeitzone für die korrekte Datumsanzeige',
      detected: 'Erkannte Zone',
      changed: 'Zeitzone wurde geändert',
      error: 'Zeitzone konnte nicht geändert werden',
    },
    theme: {
      title: 'Design',
      description: 'Wählen Sie helles, dunkles oder automatisches Design',
      light: 'Hell',
      dark: 'Dunkel',
      system: 'Automatisch',
      changed: 'Design wurde geändert',
    },
    info: {
      tip: 'Tipp',
      tipMessage:
        'Sprach- und Zeitzonenänderungen werden in Ihrem Profil gespeichert und auf allen Geräten synchronisiert.',
    },
    dateWeek: {
      title: 'Datum und Woche',
      dateFormat: 'Datumsformat',
      weekStart: 'Wochenbeginn',
      weekStartHelp: 'Dies ändert das Aussehen aller Kalender in Ihrer App.',
      weekend: 'Wochenende',
    },
    appearance: {
      title: 'Erscheinungsbild',
      themeMode: 'Design-Modus',
      description:
        'Wählen Sie, wie die App für Sie aussehen soll. Wählen Sie ein einzelnes Design oder synchronisieren Sie mit Ihrem System und wechseln Sie automatisch zwischen Tag- und Nachtdesigns.',
      system: 'System',
      light: 'Hell',
      dark: 'Dunkel',
      active: 'Aktiv',
    },
    actions: {
      saveChanges: 'Änderungen speichern',
      reset: 'Zurücksetzen',
    },
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    intents: 'Veranstaltungen',
    account: 'Konto',
    settings: 'Einstellungen',
  },
} as const;
