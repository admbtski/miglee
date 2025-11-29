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
        'Kontolöschung beantragen. Ihr Konto wird deaktiviert und kann innerhalb von 30 Tagen wiederhergestellt werden.',
      warning:
        'Warnung: Ihr Konto wird deaktiviert. Sie können es innerhalb von 30 Tagen wiederherstellen, indem Sie /restore-account besuchen. Nach 30 Tagen ist eine Wiederherstellung nicht mehr möglich.',
      button: 'Konto löschen',
      modal: {
        title: 'Konto löschen',
        description:
          'Ihr Konto wird sofort deaktiviert. Sie haben 30 Tage Zeit, es wiederherzustellen, falls Sie Ihre Meinung ändern.',
        reasonLabel: 'Grund für die Löschung (optional)',
        reasonPlaceholder: 'Sagen Sie uns, warum Sie gehen...',
        confirmLabel: 'Geben Sie LÖSCHEN ein, um zu bestätigen',
        confirmPlaceholder: 'LÖSCHEN',
        cancel: 'Abbrechen',
        confirm: 'Konto löschen',
        success:
          'Ihr Konto wurde deaktiviert. Sie können es innerhalb von 30 Tagen wiederherstellen.',
        error: 'Konto konnte nicht gelöscht werden',
        invalidConfirmation: 'Bitte geben Sie LÖSCHEN ein, um zu bestätigen',
      },
    },
  },

  // Account Restoration
  accountRestoration: {
    request: {
      title: 'Ihr Konto wiederherstellen',
      subtitle:
        'Geben Sie Ihre E-Mail-Adresse ein, um einen Wiederherstellungslink zu erhalten',
      emailLabel: 'E-Mail-Adresse',
      emailPlaceholder: 'ihre@email.de',
      submit: 'Wiederherstellungslink senden',
      submitting: 'Wird gesendet...',
      success:
        'Wenn Ihr Konto existiert und kürzlich gelöscht wurde, erhalten Sie eine E-Mail mit Wiederherstellungsanweisungen.',
      error: 'Fehler beim Anfordern der Kontowiederherstellung',
    },
    restore: {
      title: 'Ihr Konto wiederherstellen',
      subtitle: 'Klicken Sie unten, um Ihr Konto wiederherzustellen',
      button: 'Mein Konto wiederherstellen',
      restoring: 'Wird wiederhergestellt...',
      success:
        'Ihr Konto wurde wiederhergestellt! Sie können sich jetzt anmelden.',
      error:
        'Kontowiederherstellung fehlgeschlagen. Der Link ist möglicherweise abgelaufen oder ungültig.',
      backToLogin: 'Zurück zur Anmeldung',
    },
  },

  // Notifications
  notifications: {
    title: 'Benachrichtigungen',
    subtitle:
      'Verwalten Sie Ihre Benachrichtigungen und bleiben Sie auf dem Laufenden',
    loginRequired:
      'Sie müssen angemeldet sein, um Benachrichtigungen anzuzeigen',
    refresh: 'Aktualisieren',
    markAllRead: 'Alle als gelesen markieren',
    all: 'Alle',
    unread: 'Ungelesen',
    read: 'Gelesen',
    total: 'Gesamt',
    markAsRead: 'Als gelesen markieren',
    delete: 'Löschen',
    loadedAll: 'Alles geladen',
    empty: {
      all: 'Keine Benachrichtigungen',
      unread: 'Keine ungelesenen Benachrichtigungen',
      read: 'Keine gelesenen Benachrichtigungen',
      description: 'Benachrichtigungen erscheinen hier, wenn etwas passiert',
      changeFilter: 'Filter ändern, um andere Benachrichtigungen zu sehen',
    },
    kinds: {
      INTENT_REMINDER: 'Veranstaltungserinnerung',
      INTENT_UPDATED: 'Veranstaltung aktualisiert',
      INTENT_CANCELED: 'Veranstaltung abgesagt',
      INTENT_CREATED: 'Neue Veranstaltung',
      NEW_MESSAGE: 'Neue Nachricht',
      NEW_COMMENT: 'Neuer Kommentar',
      NEW_REVIEW: 'Neue Bewertung',
      MEMBER_JOINED: 'Neuer Teilnehmer',
      MEMBER_LEFT: 'Teilnehmer hat verlassen',
      INVITE_RECEIVED: 'Einladung erhalten',
      default: 'Benachrichtigung',
    },
  },

  // Favourites
  favourites: {
    title: 'Favoriten',
    subtitle: 'Ihre gespeicherten Veranstaltungen',
    savedEvents: 'gespeichert',
    savedEvent: 'Veranstaltung',
    savedEventsPlural: 'Veranstaltungen',
    emptyTitle: 'Noch keine Favoriten',
    emptyDescription:
      'Durchsuchen Sie Veranstaltungen und klicken Sie auf das ❤️-Symbol, um interessante Veranstaltungen für später zu speichern.',
    browseEvents: 'Veranstaltungen durchsuchen',
    loadMore: 'Mehr laden',
    loading: 'Lädt…',
    loadingFavourites: 'Ihre Favoriten werden geladen...',
    removeFromFavourites: 'Aus Favoriten entfernen',
    viewEvent: 'Veranstaltung ansehen',
    participants: 'Teilnehmer',
    showingEvents: 'Anzeige',
  },

  // My Intents
  myIntents: {
    title: 'Meine Veranstaltungen',
    subtitle: 'Verwalten Sie alle Ihre Veranstaltungen an einem Ort',
    loading: 'Lädt...',
    notAuthenticated: 'Nicht authentifiziert',
    pleaseLogin: 'Bitte melden Sie sich an, um Ihre Veranstaltungen anzuzeigen',
    errorLoading: 'Fehler beim Laden der Veranstaltungen',
    noEvents: 'Keine Veranstaltungen',
    tryChangeFilters: 'Versuchen Sie, die Filter zu ändern',
    noEventsYet: 'Sie haben noch keine Veranstaltungen',
    clearFilters: 'Alle Filter löschen',
    showing: 'Anzeige',
    event: 'Veranstaltung',
    events: 'Veranstaltungen',
    multipleSelectionAllowed: 'Mehrfachauswahl möglich',
    filters: {
      role: 'Rolle',
      status: 'Status',
      all: 'Filter',
      owner: 'Eigentümer',
      moderator: 'Moderator',
      member: 'Mitglied',
      pending: 'Ausstehend',
      invited: 'Eingeladen',
      rejected: 'Abgelehnt',
      banned: 'Gesperrt',
      waitlist: 'Warteliste',
      upcoming: 'Bevorstehend',
      ongoing: 'Laufend',
      finished: 'Beendet',
      canceled: 'Abgesagt',
    },
    badges: {
      owner: 'EIGENTÜMER',
      moderator: 'MODERATOR',
      member: 'MITGLIED',
      joined: 'BEIGETRETEN',
      pending: 'AUSSTEHEND',
      invited: 'EINGELADEN',
      rejected: 'ABGELEHNT',
      banned: 'GESPERRT',
      left: 'VERLASSEN',
      waitlist: 'WARTELISTE',
      live: 'LIVE',
      finished: 'BEENDET',
      canceled: 'ABGESAGT',
      deleted: 'GELÖSCHT',
    },
    actions: {
      manage: 'Verwalten',
      view: 'Ansehen',
      cancel: 'Absagen',
      leave: 'Verlassen',
      withdraw: 'Zurückziehen',
      accept: 'Akzeptieren',
      decline: 'Ablehnen',
    },
    messages: {
      requestRejected: 'Ihre Anfrage wurde abgelehnt',
      youAreBanned: 'Sie sind von diesem Intent gesperrt',
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
        'Wir verwenden Cookies, um Ihre Erfahrung auf unserer Website zu verbessern. Klicken Sie auf die Schaltfläche unten, um Ihre Cookie-Präferenzen für jede Kategorie anzupassen.',
    },
    howItWorks: {
      title: 'Wie es funktioniert',
      description:
        'Klicken Sie auf die Schaltfläche oben, um das Cookie-Zustimmungsbanner zu öffnen, in dem Sie Ihre Cookie-Präferenzen für jede Kategorie akzeptieren, ablehnen oder anpassen können.',
    },
    categoriesTitle: 'Cookie-Kategorien',
    clickManage:
      'Klicken Sie oben auf "Cookie-Präferenzen verwalten", um Ihre Auswahl anzupassen.',
    gdprCompliant: 'DSGVO und ePrivacy konform',
    gdprDescription:
      'Wir respektieren Ihre Privatsphäre und halten uns an die DSGVO- und ePrivacy-Vorschriften. Sie haben die volle Kontrolle über Ihre Cookie-Präferenzen und können diese jederzeit ändern.',
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
      manageCookies: 'Cookie-Präferenzen verwalten',
      acceptAll: 'Alle akzeptieren',
      rejectAll: 'Alle ablehnen',
      savePreferences: 'Einstellungen speichern',
      saving: 'Wird gespeichert...',
      saved: 'Cookie-Einstellungen erfolgreich gespeichert',
    },
  },
} as const;
