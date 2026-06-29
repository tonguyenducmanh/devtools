WITH input AS (
  SELECT
    'public'::text AS schema_name,
    'your_view_name'::text AS view_name
)
SELECT
  CASE WHEN c.relkind = 'm' THEN 'DROP MATERIALIZED VIEW IF EXISTS '
       ELSE 'DROP VIEW IF EXISTS '
  END || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || ';' || E'\n'
  || CASE WHEN c.relkind = 'm' THEN 'CREATE MATERIALIZED VIEW '
          ELSE 'CREATE OR REPLACE VIEW '
  END || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || ' AS' || E'\n'
  || pg_get_viewdef(c.oid, true) AS ddl
FROM input i
JOIN pg_class c ON c.relname = i.view_name
JOIN pg_namespace n ON n.nspname = i.schema_name AND c.relnamespace = n.oid
WHERE c.relkind IN ('v', 'm')
LIMIT 1;
