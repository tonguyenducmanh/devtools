SELECT
  COUNT(*) AS total
FROM
  pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE
  n.nspname IN ('pg_catalog', 'information_schema')
  AND p.prokind IN ('f', 'a', 'w')
