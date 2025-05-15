# Specyfikacja architektury modułu autentykacji

## 1. Architektura interfejsu użytkownika

### 1.1. Struktura stron i komponentów

#### Strony Astro (server-side)
- `/src/pages/login.astro` - strona logowania
- `/src/pages/reset-password.astro` - strona inicjacji resetowania hasła
- `/src/pages/new-password.astro` - strona ustawiania nowego hasła
- `/src/pages/logout.astro` - strona wylogowania (przekierowanie)

#### Komponenty React (client-side)
- `/src/components/LoginForm.tsx` - formularz logowania
- `/src/components/ResetPasswordForm.tsx` - formularz resetowania hasła
- `/src/components/NewPasswordForm.tsx` - formularz nowego hasła
- `/src/components/AuthGuard.tsx` - komponent zabezpieczający strony wymagające autentykacji

#### Layouty
- `/src/layouts/AuthLayout.astro` - layout dla stron autoryzacji (logowanie, reset hasła)
- Modyfikacja `/src/layouts/MainLayout.astro` - dodanie obsługi stanu autentykacji

### 1.2. Przepływ użytkownika i walidacja

#### Logowanie (US-001)
1. Formularz logowania zawiera:
   - Pole email (walidacja: format email)
   - Pole hasło (walidacja: min. 8 znaków)
   - Przycisk "Zaloguj"
   - Link "Zapomniałem hasła"

2. Obsługa błędów:
   - Niepoprawny email/hasło
   - Konto nie istnieje
   - Problemy z połączeniem

#### Reset hasła (US-005)
1. Formularz resetowania:
   - Pole email (walidacja: format email)
   - Przycisk "Wyślij link"

2. Formularz nowego hasła:
   - Pole nowe hasło (walidacja: min. 8 znaków)
   - Pole potwierdzenie hasła
   - Przycisk "Ustaw hasło"

3. Obsługa błędów:
   - Email nie istnieje w systemie
   - Link resetujący wygasł/jest niepoprawny
   - Hasła nie są identyczne

### 1.3. Bezpieczeństwo UI (US-006)
- Automatyczne wylogowanie po czasie bezczynności
- Blokada wielokrotnych prób logowania
- Walidacja CSRF dla formularzy
- Bezpieczne przechowywanie tokenu sesji

## 2. Logika backendowa

### 2.1. Endpointy API

#### Autentykacja
```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

// POST /api/auth/reset-password
interface ResetPasswordRequest {
  email: string;
}

// POST /api/auth/new-password
interface NewPasswordRequest {
  token: string;
  password: string;
}

// POST /api/auth/logout
// (nie wymaga body)
```

### 2.2. Middleware
- `/src/middleware/auth.ts` - middleware autentykacji
  - Weryfikacja tokenu sesji
  - Obsługa przekierowań dla stron chronionych
  - Ustawienie kontekstu użytkownika

### 2.3. Serwisy
- `/src/lib/services/auth.service.ts` - logika autentykacji
  - Integracja z Supabase Auth
  - Walidacja danych wejściowych (Zod)
  - Obsługa błędów i wyjątków

## 3. System autentykacji

### 3.1. Integracja z Supabase Auth

#### Inicjalizacja
```typescript
// /src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabaseClient = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
)
```

#### Hook React
```typescript
// /src/lib/hooks/useAuth.ts
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export const useAuth = () => {
  const supabase = useSupabaseClient()
  // implementacja metod auth
}
```

### 3.2. Bezpieczeństwo

#### Polityki RLS
```sql
-- Polityka dostępu do profilu użytkownika
CREATE POLICY "Users can only access their own data"
ON public.users
FOR ALL
USING (auth.uid() = id);

-- Polityka dostępu do analiz
CREATE POLICY "Users can access their own analyses"
ON public.analysis
FOR ALL
USING (auth.uid() = user_id);
```

#### Sesje
- Wykorzystanie wbudowanego systemu sesji Astro (experimental.session)
- Synchronizacja stanu sesji z Supabase Auth
- Automatyczne odświeżanie tokenów

### 3.3. Obsługa błędów
- Szczegółowe mapowanie błędów Supabase na komunikaty UI
- Logowanie błędów autentykacji do tabeli `logs`
- Obsługa przypadków granicznych (timeout, brak połączenia)

## 4. Integracja z istniejącą aplikacją

### 4.1. Modyfikacje istniejących komponentów
- Dodanie AuthGuard do chronionych stron
- Integracja stanu autentykacji z nawigacją
- Dodanie obsługi sesji do istniejących endpointów

### 4.2. Migracje bazy danych
- Wykorzystanie wbudowanych tabel Supabase Auth
- Rozszerzenie schematu użytkownika o dodatkowe pola (jeśli potrzebne)
- Dodanie indeksów dla optymalizacji zapytań

### 4.3. Środowisko
- Dodanie zmiennych Supabase do .env
- Konfiguracja CORS dla domen produkcyjnych
- Ustawienia SSL/TLS dla bezpiecznych połączeń
