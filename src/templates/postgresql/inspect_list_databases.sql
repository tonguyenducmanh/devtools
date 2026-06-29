SELECT
  datname AS database_name,
  pg_database_size(datname) AS size_in_bytes,
  pg_size_pretty(pg_database_size(datname)) AS size_pretty
FROM pg_database
WHERE datistemplate = false
ORDER BY datname
LIMIT 100;
