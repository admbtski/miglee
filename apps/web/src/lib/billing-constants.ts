/**
 * Shared billing constants for both user plans and event sponsorships
 */

// ========================================================================================
// PLAN TYPES
// ========================================================================================

export type UserPlanType = 'free' | 'plus' | 'pro';
export type EventPlanType = 'free' | 'plus' | 'pro';
export type BillingType =
  | 'monthly-subscription'
  | 'monthly-onetime'
  | 'annual-onetime';

// ========================================================================================
// PRICING (in PLN)
// ========================================================================================

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

// ========================================================================================
// EVENT SPONSORSHIP FEATURES
// ========================================================================================

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

// ========================================================================================
// USER PLAN FEATURES
// ========================================================================================

export const USER_PLAN_FEATURES = {
  FREE: [
    'Tworzenie wydarzeń stacjonarnych i online',
    'Do 3 aktywnych wydarzeń',
    'Do 10 uczestników na wydarzenie',
    'Publiczne wydarzenia (brak prywatnych)',
    'Brak chatu grupowego',
    'Brak join forms',
    'Brak formularzy obecności',
    'Brak hybrydowych wydarzeń',
    'Brak analityki',
    'Brak współorganizatorów',
    'Brak możliwości prowadzenia ticketingu',
    'Brak narzędzi do automatycznej komunikacji',
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
    'Join Forms — formularze dołączenia z pytaniami',
    'Formularze obecności (check-in)',
    'Współorganizatorzy (dowolna liczba)',
    'Lepsza pozycja w listingu',
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
    'Ticketing — możliwość sprzedaży biletów poprzez Stripe',
    'Zaawansowane narzędzia organizatora',
    'Lepszy priorytet promocji wydarzeń',
    'Pełny dostęp do wszystkich funkcji społecznościowych',
    'Eksperckie wsparcie premium',
    'Dostęp do API i webhooków (opcjonalnie)',
    'Tryb wysoka prywatność',
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

// ========================================================================================
// COMMON MESSAGES
// ========================================================================================

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

// ========================================================================================
// BOOST/PUSH LIMITS
// ========================================================================================

export const EVENT_PLAN_LIMITS = {
  FREE: { boosts: 0, pushes: 0 },
  PLUS: { boosts: 1, pushes: 1 },
  PRO: { boosts: 3, pushes: 3 },
} as const;

// ========================================================================================
// PLAN ICONS & COLORS
// ========================================================================================

export const PLAN_COLORS = {
  free: 'zinc',
  plus: 'indigo',
  pro: 'amber',
} as const;

export const PLAN_COLOR_CLASSES = {
  free: {
    bg: 'bg-zinc-50 dark:bg-zinc-900',
    text: 'text-zinc-900 dark:text-zinc-50',
    border: 'border-zinc-200 dark:border-zinc-800',
    icon: 'text-zinc-600 dark:text-zinc-400',
  },
  plus: {
    bg: 'bg-indigo-50 dark:bg-indigo-950',
    text: 'text-indigo-900 dark:text-indigo-50',
    border: 'border-indigo-200 dark:border-indigo-800',
    icon: 'text-indigo-600 dark:text-indigo-400',
  },
  pro: {
    bg: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900',
    text: 'text-amber-900 dark:text-amber-50',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-600 dark:text-amber-400',
  },
} as const;
