-- Migration: Initial Schema Setup
-- Description: Creates the initial database schema with tables, indexes, and RLS policies
-- Author: Cascade AI
-- Date: 2025-05-12

-- enable required extensions
create extension if not exists "citext";

-- create enums for log types and events
create type log_type as enum ('success', 'error', 'info');
create type log_event as enum ('general', 'analysis_generator');

-- create analysis_types table
create table analysis_types (
    id serial primary key,
    name varchar(100) not null unique,
    description text,
    created_at timestamptz not null default now()
);

-- enable rls for analysis_types
alter table analysis_types enable row level security;

-- rls policies for analysis_types
-- anon can only view
create policy "anon can view analysis_types"
    on analysis_types
    for select
    to anon
    using (true);

-- authenticated users can only view
create policy "authenticated can view analysis_types"
    on analysis_types
    for select
    to authenticated
    using (true);

-- create analysis table
create table analysis (
    id serial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    analysis_type_id integer not null references analysis_types(id) on delete restrict,
    id_from_api varchar(100) not null,
    checksum varchar(255) not null,
    parameters jsonb not null,
    generation_time numeric check (generation_time >= 0),
    created_at timestamptz not null default now()
);

-- enable rls for analysis
alter table analysis enable row level security;

-- rls policies for analysis
-- anon has no access
create policy "authenticated can view own analysis"
    on analysis
    for select
    to authenticated
    using (auth.uid() = user_id);

create policy "authenticated can insert own analysis"
    on analysis
    for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "authenticated can update own analysis"
    on analysis
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "authenticated can delete own analysis"
    on analysis
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- create logs table
create table logs (
    id serial primary key,
    user_id uuid references auth.users(id) on delete set null,
    type log_type not null,
    event log_event not null,
    log jsonb not null,
    created_at timestamptz not null default now()
);

-- enable rls for logs
alter table logs enable row level security;

-- rls policies for logs
-- anon has no access
create policy "authenticated can view own logs"
    on logs
    for select
    to authenticated
    using (auth.uid() = user_id or user_id is null);

create policy "authenticated can insert own logs"
    on logs
    for insert
    to authenticated
    with check (auth.uid() = user_id or user_id is null);

-- create analysis_logs table
create table analysis_logs (
    id serial primary key,
    analysis_id integer not null references analysis(id) on delete cascade,
    log_id integer not null references logs(id) on delete cascade,
    created_at timestamptz not null default now()
);

-- enable rls for analysis_logs
alter table analysis_logs enable row level security;

-- rls policies for analysis_logs
-- anon has no access
create policy "authenticated can view own analysis logs"
    on analysis_logs
    for select
    to authenticated
    using (
        exists (
            select 1 from analysis
            where analysis.id = analysis_logs.analysis_id
            and analysis.user_id = auth.uid()
        )
    );

create policy "authenticated can insert own analysis logs"
    on analysis_logs
    for insert
    to authenticated
    with check (
        exists (
            select 1 from analysis
            where analysis.id = analysis_logs.analysis_id
            and analysis.user_id = auth.uid()
        )
    );

-- create indexes
create index analysis_user_id_idx on analysis(user_id);
create index analysis_analysis_type_id_idx on analysis(analysis_type_id);
create index analysis_id_from_api_idx on analysis(id_from_api);
create index analysis_checksum_idx on analysis(checksum);
create index analysis_logs_analysis_id_idx on analysis_logs(analysis_id);
create index analysis_logs_log_id_idx on analysis_logs(log_id);
create index logs_user_id_idx on logs(user_id);
