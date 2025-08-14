# Plan testów dla projektu: Sports Event Analyzer

## 1. Wprowadzenie i cele testowania
- Zapewnić wysoką jakość, bezpieczeństwo i dostępność aplikacji opartej o Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui, Supabase oraz integrację AI (groq.com).
- Zminimalizować regresje poprzez automatyzację i integrację testów w CI/CD (GitHub Actions).
- Zweryfikować zgodność z regułami projektu w `.windsurfrules`, wzorcami kodu oraz politykami RLS w bazie.

## 2. Zakres testów
- Frontend:
  - Strony w `src/pages/` (m.in. `index.astro`, `login.astro`, `logout.astro`, `new-password.astro`, `reset-password.astro`, foldery `dashboard/`, `events/`, `event/`, `analyses/`, `user/`).
  - Komponenty w `src/components/` (Astro statyczne, React dynamiczne, Shadcn/ui).
  - Style i dostępność (Tailwind 4).
- Logika aplikacyjna:
  - `src/lib/` (np. `services/`, `hooks/`, `validations/`, `utils.ts`) oraz walidacje Zod.
  - Middleware: `src/middleware/index.ts`, `src/middleware/auth.ts`.
- Backend/API:
  - Astro server endpoints w `src/pages/api/` (POST/GET, `export const prerender = false`).
  - Integracja z Supabase przez `Astro.locals.supabase` i typowanie z `src/db/supabase.client.ts`.
- Warstwa danych:
  - `src/db/` (typy, klient).
  - Migracje i konfiguracja w `supabase/` (`migrations/`, `config.toml`, `seed.sql`).
  - RLS, indeksy, relacje i JSONB w tabelach analitycznych.
- Dokumentacja:
  - Kontrakt API w `src/docs/` (np. `openapi.yaml`).
- Infrastruktura:
  - Skrypty i linting (`package.json`, `eslint.config.js`), CI (`.github/`).

## 3. Typy testów
- Testy jednostkowe:
  - Funkcje i moduły w `src/lib/` (utils, services, hooks).
  - Walidacje Zod (schematy wejść/wyjść).
- Testy komponentowe:
  - Komponenty React (Shadcn/ui) i Astro: rendering, stany, interakcje.
  - A11y: role, aria-*, focus management, dark mode.
- Testy integracyjne:
  - API w `src/pages/api/*` z Supabase (przez `Astro.locals.supabase`).
  - Middleware (`src/middleware/*`) – autoryzacja, przekierowania, nagłówki.
  - Przepływy UI → API → DB (CRUD, RLS).
- Testy E2E:
  - Krytyczne ścieżki: logowanie, reset hasła, nawigacja do dashboardu, tworzenie i przegląd analizy, przegląd wydarzeń i szczegółów.
- Testy kontraktowe API:
  - Zgodność odpowiedzi z `src/docs/openapi.yaml`.
- Testy wydajności:
  - Endpointy API i zapytania do DB (P95, przepustowość).
- Testy bezpieczeństwa:
  - RLS (select/insert/update/delete, anon vs authenticated).
  - Autentykacja/autoryzacja, ochrona tras, nagłówki bezpieczeństwa, CORS.
- Testy dostępności i jakości UI:
  - axe-core, Lighthouse (a11y, performance, best practices).
- Testy migracji DB:
  - Idempotentność, wsteczna kompatybilność, bezpieczeństwo zmian destrukcyjnych.

## 4. Scenariusze testowe dla kluczowych funkcjonalności
- Autentykacja:
  - Logowanie (`/login`): sukces, błędne dane, blokada konta (jeśli przewidziana), przekierowanie po zalogowaniu.
  - Reset hasła (`/reset-password`, `/new-password`): ważność tokenu, niespójne hasła, sukces, komunikaty błędów.
  - Wylogowanie (`/logout`): czyszczenie sesji, redirect.
- Ochrona tras i nawigacja:
  - Dostęp do `dashboard/`, `analyses/`, `events/`, `user/` tylko dla zalogowanych.
  - Middleware: poprawne 302/401/403, nagłówki, polityka cache.
- Analizy (domena):
  - Tworzenie analizy (API): walidacja Zod, zapis do `analysis` (JSONB), powiązanie z `analysis_types`, log w `analysis_logs` (JSONB).
  - Przegląd i filtrowanie analiz: paginacja, sortowanie, uprawnienia (tylko właściciel).
  - Logi systemowe w `logs` (JSONB): kompletność i maskowanie wrażliwych danych.
- Zdarzenia sportowe:
  - Lista (`events/`), szczegóły (`event/[id]`): tworzenie/edycja (jeśli dostępne), spójność danych, RLS.
- API:
  - Kody statusu (2xx/4xx/5xx), kontrakt zgodny z `openapi.yaml`, komunikaty błędów, CORS.
- Integracja AI (groq.com):
  - Brak/niepoprawny klucz API: kontrolowane błędy.
  - Timeout/retry/backoff, limity kosztowe, degradacja (fallback UI).
