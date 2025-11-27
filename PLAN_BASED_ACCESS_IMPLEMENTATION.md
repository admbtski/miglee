# Plan-Based Feature Access Implementation Guide

## Overview

System kontroli dostępu do funkcji oparty na planach sponsorowania wydarzeń (Free/Plus/Pro).

## Komponenty

### 1. PlanRequiredGuard

Komponent ochronny który sprawdza czy użytkownik ma dostęp do funkcji na podstawie planu.

**Lokalizacja**: `apps/web/src/app/intent/[id]/manage/_components/plan-required-guard.tsx`

**Props**:

- `currentPlan`: 'free' | 'plus' | 'pro' - obecny plan wydarzenia
- `requiredPlan`: 'plus' | 'pro' - wymagany plan
- `featureName`: string - nazwa funkcji (dla wyświetlenia)
- `featureDescription?`: string - opis funkcji
- `intentId`: string - ID wydarzenia
- `children`: ReactNode - chroniona zawartość

### 2. usePlanAccess Hook

Helper hook do sprawdzania dostępu.

**Lokalizacja**: `apps/web/src/hooks/use-plan-access.ts`

## Wymagania planów

| Funkcja      | Plan wymagany | Badge w sidebar |
| ------------ | ------------- | --------------- |
| Analytics    | PRO           | 🟡 PRO          |
| Join Form    | PLUS          | 🔵 PLUS         |
| Feedback     | PLUS          | 🔵 PLUS         |
| Invite Links | PLUS          | 🔵 PLUS         |

## Implementacja

### Krok 1: Dodaj badge w sidebarze

W `intent-management-sidebar.tsx` i `intent-management-mobile-sidebar.tsx`:

```typescript
{
  id: 'feature-name',
  label: 'Feature Name',
  href: `/intent/${intentId}/manage/feature-name`,
  icon: FeatureIcon,
  requiredPlan: 'plus', // lub 'pro'
}
```

Badge pojawi się automatycznie obok nazwy funkcji.

### Krok 2: Utwórz wrapper komponent

Stwórz `_components/feature-panel-wrapper.tsx` w katalogu funkcji:

```typescript
'use client';

import { useIntentManagement } from '../../_components/intent-management-provider';
import { PlanRequiredGuard } from '../../_components/plan-required-guard';

interface FeaturePanelWrapperProps {
  intentId: string;
  children: React.ReactNode;
}

export function FeaturePanelWrapper({
  intentId,
  children,
}: FeaturePanelWrapperProps) {
  const { intent, isLoading } = useIntentManagement();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-4 rounded-full animate-spin border-zinc-200 border-t-indigo-600" />
          <p className="mt-4 text-sm text-zinc-600">Ładowanie...</p>
        </div>
      </div>
    );
  }

  const currentPlan = (intent?.sponsorshipPlan?.toLowerCase() || 'free') as
    | 'free'
    | 'plus'
    | 'pro';

  return (
    <PlanRequiredGuard
      currentPlan={currentPlan}
      requiredPlan="plus" // lub "pro"
      featureName="Nazwa funkcji"
      featureDescription="Opis funkcji i korzyści z planu."
      intentId={intentId}
    >
      {children}
    </PlanRequiredGuard>
  );
}
```

### Krok 3: Użyj wrappera w page.tsx

```typescript
import { notFound } from 'next/navigation';
import { FeaturePanelWrapper } from './_components/feature-panel-wrapper';

export default async function FeaturePage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <FeaturePanelWrapper intentId={id}>
      {/* Twoja normalna zawartość strony */}
      <div className="space-y-6">
        <h1>Feature Title</h1>
        {/* ... */}
      </div>
    </FeaturePanelWrapper>
  );
}
```

## Przykład: Analytics (PRO)

**Plik**: `apps/web/src/app/intent/[id]/manage/analytics/page.tsx`

Pełna implementacja z plan guardem dla funkcji wymagającej planu PRO.

## Zachowanie

### Gdy użytkownik MA dostęp:

- ✅ Strona działa normalnie
- ✅ Badge w sidebarze pokazuje wymagany plan (ale nie blokuje)
- ✅ Pełna funkcjonalność dostępna

### Gdy użytkownik NIE MA dostępu:

- 🔒 Pokazuje ekran z informacją o wymaganym planie
- 💰 Przyciski CTA prowadzące do zakupu planu
- 🎯 Link do strony planów: `/intent/${intentId}/manage/plans`
- ↩️ Link powrotu do dashboardu
- ℹ️ Dodatkowe informacje o planie

## Wygląd ekranu blokady

Ekran zawiera:

1. **Ikonę zamka** w gradientowym kole (indigo dla Plus, amber dla Pro)
2. **Badge planu** z ikoną (Sparkles dla Plus, Crown dla Pro)
3. **Tytuł funkcji**
4. **Opis** dlaczego ta funkcja jest wartościowa
5. **Info o aktualnym planie** użytkownika
6. **Przycisk CTA** - "Wykup plan Plus/Pro" lub "Ulepsz do Pro"
7. **Przycisk powrotu** do dashboardu
8. **Dodatkowe linki** (subskrypcja, itp.)

## Kolory i ikony

### Plan PLUS

- Kolor: Indigo gradient (`from-indigo-600 to-indigo-500`)
- Ikona: ✨ Sparkles
- Tekst: "WYMAGA PLUS"

### Plan PRO

- Kolor: Amber gradient (`from-amber-500 to-amber-600`)
- Ikona: 👑 Crown
- Tekst: "WYMAGA PRO"

## Best Practices

1. **Zawsze dodawaj wartościowy opis** - wyjaśnij użytkownikowi DLACZEGO warto wykupić plan
2. **Użyj konkretnych korzyści** - nie tylko "wymaga Pro", ale "zaawansowana analityka, trendy..."
3. **Test w różnych stanach** - sprawdź jak wygląda dla Free, Plus i Pro
4. **Spójność messaging** - używaj tych samych sformułowań co w planach
5. **Mobile-first** - guard działa responsywnie

## TODO: Funkcje do zaimplementowania

- [ ] Join Form page (PLUS)
- [ ] Feedback page (PLUS)
- [ ] Invite Links page (PLUS)

Każda z tych stron powinna używać tego samego wzorca co Analytics.
