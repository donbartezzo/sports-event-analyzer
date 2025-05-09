### Główny problem
Manualne pisanie wysokiej jakości analizy wydarzeń sportowych jest czasochłonne i wymaga wiedzy lub chociaż umiejętności zbierania oraz selekcji danych, łączenia ich ze sobą, porównywania i właściwej interpretacji.

### Najmniejszy zestaw funkcjonalności (MVP)
- Prosty system kont użytkowników do przechowywania analiz
- Tradycyjna rejestracja konta oraz logowania użytkownika poprzez email oraz hasło
- Integracja z Openrouter.ai do komunikacja z modelami AI 
- Integracja z API www.api-football.com do pobierania wymaganych danych dla meczów piłki nożnej, w tym danych statystycznych i historycznych
- Stworzenie pliku .env gdzie będą przechowywane dane do komunikacji z zewnętrznymi API
- Listowanie najbliższych meczów piłki nożnej z uwzględnieniem: <event_data>nazwy drużyn, kraj, nazwa ligi, czas rozpoczęcia</event_data> oraz oznaczenie czy została już wygenerowana analiza dla tego wydarzenia
- Wybór wydarzenia z listy
- <event_card>Wyświetlenie karty wydarzenia z podstawowymi danymi dotyczącymi wydarzenia (to co zostało zawarte w tagu <event_data>) oraz wyświetlenie listingu wygenerowanych dla tego wydarzenia analiz (opisane w tagu <analyses_list>, ale w tym przypaku ograniczone jedynie do analiz dotyczących tylko tego jednego wydarzenia), jeśli takowe istnieją.</event_card>
- Sprawdzenie czy dla tego wydarzenia i tej sumy kontrolnej była juz generowana analiza, a jeśli nie to wyświetlenie buttona na karcie wydarzenia do zainicjowania generowania analizy 
- Zapis sumy kontrolnej dla pełnych danych statystycznych tego wydarzenia, na których będzie się opierała analiza - określenie co dokładniej będzie zawarte w sumie kontrolnej zostanie w późniejszym etapie
- Generowanie analizy przez AI według opisu zawartego w tagu <how_to_generate_analysis> i informacja dla użytkwnika, że może to potrwać kilka minut oraz wyświetlenie zwykłego preloadera na czas generowania.
- Zapis najważniejszych logów z przebiegu generowania analizy, a przede wszystkim błędów jeśli takowe wystąpią
- Odnotowanie dla jakich wydarzeń generowanie zakończyło się niepowodzeniem (zalogowanie błędów) 
- Zapis analizy do bazy danych - oprócz samej treści analizy zapisz także ile czasu trwało generowanie (w sekundach) oraz datę i godzinę zakończenia generowania
- <analyses_list>Listowanie swoich (dla zalogowanego użytkownika) wygenerowanych analiz z możliwością przeglądania każdej z nich (karta wydarzenia zawarta w tagu <event_card>)</analyses_list>
- Analiza tylko tekstowa (bez elementów wizualnych)

### Co NIE wchodzi w zakres MVP
- Integracja z API do pobierania danych dla innych dyscyplin niż piłka nożna
- Manualne dodawanie/pisanie analiz oraz ich import (PDF, DOCX, itp.)
- Export analiz
- Odzyskiwanie/resetowanie hasła
- Współdzielenie analiz między użytkownikami
- Aplikacje mobilne (na początek tylko web)
- Mechanizmy informacji zwrotnej od użytkowników
- Możliwość porównywania dokładności prognoz z rzeczywistymi wynikami
- Możliwość dostosowywania parametrów analizy (będą one ustalone odgórnie "na sztywno" w systemie)
- Usuwanie i edycja analiz
- Ograniczenia czasowe dla wykonywania analizy (proces ten zapewne będzie zoptymalizowany w kolejnych etapach)
- Możliwość filtrowania i sortowania wydarzeń na listingu.
- Możliwość filtrowania i sortowania analiz na listingu.
- Listing logów (w pierwszej wersji administrator będzie sprawdzał logi bezpośrednio w bazie).

### Kryteria sukcesu
- Mniej niż 1% nieudanych analiz (w których wystąpił błąd podczas generowania). W logach powinna być informacja dla których wydarzeń wystąpił błąd
- Mniej niż 10% analiz, które wygenerowały się w czasie krótszym niż 1 minuta.

<how_to_generate_analysis>
### Jak powinno odbywać się generowanie analizy dla meczu piłki nożnej
Na podstawie pobranych z API danych przeanalizuj wydarzene i podaj prognozy w zakresie opisanym poniżej:
- wynik końcowy,
- ilość strzelonych goli ogółem,
- ilość fauli u każdego zespołu osobno,
- ilość kartek (żółtych oraz czerwonych) u każdego zespołu osobno,
- ilość rzutów rożnych u każdego zespołu osobno,
- ilość wszystkich strzałów u każdego zespołu osobno,
- ilość strzałów celnych u każdego zespołu osobno.
- w której połowie padnie więcej goli.
Upewnij się, że bierzesz pod uwagę takie czynniki, jak forma każdej ze stron, statystyki meczowe, dane historyczne, ewentualne kontuzje i inne istotne informacje. Dla analizy meczów piłki nożnej kluczowe są statystyki dotyczące bezpośrednich meczów historycznych tych zespołów ze sobą oraz meczów historycznych z innymi zespołami, z którymi grały oba zespoły z tego analizowanego meczu. Szczególnie istotne są te statystyki, w których każda z tych drużyn grała zbliżonym składem. Jeśli do któregoś z powyższych czynników nie da się wysatwić rzeczowej anlizy to napisz dlaczego.

