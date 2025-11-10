# Panel Zarządzania - Quick Start

## 🚀 Jak używać

### Dla właściciela wydarzenia

1. **Wejdź na stronę swojego wydarzenia**

   ```
   https://twoja-domena.pl/intent/[id-wydarzenia]
   ```

2. **Znajdź panel zarządzania** w prawym sidebarze (między sekcją dołączania a akcjami)

3. **Dostępne akcje:**

   #### ✏️ Edytuj wydarzenie
   - Zmień tytuł, opis, datę
   - Zaktualizuj lokalizację
   - Zmień kategorie i tagi
   - Dostosuj ustawienia dołączania

   #### 👥 Zarządzaj uczestnikami
   - Zatwierdź/odrzuć wnioski o dołączenie
   - Awansuj uczestników na moderatorów
   - Wyrzuć lub zbanuj użytkowników
   - Zaproś nowych uczestników
   - Zobacz statystyki członkostwa

   #### ⚠️ Anuluj wydarzenie
   - Anuluj wydarzenie (odwracalne)
   - Uczestnicy zostaną powiadomieni
   - Możesz podać powód anulowania

   #### 🗑️ Usuń wydarzenie
   - **UWAGA:** Akcja nieodwracalna!
   - Trwałe usunięcie wszystkich danych
   - Użyj tylko w ostateczności

### Dla moderatora wydarzenia

1. **Wejdź na stronę wydarzenia**, w którym jesteś moderatorem

2. **Znajdź panel zarządzania** w prawym sidebarze

3. **Dostępne akcje:**

   #### 👥 Zarządzaj uczestnikami
   - Wszystkie funkcje jak właściciel
   - Nie możesz zmienić właściciela

   #### ⚠️ Anuluj wydarzenie
   - Możesz anulować wydarzenie
   - Wymaga potwierdzenia

   **Uwaga:** Nie możesz edytować ani usuwać wydarzenia.

## 📱 Responsywność

Panel działa na wszystkich urządzeniach:

### Desktop (> 1024px)

```
┌────────────────┬──────────────┐
│                │ Join Section │
│   Główna       ├──────────────┤
│   treść        │ Admin Panel  │
│                ├──────────────┤
│                │   Actions    │
└────────────────┴──────────────┘
```

### Tablet (768px - 1024px)

```
┌────────────────┬──────────────┐
│                │ Join Section │
│   Główna       │ Admin Panel  │
│   treść        │   Actions    │
└────────────────┴──────────────┘
```

### Mobile (< 768px)

```
┌────────────────┐
│   Główna       │
│   treść        │
├────────────────┤
│ Join Section   │
├────────────────┤
│ Admin Panel    │
├────────────────┤
│   Actions      │
└────────────────┘
```

## 🎨 Wygląd panelu

### Light Mode

```
╔════════════════════════════════════╗
║ ⚙️  Panel zarządzania              ║
╠════════════════════════════════════╣
║ ✏️  Edytuj wydarzenie              ║
║ 👥  Zarządzaj uczestnikami     [3] ║
║ ⚠️  Anuluj wydarzenie              ║
║ 🗑️  Usuń wydarzenie                ║
╚════════════════════════════════════╝
```

### Dark Mode

```
╔════════════════════════════════════╗
║ ⚙️  Panel zarządzania              ║
╠════════════════════════════════════╣
║ ✏️  Edytuj wydarzenie              ║
║ 👥  Zarządzaj uczestnikami     [3] ║
║ ⚠️  Anuluj wydarzenie              ║
║ 🗑️  Usuń wydarzenie                ║
╚════════════════════════════════════╝
```

## 🔔 Licznik oczekujących

Jeśli są oczekujące wnioski o dołączenie, zobaczysz licznik:

```
👥  Zarządzaj uczestnikami     [5 oczekujących]
```

## ⚡ Szybkie akcje

### Edycja wydarzenia

1. Klik "Edytuj wydarzenie"
2. Modal się otwiera z wypełnionymi danymi
3. Zmień co chcesz
4. Klik "Zapisz"
5. Dane automatycznie się odświeżą

### Zarządzanie uczestnikami

1. Klik "Zarządzaj uczestnikami"
2. Modal z zakładkami:
   - **Członkowie** - lista wszystkich uczestników
   - **Oczekujący** - wnioski do zatwierdzenia
   - **Zaproszeni** - wysłane zaproszenia
   - **Zbanowani** - zbanowani użytkownicy
3. Wykonaj akcje na uczestnikach
4. Zamknij modal - dane się odświeżą

