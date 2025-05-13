# API Endpoint Implementation Plan: POST /analysis

## 1. Przegląd punktu końcowego
Endpoint POST /analysis służy do tworzenia nowej analizy w systemie. Po otrzymaniu poprawnego żądania, system waliduje dane, wstawia rekord do bazy danych oraz zwraca utworzony obiekt analizy jako odpowiedź.

## 2. Szczegóły żądania
- **Metoda HTTP:** POST
- **Struktura URL:** /analysis
- **Parametry:**
  - **Wymagane:**
    - `user_id` (string) – identyfikator użytkownika, powiązany z Supabase Auth
    - `analysis_type_id` (string lub number) – typ analizy; w modelu bazy danych definiowany jako number
    - `parameters` (JSON) – elastyczny payload zawierający parametry analizy (będzie mapowany na pole `parameters` w bazie danych)
  - **Opcjonalne:** Brak
- **Request Body:**
  ```json
  {
    "user_id": "user-123",
    "analysis_type_id": "1",
    "parameters": { "key": "value" }
  }
  ```

## 3. Wykorzystywane typy
- **DTO:**
  - `AnalysisDTO` – reprezentuje pełny obiekt analizy z bazy danych
  - `CreateAnalysisCommand` – definiuje strukturę komendy do tworzenia nowej analizy
- **Encje:**
  - Definicje zaczerpnięte z `src/db/database.types.ts` (tabela `analysis`)

## 4. Szczegóły odpowiedzi
- **Sukces:**
  - **Kod stanu:** 201
  - **Treść odpowiedzi:** Utworzony obiekt analizy w formacie zgodnym z `AnalysisDTO`
- **Błędy:**
  - 400: Nieprawidłowe dane wejściowe (np. brak wymaganych pól lub błąd walidacji)
  - 401: Brak autoryzacji lub nieprawidłowy token
  - 500: Błąd wewnętrzny serwera, np. problem z bazą danych

## 5. Przepływ danych
1. Klient wysyła żądanie POST /analysis z wymaganym payloadem.
2. Warstwa middleware (np. Astro) autoryzuje żądanie przy użyciu JWT Bearer token.
3. Endpoint wywołuje walidację danych wejściowych przy pomocy zod lub innego walidatora.
4. Po pomyślnej walidacji, wywoływana jest logika biznesowa (service layer) – `AnalysisService.createAnalysis`:
   - Konwertuje `analysis_type_id` z payload (jeśli jest stringiem) na numer
   - Mapuje `parameters` do pola `parameters` bazy danych
5. Service komunikuje się z bazą danych (np. Supabase) w celu wstawienia nowego rekordu w tabeli `analysis`.
6. W przypadku sukcesu, rekord jest zwracany i przetwarzany na `AnalysisDTO`.
7. Odpowiedź z kodem 201 jest wysyłana do klienta.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** Weryfikacja JWT Bearer token w nagłówku `Authorization`.
- **Autoryzacja:** Upewnienie się, że użytkownik może tworzyć analizy tylko dla swojego identyfikatora (user_id), zgodnie z RLS (Row-Level Security) w bazie danych.
- **Walidacja danych:** Dokładna walidacja pól przy użyciu zod lub podobnego mechanizmu, aby zapobiec wstrzyknięciom oraz nieprawidłowym danym.

## 7. Obsługa błędów
- **400 Bad Request:** Zwracane, gdy dane wejściowe nie spełniają wymagań walidacji (np. brak pola, nieprawidłowy typ danych).
- **401 Unauthorized:** W przypadku braku lub nieprawidłowego tokena.
- **500 Internal Server Error:** W przypadku problemów z komunikacją z bazą danych lub niespodziewanych wyjątków.

Wszelkie błędy powinny być również logowane przy użyciu systemu logowania (tworzenie wpisu w tabeli `logs`), aby ułatwić debugging i analizę problemów.

## 8. Rozważenia dotyczące wydajności
- Wykorzystanie indeksów na kluczach obcych (np. `user_id`, `analysis_type_id`) dla szybkich zapytań.
- Użycie połączeń z poolingu bazy danych w celu zoptymalizowania wydajności.
- Możliwość implementacji mechanizmów cache'ujących dla zapytań powiązanych z analityką.

## 9. Etapy wdrożenia
1. **Definicja endpointu i konfiguracja routingu:** Utworzenie pliku API (np. `src/pages/api/analysis.ts`) 
2. **Walidacja danych wejściowych:** Implementacja walidatora z wykorzystaniem zod lub podobnej biblioteki.
3. **Autoryzacja:** Dodanie middleware weryfikującego JWT Bearer token oraz RLS.
4. **Implementacja logiki biznesowej:** Rozbicie logiki na warstwę service, np. `AnalysisService.createAnalysis`, która obsługuje mapowanie i komunikację z bazą danych.
5. **Komunikacja z bazą danych:** Integracja z Supabase, wykorzystanie typów z `src/db/database.types.ts` oraz DTO zdefiniowanych w `src/types.ts`.
6. **Obsługa błędów:** Zaimplementowanie przejrzystej obsługi wyjątków wraz z logowaniem błędów.
7. **Dokumentacja:** Uaktualnienie dokumentacji API oraz przekazanie wytycznych zespołowi programistów.
8. **Deployment:** Wdrożenie zmian na środowisku testowym, później na produkcyjnym po przeprowadzeniu testów.
