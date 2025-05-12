# Schemat Bazy Danych

## 1. Lista tabel

### users

This table is managed by Supabase Auth.

- **id**: SERIAL PRIMARY KEY
- **email**: VARCHAR(255) NOT NULL UNIQUE
- **password**: VARCHAR(255) NOT NULL
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()

### analysis
- **id**: SERIAL PRIMARY KEY
- **user_id**: INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
- **analysis_type_id**: INTEGER NOT NULL REFERENCES analysis_types(id) ON DELETE RESTRICT
- **id_from_api**: VARCHAR(100) NOT NULL
- **checksum**: VARCHAR(255) NOT NULL
- **parameters**: JSONB NOT NULL
- **generation_time**: NUMERIC CHECK (generation_time >= 0)
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()

### logs
- **id**: SERIAL PRIMARY KEY
- **user_id**: INTEGER REFERENCES users(id) ON DELETE SET NULL
- **type**: ENUM('success', 'error', 'info')
- **event**: ENUM('general', 'analysis_generator')
- **log**: JSONB NOT NULL
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()

### analysis_logs
- **id**: SERIAL PRIMARY KEY
- **analysis_id**: INTEGER NOT NULL REFERENCES analysis(id) ON DELETE CASCADE
- **log_id**: INTEGER NOT NULL REFERENCES logs(id) ON DELETE CASCADE
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()

### analysis_types
- **id**: SERIAL PRIMARY KEY
- **name**: VARCHAR(100) NOT NULL UNIQUE
- **description**: TEXT
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()

## 2. Relacje między tabelami

- Jeden użytkownik (users) ma wiele analiz (analysis): `users` (1) --- (N) `analysis` (poprzez `user_id`)
- Jeden użytkownik (users) może mieć wiele wpisów logów (logs): `users` (1) --- (N) `logs` (poprzez `user_id`)
- Jeden typ analizy (analysis_types) ma wiele analiz (analysis): `analysis_types` (1) --- (N) `analysis` (poprzez `analysis_type_id`)
- Jedna analiza (analysis) ma wiele wpisów logów dotyczących analiz (analysis_logs): `analysis` (1) --- (N) `analysis_logs` (poprzez `analysis_id`)
- Jeden wpis logów (logs) ma wiele wpisów logów dotyczących analiz (analysis_logs): `logs` (1) --- (N) `analysis_logs` (poprzez `log_id`)

## 3. Indeksy

- Unikalne indeksy: 
  - `users(email)`, `analysis_types(name)`.

- Indeksy na kolumnach kluczy obcych:
  - `analysis(user_id)`, `analysis(analysis_type_id)`, `analysis(id_from_api)`, `analysis(checksum)`, `analysis_logs(analysis_id)`, `analysis_logs(log_id)`, `logs(user_id)`.

## 4. Zasady PostgreSQL (RLS)

W celu zwiększenia bezpieczeństwa danych oraz zgodnie z wymaganiami, należy wdrożyć zasady Row-Level Security (RLS):

- **users**: RLS umożliwiające, że użytkownik ma dostęp jedynie do swoich danych.
- **analysis** i **analysis_logs**: Dostęp ograniczony do właściciela (użytkownika powiązanego przez `user_id`) lub użytkowników z uprawnieniami administracyjnymi.
- **logs**: Dostęp tylko dla administratorów lub w ramach polityk określonych dla danych.

_Przykład wdrożenia RLS (do zaimplementowania w migracjach lub skryptach administracyjnych):_

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Przykładowa polityka dla tabeli users:
CREATE POLICY user_policy ON users
  USING (id = current_setting('app.current_user_id')::int);

-- Analogiczne polityki można wdrożyć dla pozostałych tabel.
```

## 5. Dodatkowe uwagi

- Schemat jest zaprojektowany zgodnie z zasadami trzeciej postaci normalnej (3NF) z możliwością elastycznego przechowywania dodatkowych danych przy użyciu typu `JSONB` w tabelach `analysis` oraz `logs`.
- Unikalność danych krytycznych (np. `email`, `analysis_types.name`) jest zapewniona przez odpowiednie ograniczenia unikalności.
- Indeksy na kolumnach kluczy obcych i kolumnach często wykorzystywanych w zapytaniach przyspieszają wyszukiwanie. 
- Schemat został zaprojektowany z myślą o optymalizacji dla PostgreSQL, zgodnie z przyjętym stosem technologicznym.
