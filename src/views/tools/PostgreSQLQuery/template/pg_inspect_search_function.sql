SELECT
  n.nspname AS schema_name,
  p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS object_name,
  p.oid AS object_oid
FROM
  pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE
  p.prokind = 'f' {schemaFilter}
  AND p.proname ILIKE '{value}'
ORDER BY
  n.nspname,
  p.proname
LIMIT
  {limit};