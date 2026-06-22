SELECT
  'DROP FUNCTION IF EXISTS ' || quote_ident(n.nspname) || '.' || quote_ident(p.proname) || '(' || pg_get_function_identity_arguments(p.oid) || ');' || E'\n' || pg_get_functiondef(p.oid) || ';' AS ddl
FROM
  pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE
  n.nspname = '{schema}'
  AND p.proname = '{name}'
  AND p.prokind = 'f'
LIMIT 1;
