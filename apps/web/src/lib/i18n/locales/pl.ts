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
    deleteAccount: {
      title: 'Usuń konto',
      description:
        'Poproś o usunięcie konta. Twoje konto zostanie dezaktywowane i możesz je przywrócić w ciągu 30 dni.',
      warning:
        'Ostrzeżenie: Twoje konto zostanie dezaktywowane. Możesz je przywrócić w ciągu 30 dni odwiedzając /restore-account. Po 30 dniach przywrócenie nie będzie już możliwe.',
      button: 'Usuń konto',
      modal: {
        title: 'Usuń konto',
        description:
          'Twoje konto zostanie natychmiast dezaktywowane. Masz 30 dni na przywrócenie go, jeśli zmienisz zdanie.',
        reasonLabel: 'Powód usunięcia (opcjonalnie)',
        reasonPlaceholder: 'Powiedz nam, dlaczego odchodzisz...',
        confirmLabel: 'Wpisz USUŃ aby potwierdzić',
        confirmPlaceholder: 'USUŃ',
        cancel: 'Anuluj',
        confirm: 'Usuń konto',
        success:
          'Twoje konto zostało dezaktywowane. Możesz je przywrócić w ciągu 30 dni.',
        error: 'Nie udało się usunąć konta',
        invalidConfirmation: 'Proszę wpisać USUŃ aby potwierdzić',
      },
    },
  },

  // Account Restoration
  accountRestoration: {
    request: {
      title: 'Przywróć swoje konto',
      subtitle:
        'Wprowadź swój adres email, aby otrzymać link do przywrócenia konta',
      emailLabel: 'Adres email',
      emailPlaceholder: 'twoj@email.com',
      submit: 'Wyślij link przywracający',
      submitting: 'Wysyłanie...',
      success:
        'Jeśli Twoje konto istnieje i zostało niedawno usunięte, otrzymasz email z instrukcjami przywrócenia.',
      error: 'Nie udało się wysłać prośby o przywrócenie konta',
    },
    restore: {
      title: 'Przywróć swoje konto',
      subtitle: 'Kliknij poniżej, aby przywrócić swoje konto',
      button: 'Przywróć moje konto',
      restoring: 'Przywracanie...',
      success: 'Twoje konto zostało przywrócone! Możesz się teraz zalogować.',
      error:
        'Nie udało się przywrócić konta. Link mógł wygasnąć lub jest nieprawidłowy.',
      backToLogin: 'Powrót do logowania',
    },
  },

  // Notifications
  notifications: {
    title: 'Powiadomienia',
    subtitle: 'Zarządzaj powiadomieniami i bądź na bieżąco',
    loginRequired: 'Musisz być zalogowany, aby zobaczyć powiadomienia',
    refresh: 'Odśwież',
    markAllRead: 'Oznacz wszystkie jako przeczytane',
    all: 'Wszystkie',
    unread: 'Nieprzeczytane',
    read: 'Przeczytane',
    total: 'Wszystkie',
    markAsRead: 'Oznacz jako przeczytane',
    delete: 'Usuń',
    loadedAll: 'Wszystko załadowane',
    empty: {
      all: 'Brak powiadomień',
      unread: 'Brak nieprzeczytanych powiadomień',
      read: 'Brak przeczytanych powiadomień',
      description: 'Powiadomienia pojawią się tutaj, gdy coś się wydarzy',
      changeFilter: 'Zmień filtr, aby zobaczyć inne powiadomienia',
    },
    kinds: {
      INTENT_REMINDER: 'Przypomnienie o wydarzeniu',
      INTENT_UPDATED: 'Wydarzenie zaktualizowane',
      INTENT_CANCELED: 'Wydarzenie anulowane',
      INTENT_CREATED: 'Nowe wydarzenie',
      NEW_MESSAGE: 'Nowa wiadomość',
      NEW_COMMENT: 'Nowy komentarz',
      NEW_REVIEW: 'Nowa recenzja',
      MEMBER_JOINED: 'Nowy uczestnik',
      MEMBER_LEFT: 'Uczestnik opuścił',
      INVITE_RECEIVED: 'Otrzymano zaproszenie',
      default: 'Powiadomienie',
    },
  },

  // Favourites
  favourites: {
    title: 'Zapisane',
    subtitle: 'Twoje zapisane wydarzenia',
    savedEvents: 'zapisanych',
    savedEvent: 'wydarzenie',
    savedEventsPlural: 'wydarzenia',
    emptyTitle: 'Brak zapisanych wydarzeń',
    emptyDescription:
      'Przeglądaj wydarzenia i kliknij ikonę ❤️, aby zapisać interesujące wydarzenia na później.',
    browseEvents: 'Przeglądaj wydarzenia',
    loadMore: 'Załaduj więcej',
    loading: 'Ładowanie…',
    loadingFavourites: 'Ładowanie zapisanych wydarzeń...',
    removeFromFavourites: 'Usuń z zapisanych',
    viewEvent: 'Zobacz wydarzenie',
    participants: 'uczestników',
    showingEvents: 'Wyświetlanie',
  },

  // My Intents
  myIntents: {
    title: 'Moje wydarzenia',
    subtitle: 'Zarządzaj wszystkimi swoimi wydarzeniami w jednym miejscu',
    loading: 'Ładowanie...',
    notAuthenticated: 'Brak uwierzytelnienia',
    pleaseLogin: 'Zaloguj się, aby zobaczyć swoje wydarzenia',
    errorLoading: 'Błąd ładowania wydarzeń',
    noEvents: 'Brak wydarzeń',
    tryChangeFilters: 'Spróbuj zmienić filtry',
    noEventsYet: 'Nie masz jeszcze żadnych wydarzeń',
    clearFilters: 'Wyczyść wszystkie filtry',
    showing: 'Wyświetlanie',
    event: 'wydarzenie',
    events: 'wydarzeń',
    multipleSelectionAllowed: 'Możliwy wybór wielu opcji',
    filters: {
      role: 'Rola',
      status: 'Status',
      all: 'Filtry',
      owner: 'Właściciel',
      moderator: 'Moderator',
      member: 'Uczestnik',
      pending: 'Oczekujące',
      invited: 'Zaproszony',
      rejected: 'Odrzucony',
      banned: 'Zbanowany',
      waitlist: 'Lista oczekujących',
      upcoming: 'Nadchodzące',
      ongoing: 'Trwające',
      finished: 'Zakończone',
      canceled: 'Anulowane',
    },
    badges: {
      owner: 'WŁAŚCICIEL',
      moderator: 'MODERATOR',
      member: 'UCZESTNIK',
      joined: 'DOŁĄCZONY',
      pending: 'OCZEKUJE',
      invited: 'ZAPROSZONY',
      rejected: 'ODRZUCONY',
      banned: 'ZBANOWANY',
      left: 'OPUŚCIŁ',
      waitlist: 'LISTA OCZEKUJĄCYCH',
      live: 'NA ŻYWO',
      finished: 'ZAKOŃCZONE',
      canceled: 'ANULOWANE',
      deleted: 'USUNIĘTE',
    },
    actions: {
      manage: 'Zarządzaj',
      view: 'Zobacz',
      cancel: 'Anuluj',
      leave: 'Opuść',
      withdraw: 'Wycofaj',
      accept: 'Akceptuj',
      decline: 'Odrzuć',
    },
    messages: {
      requestRejected: 'Twoja prośba została odrzucona',
      youAreBanned: 'Zostałeś zbanowany w tym wydarzeniu',
    },
  },

  // Navigation
  nav: {
    dashboard: 'Panel',
    intents: 'Wydarzenia',
    account: 'Konto',
    settings: 'Ustawienia',
  },

  // Account Sidebar Navigation
  accountNav: {
    groups: {
      personal: 'Twój profil',
      activity: 'Wydarzenia i aktywność',
      communication: 'Komunikacja',
      billing: 'Subskrypcja i rozliczenia',
      tools: 'Zaawansowane narzędzia',
      settingsSupport: 'Ustawienia i wsparcie',
    },
    items: {
      viewProfile: 'Zobacz profil',
      editProfile: 'Edytuj profil',
      myEvents: 'Moje wydarzenia',
      favourites: 'Ulubione',
      chats: 'Czaty',
      notifications: 'Powiadomienia',
      subscription: 'Subskrypcja',
      plansAndBills: 'Plany i faktury',
      analytics: 'Analityka',
      settings: 'Ustawienia',
      cookieSettings: 'Ustawienia cookies',
      terms: 'Regulamin',
      privacy: 'Polityka prywatności',
      help: 'Pomoc',
      signOut: 'Wyloguj się',
    },
  },

  // Help & Support
  help: {
    title: 'Pomoc i wsparcie',
    subtitle: 'Uzyskaj pomoc dotyczącą swojego konta i wydarzeń',
    form: {
      title: 'Kontakt z pomocą techniczną',
      subtitle: 'Wypełnij formularz poniżej, a odpowiemy w ciągu 24 godzin',
      category: {
        label: 'Kategoria',
        placeholder: 'Wybierz kategorię...',
        account: 'Konto i profil',
        events: 'Wydarzenia i aktywności',
        billing: 'Rozliczenia i subskrypcja',
        technical: 'Problem techniczny',
        other: 'Inne',
      },
      subject: {
        label: 'Temat',
        placeholder: 'Krótki opis problemu',
      },
      message: {
        label: 'Wiadomość',
        placeholder: 'Opisz szczegółowo swój problem...',
      },
      responseTime: 'Zazwyczaj odpowiadamy w ciągu 24 godzin',
      submit: 'Wyślij wiadomość',
      sending: 'Wysyłanie...',
      success:
        'Twoja wiadomość została wysłana! Wkrótce się z Tobą skontaktujemy.',
      error: 'Proszę wypełnić wszystkie pola',
    },
    contact: {
      emailTitle: 'Wsparcie email',
      emailDescription: 'Wolisz email? Wyślij nam wiadomość bezpośrednio',
      faqTitle: 'Najczęstsze pytania',
      faqItems: {
        createEvent: 'Jak stworzyć wydarzenie?',
        manageSubscription: 'Zarządzanie subskrypcją',
        privacy: 'Prywatność i bezpieczeństwo',
        paymentIssues: 'Problemy z płatnościami',
      },
    },
  },

  // Cookie Settings
  cookies: {
    title: 'Ustawienia cookies',
    subtitle: 'Zarządzaj preferencjami cookies i ustawieniami prywatności',
    about: {
      title: 'O cookies',
      description:
        'Używamy plików cookie, aby poprawić Twoje wrażenia z korzystania z naszej witryny. Kliknij poniższy przycisk, aby dostosować swoje preferencje dotyczące plików cookie dla każdej kategorii.',
    },
    howItWorks: {
      title: 'Jak to działa',
      description:
        'Kliknij przycisk powyżej, aby otworzyć banner zgody na pliki cookie, w którym możesz zaakceptować, odrzucić lub dostosować swoje preferencje dla każdej kategorii.',
    },
    categoriesTitle: 'Kategorie plików cookie',
    clickManage:
      'Kliknij "Zarządzaj preferencjami cookies" powyżej, aby dostosować swoje wybory.',
    gdprCompliant: 'Zgodność z RODO i ePrivacy',
    gdprDescription:
      'Szanujemy Twoją prywatność i przestrzegamy przepisów RODO oraz ePrivacy. Masz pełną kontrolę nad swoimi preferencjami dotyczącymi plików cookie i możesz je zmienić w dowolnym momencie.',
    categories: {
      essential: {
        name: 'Niezbędne pliki cookie',
        description:
          'Te pliki cookie są niezbędne do działania witryny i nie można ich wyłączyć. Są one zazwyczaj ustawiane tylko w odpowiedzi na Twoje działania.',
        required: '(Wymagane)',
        examples: {
          session: 'Pliki cookie sesji',
          security: 'Tokeny bezpieczeństwa',
          loadBalancing: 'Równoważenie obciążenia',
        },
      },
      analytics: {
        name: 'Pliki cookie analityczne',
        description:
          'Te pliki cookie pozwalają nam liczyć wizyty i źródła ruchu, dzięki czemu możemy mierzyć i poprawiać wydajność naszej witryny.',
        examples: {
          googleAnalytics: 'Google Analytics',
          pageViews: 'Śledzenie wyświetleń stron',
          userBehavior: 'Zachowanie użytkowników',
        },
      },
      marketing: {
        name: 'Pliki cookie marketingowe',
        description:
          'Te pliki cookie mogą być ustawiane przez naszą witrynę przez naszych partnerów reklamowych. Mogą być używane do budowania profilu Twoich zainteresowań.',
        examples: {
          adTargeting: 'Targetowanie reklam',
          socialMedia: 'Piksele mediów społecznościowych',
          remarketing: 'Remarketing',
        },
      },
      preferences: {
        name: 'Pliki cookie preferencji',
        description:
          'Te pliki cookie umożliwiają witrynie zapewnienie ulepszonej funkcjonalności i personalizacji na podstawie Twoich interakcji.',
        examples: {
          language: 'Ustawienia języka',
          theme: 'Preferencje motywu',
          region: 'Ustawienia regionu',
        },
      },
    },
    actions: {
      manageCookies: 'Zarządzaj preferencjami cookies',
      acceptAll: 'Zaakceptuj wszystkie',
      rejectAll: 'Odrzuć wszystkie',
      savePreferences: 'Zapisz preferencje',
      saving: 'Zapisywanie...',
      saved: 'Ustawienia cookies zostały zapisane',
    },
  },

  // Analytics
  analytics: {
    title: 'Analityka',
    subtitle: 'Śledź wydajność i zaangażowanie w Twoich wydarzeniach',
    comingSoon: {
      title: 'Analityka już wkrótce',
      description:
        'Pracujemy nad szczegółową analityką dla Twoich wydarzeń. Śledź wyświetlenia, zaangażowanie i wiele więcej.',
      button: 'Już wkrótce',
    },
  },

  // Plans and Bills
  plansAndBills: {
    title: 'Plany i faktury',
    subtitle: 'Zarządzaj swoją subskrypcją i informacjami rozliczeniowymi',
    loading: 'Ładowanie informacji rozliczeniowych...',
    currentPlan: {
      title: 'Aktualny plan',
      renewsOn: 'Odnawia się',
      expiresOn: 'Wygasa',
      timeToRenewal: 'Czas do odnowienia',
      timeToExpiry: 'Czas do wygaśnięcia',
      daysRemaining: 'dni pozostało',
      day: 'dzień',
      days: 'dni',
      willRenewOn: 'Plan odnowi się',
      willExpireOn: 'Plan wygaśnie',
      planDetails: 'Szczegóły planu',
      type: 'Typ',
      subscription: 'Subskrypcja',
      oneTime: 'Jednorazowy',
      period: 'Okres',
      yearly: 'Roczny',
      monthly: 'Miesięczny',
      startDate: 'Data rozpoczęcia',
      renewal: 'Odnowienie',
      expiry: 'Wygaśnięcie',
      upgradePlan: 'Ulepsz plan',
      changePlan: 'Zmień plan',
      cancelSubscription: 'Anuluj subskrypcję',
    },
    paymentHistory: {
      title: 'Historia płatności',
      subtitle: 'Przeglądaj swoją historię rozliczeń i faktury',
      date: 'Data',
      description: 'Opis',
      amount: 'Kwota',
      status: 'Status',
      actionsColumn: 'Akcje',
      to: 'do',
      active: 'Aktywny',
      paid: 'Opłacone',
      pending: 'Oczekujące',
      failed: 'Nieudane',
      view: 'Zobacz',
      receipt: 'Faktura',
      noHistory: 'Brak historii płatności',
      noHistoryDescription: 'Gdy dokonasz płatności, pojawią się one tutaj.',
      plan: 'Plan',
      event: 'Wydarzenie',
      actionPackage: 'Pakiet akcji',
      actions: 'akcje',
    },
    cancelModal: {
      title: 'Anuluj subskrypcję',
      description:
        'Twoja subskrypcja pozostanie aktywna do końca bieżącego okresu rozliczeniowego.',
      confirmButton: 'Anuluj subskrypcję',
      cancelButton: 'Zachowaj subskrypcję',
    },
    toast: {
      cancelSuccess:
        'Subskrypcja zostanie anulowana na koniec okresu rozliczeniowego',
      cancelError: 'Nie udało się anulować subskrypcji',
      receiptNotAvailable: 'Faktura nie jest jeszcze dostępna',
      receiptError: 'Nie udało się pobrać faktury',
    },
  },

  // Terms of Service
  termsOfService: {
    title: 'Regulamin',
    subtitle: 'Zapoznaj się z naszymi warunkami świadczenia usług',
    downloadPdf: 'Pobierz PDF',
    selectLanguage: 'Wybierz język:',
    english: 'Angielski',
    polish: 'Polski',
    german: 'Niemiecki',
    lastUpdated: 'Ostatnia aktualizacja:',
    viewOnline: 'Zobacz online',
  },

  // Privacy Policy
  privacyPolicy: {
    title: 'Polityka prywatności',
    subtitle: 'Dowiedz się, jak chronimy Twoje dane',
    downloadPdf: 'Pobierz PDF',
    selectLanguage: 'Wybierz język:',
    english: 'Angielski',
    polish: 'Polski',
    german: 'Niemiecki',
    lastUpdated: 'Ostatnia aktualizacja:',
    viewOnline: 'Zobacz online',
  },

  // Events Filters
  eventsFilters: {
    // Panel
    title: 'Filtry',
    clearAll: 'Wyczyść',
    // Time Status
    timeStatus: 'Status czasu',
    any: 'Dowolny',
    upcoming: 'Nadchodzące',
    ongoing: 'W trakcie',
    past: 'Przeszłe',
    // Date Range
    dateRange: 'Zakres dat',
    dateRangeHint:
      'Własny zakres dat dostępny tylko gdy Status czasu = Dowolny',
    dateRangeDisabled: 'Wyłączony przez status czasu',
    startDate: 'Data początkowa',
    endDate: 'Data końcowa',
    // Presets
    nowPlus1h: 'Teraz +1h',
    tonight: 'Dziś wieczorem',
    tomorrow: 'Jutro',
    weekend: 'Weekend',
    next7days: 'Następne 7 dni',
    // Meeting Type
    meetingType: 'Tryb spotkania',
    onsite: 'Stacjonarne',
    online: 'Online',
    hybrid: 'Hybrydowe',
    // Level
    level: 'Poziom',
    beginner: 'Początkujący',
    intermediate: 'Średniozaawansowany',
    advanced: 'Zaawansowany',
    // Join Mode
    joinMode: 'Tryb dołączania',
    open: 'Otwarte',
    request: 'Na prośbę',
    inviteOnly: 'Tylko zaproszenia',
    // Organizer
    organizer: 'Organizator',
    verifiedOnly: 'Tylko zweryfikowani',
    verifiedHint: 'Pokaż tylko wydarzenia od zweryfikowanych organizatorów',
  },

  // Events Search (Top Drawer)
  eventsSearch: {
    title: 'Wyszukiwanie',
    searchLabel: 'Szukaj',
    searchPlaceholder: 'Szukaj tagów lub kategorii…',
    loadingPlaceholder: 'Ładowanie podpowiedzi…',
    tagsLabel: 'Tagi',
    categoriesLabel: 'Kategorie',
    locationLabel: 'Lokalizacja',
    locationPlaceholder: 'Wpisz miasto...',
    distanceLabel: 'Odległość',
    global: 'Globalnie',
    apply: 'Szukaj',
    close: 'Zamknij',
  },

  // Mobile Search Bar
  mobileSearch: {
    searchPlaceholder: 'Szukaj wydarzeń...',
    filters: 'Filtry',
  },

  // Subscription Plans
  subscriptionPlans: {
    title: 'Wybierz swój plan użytkownika',
    subtitle:
      'Ulepsz swoje konto, aby odblokować więcej funkcji i rozwijać swoje wydarzenia',
    billingTypes: {
      subscription: 'Subskrypcja',
      monthly: 'Miesięczna',
      yearly: 'Roczna',
      save20: 'Oszczędzaj 20%',
    },
    tooltips: {
      subscription:
        'Subskrypcja: Odnawia się automatycznie co 30 dni. Anuluj kiedy chcesz.',
      monthly:
        'Miesięczna: Płatność jednorazowa. Dostęp na 30 dni bez auto-odnowienia.',
      yearly:
        'Roczna: Płatność jednorazowa. Dostęp na 12 miesięcy. Oszczędzasz 20%!',
    },
    badges: {
      autoRenewal: 'Auto-renewal',
      noSubscription: 'No subscription',
      oneTimeCharge: 'One-time charge',
      mostPopular: 'NAJPOPULARNIEJSZY',
      activePlan: 'AKTYWNY PLAN',
    },
    priceLabels: {
      perMonth: '/ miesiąc',
      perYear: '/ rok',
      saveYearly: 'Oszczędzasz',
      yearly: 'rocznie',
    },
    buttons: {
      activePlan: 'Aktywny plan',
      freePlan: 'Plan podstawowy',
      selectPlan: 'Wybierz plan',
    },
    features: {
      included: 'Co zawiera',
      joinQuestions: 'Pytania przed dołączeniem',
      noJoinQuestions: 'Brak pytań przed dołączeniem',
    },
    infoBanner: {
      subscriptionNote:
        'Wszystkie plany subskrypcyjne można anulować w dowolnym momencie.',
      onetimeNote:
        'Wszystkie płatności jednorazowe są ostateczne. Wybierz plan najlepiej dopasowany do Twoich potrzeb.',
      important: 'Ważne:',
    },
  },
} as const;
