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
    deleteAccount: {
      title: 'Konto löschen',
      description:
        'Löschen Sie Ihr Konto und alle zugehörigen Daten dauerhaft. Diese Aktion kann nicht rückgängig gemacht werden.',
      warning:
        'Warnung: Das Löschen Ihres Kontos entfernt alle Ihre Veranstaltungen, Nachrichten und persönlichen Daten. Diese Aktion ist unwiderruflich.',
      button: 'Konto löschen',
      modal: {
        title: 'Konto löschen',
        description:
          'Sind Sie sicher, dass Sie Ihr Konto löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden und alle Ihre Daten werden nach 30 Tagen dauerhaft gelöscht.',
        reasonLabel: 'Grund für die Löschung (optional)',
        reasonPlaceholder: 'Sagen Sie uns, warum Sie gehen...',
        confirmLabel: 'Geben Sie LÖSCHEN ein, um zu bestätigen',
        confirmPlaceholder: 'LÖSCHEN',
        cancel: 'Abbrechen',
        confirm: 'Konto löschen',
        success: 'Ihr Konto wurde zur Löschung geplant',
        error: 'Konto konnte nicht gelöscht werden',
        invalidConfirmation: 'Bitte geben Sie LÖSCHEN ein, um zu bestätigen',
      },
    },
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    intents: 'Veranstaltungen',
    account: 'Konto',
    settings: 'Einstellungen',
  },

  // Account Sidebar Navigation
  accountNav: {
    groups: {
      personal: 'Ihr Profil',
      activity: 'Veranstaltungen & Aktivität',
      communication: 'Kommunikation',
      billing: 'Abonnement & Abrechnung',
      tools: 'Erweiterte Tools',
      settingsSupport: 'Einstellungen & Support',
    },
    items: {
      viewProfile: 'Profil anzeigen',
      editProfile: 'Profil bearbeiten',
      myEvents: 'Meine Veranstaltungen',
      favourites: 'Favoriten',
      chats: 'Chats',
      notifications: 'Benachrichtigungen',
      subscription: 'Abonnement',
      plansAndBills: 'Pläne & Rechnungen',
      analytics: 'Analytik',
      settings: 'Einstellungen',
      cookieSettings: 'Cookie-Einstellungen',
      help: 'Hilfe',
      signOut: 'Abmelden',
    },
  },

  // Help & Support
  help: {
    title: 'Hilfe & Unterstützung',
    subtitle: 'Erhalten Sie Hilfe zu Ihrem Konto und Veranstaltungen',
    form: {
      title: 'Support kontaktieren',
      subtitle:
        'Füllen Sie das Formular aus und wir antworten innerhalb von 24 Stunden',
      category: {
        label: 'Kategorie',
        placeholder: 'Wählen Sie eine Kategorie...',
        account: 'Konto & Profil',
        events: 'Veranstaltungen & Aktivitäten',
        billing: 'Abrechnung & Abonnement',
        technical: 'Technisches Problem',
        other: 'Andere',
      },
      subject: {
        label: 'Betreff',
        placeholder: 'Kurze Beschreibung Ihres Problems',
      },
      message: {
        label: 'Nachricht',
        placeholder: 'Bitte beschreiben Sie Ihr Problem im Detail...',
      },
      responseTime: 'Wir antworten normalerweise innerhalb von 24 Stunden',
      submit: 'Nachricht senden',
      sending: 'Wird gesendet...',
      success: 'Ihre Nachricht wurde gesendet! Wir melden uns bald bei Ihnen.',
      error: 'Bitte füllen Sie alle Felder aus',
    },
    contact: {
      emailTitle: 'E-Mail-Support',
      emailDescription:
        'Bevorzugen Sie E-Mail? Senden Sie uns direkt eine Nachricht',
      faqTitle: 'Häufige Fragen',
      faqItems: {
        createEvent: 'Wie erstelle ich eine Veranstaltung?',
        manageSubscription: 'Abonnements verwalten',
        privacy: 'Datenschutz & Sicherheit',
        paymentIssues: 'Zahlungsprobleme',
      },
    },
  },

  // Cookie Settings
  cookies: {
    title: 'Cookie-Einstellungen',
    subtitle:
      'Verwalten Sie Ihre Cookie-Präferenzen und Datenschutzeinstellungen',
    about: {
      title: 'Über Cookies',
      description:
        'Wir verwenden Cookies, um Ihre Erfahrung auf unserer Website zu verbessern. Sie können wählen, welche Kategorien von Cookies Sie zulassen möchten. Wesentliche Cookies sind immer aktiviert, da sie für die ordnungsgemäße Funktion der Website erforderlich sind.',
    },
    categories: {
      essential: {
        name: 'Wesentliche Cookies',
        description:
          'Diese Cookies sind für die Funktion der Website erforderlich und können nicht deaktiviert werden. Sie werden in der Regel nur als Reaktion auf Ihre Aktionen gesetzt.',
        required: '(Erforderlich)',
        examples: {
          session: 'Sitzungs-Cookies',
          security: 'Sicherheitstoken',
          loadBalancing: 'Lastverteilung',
        },
      },
      analytics: {
        name: 'Analyse-Cookies',
        description:
          'Diese Cookies ermöglichen es uns, Besuche und Verkehrsquellen zu zählen, damit wir die Leistung unserer Website messen und verbessern können.',
        examples: {
          googleAnalytics: 'Google Analytics',
          pageViews: 'Seitenansichten-Tracking',
          userBehavior: 'Nutzerverhalten',
        },
      },
      marketing: {
        name: 'Marketing-Cookies',
        description:
          'Diese Cookies können von unseren Werbepartnern über unsere Website gesetzt werden. Sie können verwendet werden, um ein Profil Ihrer Interessen zu erstellen.',
        examples: {
          adTargeting: 'Anzeigen-Targeting',
          socialMedia: 'Social-Media-Pixel',
          remarketing: 'Remarketing',
        },
      },
      preferences: {
        name: 'Präferenz-Cookies',
        description:
          'Diese Cookies ermöglichen es der Website, erweiterte Funktionalität und Personalisierung basierend auf Ihren Interaktionen bereitzustellen.',
        examples: {
          language: 'Spracheinstellungen',
          theme: 'Design-Präferenzen',
          region: 'Regionseinstellungen',
        },
      },
    },
    actions: {
      acceptAll: 'Alle akzeptieren',
      rejectAll: 'Alle ablehnen',
      savePreferences: 'Einstellungen speichern',
      saving: 'Wird gespeichert...',
      saved: 'Cookie-Einstellungen erfolgreich gespeichert',
    },
  },
} as const;
