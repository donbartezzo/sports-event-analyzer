# Architektura UI dla Sports Event Analyzer

## 1. Przegląd struktury UI

Struktura UI oparta jest na komponencie Astro z integracją React w celu zapewnienia interaktywności. Kluczowe widoki są budowane przy użyciu komponentów Shadcn/ui, co gwarantuje spójność wizualną i funkcjonalną. Interfejs uwzględnia mechanizmy zabezpieczeń poprzez odpowiednie walidatory (React Hook Form i Zod) oraz dba o dostępność zgodnie z wymaganiami ARIA.

## 2. Lista widoków

- **Ekran logowania**
  - Ścieżka: `/login`
  - Główny cel: Umożliwienie użytkownikowi zalogowania się do systemu.
  - Kluczowe informacje: Formularz logowania, komunikaty o błędach.
  - Kluczowe komponenty: Formularz logowania (React Hook Form, Zod), przyciski, pola input.
  - Uwagi UX/dostępność: Prosty, responsywny design, zgodność z ARIA, wizualne wskazówki dla błędnych pól.

- **Ekran resetu hasła**
  - Ścieżka: `/reset-password`
  - Główny cel: Umożliwienie użytkownikowi zresetowania hasła poprzez wprowadzenie adresu e-mail.
  - Kluczowe informacje: Formularz z polem e-mail, komunikaty walidacyjne.
  - Kluczowe komponenty: Formularz resetu hasła (React Hook Form, Zod), przyciski.
  - Uwagi UX/dostępność: Jasne komunikaty o błędach, prosty design, zgodność z ARIA.

- **Dashboard**
  - Ścieżka: `/dashboard`
  - Główny cel: Przegląd głównych funkcji i informacji dostępnych dla użytkownika.
  - Kluczowe informacje: Podsumowanie analiz, nadchodzących wydarzeń sportowych, powiadomienia.
  - Kluczowe komponenty: Pasek nawigacji, karty informacyjne, wykresy, listy skrótów.
  - Uwagi UX/dostępność: Intuicyjna nawigacja, responsywność, bezproblemowy dostęp dla osób niepełnosprawnych.

- **Widok listy analiz użytkownika**
  - Ścieżka: `/analyses/list`
  - Główny cel: Przedstawienie historii analiz wykonanych przez użytkownika.
  - Kluczowe informacje: Lista analiz, status analizy, daty utworzenia.
  - Kluczowe komponenty: Tabela lub lista elementów, filtry, opcje sortowania.
  - Uwagi UX/dostępność: Łatwość filtrowania, czytelność danych, optymalizacja pod kątem szybkości.

- **Widok listy nadchodzących wydarzeń sportowych**
  - Ścieżka: `/events/list`
  - Główny cel: Prezentacja kalendarza lub listy nadchodzących wydarzeń sportowych.
  - Kluczowe informacje: Data, godzina, opis wydarzenia, lokalizacja.
  - Kluczowe komponenty: Lista lub kalendarz, przyciski do filtrowania, widżety informacyjne.
  - Uwagi UX/dostępność: Intuicyjna orientacja w czasie, czytelność, responsywność.

- **Widok pojedynczego wydarzenia**
  - Ścieżka: `/event/card/:id`
  - Główny cel: Wyświetlenie szczegółowych informacji o wydarzeniu oraz możliwość uruchomienia analizy.
  - Kluczowe informacje: Szczegóły wydarzenia, wyniki analizy, historia interakcji.
  - Kluczowe komponenty: Szczegółowy widok z opisem, przycisk do generowania analizy, sekcja wyników analizy.
  - Uwagi UX/dostępność: Czytelność szczegółowych informacji, dostępność przycisków, potwierdzenia akcji.

- **Panel użytkownika**
  - Ścieżka: `/user/profile`
  - Główny cel: Zarządzanie danymi użytkownika i ustawieniami konta.
  - Kluczowe informacje: Informacje osobowe, ustawienia konta, historia aktywności.
  - Kluczowe komponenty: Formularze edycji, przyciski zapisu, sekcje informacyjne.
  - Uwagi UX/dostępność: Prostota edycji, wyraźne komunikaty o zapisaniu zmian, bezpieczeństwo danych.

## 3. Mapa podróży użytkownika

Przykładowy przepływ dla głównego przypadku użycia:
1. Użytkownik wchodzi na stronę logowania (`/login`).
2. Po poprawnym zalogowaniu zostaje przekierowany do dashboardu (`/dashboard`).
3. Na dashboardzie użytkownik ma widoczne opcje przejścia do listy analiz (`/analyses/list`) lub listy nadchodzących wydarzeń (`/events/list`).
4. Wybierając wydarzenie, użytkownik trafia do widoku szczegółowego (`/event/card/:id`), gdzie może rozpocząć analizę wydarzenia.
5. Użytkownik może przejść do panelu swojego konta (`/user/profile`) w celu aktualizacji danych.
6. W razie potrzeby użytkownik może przejść do ekranu resetu hasła (`/reset-password`).

## 4. Układ i struktura nawigacji

- Główna nawigacja umieszczona w dashboardzie, dostępna z każdej głównej sekcji strony.
- Menu boczne lub górne umożliwiające szybki dostęp do najważniejszych widoków: Dashboard, Analizy, Wydarzenia, Panel użytkownika.
- Widoczna informacja o aktualnej ścieżce (breadcrumb) ułatwiająca orientację.
- Mechanizmy dostępu i autoryzacji, w tym warstwy uwierzytelniania i autoryzacji oparte na Supabase Auth, gwarantujące bezpieczeństwo.

## 5. Kluczowe komponenty

- **Formularze**: Logowania, resetu hasła, edycji profilu - zintegrowane z React Hook Form i Zod.
- **Komponenty karty/informacyjne**: Prezentacja skrótowych informacji, wykresy, powiadomienia.
- **Nawigacja**: Pasek nawigacji, menu boczne, breadcrumb.
- **Widżety**: Listy, tabele, kalendarze, widgety dynamicznych danych.
- **Komponenty zabezpieczeń**: Elementy do zarządzania autoryzacją (np. ukrywanie funkcjonalności dla nieautoryzowanych użytkowników).
