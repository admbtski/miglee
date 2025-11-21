# Miglee Design System

## Layout Standards

### Container Widths

**Standard:** Wszystkie strony używają `max-w-6xl` (72rem / 1152px)

```tsx
<div className="container mx-auto max-w-6xl px-4 py-6">{children}</div>
```

### Spacing

- **Container padding:** `px-4 py-6`
- **Section spacing:** `space-y-8` (główne sekcje)
- **Content spacing:** `space-y-6` (wewnątrz sekcji)
- **Element spacing:** `space-y-4` (małe elementy)

### Colors

#### Backgrounds

- **Primary bg:** `bg-zinc-50 dark:bg-zinc-950`
- **Card bg:** `bg-white/95 dark:bg-[#141518]/80`
- **Secondary bg:** `bg-zinc-100 dark:bg-zinc-900`

#### Text

- **Primary:** `text-zinc-900 dark:text-zinc-100`
- **Secondary:** `text-zinc-600 dark:text-zinc-400`
- **Muted:** `text-zinc-500 dark:text-zinc-500`

#### Borders

- **Primary:** `border-zinc-200 dark:border-zinc-800`
- **Secondary:** `border-zinc-300 dark:border-zinc-700`

### Cards & Containers

#### Standard Card

```tsx
<div className="rounded-3xl border border-zinc-200 bg-white/95 shadow-sm ring-1 ring-black/5 dark:border-zinc-700 dark:bg-[#141518]/80 backdrop-blur-[2px] p-4 sm:p-6 lg:p-8">
  {content}
</div>
```

#### Sidebar Card (dla account, admin)

```tsx
<aside className="rounded-3xl border border-zinc-200 bg-white/90 shadow-sm ring-1 ring-black/5 dark:border-zinc-700 dark:bg-zinc-900/70 backdrop-blur-[2px] p-2 sm:p-3">
  {navigation}
</aside>
```

### Typography

#### Headings

- **H1:** `text-3xl font-bold tracking-tight`
- **H2:** `text-2xl font-semibold`
- **H3:** `text-xl font-semibold`
- **H4:** `text-lg font-medium`

#### Body

- **Large:** `text-base`
- **Normal:** `text-sm`
- **Small:** `text-xs`

### Buttons

#### Primary

```tsx
<button className="rounded-xl px-8 py-3 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg hover:shadow-xl hover:from-indigo-500 hover:to-violet-500 transition-all">
  Action
</button>
```

#### Secondary

```tsx
<button className="rounded-xl border px-6 py-3 text-sm font-medium border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 shadow-sm hover:shadow">
  Action
</button>
```

### Forms

#### Input

```tsx
<input className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
```

#### Label

```tsx
<label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
  Label
</label>
```

### Animations

#### Transitions

- **Standard:** `transition-all duration-300`
- **Fast:** `transition-all duration-150`
- **Slow:** `transition-all duration-500`

#### Hover Effects

- **Scale:** `hover:scale-[1.02] active:scale-[0.98]`
- **Shadow:** `hover:shadow-lg`
- **Opacity:** `hover:opacity-90`

## Page Structure Templates

### Standard Page (bez sidebar)

```tsx
<div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
  <Navbar />
  <div className="container mx-auto max-w-6xl px-4 py-6">
    <main className="rounded-3xl border border-zinc-200 bg-white/95 shadow-sm ring-1 ring-black/5 dark:border-zinc-700 dark:bg-[#141518]/80 backdrop-blur-[2px] p-4 sm:p-6 lg:p-8">
      {content}
    </main>
  </div>
</div>
```

### Page z Sidebar (account, admin)

```tsx
<div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
  <Navbar />
  <div className="container mx-auto max-w-6xl px-4 py-6 grid gap-4 md:gap-6 md:grid-cols-[minmax(220px,240px)_1fr]">
    <aside className="rounded-3xl border border-zinc-200 bg-white/90 shadow-sm ring-1 ring-black/5 dark:border-zinc-700 dark:bg-zinc-900/70 backdrop-blur-[2px] p-2 sm:p-3">
      {sidebar}
    </aside>
    <main className="rounded-3xl border border-zinc-200 bg-white/95 shadow-sm ring-1 ring-black/5 dark:border-zinc-700 dark:bg-[#141518]/80 backdrop-blur-[2px] p-4 sm:p-6 lg:p-8">
      {content}
    </main>
  </div>
</div>
```

### Full Width Page (strona główna, mapa)

```tsx
<div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
  <Navbar />
  {content}
</div>
```

## Responsive Breakpoints

- **Mobile:** < 768px
- **Tablet:** 768px - 1023px
- **Desktop:** ≥ 1024px

### Responsive Patterns

```tsx
// Padding
px-4 sm:px-6 lg:px-8

// Grid
grid-cols-1 md:grid-cols-2 lg:grid-cols-3

// Text
text-sm sm:text-base lg:text-lg

// Spacing
space-y-4 md:space-y-6 lg:space-y-8
```

## Accessibility

### Focus States

```tsx
focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
```

### ARIA Labels

- Zawsze dodawaj `aria-label` do przycisków bez tekstu
- Używaj `aria-describedby` dla pól formularzy
- Dodawaj `role="main"` do głównej treści

## Dark Mode

### Zasady

1. Wszystkie kolory muszą mieć wariant dark:
2. Używaj `dark:` prefix dla wszystkich klas kolorów
3. Testuj w obu trybach przed commitem

### Przykład

```tsx
className = 'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100';
```

## Migration Checklist

Przy aktualizacji istniejącej strony:

- [ ] Zmień max-width na `max-w-6xl`
- [ ] Dodaj `container mx-auto`
- [ ] Ujednolić padding na `px-4 py-6`
- [ ] Sprawdź karty - `rounded-3xl` + shadows
- [ ] Sprawdź kolory tła i tekstu
- [ ] Sprawdź przyciski - rounded-xl
- [ ] Sprawdź spacing - space-y-6/8
- [ ] Sprawdź typography - font sizes
- [ ] Testuj dark mode
- [ ] Testuj responsive
