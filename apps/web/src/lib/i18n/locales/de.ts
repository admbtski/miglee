import type { Translations } from './en';

export const de: Translations = {
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
      title: 'Sprache',
      label: 'Sprache',
      description: 'Ändern Sie die Sprache der Benutzeroberfläche.',
    },
    timezone: {
      title: 'Zeitzone',
      label: 'Zeitzone',
      automatic: 'Automatische Zeitzone',
      description:
        'Alle Daten und Zeiten werden in Ihrer lokalen Zeitzone angezeigt.',
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
