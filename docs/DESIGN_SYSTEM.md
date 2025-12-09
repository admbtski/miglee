# Miglee Design System

Ten dokument opisuje zasady designu i spójności wizualnej stosowane w projekcie Miglee.

## Spis treści

- [Kolory i motyw](#kolory-i-motyw)
- [Typografia](#typografia)
- [Spacing](#spacing)
- [Borders i Shadows](#borders-i-shadows)
- [Komponenty](#komponenty)
- [Animacje](#animacje)
- [Internacjonalizacja (i18n)](#internacjonalizacja-i18n)
- [Dostępność (a11y)](#dostępność-a11y)
- [Wzorce UI](#wzorce-ui)

---

## Kolory i motyw

### Akcenty

| Rola          | Klasa Tailwind             | Użycie                            |
| ------------- | -------------------------- | --------------------------------- |
| **Primary**   | `indigo-600`, `indigo-500` | CTA buttons, active states, links |
| **Secondary** | `violet-*`, `purple-*`     | Gradienty, highlights             |
| **Success**   | `emerald-*`, `green-*`     | Pozytywne akcje, sukces           |
| **Warning**   | `amber-*`, `yellow-*`      | Ostrzeżenia                       |
| **Error**     | `red-*`, `rose-*`          | Błędy, destructive actions        |
| **Info**      | `sky-*`, `blue-*`          | Informacje                        |

### Neutralne kolory

Używamy skali **Zinc** dla wszystkich neutralnych kolorów:

```
zinc-50  → Najjaśniejsze tło (light mode)
zinc-100 → Tła sekcji, hover states
zinc-200 → Borders (light mode)
zinc-300 → Disabled states
zinc-400 → Placeholder text
zinc-500 → Helper text
zinc-600 → Secondary text
zinc-700 → Body text
zinc-800 → Borders (dark mode)
zinc-900 → Tła (dark mode), primary text (light)
zinc-950 → Najciemniejsze tło (dark mode)
```

### Dark Mode

- Zawsze używaj prefixu `dark:` dla stylów dark mode
- Tło główne: `bg-zinc-50 dark:bg-zinc-950`
- Tło kart: `bg-white dark:bg-zinc-900`
- Tekst: `text-zinc-900 dark:text-zinc-100`
- Borders: `border-zinc-200 dark:border-zinc-800`

---

## Typografia

### Hierarchia rozmiarów

| Rola              | Klasa                   | Przykład użycia      |
| ----------------- | ----------------------- | -------------------- |
| **Page title**    | `text-2xl font-bold`    | Nagłówki stron       |
| **Section title** | `text-xl font-semibold` | Tytuły sekcji        |
| **Card title**    | `text-lg font-semibold` | Nagłówki kart        |
| **Body**          | `text-base`             | Główna treść         |
| **Secondary**     | `text-sm`               | Opisy, meta info     |
| **Helper/Small**  | `text-xs`               | Etykiety, timestamps |

### Line height

- Body text: `leading-relaxed`
- Headings: domyślne (tight)

### Font weight

- `font-bold` - nagłówki stron
- `font-semibold` - tytuły sekcji, przyciski
- `font-medium` - etykiety, linki
- domyślny (400) - body text

---

## Spacing

### Padding

| Element       | Klasy                    |
| ------------- | ------------------------ |
| **Sekcje**    | `py-6`, `py-8`           |
| **Karty**     | `p-4`, `p-5`, `p-6`      |
| **Przyciski** | `px-4 py-2`, `px-6 py-3` |
| **Inputy**    | `px-4 py-3`              |

### Gap

| Kontekst     | Klasy            |
| ------------ | ---------------- |
| **Tight**    | `gap-1`, `gap-2` |
| **Standard** | `gap-3`, `gap-4` |
| **Loose**    | `gap-6`, `gap-8` |

### Zasady

- ❌ Unikaj dziwnych wartości: `mt-7`, `px-[13px]`
- ✅ Używaj standardowych wartości z skali Tailwind
- ✅ Zachowuj spójność w podobnych komponentach

---

## Borders i Shadows

### Border radius

| Element                      | Klasa          | Wartość |
| ---------------------------- | -------------- | ------- |
| **Przyciski, małe elementy** | `rounded-xl`   | 12px    |
| **Karty, modale**            | `rounded-2xl`  | 16px    |
| **Duże karty, hero**         | `rounded-3xl`  | 24px    |
| **Avatary, badges**          | `rounded-full` | 50%     |

### Borders

```css
/* Light mode */
border-zinc-200

/* Dark mode */
dark:border-zinc-800

/* Subtelniejsze */
border-zinc-200/60
dark:border-zinc-800/60
```

### Shadows

| Użycie       | Klasa        |
| ------------ | ------------ |
| **Subtle**   | `shadow-sm`  |
| **Cards**    | `shadow-md`  |
| **Elevated** | `shadow-lg`  |
| **Modals**   | `shadow-2xl` |

---

## Komponenty

### Przyciski

#### Primary Button

```tsx
<button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-4 py-2 shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
  Action
</button>
```

#### Secondary Button

```tsx
<button className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
  Secondary
</button>
```

#### Danger Button

```tsx
<button className="bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl px-4 py-2 shadow-sm transition-colors">
  Delete
</button>
```

### Karty

```tsx
<div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
  {/* Content */}
</div>
```

### Inputy

```tsx
<input
  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
  placeholder="Enter value..."
/>
```

### Badges

```tsx
// Success
<span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
  Active
</span>

// Warning
<span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
  Pending
</span>

// Error
<span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
  Error
</span>
```

---

## Animacje

### Długość animacji

- **Micro interactions**: 150ms
- **Standard transitions**: 200ms
- **Complex animations**: 250-300ms

### Klasy transition

```css
transition-colors    /* Tylko kolory */
transition-all       /* Wszystkie properties */
transition-transform /* Scale, translate */
```

### Framer Motion

Używaj Framer Motion dla:

- Modali i overlays
- List animations
- Page transitions
- Complex gestures

```tsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 10 }}
  transition={{ duration: 0.2 }}
>
```

### Loadery

```tsx
<Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
```

---

## Internacjonalizacja (i18n)

### Oznaczanie tekstu do tłumaczenia

Każdy hardcoded string widoczny dla użytkownika powinien być oznaczony:

```tsx
// TODO i18n: opis co wymaga tłumaczenia

// Przykład:
// TODO i18n: Button labels need translation keys
<button>Zapisz zmiany</button>
```

### Formatowanie dat

Daty wymagają locale-aware formatting:

```tsx
// TODO i18n: date formatting should be locale-aware
{
  format(date, 'PPP', { locale: pl });
}
```

### Nawigacja

Zawsze używaj `localePath()` dla wewnętrznych linków:

```tsx
import { useLocalePath } from '@/hooks/use-locale-path';

const { localePath } = useLocalePath();

// ✅ Poprawnie
<Link href={localePath('/account/settings')}>Settings</Link>

// ❌ Niepoprawnie
<Link href="/account/settings">Settings</Link>
```

### Link vs anchor

- `<Link>` z Next.js dla wewnętrznych linków
- `<a>` tylko dla zewnętrznych linków z `target="_blank"` i `rel="noopener noreferrer"`

---

## Dostępność (a11y)

### Aria labels

Zawsze dodawaj `aria-label` do icon buttons:

```tsx
<button aria-label="Close menu" title="Close menu">
  <X className="h-5 w-5" />
</button>
```

### Focus states

- ❌ Nie usuwaj focus outlines bez replacement
- ✅ Używaj `focus-visible:ring-2 focus-visible:ring-indigo-500`

```tsx
<button className="... focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
```

### Semantic HTML

Używaj odpowiednich elementów:

- `<button>` dla akcji
- `<a>` / `<Link>` dla nawigacji
- `<nav>` dla nawigacji
- `<main>` dla głównej treści
- `<aside>` dla sidebars
- `<header>` / `<footer>` dla nagłówka i stopki

### Role attributes

Dla custom components:

```tsx
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Modal Title</h2>
</div>
```

---

## Wzorce UI

### Empty States

```tsx
<div className="flex flex-col items-center justify-center text-center py-12">
  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
    <Icon className="h-8 w-8 text-zinc-400" />
  </div>
  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
    No results
  </h3>
  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-md">
    Description text here
  </p>
</div>
```

### Loading States

```tsx
// Full page loader
<div className="flex items-center justify-center min-h-[60vh]">
  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
</div>

// Inline loader
<button disabled className="... opacity-60">
  <Loader2 className="h-4 w-4 animate-spin mr-2" />
  Saving...
</button>
```

### Error States

```tsx
<div className="rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-6">
  <div className="flex items-start gap-3">
    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
    <div>
      <h4 className="font-semibold text-red-900 dark:text-red-100">
        Error title
      </h4>
      <p className="mt-1 text-sm text-red-800 dark:text-red-200">
        Error description
      </p>
    </div>
  </div>
</div>
```

### Info Banners

```tsx
<div className="rounded-xl border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50 dark:bg-indigo-900/20 p-4">
  <div className="flex items-start gap-3">
    <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
    <p className="text-sm text-indigo-800 dark:text-indigo-200">
      Information message
    </p>
  </div>
</div>
```

---

## Checklist dla nowych komponentów

- [ ] Używam spójnych kolorów z design systemu
- [ ] Stosuje poprawne rozmiary typografii
- [ ] Spacing jest zgodny z zasadami
- [ ] Border radius jest spójny
- [ ] Dark mode jest zaimplementowany
- [ ] Animacje są płynne (150-250ms)
- [ ] Hardcoded strings są oznaczone `// TODO i18n`
- [ ] Daty są oznaczone jako wymagające locale-aware formatting
- [ ] Wewnętrzne linki używają `localePath()`
- [ ] Icon buttons mają `aria-label`
- [ ] Focus states są dostępne
- [ ] Używam semantic HTML

---

_Ostatnia aktualizacja: Grudzień 2024_
