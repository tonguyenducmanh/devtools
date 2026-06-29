SELECT
  COUNT(*) AS total
FROM
  pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE
  n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND p.prokind = 'f';