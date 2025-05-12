<conversation_summary>

<decisions>
1. Tabela "users" będzie posiadała kolumnę "email" oznaczoną jako unikalna z indeksem, aby zapobiec duplikowaniu adresów email.
2. Wszystkie relacje między tabelami (analysis.user_id → users.id, analysis_logs.analysis_id → analysis.id, analysis.type_id → analysis_types.id) będą miały ustawioną akcję RESTRICT przy próbie usunięcia.
3. Tabela "analysis" zostanie wyposażona w dedykowane indeksy na kolumnach "id_from_api" oraz "checksum" ze względu na częste zapytania.
4. Kolumna "data" w tabeli "analysis" zostanie zaimplementowana jako typ JSONB umożliwiający szybkie operacje na danych strukturalnych.
5. Tabela "analysis" otrzyma dodatkowy atrybut "generation_time" (number) z ograniczeniem nieujemności.
6. W tabelach zostanie zastosowany typ TIMESTAMPTZ dla kolumny "created_at" z wartością domyślną CURRENT_TIMESTAMP, aby zapewnić precyzyjne rejestrowanie czasu wraz ze strefą czasową.
7. Tabela "logs" zostanie dodana jako encja służąca do zbierania logów, bez dodatkowych indeksów, gdyż dane te będą przeglądane bezpośrednio z bazy danych.
8. Tabela "analysis_logs" będzie indeksowana na kolumnie "analysis_id" dla szybszego filtrowania.
9. Polityka RLS zostanie wdrożona na podstawie porównania kolumny "user_id" rekordu z wartością zwracaną przez Supabase Auth (auth.uid()), co zapewni, że użytkownik ma dostęp tylko do swoich danych.
10. Tabela "analysis_types" pozostanie statyczna na etapie MVP.
</decisions>

<matched_recommendations>
1. Użycie unikalnego indeksu w tabeli "users" dla kolumny "email".
2. Zastosowanie akcji RESTRICT dla kluczy obych w relacjach między tabelami.
3. Utworzenie dedykowanych indeksów na kolumnach "id_from_api" i "checksum" w tabeli "analysis".
4. Implementacja kolumny "data" jako JSONB w tabeli "analysis".
5. Wdrożenie polityki RLS opartej na porównaniu "user_id" z wartością auth.uid() z Supabase Auth.
6. Ustalenie kolumny "created_at" jako TIMESTAMPTZ z DEFAULT CURRENT_TIMESTAMP we wszystkich tabelach.
7. Dodanie atrybutu "generation_time" w tabeli "analysis" z CHECK na nieujemną wartość.
8. Utworzenie encji "logs" oraz indeksu na kolumnie "analysis_id" w tabeli "analysis_logs".
</matched_recommendations>

<database_planning_summary>
Główne wymagania dotyczące schematu bazy danych obejmują stworzenie kluczowych encji: "users", "analysis", "analysis_logs", "analysis_types" oraz "logs".
Kluczowe encje i ich relacje:

- Tabela "users" przechowuje dane użytkowników, w tym unikalny "email".
- Tabela "analysis" zawiera dane analiz, posiada powiązanie z "users" przez "user_id", z "analysis_types" przez "type_id" oraz przechowuje dane JSONB i atrybut "generation_time".
- Tabela "analysis_logs" rejestruje logi związane z analizami, powiązana przez "analysis_id".
- Tabela "analysis_types" jest statyczną referencją typów analiz.
- Tabela "logs" służy do zbierania ogólnych logów systemowych.

Ważne kwestie dotyczące bezpieczeństwa obejmują wdrożenie polityki RLS, która ogranicza dostęp do danych do rekordów, gdzie "user_id" jest zgodne z auth.uid() z Supabase Auth. Skalowalność i wydajność zostaną osiągnięte poprzez selektywne indeksowanie (zwłaszcza kolumn "id_from_api" i "checksum" w tabeli "analysis" oraz "analysis_id" w tabeli "analysis_logs") oraz stosowanie odpowiednich typów danych, m.in. JSONB i TIMESTAMPTZ.
Wszystkie encje mają obowiązkowo pole "created_at" z ustawieniem domyślnym na CURRENT_TIMESTAMP, co ułatwia śledzenie czasu operacji.
</database_planning_summary>

<unresolved_issues>
1. Brak dodatkowych wymagań dotyczących monitorowania i logowania operacji poza encją "logs".
2. Ewentualne rozszerzenie polityk autoryzacji w przyszłości nie jest przewidziane w MVP, ale warto zachować możliwość rozbudowy.
</unresolved_issues>

</conversation_summary>