-- Tworzenie roli administratora
create role admin;

-- Nadanie uprawnień roli administratora
grant usage on schema public to admin;
grant all privileges on all tables in schema public to admin;
grant all privileges on all sequences in schema public to admin;
grant all privileges on all functions in schema public to admin;

-- Nadanie uprawnień roli authenticated
grant usage on schema public to authenticated;
grant select on table analysis_types to authenticated;
grant select, insert, update, delete on table analysis to authenticated;
grant select, insert on table analysis_logs to authenticated;

-- Nadanie uprawnień roli anon
grant usage on schema public to anon;
grant select on table analysis_types to anon;