# Kroki analizy
1. Uzyskaj dostęp do danych i dokładnie je przeanalizuj, aby zebrać wszystkie istotne informacje o dopasowaniu.
2. Oceń obecną formę obu drużyn, zwracając uwagę na ostatnie trendy w zakresie wyników.
3. Uwzględnij historyczne spotkania, szczególnie te bezpośrednie (między tymi samymi drużynami).
4. Jeśli to możliwe to przeanalizuj statystyki poszczególnych zawodników, które mogą mieć wpływ na wydarzenie.
5. Spróbuj zidentyfikować wszelkie kontuzje lub nieobecności, które mają wpływ na kluczowych zawodników lub ogólną siłę zespołu.
6. Weź pod uwagę inne istotne szczegóły, takie jak, np. przewaga własnego boiska.
7. Zsyntetyzuj wszystkie zebrane informacje, aby opracować uzasadnioną prognozę wyniku wydarzenia.

# Format wyjściowy
Przedstaw szczegółową analizę pisemną podsumowującą kluczowe punkty. Jeśli to możliwe, uwzględnij prawdopodobieństwa liczbowe lub przewidywania wyników i wyjaśnij uzasadnienie prognozy.

# Notatki
- Bądź obiektywny i opieraj swoją prognozę ściśle na dostarczonych danych.
- Skup się na danych pobranych z API, nie zakładaj informacji spoza.
- Należy uwzględnić wszelkie niepewności i zastrzeżenia związane z prognozą.
- Używaj jasnego, zwięzłego języka, dostosowanego do potrzeb szerokiego grona odbiorców.
- Odpowiedź powinna być klarowna i w pełni w języku polskim.
</how_to_generate_analysis>

### Informacje uzupełniające:
- Użytkownikami serwisu będą profesjonalni analitycy sportowi oraz gracze bukmacherscy.
- W pierwszej wersji będzie tylko kilku (max 10) zarejestrowanych użytkowników.
- W pierwszej wersji system będzie generował łącznie do 100 analiz dziennie.
- W pierwszej wersji serwis obsługiwać będzie tylko mecze piłki nożnej, ale w kolejnych wersjach dojdą kolejne sporty drużynowe (np. siatkówka, hokej itp.), a także dyscypliny indywidualne (np. tenis, boks itp.), a więc być może zachodzi potrzeba żeby aplikację zaprojektować modułowo per dyscyplina (to tylko propozycja). Prawdopodobnie zajdzie potrzeba żeby dane pobierać z różnych API, w zależności od obsługiwanej dyscypliny.
- Interfejs użytkownika dla wyszukiwania i przeglądania zapisanych analiz powinien być możliwie najprostszy.
- Suma kontrolna zapisywana podczas generowania analizy posłuży do sprawdzenia czy pojawiły się z czasem jakieś nowe dane statystyczne i w związku z tym być może jest potrzeba wygenerowania aktualniejszej analizy. Jeśli obecna suma kontrolna jest identyczna z którąś z tych, co zostały już zapisane dla tego wydarzenia to wtedy ponowne generowanie analizy nie jest możliwe - należy wyświetlić użytkownikowi stosowną informację z tym związaną. 
- System powinien obsługiwać analizy tylko przed rozpoczęciem danego wydarzenia.
- W pierwszej wersji nie ma ograniczeń co do przechowywania historycznych analiz.
- W pierwszej wersji analiza ma zawierać tylko tekst (bez elementów wizualnych).
- System samoczynnie nic nie robi z wygenerowanymi już analizami. Nie ma potrzeby oznaczania analiz do wydarzeń, które już się odbyły oraz jakiegokolwiek weryfikowania poprawności prognoz.
- W pierwszej wersji wydajność systemu jest drugorzędna.
- Jeśli API jest niedostępne lub nie można było pobrać wszystkich danych do kompletnej analizy to generowanie analizy powinno zostać przerwane, całość powinna zostać szczegółowo zalogowana (logi przechowywane w bazie: błąd + dla jakiego wydarzenia to wystąpiło), a użytkownik powinien otrzymać stosowną informację z tym związaną.
- System nie musi pokazywać użytkownikowi szczegółowych informacji o wykorzystanych danych do analizy.
- System powinien umożliwiać ponowne ręczne próby generowania analizy w przypadku niepowodzenia. Ponowne próby odbywają się manualnie, a więc system nie musi tego automatyzować oraz nie musi kontrolować nieudanych prób oraz interwałów między tymi próbami.
- W pierwszej wersji listing wydarzeń może zawierać maksymalnie 100 pozycji, najlepiej sortowanych wg daty rozpoczęcia, zaczynając od tych które odbędą się najszybciej. Nie ma potrzeby żeby lista była odświeżana przez system.
- Użytkownik może zmienić jedynie hasło na swoim koncie - nic więcej. Nie ma potrzeby wprowadzania wymagań co do siły hasła.
- Analizy powinny być prezentowane wszystkie na jednej liście. 
- System nie musi umożliwiać przeglądania analiz w trybie pełnoekranowym.
- W logach powinny być zapisywane szczegółowe informacje dotyczące napotkanych błędów podczas generowania analizy. 
- W przypadku błędu użytkownikowi powinno się wyświetlić tylko ogólne powiadomienie.
- W pierwszej wersji nie ma wymagań dotyczących wydajności systemu, a czas generowania analiz jest dowolny i z czasem będzie optymalizowany.
- W pierwszej wersji nie są potrzebne żadne metryki lub kryteria jakości analiz.
- W pierwszej wersji system powinien obsługiwać tylko język polski.