SELECT array_agg(n.nspname ORDER BY n.nspname) AS schema_names
FROM pg_namespace n
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname !~ '^pg_'
LIMIT 1
