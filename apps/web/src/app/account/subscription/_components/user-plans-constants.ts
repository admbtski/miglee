/**
 * User Plans Constants
 * Shared configuration for user subscription plans
 */

export const USER_PLAN_FEATURES = {
  FREE: [
    'Tworzenie wydarzeń stacjonarnych i online',
    'Do 3 aktywnych wydarzeń',
    'Do 10 uczestników na wydarzenie',
    'Publiczne wydarzenia (brak prywatnych)',
    'Brak chatu grupowego',
    'Brak join forms',
    'Brak formularzy obecności',
    'Brak hybrydowych wydarzeń (onsite + online)',
    'Brak analityki',
    'Brak współorganizatorów',
    'Brak możliwości prowadzenia ticketingu',
    'Podstawowe notyfikacje systemowe',
    'Podstawowy profil użytkownika',
  ],
  PLUS: [
    'Wszystko z FREE',
    'Brak limitu aktywnych wydarzeń',
    'Brak limitu uczestników',
    'Chat grupowy dla uczestników wydarzeń',
    'Prywatne i ukryte wydarzenia',
    'Wydarzenia hybrydowe (onsite + online)',
    'Join Forms — formularze dołączenia z pytaniami',
    'Formularze obecności (check-in)',
    'Współorganizatorzy (dowolna liczba)',
    'Lepsza pozycja w listingu',
    'Podstawowa analityka wydarzeń (odwiedziny, dołączenia, opuszczenia)',
    'SEO-friendly event pages',
    'Zarządzanie członkami wydarzenia (role, moderate tools)',
    'Wsparcie premium społeczności',
  ],
  PRO: [
    'Wszystko z PLUS',
    'Zaawansowana analityka wydarzeń i społeczności (trendy, źródła ruchu, heatmapy)',
    'Narzędzia do komunikacji masowej (broadcasty)',
    'Priorytetowa widoczność w listingu',
    'Ticketing — możliwość sprzedaży biletów poprzez Stripe',
    'Zaawansowane narzędzia organizatora (automatyzacje, powiadomienia cykliczne)',
    'Lepszy priorytet promocji wydarzeń',
    'Pełny dostęp do wszystkich funkcji społecznościowych',
    'Eksperckie wsparcie premium',
    'Dostęp do API i webhooków (opcjonalnie)',
    'Tryb wysoka prywatność (widoczność adresu dopiero po dołączeniu)',
  ],
} as const;

/**
 * Shortened features list for checkout panel
 */
export const USER_PLAN_FEATURES_SHORT = {
  PLUS: [
    'Wszystko z FREE',
    'Brak limitu aktywnych wydarzeń i uczestników',
    'Chat grupowy + wydarzenia hybrydowe',
    'Join Forms i formularze obecności',
    'Podstawowa analityka',
    'SEO-friendly strony wydarzeń',
    'Wsparcie premium',
  ],
  PRO: [
    'Wszystko z PLUS',
    'Zaawansowana analityka (trendy, źródła ruchu)',
    'Narzędzia komunikacji masowej (broadcasty)',
    'Ticketing — sprzedaż biletów przez Stripe',
    'Priorytetowa widoczność w listingu',
    'Dostęp do API i webhooków',
    'Eksperckie wsparcie premium',
  ],
} as const;

/**
 * Important notice about plan application scope
 */
export const PLAN_SCOPE_NOTICE =
  '💡 **Ważne:** Plan ma zastosowanie do nowo tworzonych wydarzeń. Istniejące wydarzenia zachowują obecne funkcje.' as const;

export const PLAN_SCOPE_NOTICE_EXTENDED =
  'Zmiana planu użytkownika ma zastosowanie tylko do nowo utworzonych wydarzeń. Twoje istniejące wydarzenia zachowają swoje obecne funkcje i limity. Aby ulepszyć konkretne wydarzenie, użyj planów sponsorowania w zarządzaniu wydarzeniem.' as const;
