# Dokument wymagań produktu (PRD) - Analiza Wydarzeń Sportowych

## 1. Przegląd produktu
Produkt "Analiza Wydarzeń Sportowych" ma na celu automatyzację procesu generowania analiz wydarzeń sportowych (głównie meczów piłki nożnej). System integruje się z zewnętrznymi API, w szczególności z API www.api-football.com, które dostarcza dane statystyczne i historyczne, oraz z groq.com, umożliwiającego generowanie prognoz meczowych przy użyciu modeli AI. Aplikacja skierowana jest do profesjonalnych analityków sportowych oraz graczy bukmacherskich, którzy potrzebują szybkiego i wiarygodnego narzędzia do przygotowywania analiz. Frontend oparty jest na Astro i React (TS/JS), a backend korzysta z Supabase oraz jest hostowany przy użyciu www.mydevil.net.

## 2. Problem użytkownika
Ręczne przygotowywanie analiz meczów piłkarskich jest czasochłonne i wymaga dużej wiedzy oraz umiejętności zbierania, selekcji i interpretacji danych. Użytkownicy napotykają trudności z szybkim pozyskaniem kompletnego zestawu danych statystycznych i historycznych, co skutkuje opóźnieniami, błędami oraz niespójnościami w prognozach.

## 3. Wymagania funkcjonalne
1. Integracja z API www.api-football.com do pobierania danych statystycznych i historycznych dotyczących meczów piłki nożnej.
2. Logowanie użytkowników przy użyciu adresu email i hasła.
3. Przechowywanie podstawowych danych użytkownika, tj. ID, email oraz hasło.
4. Utworzenie pliku .env do przechowywania danych konfiguracyjnych i kluczy API.
5. Listowanie nadchodzących meczów piłki nożnej (maksimum 100 pozycji) z informacjami takimi jak nazwy drużyn, kraj, nazwa ligi i czas rozpoczęcia; lista nie będzie automatycznie odświeżana ani filtrowana przez użytkownika.
6. Wyświetlanie karty wydarzenia po wyborze danego meczu, zawierającej podstawowe informacje oraz listę wygenerowanych analiz, jeśli analiza dla danego wydarzenia już istnieje.
7. Sprawdzenie, czy dla wybranego wydarzenia (na podstawie sumy kontrolnej danych statystycznych) analiza została już wygenerowana; w przypadku braku, wyświetlenie opcji generowania analizy.
8. Generowanie analizy przez AI przy użyciu groq.com, z wyświetleniem preloadera oraz komunikatu o tym, że proces może trwać kilka minut.
9. Analiza powinna być w języku polskim.
10. Zapisanie sumy kontrolnej pełnych danych statystycznych wydarzenia (szczegółowe parametry do ustalenia w późniejszym etapie) w celu wykrycia zmian danych.
11. Logowanie zdarzeń i błędów podczas generowania analizy, w tym nieudanych prób (z identyfikatorem wydarzenia i szczegółami błędów, np. niepełne lub niepoprawne dane, przekroczenie limitów API).
12. W przypadku długotrwałej niedostępności API lub otrzymania niepełnych/niepoprawnych danych, system wyświetla stronę informacyjną z tekstowym komunikatem o niedostępności danych oraz zapisuje ten incydent w logach.
13. Mechanizm resetowania hasła, gdzie użytkownik może zainicjować proces odzyskiwania hasła i otrzymać unikalny link resetujący na swój adres email.

## 4. Granice produktu
1. Wersja MVP obsługuje wyłącznie mecze piłki nożnej; integracja z dodatkowymi dyscyplinami sportowymi nie jest przewidziana.
2. Manualne dodawanie, edycja lub import/eksport analiz (np. PDF, DOCX) nie wchodzi w zakres MVP.
3. Użytkownik nie będzie mógł sortować lub filtrować listy wydarzeń; lista będzie prezentowana chronologicznie i ograniczona do 100 pozycji.
4. Aplikacja nie przewiduje funkcji edycji, usuwania ani współdzielenia wygenerowanych analiz.
5. Mobilna wersja aplikacji nie jest uwzględniona – system jest dedykowany aplikacji webowej.
6. Uwierzytelnianie odbywa się wyłącznie przez email i hasło; dodatkowa weryfikacja adresu email nie jest przewidziana.
7. Lista logów błędów jest dostępna tylko dla administratora poprzez bazę danych, bez dedykowanego interfejsu użytkownika.
8. Szczegóły dotyczące wyboru konkretnego API do integracji, specyfikacji technologicznej poza preferencjami JS/TS, kryteriów weryfikacji dostępności danych oraz formatu komunikatów błędów będą określone w kolejnych etapach projektu.

