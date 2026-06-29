WITH input AS (
  SELECT
    '%your_keyword%'::text AS search_keyword,
    ''::text AS schema_filter  -- để trống để tìm tất cả schema, hoặc nhập 'public'
)
SELECT
  n.nspname AS schema_name,
  p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS function_signature,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_catalog.format_type(p.prorettype, NULL) AS return_type
FROM input i
JOIN pg_proc p ON p.proname ILIKE i.search_keyword AND p.prokind = 'f'
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE (i.schema_filter = '' OR n.nspname = i.schema_filter)
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, p.proname
LIMIT 100;
