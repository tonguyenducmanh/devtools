WITH input AS (
  SELECT current_database()::text AS db_name
)
SELECT
  i.db_name AS database_name,
  pg_database_size(i.db_name) AS size_in_bytes,
  pg_database_size(i.db_name) / 1024 / 1024 AS size_in_mb,
  pg_size_pretty(pg_database_size(i.db_name)) AS size_pretty
FROM input i
LIMIT 1;
