# Features Structure - Miglee Web App

## 📁 Obecna Struktura Features

### ✅ Ukończone Features

#### 1. **`account`** - Zarządzanie kontem użytkownika
- **Lokalizacja**: `src/features/account/`
- **Zawartość**:
  - API: user preferences, delete/restore account
  - Komponenty: profile tabs, settings, sidebar, navigation
- **Używane w**: `app/[locale]/account/*`

#### 2. **`admin`** - Panel administracyjny
- **Lokalizacja**: `src/features/admin/`
- **Zawartość**:
  - API: admin events, users, comments
  - Komponenty: admin header, sidebar, KPI cards
- **Używane w**: `app/[locale]/admin/*`

#### 3. **`agenda`** - Agenda wydarzeń
- **Lokalizacja**: `src/features/agenda/`
- **Zawartość**:
  - API: agenda operations
  - Komponenty: event agenda display
- **Używane w**: Event details, event management

#### 4. **`auth`** - Autentykacja
- **Lokalizacja**: `src/features/auth/`
- **Zawartość**:
  - Hooks: auth state management
  - Komponenty: sign in/up panels, auth modals
- **Używane w**: Cała aplikacja

#### 5. **`billing`** - Rozliczenia (core)
- **Lokalizacja**: `src/features/billing/`
- **Zawartość**:
  - API: billing operations
  - Hooks: plan access checks
  - Constants: billing constants
  - Utils: currency formatting
- **Rozszerzone przez**: `subscription` feature

#### 6. **`categories`** - Kategorie wydarzeń
- **Lokalizacja**: `src/features/categories/`
- **Zawartość**:
  - API: categories CRUD
  - Types: category options
- **Używane w**: Event creation, filters, admin

#### 7. **`chat`** - System czatu
- **Lokalizacja**: `src/features/chat/`
- **Zawartość**:
  - API: DM, event chat, reactions, subscriptions
  - Komponenty: chat thread, message bubble, reactions
  - Hooks: chat instances, message actions
  - Types: chat types
- **Używane w**: Event details, account/chats

#### 8. **`checkin`** ✨ NOWY
- **Lokalizacja**: `src/features/checkin/`
- **Zawartość**:
  - API: checkin operations
  - Komponenty: QR codes, scanner, checkin management
- **Używane w**: 
  - `app/[locale]/checkin/user/`
  - `app/[locale]/checkin/event/[id]/`
  - `app/[locale]/event/[id]/manage/checkin/`

#### 9. **`comments`** - Komentarze
- **Lokalizacja**: `src/features/comments/`
- **Zawartość**:
  - API: comments CRUD
  - Komponenty: event comments, report modal
- **Używane w**: Event details, admin

#### 10. **`event-creation`** ✨ NOWY
- **Lokalizacja**: `src/features/event-creation/`
- **Zawartość**:
  - Komponenty: creator form, steps, providers
  - Hooks: event form, auto-save draft
- **Używane w**: `app/[locale]/event/new/`

#### 11. **`event-management`** ✨ NOWY
- **Lokalizacja**: `src/features/event-management/`
- **Zawartość**:
  - Komponenty: management navbar, sidebar, guards, layout
- **Używane w**: `app/[locale]/event/[id]/manage/*`

#### 12. **`events`** - Wydarzenia (core)
- **Lokalizacja**: `src/features/events/`
- **Zawartość**:
  - API: events queries, mutations, members, permissions
  - Komponenty: event cards, detail views, actions, modals
  - Hooks: permissions, subscriptions, modals
  - Types: event types, form types, details
  - Utils: formatters, status, join state
- **Uwaga**: Duży feature, zawiera discovery + details
- **Używane w**: Cała aplikacja

#### 13. **`faq`** ✨ NOWY
- **Lokalizacja**: `src/features/faq/`
- **Zawartość**:
  - Komponenty: FAQ display, management client
- **Używane w**: Event details, event management

#### 14. **`favourites`** - Ulubione
- **Lokalizacja**: `src/features/favourites/`
- **Zawartość**:
  - API: favourites operations
  - Komponenty: favourite card, bell
  - Types: favourite types
- **Używane w**: Account, event cards

#### 15. **`feedback`** - Feedback po wydarzeniu
- **Lokalizacja**: `src/features/feedback/`
- **Zawartość**:
  - API: feedback operations
- **Używane w**: `app/[locale]/feedback/[eventId]/`

#### 16. **`invite-links`** - Linki zaproszeniowe
- **Lokalizacja**: `src/features/invite-links/`
- **Zawartość**:
  - API: invite links CRUD
  - Komponenty: invite links panel
- **Używane w**: Event management, invite pages

#### 17. **`join-form`** - Formularze dołączania
- **Lokalizacja**: `src/features/join-form/`
- **Zawartość**:
  - API: join form operations
  - Komponenty: join question form, request modal
- **Używane w**: Event details, event management

#### 18. **`maps`** - Mapy i lokalizacje
- **Lokalizacja**: `src/features/maps/`
- **Zawartość**:
  - API: map clusters
  - Komponenty: map preview
  - Hooks: places autocomplete
  - Utils: geocoding, Google Maps helpers
- **Używane w**: Event creation, discovery, details