- A11y:
  - `aria-current` dla nawigacji, `aria-live` dla dynamicznych treści, `aria-expanded`/`aria-controls` dla rozwijanych sekcji.
  - Sterowanie klawiaturą (Tab, Escape), focus ring.

## 5. Środowisko testowe
- Node.js 22.14.0 (z `.nvmrc`), `npm`.
- Zmienne z `.env`/`.env.example` (Supabase, groq.com, URL-e).
- Supabase lokalnie (CLI/docker) z uruchomionymi `supabase/migrations/` i `seed.sql`.
- Aplikacja w trybie dev (`npm run dev`) i produkcyjnym (`npm run build && npm run start`).
- Dane testowe: użytkownicy, typy analiz, przykładowe wydarzenia/analizy, logi.

## 6. Narzędzia do testowania
- Jednostkowe/komponentowe/integracyjne: Vitest, @testing-library/react, @testing-library/dom, astro/test.
- E2E: Playwright (UI + API).
- Kontrakt API: Dredd lub Schemathesis (na `openapi.yaml`).
- Mocki: MSW (API/AI), ewentualnie Nock.
- Wydajność: k6 lub Artillery.
- Dostępność: axe-core, Lighthouse CI.
- Bezpieczeństwo: OWASP ZAP baseline scan.
- Jakość: ESLint, Prettier, TypeScript (`tsc --noEmit`).
- DB: Supabase CLI (migracje, polityki, smoke testy zapytań).

## 7. Harmonogram testów
- Na każdy PR (CI):
  - Lint, `tsc`, testy jednostkowe/komponentowe/integracyjne, szybki kontrakt API, a11y (axe), smoke E2E: login → dashboard → utworzenie/przegląd analizy.
- Nocne/tygodniowe:
  - Lighthouse, k6/Artillery, ZAP baseline, pełniejsze E2E na krytycznych ścieżkach.
- Przed releasem:
  - Pełne E2E, testy kontraktowe, migracje na czystej i zaktualizowanej bazie, RLS/indeksy, regresja a11y i wydajność.

## 8. Kryteria akceptacji testów
- Lint/TS: brak błędów krytycznych.
- Pokrycie: ≥ 90% dla `src/lib/services`, `src/lib/validations`, `src/pages/api/*`, `src/middleware/*`.
- E2E: 100% przejścia scenariuszy krytycznych (auth, dashboard, analizy, wydarzenia).
- Kontrakt API: 100% zgodności z `openapi.yaml`.
- RLS: brak dostępu między użytkownikami; wszystkie polityki przechodzą testy per operacja i rola.
- Wydajność: P95 < 300 ms dla krytycznych endpointów; brak regresji >10% względem poprzedniego releasu.
- A11y: brak błędów axe o najwyższej wadze; Lighthouse a11y ≥ 90.
- Migracje: przechodzą na czystej bazie i przy aktualizacji, bez utraty danych.

## 9. Role i odpowiedzialności
- QA Engineer: strategia i implementacja testów automatycznych, metryki jakości, triage defektów.
- Zespół Dev: testy jednostkowe/komponentowe, naprawy defektów, wsparcie integracji/E2E.
- Tech Lead: akceptacja kryteriów, przegląd wyników, decyzje release’owe.
- DevOps: utrzymanie CI/CD, tajemnice środowiskowe, artefakty raportowe (coverage, Lighthouse, k6).

## 10. Procedury raportowania błędów
- GitHub Issues:
  - Opis, kroki reprodukcji, expected vs actual, logi/konsola, zrzuty ekranu, commit/branch, środowisko.
  - Priorytety: P1 (blokujące), P2 (krytyczne), P3 (średnie), P4 (niskie).
  - Etykiety: `area/frontend`, `area/api`, `area/db`, `security`, `performance`, `a11y`.
- Triage per sprint, przypisania, SLA napraw.
- Retest po naprawie + dodanie testów regresyjnych.

## Wytyczne specyficzne dla projektu
- Astro/React:
  - Komponenty interaktywne w React, statyczne w Astro. Testy focus/klawiatura dla Shadcn/ui; dark mode i responsywność (Tailwind warianty).
- API:
  - Handlery POST/GET, `export const prerender = false`, walidacje Zod, spójne kody błędów i komunikaty użytkownika.
- Supabase:
  - Używać `Astro.locals.supabase` i typu z `src/db/supabase.client.ts`. Testy RLS per operacja (select/insert/update/delete) i rola (anon/authenticated).
  - Indeksy na FK i często filtrowanych kolumnach; testy planów zapytań i czasu odpowiedzi.
  - JSONB w `analysis`, `analysis_logs`, `logs`: walidacja schematów i ograniczanie wrażliwych pól w logach.
- AI (groq.com):
  - Obsługa błędów klucza/limitów/timeoutów; retry/backoff; brak wycieków w logach.
- CI/CD:
  - Gating na PR: fail testów blokuje merge; artefakty raportów (coverage, Lighthouse, k6) do wglądu.
- Dokumentacja:
  - Spójność implementacji z `src/docs/openapi.yaml`; każdy breaking change wymaga aktualizacji kontraktu i testów kontraktowych.
