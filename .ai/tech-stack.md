Frontend - Astro z React dla komponentów interaktywnych:
- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:
- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę groq.com:
- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

CI/CD i Hosting:
- Github Actions do tworzenia pipeline’ów CI/CD
- www.mydevil.net do hostowania aplikacji

Testy:
- Testy jednostkowe: Vitest, @testing-library/react, @testing-library/dom, astro/test
  - Konfiguracja: `vitest.config.ts` (środowisko `jsdom`, globalne asercje, setup: `tests/setup/vitest.setup.ts`)
  - Uruchamianie: `npm run test:unit` (pokrycie: `npm run test:coverage`)
- Testy E2E: Playwright (UI + API)
  - Konfiguracja: `playwright.config.ts` (uruchamia dev server automatycznie)
  - Pierwsze uruchomienie: `npx playwright install`
  - Uruchamianie: `npm run test:e2e` (tryb UI: `npm run test:e2e:ui`)
- Dodatkowo: MSW (mocki API/AI), ESLint, Prettier, TypeScript (`tsc --noEmit`), axe-core/Lighthouse (a11y), k6/Artillery (wydajność)