#### 19. **`notifications`** - Powiadomienia
- **Lokalizacja**: `src/features/notifications/`
- **Zawartość**:
  - API: notifications, preferences, mutes
  - Komponenty: notification item, bell
- **Używane w**: Navbar, account

#### 20. **`reports`** ✨ ROZSZERZONY
- **Lokalizacja**: `src/features/reports/`
- **Zawartość**:
  - API: reports operations
  - Komponenty: report modals (event, comment, chat, user)
- **Używane w**: Cała aplikacja (reporting)

#### 21. **`reviews`** ✨ NOWY
- **Lokalizacja**: `src/features/reviews/`
- **Zawartość**:
  - API: reviews CRUD, stats
  - Komponenty: review cards, stats, modals
- **Używane w**: Event details, feedback, admin

#### 22. **`search`** ✨ NOWY
- **Lokalizacja**: `src/features/search/`
- **Zawartość**:
  - Komponenty: search bars, filters, sort controls
  - Hooks: filter state, committed filters, query variables
- **Używane w**: Events discovery, my events

#### 23. **`subscription`** ✨ NOWY
- **Lokalizacja**: `src/features/subscription/`
- **Zawartość**:
  - Komponenty: subscription plans, checkout, billing
  - Re-exports: billing API, hooks, constants
- **Używane w**: `app/[locale]/account/subscription/`, `app/[locale]/account/plans-and-bills/`

#### 24. **`tags`** - Tagi
- **Lokalizacja**: `src/features/tags/`
- **Zawartość**:
  - API: tags operations
  - Hooks: use-tags
  - Types: tag options
- **Używane w**: Event creation, filters, admin

#### 25. **`theme`** - Motywy
- **Lokalizacja**: `src/features/theme/`
- **Zawartość**:
  - Components: theme switch
  - Provider: theme provider
  - Scripts: inline theme script
- **Używane w**: Layout, settings

#### 26. **`users`** - Użytkownicy
- **Lokalizacja**: `src/features/users/`
- **Zawartość**:
  - API: user profile, blocks, events, reviews
  - Komponenty: public profile, tabs, report modal
- **Używane w**: Public profiles, admin

---

## 🎯 Rekomendacje Dalszego Refactoringu

### Priorytet 1: Rozdziel `events` feature

Feature `events` jest zbyt duży. Proponowany podział:

#### A. **`event-discovery`** (nowy)
- Komponenty: events-list, event-card, map components
- Hooks: infinite query, location mode
- Discovery-specific logic

#### B. **`event-details`** (nowy)  
- Komponenty: event-detail-client, event-hero, event-details
- Public view components
- Detail-specific logic

#### C. **`events`** (zostaje jako core)
- API: queries, mutations
- Shared types
- Core utilities

### Priorytet 2: Dodatkowe features do wydzielenia

#### **`analytics`**
- Z: `app/[locale]/account/analytics/`, `app/[locale]/event/[id]/manage/analytics/`
- Komponenty: analytics dashboards, stats

#### **`appearance`**
- Z: `app/[locale]/event/[id]/manage/appearance/`
- Komponenty: cover management, branding

#### **`boost`**
- Z: `app/[locale]/event/[id]/manage/boost/`
- Komponenty: event promotion, sponsorship

#### **`cookie-consent`**
- Z: `components/cookie-consent/`
- Cookie management

#### **`legal`**
- Z: `app/[locale]/account/{terms,privacy,help}/`
- Legal pages, PDFs

#### **`media`**
- Z: `lib/media/`, `components/ui/image-crop-modal`
- Media upload, processing

#### **`profile-public`**
- Z: `app/[locale]/u/[name]/`
- Public user profiles (oddzielnie od account)

#### **`restore-account`**
- Z: `app/[locale]/restore-account/`
- Account restoration

#### **`sharing`**
- Z: `components/ui/share-*`
- Social sharing

---

## 📋 Zasady Organizacji Features

### Struktura każdego feature:
```
features/
  nazwa-feature/
    ├── api/          # GraphQL queries, mutations, hooks
    ├── components/   # Komponenty UI
    ├── hooks/        # Custom hooks
    ├── types/        # TypeScript types
    ├── utils/        # Utility functions
    ├── constants/    # Stałe
    └── index.ts      # Public exports
```

### Zasady:
1. ✅ **Self-contained**: Każdy feature jest niezależny
2. ✅ **Public API**: Eksportuj tylko przez `index.ts`
3. ✅ **No circular deps**: Unikaj cyklicznych zależności
4. ✅ **Domain-based**: Podział według domeny biznesowej
5. ✅ **Shared UI**: Komponenty ogólne w `components/ui`

---

## 🔄 Status Migracji

### ✅ Ukończone (8 nowych features):
- `checkin`
- `account`
- `event-creation`
- `event-management`
- `search`
- `subscription`
- `reviews`
- `faq`

### 🔧 Rozszerzone:
- `reports` (dodano wszystkie report modals)

### ⏳ Do zrobienia:
- Rozdzielenie `events` na `event-discovery` + `event-details`
- Dodanie pozostałych features z Priorytetu 2

---

**Data utworzenia**: 2025-12-16
**Autor**: AI Assistant + abartski

