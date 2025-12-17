export const EVENT_PLAN_PRICES = {
  free: 0,
  plus: 14.99, // STRIPE_PRICE_EVENT_PLUS
  pro: 29.99, // STRIPE_PRICE_EVENT_PRO
} as const;

export const USER_PLAN_PRICES = {
  free: {
    monthlySubscription: 0,
    monthlyOnetime: 0,
    annualOnetime: 0,
  },
  plus: {
    monthlySubscription: 29.99, // STRIPE_PRICE_USER_PLUS_MONTHLY_SUB
    monthlyOnetime: 35.99, // STRIPE_PRICE_USER_PLUS_MONTHLY_ONEOFF
    annualOnetime: 359.99, // STRIPE_PRICE_USER_PLUS_YEARLY_ONEOFF
  },
  pro: {
    monthlySubscription: 69.99, // STRIPE_PRICE_USER_PRO_MONTHLY_SUB
    monthlyOnetime: 83.99, // STRIPE_PRICE_USER_PRO_MONTHLY_ONEOFF
    annualOnetime: 839.99, // STRIPE_PRICE_USER_PRO_YEARLY_ONEOFF
  },
} as const;

export const EVENT_PLAN_FEATURES = {
  FREE: [
    'Tworzenie wydarzeń stacjonarnych i online',
    'Do 10 uczestników',
    'Podstawowe zarządzanie wydarzeniem',
    'Brak chatu grupowego',
    'Brak podbić',
    'Brak lokalnych powiadomień',
    'Brak analityki',
    'Brak wydarzeń hybrydowych',
    'Brak formularzy dołączenia',
    'Brak współorganizatorów',
  ],
  PLUS: [
    '✅ Wszystko z Free',
    'Brak limitu uczestników',
    'Chat grupowy',
    'Wydarzenia hybrydowe (onsite + online)',
    'Badge „Promowane"',
    'Wyróżniony kafelek na stronie głównej',
    '1 podbicie wydarzenia',
    '1 lokalne powiadomienie push',
    'Formularze dołączenia (Join Forms)',
    'Formularze obecności / Check-in',
    'Dostęp do narzędzi zarządzania grupą',
    'Nieograniczona liczba współorganizatorów',
    'Przyjazna SEO strona wydarzenia',
    'Podstawowa analityka',
    'Wsparcie premium społeczności',
  ],
  PRO: [
    '✅ Wszystko z Plus',
    '3 podbicia wydarzenia',
    '3 lokalne powiadomienia push',
    'Zaawansowana analityka (trendy, źródła ruchu, aktywność)',
    'Narzędzia do komunikacji masowej (broadcasty, ogłoszenia)',
    'Opłaty za bilety (ticketing)',
    'Zaawansowane narzędzia organizatora',
    'Priorytetowa widoczność w listingu',
    'Pełny chat grupowy + narzędzia moderacji',
    'Zaawansowane formularze dołączenia',
    'Eksperckie wsparcie premium',
  ],
} as const;

export const EVENT_PLAN_DESCRIPTIONS = {
  FREE: 'Podstawowy plan wydarzenia',
  PLUS: 'Dla aktywnych organizatorów',
  PRO: 'Dla profesjonalnych organizatorów',
} as const;

export const USER_PLAN_FEATURES = {
  FREE: [
    'Tworzenie wydarzeń stacjonarnych i online',
    'Do 3 aktywnych wydarzeń',
    'Do 10 uczestników na wydarzenie',
    'Publiczne wydarzenia (brak prywatnych)',
    'Brak chatu grupowego',
    'Brak pytań przed dołączeniem',
    'Brak formularzy obecności',
    'Brak hybrydowych wydarzeń',
    'Brak analityki',
    'Brak współorganizatorów',
    'Brak możliwości prowadzenia ticketingu',
    'Podstawowe notyfikacje systemowe',
    'Podstawowy profil użytkownika',
  ],
  PLUS: [
    '✅ Wszystko z FREE',
    'Brak limitu aktywnych wydarzeń',
    'Brak limitu uczestników',
    'Chat grupowy dla uczestników wydarzeń',
    'Prywatne i ukryte wydarzenia',
    'Wydarzenia hybrydowe (onsite + online)',
    'Pytania przed dołączeniem',
    'Formularze obecności (check-in)',
    'Ankiety po wydarzeniu',
    'Współorganizatorzy (dowolna liczba)',
    'Priorytet w whitelistingu',
    'Wyróżnienie kafelka i szczegółów wydarzenia',
    'Dostęp do podstawowej analityki wydarzeń',
    'SEO-friendly event pages',
    'Zarządzanie członkami wydarzenia (role, moderate tools)',
    'Wsparcie premium społeczności',
  ],
  PRO: [
    '✅ Wszystko z PLUS',
    'Zaawansowana analityka wydarzeń i społeczności',
    'Narzędzia do komunikacji masowej (broadcasty)',
    'Priorytetowa widoczność w listingu',
    'Ticketing (wkrótce)',
    'Zaawansowany check-in (wkrótce)',
    'Zaawansowane narzędzia organizatora',
    'Lepszy priorytet promocji wydarzeń',
    'Pełny dostęp do wszystkich funkcji społecznościowych',
    'Eksperckie wsparcie premium',
  ],
} as const;

export const USER_PLAN_DESCRIPTIONS = {
  FREE: 'Darmowy plan użytkownika',
  PLUS: 'Więcej możliwości, zero limitów',
  PRO: 'Profesjonalne narzędzia dla dużych społeczności',
} as const;

export const USER_PLAN_AUDIENCES = {
  FREE: 'Idealny dla małych, kameralnych spotkań i nowych użytkowników',
  PLUS: 'Dla aktywnych organizatorów, którzy regularnie tworzą wydarzenia',
  PRO: 'Dla organizatorów, którzy potrzebują pełnej kontroli, narzędzi analitycznych i automatyzacji',
} as const;

export const PLAN_SCOPE_NOTICE =
  'Plan użytkownika określa funkcje dostępne dla **nowo tworzonych wydarzeń**. Istniejące wydarzenia zachowują swoje obecne ustawienia.';

export const PLAN_SCOPE_NOTICE_EXTENDED =
  '💡 **Ważne:** Zmiana planu użytkownika ma zastosowanie tylko do **nowo utworzonych wydarzeń**. Twoje istniejące wydarzenia zachowają swoje obecne funkcje i limity. Aby ulepszyć konkretne wydarzenie, użyj planów sponsorowania w zarządzaniu wydarzeniem.';

export const EVENT_SPONSORSHIP_LIFETIME_NOTICE =
  'Plan sponsorship dla wydarzenia jest aktywny przez cały cykl życia eventu. Upgrade jest możliwy. Dokupienie podbić i pushów jest możliwe. Downgrade jest niemożliwy.';

export const ACTIONS_NEVER_EXPIRE =
  '💡 Akcje nigdy nie wygasają. Możesz ich używać w dowolnym momencie.';

export const SOCIAL_PROOF_RELOAD =
  '📊 Najczęściej kupowane: doładowanie akcji po pierwszym tygodniu wydarzenia.';
