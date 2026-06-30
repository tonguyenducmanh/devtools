WITH
  input AS (
    SELECT
      'public'::text AS schema_name,
      'your_function_name'::text AS function_name
  )
SELECT
  'DROP FUNCTION IF EXISTS ' || quote_ident(n.nspname) || '.' || quote_ident(p.proname) || '(' || pg_get_function_identity_arguments(p.oid) || ');' || E'\n' || pg_get_functiondef(p.oid) AS ddl
FROM
  input i
  JOIN pg_proc p ON p.proname = i.function_name
  JOIN pg_namespace n ON n.oid = p.pronamespace
  AND n.nspname = i.schema_name
WHERE
  p.prokind = 'f'
LIMIT
  1;