# Diagram przepływu autentykacji

```mermaid
sequenceDiagram
    participant U as Użytkownik
    participant F as Frontend (Astro/React)
    participant M as Middleware
    participant S as Supabase Auth
    participant D as Baza Danych

    %% Logowanie
    rect rgb(200, 220, 255)
        Note over U,S: Proces logowania
        U->>F: Wprowadza email i hasło
        F->>F: Walidacja formularza (Zod)
        F->>S: signInWithPassword()
        S->>D: Weryfikacja danych
        D-->>S: Potwierdzenie
        S-->>F: Token JWT + dane użytkownika
        F->>F: Zapisanie tokenu
        F-->>U: Przekierowanie do dashboardu
    end

    %% Weryfikacja sesji
    rect rgb(220, 240, 220)
        Note over U,D: Weryfikacja sesji
        U->>F: Żądanie chronionego zasobu
        F->>M: Request + Token
        M->>S: Weryfikacja tokenu
        S->>D: Sprawdzenie uprawnień
        D-->>S: Status uprawnień
        S-->>M: Wynik weryfikacji
        alt Token ważny
            M-->>F: Dostęp przyznany
            F-->>U: Wyświetlenie zasobu
        else Token nieważny/wygasły
            M-->>F: 401 Unauthorized
            F-->>U: Przekierowanie do logowania
        end
    end

    %% Reset hasła
    rect rgb(255, 220, 220)
        Note over U,S: Reset hasła
        U->>F: Żądanie resetu hasła
        F->>S: resetPasswordForEmail()
        S->>S: Generowanie linku
        S->>U: Email z linkiem
        U->>F: Kliknięcie w link
        F->>S: updatePassword()
        S->>D: Aktualizacja hasła
        D-->>S: Potwierdzenie
        S-->>F: Nowy token JWT
        F-->>U: Przekierowanie do dashboardu
    end

    %% Wylogowanie
    rect rgb(240, 240, 240)
        Note over U,S: Wylogowanie
        U->>F: Kliknięcie "Wyloguj"
        F->>S: signOut()
        S-->>F: Potwierdzenie
        F->>F: Usunięcie tokenu
        F-->>U: Przekierowanie do logowania
    end
```

## Legenda

1. **Aktorzy**:
   - Użytkownik - końcowy użytkownik systemu
   - Frontend - warstwa prezentacji (Astro + React)
   - Middleware - warstwa autoryzacji żądań
   - Supabase Auth - system autentykacji
   - Baza Danych - przechowywanie danych użytkowników

2. **Procesy**:
   - Logowanie (niebieski) - podstawowy proces autentykacji
   - Weryfikacja sesji (zielony) - sprawdzanie uprawnień dostępu
   - Reset hasła (czerwony) - odzyskiwanie dostępu
   - Wylogowanie (szary) - zakończenie sesji

3. **Zabezpieczenia**:
   - Walidacja formularzy przez Zod
   - Tokeny JWT do autoryzacji
   - Bezpieczne połączenie HTTPS
   - Szyfrowanie haseł przez Supabase
