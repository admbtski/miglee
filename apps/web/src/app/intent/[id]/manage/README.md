# Intent Management System

System zarządzania wydarzeniami (intent management) z dedykowanym interfejsem dla uprawnionych użytkowników.

## Struktura

```
/intent/[id]/manage/
├── layout.tsx                    # Layout z sidebarem i topbarem
├── page.tsx                      # Dashboard (główna strona)
├── view/                         # Podgląd wydarzenia
├── members/                      # Zarządzanie członkami
├── chat/                         # Zarządzanie czatem
├── analytics/                    # Analityka wydarzenia
├── moderation/                   # Moderacja treści
├── settings/                     # Ustawienia wydarzenia
└── _components/                  # Komponenty zarządzania
    ├── intent-management-sidebar.tsx
    ├── intent-management-navbar.tsx
    ├── intent-management-mobile-sidebar.tsx
    ├── intent-management-guard.tsx
    ├── intent-management-provider.tsx
    └── intent-management-dashboard.tsx
```

## Uprawnienia dostępu

Interfejs zarządzania jest dostępny dla:

1. **Owner wydarzenia** - pełny dostęp
2. **Moderator wydarzenia** - pełny dostęp
3. **Admin aplikacji** - pełny dostęp (globalny)
4. **Moderator aplikacji** - pełny dostęp (globalny)

Zwykli użytkownicy i uczestnicy widzą standardowy widok wydarzenia.

## Komponenty

### IntentManagementGuard

Komponent sprawdzający uprawnienia użytkownika. Automatycznie przekierowuje nieuprawnionych użytkowników na stronę wydarzenia.

```tsx
<IntentManagementGuard intentId={id}>{children}</IntentManagementGuard>
```

### IntentManagementProvider

Kontekst dostarczający dane wydarzenia do komponentów zarządzania.

```tsx
const { intent, isLoading } = useIntentManagement();
```

### IntentManagementSidebar

Zwijany sidebar z nawigacją dla zarządzania wydarzeniem.

Funkcje:

- Zwijanie/rozwijanie (280px ↔ 80px)
- Nawigacja między sekcjami
- Wyświetlanie tytułu wydarzenia
- Link powrotu do wydarzenia

### IntentManagementNavbar

Górny pasek nawigacyjny (podobny do `/account/`).

Funkcje:

- Powiadomienia i akcje użytkownika (NavbarActions)
- Przycisk menu mobilnego
- Sticky positioning
- Backdrop blur effect

### IntentManagementMobileSidebar

Mobilny drawer z nawigacją.

Funkcje:

- Slide-in animation
- Pełna lista nawigacji
- Automatyczne zamykanie przy zmianie trasy
- Backdrop overlay

## Hook: useIntentPermissions

Hook sprawdzający uprawnienia użytkownika dla wydarzenia.

```tsx
const permissions = useIntentPermissions(intent);

// Dostępne pola:
permissions.canManage; // Czy może zarządzać
permissions.isOwner; // Czy jest właścicielem
permissions.isModerator; // Czy jest moderatorem
permissions.isParticipant; // Czy jest uczestnikiem
permissions.isAppAdmin; // Czy jest adminem aplikacji
permissions.isAppModerator; // Czy jest moderatorem aplikacji
permissions.isLoading; // Stan ładowania
```

## Strony zarządzania

### Dashboard (`/manage`)

- Przegląd statystyk wydarzenia
- Szybkie akcje
- Informacje o wydarzeniu

### View Event (`/manage/view`)

- Podgląd publicznego widoku wydarzenia
- Widok taki sam jak dla zwykłych użytkowników
- Link do otwarcia w nowej karcie

### Members (`/manage/members`)

- Lista członków
- Filtrowanie po rolach
- Zarządzanie rolami i uprawnieniami

### Settings (`/manage/settings`)

- Ustawienia ogólne
- Prywatność
- Ustawienia członków
- Ustawienia czatu
- Strefa niebezpieczna (cancel/delete)

### Analytics (`/manage/analytics`)

- Statystyki wydarzenia
- Wykresy i metryki

### Chat (`/manage/chat`)

- Zarządzanie czatem wydarzenia
- Moderacja wiadomości

### Moderation (`/manage/moderation`)

- Moderacja treści
- Raporty
- Akcje moderacyjne

## Routing

```
/intent/[id]                    # Standardowy widok wydarzenia
/intent/[id]/manage             # Dashboard zarządzania (wymaga uprawnień)
/intent/[id]/manage/view        # Podgląd wydarzenia
/intent/[id]/manage/members     # Zarządzanie członkami
/intent/[id]/manage/chat        # Zarządzanie czatem
/intent/[id]/manage/analytics   # Analityka
/intent/[id]/manage/moderation  # Moderacja
/intent/[id]/manage/settings    # Ustawienia
```

## Bezpieczeństwo

1. **Guard na poziomie layoutu** - sprawdza uprawnienia przed renderowaniem
2. **Automatyczne przekierowanie** - nieuprawnionych użytkowników przekierowuje na stronę wydarzenia
3. **Weryfikacja po stronie API** - wszystkie mutacje są dodatkowo weryfikowane na backendzie

## Przykład użycia

```tsx
// Strona zarządzania
export default async function ManagePage({ params }: PageProps) {
  const { id } = await params;

  return <IntentManagementDashboard intentId={id} />;
}
```

## Stylowanie

Komponenty używają:

- Tailwind CSS
- Dark mode support
- Responsywny design
- Animacje przejść

## Rozwój

Aby dodać nową sekcję zarządzania:

1. Utwórz folder w `/manage/[nazwa]/`
2. Dodaj `page.tsx` z komponentem
3. Dodaj link w `intent-management-sidebar.tsx`
4. Dodaj metadata w `generateMetadata`
