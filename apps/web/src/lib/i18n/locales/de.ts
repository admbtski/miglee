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
      EVENT_REMINDER: 'Veranstaltungserinnerung',
      EVENT_UPDATED: 'Veranstaltung aktualisiert',
      EVENT_CANCELED: 'Veranstaltung abgesagt',
      EVENT_CREATED: 'Neue Veranstaltung',
      NEW_MESSAGE: 'Neue Nachricht',
      NEW_COMMENT: 'Neuer Kommentar',
      NEW_REVIEW: 'Neue Bewertung',
      MEMBER_JOINED: 'Neuer Teilnehmer',
      MEMBER_LEFT: 'Teilnehmer hat verlassen',
      INVITE_RECEIVED: 'Einladung erhalten',
      default: 'Benachrichtigung',
    },
    // Notification content (title + body with interpolation)
    content: {
      EVENT_CREATED: {
        title: 'Neues Event',
        body: 'Ein neues Event wurde erstellt.',
      },
      EVENT_UPDATED: {
        title: 'Event aktualisiert',
        body: 'Event "{{eventTitle}}" wurde aktualisiert.{{changesDescription}}',
      },
      EVENT_CANCELED: {
        title: 'Event abgesagt',
        body: '{{reason}}',
      },
      EVENT_DELETED: {
        title: 'Event gelöscht',
        body: 'Das Event wurde dauerhaft gelöscht.',
      },
      EVENT_INVITE: {
        title: 'Event-Einladung',
        body: 'Du wurdest zu "{{eventTitle}}" eingeladen.',
      },
      EVENT_INVITE_ACCEPTED: {
        title: 'Einladung angenommen',
        body: '{{actorName}} hat deine Einladung angenommen.',
      },
      EVENT_MEMBERSHIP_APPROVED: {
        title: 'Anfrage genehmigt',
        body: 'Deine Anfrage für "{{eventTitle}}" wurde genehmigt.',
      },
      EVENT_MEMBERSHIP_REJECTED: {
        title: 'Anfrage abgelehnt',
        body: 'Deine Anfrage für "{{eventTitle}}" wurde abgelehnt.{{reason}}',
      },
      EVENT_MEMBER_KICKED: {
        title: 'Vom Event entfernt',
        body: 'Du wurdest vom Event entfernt.{{reason}}',
      },
      EVENT_MEMBER_ROLE_CHANGED: {
        title: 'Rolle geändert',
        body: 'Deine Rolle wurde zu {{newRole}} geändert.',
      },
      JOIN_REQUEST: {
        title: 'Neue Beitrittsanfrage',
        body: '{{actorName}} möchte deinem Event beitreten.',
      },
      BANNED: {
        title: 'Gesperrt',
        body: 'Du wurdest vom Event gesperrt.{{reason}}',
      },
      UNBANNED: {
        title: 'Entsperrt',
        body: 'Deine Sperre wurde aufgehoben. Du kannst erneut anfragen.',
      },
      WAITLIST_JOINED: {
        title: 'Zur Warteliste hinzugefügt',
        body: '{{actorName}} hat sich auf die Warteliste gesetzt.',
      },
      WAITLIST_PROMOTED: {
        title: 'Von Warteliste befördert',
        body: 'Du wurdest von der Warteliste befördert! Du bist jetzt Teilnehmer.',
      },
      EVENT_REVIEW_RECEIVED: {
        title: 'Neue Bewertung',
        body: '{{actorName}} hat eine Bewertung hinterlassen ({{rating}} ⭐){{reviewContent}}',
      },
      EVENT_FEEDBACK_RECEIVED: {
        title: 'Neues Feedback',
        body: '{{actorName}} hat Feedback gesendet ({{rating}} ⭐).',
      },
      EVENT_FEEDBACK_REQUEST: {
        title: 'Teile dein Feedback',
        body: 'Wie war "{{eventTitle}}"? Teile dein Feedback.',
      },
      REVIEW_HIDDEN: {
        title: 'Bewertung ausgeblendet',
        body: 'Deine Bewertung wurde von {{moderatorName}} ausgeblendet.',
      },
      EVENT_COMMENT_ADDED: {
        title: 'Neuer Kommentar',
        body: '{{actorName}}: {{commentContent}}',
      },
      COMMENT_REPLY: {
        title: 'Antwort auf deinen Kommentar',
        body: '{{actorName}}: {{commentContent}}',
      },
      COMMENT_HIDDEN: {
        title: 'Kommentar ausgeblendet',
        body: 'Dein Kommentar wurde von {{moderatorName}} ausgeblendet.',
      },
      NEW_MESSAGE: {
        title: 'Neue Nachricht',
        body: '{{actorName}}: {{messageContent}}',
      },
      NEW_COMMENT: {
        title: 'Neuer Kommentar',
        body: '{{actorName}} hat einen Kommentar hinzugefügt.',
      },
      NEW_REVIEW: {
        title: 'Neue Bewertung',
        body: '{{actorName}} hat eine Bewertung hinterlassen ({{rating}} ⭐).',
      },
      EVENT_CHAT_MESSAGE: {
        title: 'Neue Chat-Nachricht',
        body: '{{actorName}}: {{messageContent}}',
      },
      EVENT_REMINDER: {
        title: 'Event-Erinnerung',
        body: 'Event "{{eventTitle}}" beginnt {{startsIn}}.',
      },
      SYSTEM: {
        title: 'Systembenachrichtigung',
        body: '{{message}}',
      },
    },
    roles: {
      OWNER: 'Eigentümer',
      MODERATOR: 'Moderator',
      PARTICIPANT: 'Teilnehmer',
    },
    relativeTime: {
      inMinutes: 'in {{count}} Min.',
      inHours: 'in {{count}} Std.',
      inDays: 'in {{count}} Tagen',
      soon: 'bald',
    },
    reasonPrefix: 'Grund:',
    changedFields: {
      title: 'Titel',
      description: 'Beschreibung',
      notes: 'Notizen',
      startAt: 'Startzeit',
      endAt: 'Endzeit',
      address: 'Standort',
      onlineUrl: 'Online-Link',
      min: 'Min. Teilnehmer',
      max: 'Max. Teilnehmer',
      meetingKind: 'Veranstaltungstyp',
      visibility: 'Sichtbarkeit',
      joinMode: 'Beitrittsmodus',
      addressVisibility: 'Adresssichtbarkeit',
      membersVisibility: 'Teilnehmersichtbarkeit',
      joinOpensMinutesBeforeStart: 'Anmeldung öffnet',
      joinCutoffMinutesBeforeStart: 'Anmeldeschluss',
      allowJoinLate: 'Spätes Beitreten',
      lateJoinCutoffMinutesAfterStart: 'Spätes Beitreten Limit',
      levels: 'Niveaus',
      categories: 'Kategorien',
      tags: 'Tags',
    },
    changesPrefix: ' Geändert:',
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

  // My Events
  myEvents: {
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
      youAreBanned: 'Sie sind von diesem Event gesperrt',
    },
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    events: 'Veranstaltungen',
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
      terms: 'Nutzungsbedingungen',
      privacy: 'Datenschutzrichtlinie',
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

  // Analytics
  analytics: {
    title: 'Analytik',
    subtitle:
      'Verfolgen Sie die Leistung und das Engagement Ihrer Veranstaltungen',
    comingSoon: {
      title: 'Analytik kommt bald',
      description:
        'Wir arbeiten daran, Ihnen detaillierte Analysen für Ihre Veranstaltungen bereitzustellen. Verfolgen Sie Ansichten, Engagement und mehr.',
      button: 'Demnächst',
    },
  },

  // Plans and Bills
  plansAndBills: {
    title: 'Pläne & Rechnungen',
    subtitle: 'Verwalten Sie Ihr Abonnement und Ihre Rechnungsinformationen',
    loading: 'Lade Rechnungsinformationen...',
    currentPlan: {
      title: 'Aktueller Plan',
      renewsOn: 'Erneuert sich am',
      expiresOn: 'Läuft ab am',
      timeToRenewal: 'Zeit bis zur Erneuerung',
      timeToExpiry: 'Zeit bis zum Ablauf',
      daysRemaining: 'Tage verbleibend',
      day: 'Tag',
      days: 'Tage',
      willRenewOn: 'Plan wird erneuert am',
      willExpireOn: 'Plan läuft ab am',
      planDetails: 'Plan-Details',
      type: 'Typ',
      subscription: 'Abonnement',
      oneTime: 'Einmalig',
      period: 'Zeitraum',
      yearly: 'Jährlich',
      monthly: 'Monatlich',
      startDate: 'Startdatum',
      renewal: 'Erneuerung',
      expiry: 'Ablauf',
      upgradePlan: 'Plan upgraden',
      changePlan: 'Plan ändern',
      cancelSubscription: 'Abonnement kündigen',
    },
    paymentHistory: {
      title: 'Zahlungsverlauf',
      subtitle: 'Sehen Sie Ihre Abrechnungshistorie und Rechnungen ein',
      date: 'Datum',
      description: 'Beschreibung',
      amount: 'Betrag',
      status: 'Status',
      actionsColumn: 'Aktionen',
      to: 'bis',
      active: 'Aktiv',
      paid: 'Bezahlt',
      pending: 'Ausstehend',
      failed: 'Fehlgeschlagen',
      view: 'Ansehen',
      receipt: 'Rechnung',
      noHistory: 'Kein Zahlungsverlauf',
      noHistoryDescription:
        'Wenn Sie Zahlungen tätigen, werden sie hier angezeigt.',
      plan: 'Plan',
      event: 'Veranstaltung',
      actionPackage: 'Aktionspaket',
      actions: 'Aktionen',
    },
    cancelModal: {
      title: 'Abonnement kündigen',
      description:
        'Ihr Abonnement bleibt bis zum Ende des aktuellen Abrechnungszeitraums aktiv.',
      confirmButton: 'Abonnement kündigen',
      cancelButton: 'Abonnement behalten',
    },
    toast: {
      cancelSuccess:
        'Das Abonnement wird am Ende des Abrechnungszeitraums gekündigt',
      cancelError: 'Fehler beim Kündigen des Abonnements',
      receiptNotAvailable: 'Rechnung ist noch nicht verfügbar',
      receiptError: 'Fehler beim Abrufen der Rechnung',
    },
  },

  // Terms of Service
  termsOfService: {
    title: 'Nutzungsbedingungen',
    subtitle: 'Lesen Sie unsere Geschäftsbedingungen',
    downloadPdf: 'PDF herunterladen',
    selectLanguage: 'Sprache wählen:',
    english: 'Englisch',
    polish: 'Polnisch',
    german: 'Deutsch',
    lastUpdated: 'Zuletzt aktualisiert:',
    viewOnline: 'Online ansehen',
  },

  // Privacy Policy
  privacyPolicy: {
    title: 'Datenschutzrichtlinie',
    subtitle: 'Erfahren Sie, wie wir Ihre Daten schützen',
    downloadPdf: 'PDF herunterladen',
    selectLanguage: 'Sprache wählen:',
    english: 'Englisch',
    polish: 'Polnisch',
    german: 'Deutsch',
    lastUpdated: 'Zuletzt aktualisiert:',
    viewOnline: 'Online ansehen',
  },

  // Events Filters
  eventsFilters: {
    // Panel
    title: 'Filter',
    clearAll: 'Löschen',
    // Time Status
    timeStatus: 'Zeitstatus',
    any: 'Beliebig',
    upcoming: 'Bevorstehend',
    ongoing: 'Laufend',
    past: 'Vergangen',
    // Date Range
    dateRange: 'Datumsbereich',
    dateRangeHint:
      'Benutzerdefinierter Datumsbereich nur verfügbar wenn Zeitstatus = Beliebig',
    dateRangeDisabled: 'Deaktiviert durch Zeitstatus',
    startDate: 'Startdatum',
    endDate: 'Enddatum',
    // Presets
    nowPlus1h: 'Jetzt +1h',
    tonight: 'Heute Abend',
    tomorrow: 'Morgen',
    weekend: 'Wochenende',
    next7days: 'Nächste 7 Tage',
    // Meeting Type
    meetingType: 'Veranstaltungsart',
    onsite: 'Vor Ort',
    online: 'Online',
    hybrid: 'Hybrid',
    // Level
    level: 'Niveau',
    beginner: 'Anfänger',
    intermediate: 'Fortgeschritten',
    advanced: 'Experte',
    // Join Mode
    joinMode: 'Beitrittsmodus',
    open: 'Offen',
    request: 'Auf Anfrage',
    inviteOnly: 'Nur mit Einladung',
    // Organizer
    organizer: 'Veranstalter',
    verifiedOnly: 'Nur verifizierte',
    verifiedHint:
      'Nur Veranstaltungen von verifizierten Veranstaltern anzeigen',
  },

  // Events Search (Top Drawer)
  eventsSearch: {
    title: 'Suche',
    searchLabel: 'Suchen',
    searchPlaceholder: 'Tags oder Kategorien suchen…',
    loadingPlaceholder: 'Vorschläge werden geladen…',
    tagsLabel: 'Tags',
    categoriesLabel: 'Kategorien',
    locationLabel: 'Standort',
    locationPlaceholder: 'Stadt eingeben...',
    distanceLabel: 'Entfernung',
    global: 'Global',
    apply: 'Suchen',
    close: 'Schließen',
  },

  // Mobile Search Bar
  mobileSearch: {
    searchPlaceholder: 'Veranstaltungen suchen...',
    filters: 'Filter',
  },

  // Subscription Plans
  subscriptionPlans: {
    title: 'Wählen Sie Ihren Benutzerplan',
    subtitle:
      'Upgraden Sie Ihr Konto, um mehr Funktionen freizuschalten und Ihre Veranstaltungen zu erweitern',
    billingTypes: {
      subscription: 'Abonnement',
      monthly: 'Monatlich',
      yearly: 'Jährlich',
      save20: 'Sparen Sie 20%',
    },
    tooltips: {
      subscription:
        'Abonnement: Verlängert sich automatisch alle 30 Tage. Jederzeit kündbar.',
      monthly:
        'Monatlich: Einmalzahlung. Zugang für 30 Tage ohne automatische Verlängerung.',
      yearly: 'Jährlich: Einmalzahlung. Zugang für 12 Monate. Sparen Sie 20%!',
    },
    badges: {
      autoRenewal: 'Auto-renewal',
      noSubscription: 'No subscription',
      oneTimeCharge: 'One-time charge',
      mostPopular: 'AM BELIEBTESTEN',
      activePlan: 'AKTIVER PLAN',
    },
    priceLabels: {
      perMonth: '/ Monat',
      perYear: '/ Jahr',
      saveYearly: 'Sie sparen',
      yearly: 'jährlich',
    },
    buttons: {
      activePlan: 'Aktiver Plan',
      freePlan: 'Basisplan',
      selectPlan: 'Plan wählen',
    },
    features: {
      included: 'Was enthalten ist',
      joinQuestions: 'Fragen vor dem Beitritt',
      noJoinQuestions: 'Keine Fragen vor dem Beitritt',
    },
    infoBanner: {
      subscriptionNote:
        'Alle Abonnementpläne können jederzeit gekündigt werden.',
      onetimeNote:
        'Alle Einmalzahlungen sind endgültig. Wählen Sie den Plan, der am besten zu Ihren Bedürfnissen passt.',
      important: 'Wichtig:',
    },
  },
} as const;
