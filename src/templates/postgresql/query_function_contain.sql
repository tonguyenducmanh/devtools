WITH input AS (
  SELECT '%your_keyword%'::text AS search_keyword
)
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  left(p.prosrc, 500) AS body_preview
FROM input i
JOIN pg_proc p ON p.prosrc ILIKE i.search_keyword
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, p.proname
LIMIT 50;
