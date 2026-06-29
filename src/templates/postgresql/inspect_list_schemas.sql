SELECT
  n.nspname AS schema_name,
  (SELECT COUNT(*) FROM pg_class c WHERE c.relnamespace = n.oid AND c.relkind = 'r') AS table_count,
  (SELECT COUNT(*) FROM pg_class c WHERE c.relnamespace = n.oid AND c.relkind IN ('v', 'm')) AS view_count,
  (SELECT COUNT(*) FROM pg_proc p WHERE p.pronamespace = n.oid AND p.prokind = 'f') AS function_count
FROM pg_namespace n
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname !~ '^pg_'
ORDER BY n.nspname
LIMIT 100;