## 5. Historyjki użytkowników

US-001
Tytuł: Logowanie użytkownika
Opis: Jako użytkownik chcę móc zalogować się do systemu, aby uzyskać dostęp do systemu.
Kryteria akceptacji:
- Użytkownik może się zalogować, a system autentykuje dane.

US-002
Tytuł: Przeglądanie nadchodzących wydarzeń
Opis: Jako użytkownik chcę przeglądać listę nadchodzących meczów piłki nożnej, aby wybrać wydarzenie do analizy.
Kryteria akceptacji:
- System wyświetla listę maksymalnie 100 nadchodzących meczów.
- Każdy mecz wyświetla informacje: nazwy drużyn, kraj, nazwa ligi oraz czas rozpoczęcia.
- Lista jest prezentowana w kolejności chronologicznej.

US-003
Tytuł: Wyświetlanie karty wydarzenia
Opis: Jako użytkownik chcę mieć możliwość kliknięcia na mecz z listy, aby zobaczyć szczegółowe informacje o wydarzeniu oraz historię wygenerowanych analiz, jeśli takie istnieją.
Kryteria akceptacji:
- Po wybraniu meczu system wyświetla kartę wydarzenia z podstawowymi danymi.
- Jeśli dla wydarzenia istnieje już analiza, użytkownik widzi listę dostępnych analiz.

US-004
Tytuł: Generowanie analizy meczu
Opis: Jako użytkownik chcę wygenerować analizę wybranego meczu na podstawie danych pobranych z API, aby uzyskać prognozę wyniku oraz szczegółowe statystyki dotyczące meczu.
Kryteria akceptacji:
- System sprawdza kompletność danych z API przed rozpoczęciem generowania analizy.
- W przypadku niepełnych lub niepoprawnych danych proces generowania zostaje przerwany, a użytkownik widzi stronę informacyjną o niedostępności danych.
- Podczas procesu generowania wyświetlany jest preloader z komunikatem, że generowanie może potrwać kilka minut.
- Po zakończeniu analizy, wynik zostaje zapisany wraz z informacjami o czasie generowania i dacie zakończenia.
- Każda nieudana próba generowania jest logowana z identyfikatorem wydarzenia i szczegółami błędu.

US-005
Tytuł: Resetowanie hasła
Opis: Jako użytkownik chcę móc zresetować zapomniane hasło poprzez otrzymanie unikalnego linku resetującego na mój adres email, aby odzyskać dostęp do konta.
Kryteria akceptacji:
- Użytkownik inicjuje proces resetowania hasła.
- System wysyła unikalny link resetujący na podany adres email.
- Po kliknięciu linku użytkownik może ustawić nowe hasło.

US-006
Tytuł: Bezpieczny dostęp do systemu
Opis: Jako użytkownik chcę mieć pewność, że dostęp do systemu jest bezpieczny, a moje dane są chronione podczas logowania i użytkowania aplikacji.
Kryteria akceptacji:
- Proces logowania odbywa się przez bezpieczne połączenie (HTTPS).
- Hasła są przechowywane w sposób zaszyfrowany.
- System nie wymaga dodatkowej weryfikacji adresu email, ale zapewnia podstawowy poziom bezpieczeństwa poprzez autentykację email/hasło.

## 6. Metryki sukcesu
1. Mniej niż 1% nieudanych prób generowania analizy, przy czym każdy błąd jest logowany wraz z identyfikatorem wydarzenia.
2. Mniej niż 10% analiz generuje się w czasie krótszym niż 1 minuta.
3. Wersja MVP obsługuje do 10 zarejestrowanych użytkowników oraz do 100 analiz generowanych dziennie.
4. Użytkownik otrzymuje jasny i czytelny komunikat o niedostępności danych w przypadku problemów z API, a incydenty te są dokładnie rejestrowane w logach.
5. Proces logowania oraz resetowania hasła przebiega sprawnie, zapewniając bezpieczny dostęp do systemu.
