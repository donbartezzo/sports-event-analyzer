-- Tworzenie tabel
create table if not exists analysis_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_type_id uuid not null references analysis_types(id) on delete restrict,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists analysis_logs (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references analysis(id) on delete cascade,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists logs (
  id uuid primary key default gen_random_uuid(),
  level text not null,
  message text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Indeksy
create index if not exists analysis_user_id_idx on analysis(user_id);
create index if not exists analysis_type_id_idx on analysis(analysis_type_id);
create index if not exists analysis_created_at_idx on analysis(created_at desc);
create index if not exists analysis_logs_analysis_id_idx on analysis_logs(analysis_id);
create index if not exists analysis_logs_created_at_idx on analysis_logs(created_at desc);
create index if not exists logs_level_idx on logs(level);
create index if not exists logs_created_at_idx on logs(created_at desc);

-- RLS
alter table analysis enable row level security;
alter table analysis_types enable row level security;
alter table analysis_logs enable row level security;
alter table logs enable row level security;

-- Polityki dla analysis_types
create policy "Wszyscy mogą czytać typy analiz"
  on analysis_types for select
  to authenticated, anon
  using (true);

create policy "Tylko administratorzy mogą zarządzać typami analiz"
  on analysis_types for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- Polityki dla analysis
create policy "Użytkownicy mogą czytać swoje analizy"
  on analysis for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Użytkownicy mogą tworzyć swoje analizy"
  on analysis for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Użytkownicy mogą aktualizować swoje analizy"
  on analysis for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Użytkownicy mogą usuwać swoje analizy"
  on analysis for delete
  to authenticated
  using (auth.uid() = user_id);

-- Polityki dla analysis_logs
create policy "Użytkownicy mogą czytać logi swoich analiz"
  on analysis_logs for select
  to authenticated
  using (exists (
    select 1 from analysis
    where analysis.id = analysis_logs.analysis_id
    and analysis.user_id = auth.uid()
  ));

create policy "Użytkownicy mogą tworzyć logi dla swoich analiz"
  on analysis_logs for insert
  to authenticated
  with check (exists (
    select 1 from analysis
    where analysis.id = analysis_logs.analysis_id
    and analysis.user_id = auth.uid()
  ));

-- Polityki dla logs
create policy "Tylko administratorzy mogą czytać logi systemowe"
  on logs for select
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin');

create policy "Tylko administratorzy mogą zarządzać logami systemowymi"
  on logs for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');
