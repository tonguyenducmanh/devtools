SELECT
  '-- Create view script' || E'\n' ||
  CASE
    WHEN c.relkind = 'm' THEN 'DROP MATERIALIZED VIEW IF EXISTS '
    ELSE 'DROP VIEW IF EXISTS '
  END || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || ';' || E'\n' || CASE
    WHEN c.relkind = 'm' THEN 'CREATE MATERIALIZED VIEW '
    ELSE 'CREATE OR REPLACE VIEW '
  END || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || ' AS' || E'\n' || pg_get_viewdef(c.oid, true) AS ddl
FROM
  pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE
  n.nspname = '{schema}'
  AND c.relname = '{name}'
  AND c.relkind IN ('v', 'm')
LIMIT
  1;