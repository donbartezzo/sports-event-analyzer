-- 2025-08-17 12:04:00 UTC
-- Migration: AI analysis storage, logs, and RLS policies
-- This migration creates/extends tables required for US-004 (AI analysis generation)
-- All SQL is lowercase; includes comments, indices, and rls policies.

begin;

-- analysis table: extend or create
create table if not exists public.analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  event_id text not null,
  analysis_type_id int4 null,
  type text not null default 'ai',
  status text not null default 'pending',
  checksum text not null,
  started_at timestamptz null,
  finished_at timestamptz null,
  duration_ms int4 null,
  content_json jsonb null,
  created_at timestamptz not null default now()
);

-- ensure required columns exist if table pre-existed
alter table public.analysis add column if not exists user_id uuid;
alter table public.analysis add column if not exists event_id text;
alter table public.analysis add column if not exists type text;
alter table public.analysis add column if not exists status text;
alter table public.analysis add column if not exists checksum text;
alter table public.analysis add column if not exists started_at timestamptz;
alter table public.analysis add column if not exists finished_at timestamptz;
alter table public.analysis add column if not exists duration_ms int4;
alter table public.analysis add column if not exists content_json jsonb;
alter table public.analysis add column if not exists created_at timestamptz default now();

-- relax not null constraints if they exist from previous schema
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'analysis' and column_name = 'user_id' and is_nullable = 'NO'
  ) then
    execute 'alter table public.analysis alter column user_id drop not null';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_name = 'analysis' and column_name = 'analysis_type_id' and is_nullable = 'NO'
  ) then
    execute 'alter table public.analysis alter column analysis_type_id drop not null';
  end if;
end $$;

-- indexes
create index if not exists idx_analysis_event on public.analysis (event_id);
create index if not exists idx_analysis_checksum on public.analysis (checksum);
create index if not exists idx_analysis_finished_at on public.analysis (finished_at desc);

-- analysis_logs: per-analysis logging
create table if not exists public.analysis_logs (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analysis(id) on delete cascade,
  event_id text not null,
  level text not null check (level in ('info','warn','error')),
  message text not null,
  context jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists idx_analysis_logs_analysis on public.analysis_logs (analysis_id);
-- Ensure columns exist on legacy schemas
alter table public.analysis_logs add column if not exists event_id text;
alter table public.analysis_logs add column if not exists level text;
alter table public.analysis_logs add column if not exists message text;
alter table public.analysis_logs add column if not exists context jsonb;

create index if not exists idx_analysis_logs_event on public.analysis_logs (event_id);
create index if not exists idx_analysis_logs_created on public.analysis_logs (created_at desc);

-- logs: general system logs
create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  event text not null check (event in ('general','analysis_generator')),
  type text not null check (type in ('success','info','error')),
  log jsonb not null,
  user_id uuid null,
  created_at timestamptz not null default now()
);

create index if not exists idx_logs_created on public.logs (created_at desc);

-- If an older schema exists (level/message/data), add new columns to be compatible with API
alter table public.logs add column if not exists event text;
alter table public.logs add column if not exists type text;
alter table public.logs add column if not exists log jsonb;
alter table public.logs add column if not exists user_id uuid;
-- Set simple defaults for legacy rows if columns were just added (nullable allowed)
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'logs' and column_name = 'type'
  ) then
    -- enforce enum-like constraint only if not present yet
    begin
      alter table public.logs add constraint logs_type_chk check (type in ('success','info','error'));
    exception when duplicate_object then null; end;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_name = 'logs' and column_name = 'event'
  ) then
    begin
      alter table public.logs add constraint logs_event_chk check (event in ('general','analysis_generator'));
    exception when duplicate_object then null; end;
  end if;
end $$;

-- Helpful index if using new `type`
create index if not exists idx_logs_type on public.logs (type);

-- rls
alter table public.analysis enable row level security;
alter table public.analysis_logs enable row level security;
alter table public.logs enable row level security;

-- policies: granular per operation and role, permissive for mvp
-- analysis
drop policy if exists analysis_select_anon on public.analysis;
create policy analysis_select_anon on public.analysis for select to anon using (true);
drop policy if exists analysis_select_auth on public.analysis;
create policy analysis_select_auth on public.analysis for select to authenticated using (true);
drop policy if exists analysis_insert_anon on public.analysis;
create policy analysis_insert_anon on public.analysis for insert to anon with check (true);
drop policy if exists analysis_insert_auth on public.analysis;
create policy analysis_insert_auth on public.analysis for insert to authenticated with check (true);
drop policy if exists analysis_update_auth on public.analysis;
create policy analysis_update_auth on public.analysis for update to authenticated using (true) with check (true);
drop policy if exists analysis_delete_auth on public.analysis;
create policy analysis_delete_auth on public.analysis for delete to authenticated using (true);

-- analysis_logs
drop policy if exists analysis_logs_select_anon on public.analysis_logs;
create policy analysis_logs_select_anon on public.analysis_logs for select to anon using (true);
drop policy if exists analysis_logs_select_auth on public.analysis_logs;
create policy analysis_logs_select_auth on public.analysis_logs for select to authenticated using (true);
drop policy if exists analysis_logs_insert_anon on public.analysis_logs;
create policy analysis_logs_insert_anon on public.analysis_logs for insert to anon with check (true);
drop policy if exists analysis_logs_insert_auth on public.analysis_logs;
create policy analysis_logs_insert_auth on public.analysis_logs for insert to authenticated with check (true);

-- logs (system). reading allowed; inserts by server only (anon allowed for mvp)
drop policy if exists logs_select_anon on public.logs;
create policy logs_select_anon on public.logs for select to anon using (true);
drop policy if exists logs_select_auth on public.logs;
create policy logs_select_auth on public.logs for select to authenticated using (true);
drop policy if exists logs_insert_anon on public.logs;
create policy logs_insert_anon on public.logs for insert to anon with check (true);
drop policy if exists logs_insert_auth on public.logs;
create policy logs_insert_auth on public.logs for insert to authenticated with check (true);

commit;