### Anulowanie wydarzenia

1. Klik "Anuluj wydarzenie"
2. Potwierdzenie: "Czy na pewno?"
3. Klik "Tak, anuluj"
4. Modal sukcesu
5. Wydarzenie oznaczone jako anulowane

### Usuwanie wydarzenia

1. Klik "Usuń wydarzenie"
2. **Ostrzeżenie:** "Akcja nieodwracalna!"
3. Klik "Tak, usuń"
4. Modal sukcesu
5. Wydarzenie trwale usunięte

## 🛡️ Bezpieczeństwo

### Kto widzi panel?

- ✅ Właściciel wydarzenia
- ✅ Moderatorzy wydarzenia
- ❌ Zwykli uczestnicy
- ❌ Niezalogowani użytkownicy

### Kto może co?

| Akcja                  | Właściciel | Moderator | Uczestnik |
| ---------------------- | ---------- | --------- | --------- |
| Edytować               | ✅         | ❌        | ❌        |
| Zarządzać uczestnikami | ✅         | ✅        | ❌        |
| Anulować               | ✅         | ✅        | ❌        |
| Usuwać                 | ✅         | ❌        | ❌        |

## 💡 Wskazówki

### ✅ Dobre praktyki

- Zawsze podawaj powód przy anulowaniu
- Sprawdź oczekujące wnioski regularnie
- Używaj moderatorów do pomocy w zarządzaniu
- Usuwaj tylko w ostateczności

### ⚠️ Ostrzeżenia

- Usunięcie jest nieodwracalne
- Anulowanie powiadamia wszystkich uczestników
- Banowanie użytkownika jest trwałe dla tego wydarzenia
- Zmiana właściciela przenosi wszystkie uprawnienia

## 🐛 Rozwiązywanie problemów

### Nie widzę panelu zarządzania

- ✓ Sprawdź czy jesteś właścicielem lub moderatorem
- ✓ Odśwież stronę
- ✓ Sprawdź czy jesteś zalogowany

### Przycisk jest nieaktywny

- ✓ Sprawdź status wydarzenia (anulowane/usunięte)
- ✓ Sprawdź swoje uprawnienia
- ✓ Sprawdź połączenie internetowe

### Modal się nie otwiera

- ✓ Sprawdź konsolę przeglądarki
- ✓ Odśwież stronę
- ✓ Wyczyść cache przeglądarki

### Dane się nie odświeżają

- ✓ Poczekaj kilka sekund
- ✓ Odśwież stronę ręcznie
- ✓ Sprawdź połączenie internetowe

## 📞 Wsparcie

Jeśli masz problemy z panelem zarządzania:

1. Sprawdź tę dokumentację
2. Sprawdź `EVENT_DETAIL_ADMIN_PANEL.md` dla szczegółów technicznych
3. Zgłoś problem do zespołu deweloperskiego

## 🎓 Przykłady użycia

### Scenariusz 1: Zatwierdzanie uczestników

```
1. Otwórz "Zarządzaj uczestnikami"
2. Przejdź do zakładki "Oczekujący"
3. Przejrzyj profile użytkowników
4. Klik "Zatwierdź" lub "Odrzuć"
5. Użytkownik zostanie powiadomiony
```

### Scenariusz 2: Awansowanie moderatora

```
1. Otwórz "Zarządzaj uczestnikami"
2. Znajdź zaufanego uczestnika
3. Klik menu (⋮) przy jego nazwie
4. Wybierz "Awansuj na moderatora"
5. Potwierdź akcję
6. Użytkownik otrzyma uprawnienia moderatora
```

### Scenariusz 3: Zmiana daty wydarzenia

```
1. Klik "Edytuj wydarzenie"
2. Zmień datę rozpoczęcia i zakończenia
3. Zapisz zmiany
4. Uczestnicy zostaną automatycznie powiadomieni
```

### Scenariusz 4: Anulowanie z powodu pogody

```
1. Klik "Anuluj wydarzenie"
2. W polu powodu wpisz: "Złe warunki pogodowe"
3. Potwierdź anulowanie
4. Wszyscy uczestnicy otrzymają powiadomienie
```

## 🔗 Powiązane dokumenty

- `EVENT_DETAIL_ADMIN_PANEL.md` - Szczegółowa dokumentacja techniczna
- `EVENT_ADMIN_PANEL_SUMMARY.md` - Podsumowanie implementacji
- `apps/web/src/app/account/intents/page.tsx` - Strona zarządzania kontami (podobny flow)
