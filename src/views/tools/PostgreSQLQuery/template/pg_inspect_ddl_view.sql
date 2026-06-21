SELECT 'CREATE OR REPLACE VIEW ' || quote_ident(schemaname) || '.' || quote_ident(viewname) || ' AS' || E'\n' || definition AS ddl
FROM pg_views
WHERE schemaname = '{schema}' AND viewname = '{name}';
